'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import { useInView } from 'react-intersection-observer';
import { FixedSizeList as List } from 'react-window';
import { useStoryStore } from '../../store/useStoryStore';
import { usePageManager } from '../../hooks/usePageManager';
import { AVAILABLE_FONTS, LINE_HEIGHT_OPTIONS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { debounce } from '../../lib/debounce';
import { 
  htmlToTextWithLineBreaks, 
  textToHtmlWithLineBreaks, 
  splitContentPreservingLineBreaks,
  validatePageBreakIntegrity 
} from '../../lib/text-processing';
import { useToast } from '../../hooks/useToast';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  Type, 
  BookOpen, 
  Bold as BoldIcon, 
  Italic as ItalicIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignHorizontalJustifyStart,
  AlignHorizontalJustifyCenter,
  AlignHorizontalJustifyEnd,
  Plus,
  Minus,
  RefreshCw
} from 'lucide-react';

interface PaginatedEditorProps {
  className?: string;
}

// Page styling constants
const PAGE_WIDTH = 900;
const PAGE_HEIGHT = 1600;
const PAGE_PADDING = 60;
const LINE_HEIGHT = 32;
const FONT_SIZE = 18;

const PaginatedEditor: React.FC<PaginatedEditorProps> = ({ className }) => {
  const { 
    content, 
    setContent, 
    editorSettings, 
    sections, 
    setCurrentStep, 
    pages, 
    currentPageIndex,
    getCurrentPageContent,
    setCurrentPageContent,
    addEmptyPage,
    initializeWithEmptyPage,
    setTextAlignment,
    setVerticalAlignment,
    setFontSize,
    increaseFontSize,
    decreaseFontSize,
    setLineHeight
  } = useStoryStore();
  const { 
    totalPages, 
    getPageInfo, 
    navigateToPage,
    addNewPage,
    updateCurrentPageContent,
    storeGetCurrentPageContent,
    syncPagesToSections,
    syncContentToPage,
    storeUpdatePage: updatePage
  } = usePageManager();
  
  const [selectedFont, setSelectedFont] = useState(AVAILABLE_FONTS[1].family); // Default to CustomFontTTF
  const [pageBreakMessage, setPageBreakMessage] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const { ref: pageBreakRef, inView } = useInView({ threshold: 0.5 });
  
  // Refs to track navigation state and prevent content overwrites
  const isNavigatingRef = useRef(false);
  const lastSyncedContentRef = useRef('');
  const lastSyncedPageIndexRef = useRef(0);
  
  // Get page info - make it reactive to currentPageIndex changes
  const pageInfo = useMemo(() => {
    const info = getPageInfo();
    // Comprehensive logging for pagination state tracking during development
    console.group('[PaginatedEditor] Page State Update');
    console.log('Current page index:', currentPageIndex);
    console.log('Total pages:', totalPages);
    console.log('Pages array length:', pages.length);
    console.log('Page info:', info);
    console.log('Page IDs:', pages.map(p => p.id));
    console.log('Current page content length:', getCurrentPageContent()?.length || 0);
    console.groupEnd();
    return info;
  }, [currentPageIndex, totalPages, getPageInfo, pages, getCurrentPageContent]);
  
  // Calculate current section index based on current page
  const currentSectionIndex = Math.max(0, pageInfo.currentPage - 1);
  

  // Initialize with an empty page if no pages exist
  useEffect(() => {
    initializeWithEmptyPage();
  }, [initializeWithEmptyPage]);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: getCurrentPageContent() || '',
    editorProps: {
      attributes: {
        class: `w-full h-full resize-none outline-none bg-transparent`,
        style: `padding: ${PAGE_PADDING}px; font-family: ${selectedFont}; font-size: ${editorSettings.fontSize}px; line-height: ${editorSettings.lineHeight}; color: #333; text-align: ${editorSettings.textAlignment}; display: flex; flex-direction: column; justify-content: ${editorSettings.verticalAlignment === 'top' ? 'flex-start' : editorSettings.verticalAlignment === 'middle' ? 'center' : 'flex-end'};`,
        contenteditable: 'true',
      },
    },
  });

  // Update text alignment dynamically when needed
  const updateTextAlignment = useMemo(
    () => debounce(() => {
      if (editor) {
        const editorElement = editor.view.dom as HTMLElement;
        editorElement.style.textAlign = editorSettings.textAlignment;
      }
    }, 300),
    [editor, editorSettings.textAlignment]
  );

  // Debounced editor content update to prevent excessive store updates
  const debouncedUpdateContent = useMemo(
    () => debounce((content: string) => {
      // Only update if we're not currently navigating and content actually changed
      if (!isNavigatingRef.current) {
        const currentStoreContent = getCurrentPageContent();
        if (content !== currentStoreContent) {
          console.log('[Editor] Updating store content:', content.length, 'characters');
          updateCurrentPageContent(content);
        }
      }
    }, 300),
    [getCurrentPageContent, updateCurrentPageContent]
  );

  // Add onUpdate to editor with improved synchronization
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        onUpdate: ({ editor }) => {
          const newContent = editor.getText();
          // Use debounced update to prevent excessive store updates
          debouncedUpdateContent(newContent);
          // Update text alignment immediately (UI change)
          updateTextAlignment();
        },
      });
    }
  }, [editor, debouncedUpdateContent, updateTextAlignment]);

  // Enhanced navigation wrapper with proper synchronization
  const navigateToPageWithEditorSync = useCallback((pageIndex: number) => {
    console.log(`[Navigation] Starting navigation from ${currentPageIndex} to ${pageIndex}`);
    
    if (!editor || pages.length === 0 || pageIndex < 0 || pageIndex >= pages.length) {
      console.warn('[Navigation] Invalid navigation parameters');
      return;
    }

    // Set navigation flag to prevent interference
    isNavigatingRef.current = true;
    
    try {
      // Step 1: Get current editor content and save it immediately
      const currentEditorContent = editor.getText();
      console.log('[Navigation] Current editor content length:', currentEditorContent.length);
      
      // Step 2: Save current page content synchronously
      if (currentPageIndex >= 0 && currentPageIndex < pages.length) {
        const currentPageId = pages[currentPageIndex].id;
        console.log('[Navigation] Saving content to current page:', currentPageId);
        updatePage(currentPageId, currentEditorContent);
      }
      
      // Step 3: Navigate to new page
      console.log('[Navigation] Navigating to page:', pageIndex);
      navigateToPage(pageIndex);
      
      // Step 4: Load new page content with a delay to ensure state has updated
      setTimeout(() => {
        try {
          const targetPageContent = pages[pageIndex]?.content || '';
          console.log('[Navigation] Loading target page content length:', targetPageContent.length);
          
          // Temporarily disable editor updates to prevent feedback loops
          const originalOnUpdate = editor.options.onUpdate;
          editor.setOptions({ onUpdate: undefined });
          
          // Clear and set new content
          editor.commands.clearContent();
          const htmlContent = targetPageContent ? 
            textToHtmlWithLineBreaks(targetPageContent) : '<p></p>';
          editor.commands.setContent(htmlContent);
          
          // Re-enable editor updates after a brief delay
          setTimeout(() => {
            if (editor && !editor.isDestroyed) {
              editor.setOptions({ onUpdate: originalOnUpdate });
              // Focus the editor
              editor.commands.focus('start');
            }
          }, 50);
          
        } finally {
          // Clear navigation flag
          isNavigatingRef.current = false;
        }
      }, 100);
      
    } catch (error) {
      console.error('[Navigation] Error during navigation:', error);
      isNavigatingRef.current = false;
    }
  }, [editor, currentPageIndex, pages, navigateToPage, updatePage]);

  // Add new page wrapper that syncs current editor content before adding new page
  const addNewPageWithSync = useCallback(() => {
    if (editor) {
      // Get current editor content and sync it to the store before adding new page
      const currentEditorContent = editor.getText();
      console.log('[AddNewPage] Syncing editor content before adding new page:', currentEditorContent.length, 'characters');
      syncContentToPage(currentEditorContent);
    }
    // Then proceed with adding new page
    addNewPage();
  }, [editor, syncContentToPage, addNewPage]);

  // Manual synchronization handler
  const handleManualSync = useCallback(() => {
    console.log('[Sync] Manual synchronization triggered');
    if (editor) {
      const currentEditorContent = editor.getText();
      console.log('[Sync] Syncing current editor content:', currentEditorContent.length, 'characters');
      syncContentToPage(currentEditorContent);
      // Provide user feedback
      setPageBreakMessage('Content synchronized successfully!');
      setTimeout(() => setPageBreakMessage(''), 2000);
    } else {
      setPageBreakMessage('Editor not ready. Please try again.');
      setTimeout(() => setPageBreakMessage(''), 3000);
    }
  }, [editor, syncContentToPage]);

  // Smooth scroll to editor when page changes
  // Enhanced smooth scroll to editor with focus management
  const scrollToEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
      // Ensure editor gets focus after scrolling
      setTimeout(() => {
        if (editor && !editor.isDestroyed) {
          editor.commands.focus();
        }
      }, 300);
    }
  }, [editor]);

  /**
   * ADVANCED PAGE BREAK INSERTION WITH LINE BREAK PRESERVATION
   * 
   * This function implements intelligent page break insertion that preserves
   * all existing line breaks and paragraph formatting. The process involves:
   * 
   * 1. VALIDATION: Checks editor state, page limits, and content availability
   * 2. CONTENT EXTRACTION: Retrieves HTML content and converts to plain text
   *    while preserving line break structure using htmlToTextWithLineBreaks()
   * 3. CURSOR POSITION MAPPING: Calculates precise text position accounting
   *    for HTML tags and formatting
   * 4. INTELLIGENT SPLITTING: Uses splitContentPreservingLineBreaks() to
   *    split content at cursor while maintaining paragraph integrity
   * 5. CONTENT VALIDATION: Validates that no content is lost during splitting
   * 6. PAGE UPDATES: Updates current page and creates new page with proper
   *    HTML formatting restored via textToHtmlWithLineBreaks()
   * 7. NAVIGATION: Smoothly navigates to the new page with focus management
   * 
   * Features:
   * - Preserves single line breaks within paragraphs
   * - Maintains paragraph breaks (double newlines)
   * - Handles consecutive line breaks intelligently
   * - Validates content integrity
   * - Provides user feedback for all operations
   * - Includes error handling for edge cases
   */
  const insertPageBreak = useCallback(() => {
    // Clear any existing message
    setPageBreakMessage('');
    
    if (!editor) {
      setPageBreakMessage('Editor is not ready. Please try again.');
      return;
    }
    
    if (pageInfo.currentPage >= 6) {
      setPageBreakMessage('Cannot insert page break. Maximum of 6 pages allowed.');
      return;
    }
    
    // Get HTML content to preserve formatting and line breaks
    const currentHtmlContent = editor.getHTML();
    const currentTextContent = editor.getText();
    
    // Check if there's any content to split
    if (!currentTextContent.trim()) {
      setPageBreakMessage('Cannot insert page break on empty page. Add some content first.');
      setTimeout(() => setPageBreakMessage(''), 3000);
      return;
    }
    
    // Get current selection range
    const { from, to } = editor.state.selection;
    
    // Convert HTML to plain text while preserving line breaks
    const plainTextContent = htmlToTextWithLineBreaks(currentHtmlContent);
    
    // Calculate the actual text position accounting for line breaks
    let textPosition = 0;
    const editorText = editor.getText();
    for (let i = 0; i < editorText.length && i < from; i++) {
      textPosition++;
    }
    
    // Use enhanced splitting function that preserves line breaks
    const { before: beforeContent, after: afterContent } = splitContentPreservingLineBreaks(plainTextContent, textPosition);
    
    // Validate that the split operation preserves content integrity
    const isValid = validatePageBreakIntegrity(plainTextContent, beforeContent, afterContent);
    if (!isValid) {
      setPageBreakMessage('Page break operation failed. Content integrity could not be preserved.');
      setTimeout(() => setPageBreakMessage(''), 3000);
      return;
    }
    
    // Show success message
    setPageBreakMessage('Page break inserted successfully!');
    setTimeout(() => setPageBreakMessage(''), 2000);
    
    // Update current page with content before cursor
    if (beforeContent.trim()) {
      const beforeHtml = textToHtmlWithLineBreaks(beforeContent);
      updateCurrentPageContent(beforeContent.trim());
      // Set editor content with preserved formatting
      editor.commands.setContent(beforeHtml);
    } else {
      // If no content before cursor, keep current page empty
      updateCurrentPageContent('');
      editor.commands.setContent('<p></p>');
    }
    
    // Create new page with content after cursor and navigate to it
    setTimeout(() => {
      // Add new page and let addNewPage handle the navigation
      addNewPage();
      
      // Set content on the new page after a brief delay to ensure page is created
      setTimeout(() => {
        if (afterContent.trim()) {
          const afterHtml = textToHtmlWithLineBreaks(afterContent);
          updateCurrentPageContent(afterContent.trim());
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent(afterHtml);
            // Focus the editor on the new page
            editor.commands.focus('start');
          }
        } else {
          // Ensure new page starts with proper structure and focus
          if (editor && !editor.isDestroyed) {
            editor.commands.setContent('<p></p>');
            editor.commands.focus('start');
          }
        }
        // Scroll to editor after navigation
        scrollToEditor();
      }, 200); // Increased delay to ensure navigation completes
    }, 50);
  }, [editor, pageInfo.currentPage, updateCurrentPageContent, addNewPage, navigateToPage, scrollToEditor]);

  /**
   * KEYBOARD SHORTCUTS FOR PAGE NAVIGATION AND EDITING
   * 
   * This effect sets up global keyboard shortcuts for enhanced editing experience:
   * - Ctrl/Cmd + Left Arrow: Navigate to previous page (with smooth scrolling)
   * - Ctrl/Cmd + Right Arrow: Navigate to next page (with smooth scrolling)
   * - Ctrl/Cmd + Enter: Insert page break at current cursor position
   * - Ctrl/Cmd + Shift + N: Add new empty page (up to 6 page limit)
   * 
   * All shortcuts are disabled when typing in the editor to prevent conflicts.
   * Focus management ensures the editor remains focused after navigation.
   */
  useEffect(() => {
    // Don't set up keyboard shortcuts if editor is not ready
    if (!editor) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in editor
      if (event.target !== editor?.view?.dom) {
        // Ctrl/Cmd + Left Arrow: Previous page
        if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowLeft') {
          event.preventDefault();
          if (pageInfo.hasPreviousPage) {
            isNavigatingRef.current = true;
            navigateToPageWithEditorSync(pageInfo.currentPage - 2);
            scrollToEditor();
            setTimeout(() => {
              isNavigatingRef.current = false;
            }, 200);
          }
        }
        // Ctrl/Cmd + Right Arrow: Next page
        else if ((event.ctrlKey || event.metaKey) && event.key === 'ArrowRight') {
          event.preventDefault();
          if (pageInfo.hasNextPage) {
            isNavigatingRef.current = true;
            navigateToPageWithEditorSync(pageInfo.currentPage);
            scrollToEditor();
            setTimeout(() => {
              isNavigatingRef.current = false;
            }, 200);
          }
        }
        // Ctrl/Cmd + Enter: Insert page break
        else if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
          event.preventDefault();
          insertPageBreak();
        }
        // Ctrl/Cmd + Shift + N: Add new page
        else if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'N') {
          event.preventDefault();
          if (pages.length < 6) {
            addNewPageWithSync();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, pageInfo, navigateToPageWithEditorSync, scrollToEditor, insertPageBreak, addNewPageWithSync, pages.length]);

  // Enhanced content synchronization with improved race condition prevention
  useEffect(() => {
    // Early return if editor is not ready or no pages exist
    if (!editor || pages.length === 0) {
      return;
    }
    
    // Skip sync during navigation to prevent content overwrites
    if (isNavigatingRef.current) {
      console.log('[Sync] Skipping sync during navigation');
      return;
    }
    
    const currentPageContent = getCurrentPageContent() || '';
    const currentEditorContent = editor.getText();
    
    // Determine if sync is actually needed based on multiple conditions:
    const pageIndexChanged = lastSyncedPageIndexRef.current !== currentPageIndex;
    const contentChanged = lastSyncedContentRef.current !== currentPageContent;
    const editorContentDiffers = currentPageContent !== currentEditorContent;
    
    // Enhanced debugging to understand sync behavior
    console.log('[Sync Debug]', {
      currentPageIndex,
      pageIndexChanged,
      contentChanged,
      editorContentDiffers,
      currentPageContent: currentPageContent.substring(0, 50) + '...',
      currentEditorContent: currentEditorContent.substring(0, 50) + '...',
      lastSyncedPageIndex: lastSyncedPageIndexRef.current,
      lastSyncedContent: lastSyncedContentRef.current.substring(0, 50) + '...',
      editorIsFocused: editor.isFocused,
      isNavigating: isNavigatingRef.current
    });
    
    // More conservative sync conditions:
    // 1. Page index has changed (navigation occurred) - this is the primary trigger
    // 2. Content has changed externally AND editor is not focused (external update)
    // 3. Never sync when editor is focused to prevent overwriting user input
    const shouldSync = pageIndexChanged && !editor.isFocused && !isNavigatingRef.current;
    
    if (shouldSync) {
      console.log('[Sync] Syncing content for page', currentPageIndex, 'with content:', currentPageContent.substring(0, 50));
      
      // Update tracking refs before sync to prevent unnecessary future syncs
      lastSyncedPageIndexRef.current = currentPageIndex;
      lastSyncedContentRef.current = currentPageContent;
      
      // Use requestAnimationFrame for better timing coordination with a timeout fallback
      const timeoutId = setTimeout(() => {
        if (editor && !editor.isDestroyed && !isNavigatingRef.current && !editor.isFocused) {
          console.log('[Sync] Executing content sync for page', currentPageIndex);
          
          // Prevent the editor from triggering updates during sync
          const originalOnUpdate = editor.options.onUpdate;
          editor.setOptions({ onUpdate: undefined });
          
          try {
            // Clear content first to ensure clean state
            editor.commands.clearContent();
            // Convert plain text to HTML with proper line break preservation
            const htmlContent = currentPageContent ? 
              textToHtmlWithLineBreaks(currentPageContent) : '<p></p>';
            editor.commands.setContent(htmlContent);
            
            // Focus the editor after content is set for page navigation
            if (pageIndexChanged) {
              setTimeout(() => {
                if (editor && !editor.isDestroyed && !isNavigatingRef.current) {
                  editor.commands.focus('start');
                }
              }, 50);
            }
          } finally {
            // Restore the original onUpdate handler
            setTimeout(() => {
              if (editor && !editor.isDestroyed) {
                editor.setOptions({ onUpdate: originalOnUpdate });
              }
            }, 100);
          }
        }
      }, 16); // Use ~1 frame delay for better timing
      
      // Cleanup timeout if component unmounts
      return () => clearTimeout(timeoutId);
    }
  }, [editor, currentPageIndex, getCurrentPageContent, pages.length]);

  // Handle font change
  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fontFamily = e.target.value;
    setSelectedFont(fontFamily);
    
    if (editor) {
      // Update editor styling
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.style.fontFamily = fontFamily;
    }
  };

  // Ensure text alignment is correctly applied on render
  // This useEffect must be called before any early returns to maintain hook order
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.style.textAlign = editorSettings.textAlignment;
    }
  }, [editor, editorSettings.textAlignment]);

  // Update font size when it changes
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.style.fontSize = `${editorSettings.fontSize}px`;
    }
  }, [editor, editorSettings.fontSize]);

  // Update vertical alignment when it changes
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      const justifyContent = editorSettings.verticalAlignment === 'top' ? 'flex-start' : 
                           editorSettings.verticalAlignment === 'middle' ? 'center' : 'flex-end';
      editorElement.style.display = 'flex';
      editorElement.style.flexDirection = 'column';
      editorElement.style.justifyContent = justifyContent;
    }
  }, [editor, editorSettings.verticalAlignment]);

  // Update line height when it changes
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.style.lineHeight = `${editorSettings.lineHeight}`;
    }
  }, [editor, editorSettings.lineHeight]);

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>Loading editor...</p>
        </div>
      </div>
    );
  }


  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Paginated Story Editor
        </CardTitle>
        
        {/* Text Alignment Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Text Alignment:</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={editorSettings.textAlignment === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextAlignment('left')}
              className="h-8 w-8 p-0"
              title="Align left"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.textAlignment === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextAlignment('center')}
              className="h-8 w-8 p-0"
              title="Align center"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.textAlignment === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextAlignment('right')}
              className="h-8 w-8 p-0"
              title="Align right"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Vertical Alignment Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Vertical Alignment:</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={editorSettings.verticalAlignment === 'top' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVerticalAlignment('top')}
              className="h-8 w-8 p-0"
              title="Align top"
            >
              <AlignHorizontalJustifyStart className="w-4 h-4 rotate-90" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.verticalAlignment === 'middle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVerticalAlignment('middle')}
              className="h-8 w-8 p-0"
              title="Align middle"
            >
              <AlignHorizontalJustifyCenter className="w-4 h-4 rotate-90" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.verticalAlignment === 'bottom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVerticalAlignment('bottom')}
              className="h-8 w-8 p-0"
              title="Align bottom"
            >
              <AlignHorizontalJustifyEnd className="w-4 h-4 rotate-90" />
            </Button>
          </div>
        </div>
        
        {/* Font Size Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Font Size:</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={decreaseFontSize}
              className="h-8 w-8 p-0"
              title="Decrease font size"
              disabled={editorSettings.fontSize <= 8}
            >
              <Minus className="w-4 h-4" />
            </Button>
            
            <span className="text-sm font-medium min-w-[3rem] text-center">
              {editorSettings.fontSize}px
            </span>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={increaseFontSize}
              className="h-8 w-8 p-0"
              title="Increase font size"
              disabled={editorSettings.fontSize >= 72}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Line Height Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Line Height:</span>
          <div className="flex items-center gap-1">
            {LINE_HEIGHT_OPTIONS.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={editorSettings.lineHeight === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLineHeight(option.value)}
                className="text-xs px-2 py-1 h-8"
                title={`Line height ${option.label}`}
              >
                {option.value}x
              </Button>
            ))}
          </div>
        </div>
<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Font Selection */}
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <select 
              value={selectedFont} 
              onChange={handleFontChange} 
              className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.name} value={font.family}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>

          {/* Synchronization Button */}
          <Button 
            onClick={handleManualSync}
            size="sm"
            variant="outline"
            title="Synchronize Content"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Synchronize
          </Button>
          
          {/* Page Break Button */}
          <Button 
            onClick={insertPageBreak}
            disabled={pageInfo.currentPage >= 6}
            size="sm"
            variant="outline"
            title="Insert page break (Ctrl+Enter)"
          >
            Insert Page Break
          </Button>
          
          {/* Add New Page Button */}
          <Button 
            onClick={addNewPageWithSync}
            disabled={pages.length >= 6}
            size="sm"
            variant="default"
            title="Add new page (Ctrl+Shift+N)"
          >
            Add New Page
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        
        {/* Page Break Message */}
        {pageBreakMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-md ${
            pageBreakMessage.includes('successfully') 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-orange-50 border border-orange-200'
          }`}>
            <AlertCircle className={`w-5 h-5 ${
              pageBreakMessage.includes('successfully') ? 'text-green-600' : 'text-orange-600'
            }`} />
            <div className={`text-sm ${
              pageBreakMessage.includes('successfully') ? 'text-green-700' : 'text-orange-700'
            }`}>
              <p>{pageBreakMessage}</p>
            </div>
          </div>
        )}

        {/* Editor Toolbar */}
        <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50">
          <Button
            type="button"
            variant={editor.isActive('bold') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <BoldIcon className="w-4 h-4" />
          </Button>
          
          <Button
            type="button"
            variant={editor.isActive('italic') ? 'default' : 'outline'}
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <ItalicIcon className="w-4 h-4" />
          </Button>
          
          <div className="h-4 w-px bg-gray-300 mx-2" />
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Characters: {editor.getText().length}</span>
          </div>
        </div>

        {/* Pages Container */}
        <div 
          ref={editorRef}
          className="overflow-y-auto overflow-x-hidden"
          style={{ maxHeight: '80vh' }}
        >
          <div className="space-y-8 pb-8">
            <div
              className="mx-auto"
              style={{ width: `${PAGE_WIDTH}px` }}
            >
              {/* Page Number */}
              <div className="text-center text-sm text-gray-500 mb-2">
                Page {pageInfo.currentPage}
              </div>

              {/* Page Container */}
              <div 
                className="relative bg-white border-2 border-gray-300 shadow-lg rounded-lg overflow-hidden"
                style={{
                  width: `${PAGE_WIDTH}px`,
                  height: `${PAGE_HEIGHT}px`,
                  backgroundImage: 'url(/backgrounds/stage_3.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              >
                {/* Background overlay for text readability */}
                <div 
                  className="absolute inset-0" 
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.3)'
                  }}
                />
                <style>{`
                  .ProseMirror {
                    white-space: pre-wrap;
                    position: relative;
                    z-index: 1;
                  }
                  .ProseMirror p {
                    margin: 0;
                    line-height: ${editorSettings.lineHeight};
                  }
                  .ProseMirror p + p {
                    margin-top: ${editorSettings.fontSize * 0.5}px;
                  }
                `}</style>
                <div className="relative z-10">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Page Navigation */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 shadow-inner">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                disabled={!pageInfo.hasPreviousPage}
                onClick={() => {
                  navigateToPageWithEditorSync(pageInfo.currentPage - 2);
                  scrollToEditor();
                }}
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                title="Previous page (Ctrl+←)"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous Page
              </Button>
              
              {/* Page Indicators - Virtualized for large page counts */}
              <div className="flex items-center gap-1 max-w-[300px]">
                {pageInfo.totalPages > 10 ? (
                  // Use virtualized list for many pages
                  <List
                    height={40}
                    itemCount={pageInfo.totalPages}
                    itemSize={40}
                    layout="horizontal"
                    width={pageInfo.totalPages * 40}
                  >
                    {({ index, style }) => (
                      <button
                        style={style}
                        onClick={() => {
                          navigateToPageWithEditorSync(index);
                          scrollToEditor();
                        }}
                        className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 hover:scale-110 ${
                          pageInfo.currentPage === index + 1
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300'
                        }`}
                      >
                        {index + 1}
                      </button>
                    )}
                  </List>
                ) : (
                  // Use regular rendering for few pages
                  Array.from({ length: pageInfo.totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        navigateToPageWithEditorSync(i);
                        scrollToEditor();
                      }}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 hover:scale-110 ${
                        pageInfo.currentPage === i + 1
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))
                )}
              </div>
              
              <Button
                variant="outline"
                size="default"
                disabled={!pageInfo.hasNextPage}
                onClick={() => {
                  navigateToPageWithEditorSync(pageInfo.currentPage);
                  scrollToEditor();
                }}
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                title="Next page (Ctrl+→)"
              >
                Next Page
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* Page Info */}
            <div className="text-center sm:text-right">
              <div className="text-lg font-medium text-gray-800">
                Page {pageInfo.currentPage} of {pageInfo.totalPages}
              </div>
              {pageInfo.totalPages > 6 && (
                <div className="text-sm text-red-600 flex items-center justify-center sm:justify-end gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {pageInfo.totalPages - 6} pages over limit
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="text-lg font-semibold text-blue-600">{pageInfo.totalPages}</div>
            <div className="text-sm text-blue-600">Total Pages</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-md">
            <div className="text-lg font-semibold text-green-600">{sections.length}</div>
            <div className="text-sm text-green-600">Sections</div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-md">
            <div className="text-lg font-semibold text-purple-600">{editor.getText().length}</div>
            <div className="text-sm text-purple-600">Characters</div>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-md">
            <div className="text-lg font-semibold text-orange-600">{getCurrentPageContent()?.length || 0}</div>
            <div className="text-sm text-orange-600">Page Characters</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Add navigation section wrapper
const PaginatedEditorWithNavigation: React.FC<PaginatedEditorProps> = ({ className }) => {
  const { setCurrentStep, content } = useStoryStore();
  
  const handleBack = () => {
    setCurrentStep(0);
  };
  
const { showWarning } = useToast();

  const handleNext = () => {
    if (!content || content.trim() === '') {
      showWarning('Incomplete Content', 'Please write some content before proceeding.');
      return;
    }
    setCurrentStep(2);
  };
  
  return (
    <div className="space-y-6">
      <PaginatedEditor className={className} />
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Author Info
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
        >
          Preview & Export
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export { PaginatedEditor, PaginatedEditorWithNavigation };
export default PaginatedEditorWithNavigation;

