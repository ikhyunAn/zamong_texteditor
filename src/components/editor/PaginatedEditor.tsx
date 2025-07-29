'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CharacterCount from '@tiptap/extension-character-count';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import HardBreak from '@tiptap/extension-hard-break';
import { useInView } from 'react-intersection-observer';
import { FixedSizeList as List } from 'react-window';
import { useStoryStore } from '../../store/useStoryStore';
import { usePageManager } from '../../hooks/usePageManager';
import { AVAILABLE_FONTS, DEFAULT_TEXT_STYLE } from '../../lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { debounce } from '../../lib/debounce';
import { 
  htmlToTextWithLineBreaks, 
  textToHtmlWithLineBreaks, 
  splitContentPreservingLineBreaks,
  validatePageBreakIntegrity 
} from '../../lib/text-processing';
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
  AlignRight
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
    setTextAlignment
  } = useStoryStore();
  const { 
    totalPages, 
    getPageInfo, 
    checkPageLimits, 
    calculateLineCount,
    autoPaginate,
    navigateToPage,
    addNewPage,
    updateCurrentPageContent,
    storeGetCurrentPageContent,
    syncPagesToSections,
    syncContentToPage
  } = usePageManager();
  
  const [currentLines, setCurrentLines] = useState(0);
  const [selectedFont, setSelectedFont] = useState(AVAILABLE_FONTS[0].family);
  const [pageExceedsLimit, setPageExceedsLimit] = useState(false);
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
      CharacterCount.configure({
        limit: editorSettings.maxLinesPerPage * 80,
      }),
    ],
    content: getCurrentPageContent() || '',
    editorProps: {
      attributes: {
        class: `w-full h-full resize-none outline-none bg-transparent`,
        style: `padding: ${PAGE_PADDING}px; font-family: ${selectedFont}; font-size: ${FONT_SIZE}px; line-height: ${LINE_HEIGHT}px; color: #333; text-align: ${editorSettings.textAlignment};`,
        contenteditable: 'true',
      },
    },
  });

  // Create debounced line count function after editor is declared
  const debouncedCalculateLineCount = useMemo(
    () => debounce((text: string) => {
      const lines = calculateLineCount(text);
      setCurrentLines(lines);
      // Update text alignment dynamically
      if (editor) {
        const editorElement = editor.view.dom as HTMLElement;
        editorElement.style.textAlign = editorSettings.textAlignment;
      }
    }, 300),
    [calculateLineCount, editor, editorSettings.textAlignment]
  );

  // Add onUpdate to editor after debounced function is available
  useEffect(() => {
    if (editor) {
      editor.setOptions({
        onUpdate: ({ editor }) => {
          // Re-enabled with safeguards: Update current page content when editor changes
          const newContent = editor.getText();
          // Only update if there's actually new content to prevent infinite loops
          if (newContent !== getCurrentPageContent()) {
            updateCurrentPageContent(newContent);
            // Update line count with debouncing
            debouncedCalculateLineCount(newContent);
          }
        },
      });
    }
  }, [editor, debouncedCalculateLineCount, getCurrentPageContent, updateCurrentPageContent]);

  // Navigation wrapper that syncs current editor content before navigating
  const navigateToPageWithEditorSync = useCallback((pageIndex: number) => {
    if (editor) {
      // Get current editor content and sync it to the store before navigation
      const currentEditorContent = editor.getText();
      console.log('[Navigation] Syncing editor content before navigation:', currentEditorContent.length, 'characters');
      syncContentToPage(currentEditorContent);
    }
    // Then proceed with normal navigation
    navigateToPage(pageIndex);
  }, [editor, syncContentToPage, navigateToPage]);

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

  // Stabilized content synchronization with navigation-aware updates
  useEffect(() => {
    // Early return if editor is not ready or no pages exist
    if (!editor || pages.length === 0) {
      return;
    }
    
    // Skip sync during navigation to prevent content overwrites
    if (isNavigatingRef.current) {
      return;
    }
    
    const currentPageContent = getCurrentPageContent() || '';
    const currentEditorContent = editor.getText();
    
    // Determine if sync is actually needed based on multiple conditions:
    const pageIndexChanged = lastSyncedPageIndexRef.current !== currentPageIndex;
    const contentChanged = lastSyncedContentRef.current !== currentPageContent;
    const editorContentDiffers = currentPageContent !== currentEditorContent;
    
    // Add debugging to understand sync behavior
    console.log('[Sync Debug]', {
      currentPageIndex,
      pageIndexChanged,
      contentChanged,
      editorContentDiffers,
      currentPageContent: currentPageContent.substring(0, 50) + '...',
      currentEditorContent: currentEditorContent.substring(0, 50) + '...',
      lastSyncedPageIndex: lastSyncedPageIndexRef.current,
      lastSyncedContent: lastSyncedContentRef.current.substring(0, 50) + '...',
      editorIsFocused: editor.isFocused
    });
    
    // Only sync when:
    // 1. Page index has changed (navigation occurred) - this is the primary trigger
    // 2. Stored content has changed (external update) AND it's not empty
    // BE MORE PROTECTIVE: Don't sync just because editor content differs
    const shouldSync = (pageIndexChanged || (contentChanged && currentPageContent.trim())) && 
                      !editor.isFocused;
    
    if (shouldSync) {
      console.log('[Sync] Syncing content for page', currentPageIndex, 'with content:', currentPageContent.substring(0, 50));
      
      // Update tracking refs before sync to prevent unnecessary future syncs
      lastSyncedPageIndexRef.current = currentPageIndex;
      lastSyncedContentRef.current = currentPageContent;
      
      // Use requestAnimationFrame for better timing coordination
      requestAnimationFrame(() => {
        if (editor && !editor.isDestroyed && !isNavigatingRef.current) {
          // Clear content first to ensure clean state
          editor.commands.clearContent();
          // Convert plain text to HTML with proper line break preservation
          const htmlContent = currentPageContent ? 
            textToHtmlWithLineBreaks(currentPageContent) : '<p></p>';
          editor.commands.setContent(htmlContent);
          
          // Only focus if this was a page navigation
          if (pageIndexChanged) {
            setTimeout(() => {
              if (editor && !editor.isDestroyed && !isNavigatingRef.current) {
                editor.commands.focus('start');
              }
            }, 50);
          }
        }
      });
    }
  }, [editor, currentPageIndex, getCurrentPageContent]);

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

  const exceedsLineLimit = currentLines > editorSettings.maxLinesPerPage;
  const remainingLines = Math.max(0, editorSettings.maxLinesPerPage - currentLines);

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
        {/* Content Warning */}
        {pageExceedsLimit && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Content exceeds 6-page limit</p>
              <p>Please reduce your content to fit within 6 pages.</p>
            </div>
          </div>
        )}

        {/* Line Count Warning */}
        {exceedsLineLimit && (
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Page line limit exceeded</p>
              <p>Current: {currentLines} lines (max: {editorSettings.maxLinesPerPage})</p>
            </div>
          </div>
        )}
        
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
            <span>Lines: {currentLines}/{editorSettings.maxLinesPerPage}</span>
            <span>Characters: {editor.storage.characterCount?.characters() || 0}</span>
            <span className={remainingLines < 5 ? 'text-orange-600 font-medium' : ''}>
              Remaining: {remainingLines} lines
            </span>
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
                    line-height: ${LINE_HEIGHT}px;
                  }
                  .ProseMirror p + p {
                    margin-top: ${LINE_HEIGHT}px;
                  }
                `}</style>
                <div className="relative z-10">
                  <EditorContent editor={editor} />
                </div>
                
                {/* Line count indicator */}
                <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white px-2 py-1 rounded z-20">
                  {currentLines}/{editorSettings.maxLinesPerPage} lines
                </div>

                {/* Visual indicator when approaching limit */}
                {currentLines > editorSettings.maxLinesPerPage - 5 && (
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-yellow-200 to-transparent opacity-50 z-20" />
                )}
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
            <div className="text-lg font-semibold text-purple-600">{currentLines}</div>
            <div className="text-sm text-purple-600">Current Lines</div>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-md">
            <div className="text-lg font-semibold text-orange-600">{remainingLines}</div>
            <div className="text-sm text-orange-600">Lines Left</div>
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
  
  const handleNext = () => {
    if (!content || content.trim() === '') {
      alert('Please write some content before proceeding.');
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

