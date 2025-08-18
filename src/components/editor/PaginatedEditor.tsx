'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import StarterKit from '@tiptap/starter-kit';
import { FixedSizeList as List } from 'react-window';
import { useStoryStore } from '../../store/useStoryStore';
import { useLanguageStore } from '../../store/useLanguageStore';
import { usePageManager } from '../../hooks/usePageManager';
import { AVAILABLE_FONTS, LINE_HEIGHT_OPTIONS, getRecommendedFontForLanguage, getTitleFont, getAuthorFont } from '@/lib/constants';
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

const PaginatedEditor: React.FC<PaginatedEditorProps> = ({ className }) => {
  const { t } = useTranslation('common');
  const { 
    editorSettings, 
    sections, 
    pages, 
    currentPageIndex,
    getCurrentPageContent,
    initializeWithEmptyPage,
    setTextAlignment,
    setVerticalAlignment,
    setFontFamily,
    increaseFontSize,
    decreaseFontSize,
    setLineHeight,
    authorInfo
  } = useStoryStore();
  const { language } = useLanguageStore();
  const { 
    totalPages, 
    getPageInfo, 
    navigateToPage,
    addNewPage,
    updateCurrentPageContent,
    syncContentToPage,
    storeUpdatePage: updatePage
  } = usePageManager();
  
  const [selectedFont, setSelectedFont] = useState(editorSettings.fontFamily); // Use font from global settings
  const [pageBreakMessage, setPageBreakMessage] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);

  // Refs for content integrity
  const firstPageSnapshotRef = useRef<string>('');
  const firstPageBackupSnapshotRef = useRef<string>('');
  const lastKnownGoodContentRef = useRef<{ [pageId: string]: string }>({});
  const isNavigatingRef = useRef(false);
  const firstPageInitializedRef = useRef(false);
  
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
// const currentSectionIndex = Math.max(0, pageInfo.currentPage - 1);
  

  // Initialize with an empty page if no pages exist
  useEffect(() => {
    initializeWithEmptyPage();
  }, [initializeWithEmptyPage]);

  // Force Korean body font on component mount (ensure consistency)
  useEffect(() => {
    const bodyFont = 'HakgyoansimBareonbatangR'; // Regular weight for body text
    if (editorSettings.fontFamily !== bodyFont) {
      console.log(`[Font Init] Setting Korean body font on mount: ${bodyFont}`);
      setFontFamily(bodyFont);
      setSelectedFont(bodyFont);
    }
  }, []); // Only run on mount

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

  const debouncedUpdateContent = useMemo(
    () => debounce((htmlContent: string) => {
      const textContent = htmlToTextWithLineBreaks(htmlContent);
      if (textContent !== getCurrentPageContent()) {
        console.log('[Editor] Updating store content:', textContent.length, 'characters, newlines:', textContent.split('\n').length - 1);
        updateCurrentPageContent(textContent);
      }
    }, 300),
    [getCurrentPageContent, updateCurrentPageContent]
  );

  useEffect(() => {
    if (editor) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handleUpdate = ({ editor }: { editor: any }) => {
        const newHtmlContent = editor.getHTML();
        debouncedUpdateContent(newHtmlContent);
        updateTextAlignment();
      };

      editor.setOptions({
        onUpdate: handleUpdate,
      });
    }
  }, [editor, debouncedUpdateContent, updateTextAlignment]);


  // Enhanced Content Integrity Snapshot Utilities
  const storeSnapshot = useCallback((pageIndex: number, content: string) => {
    // Only store snapshots of content that has newlines to avoid storing corrupted content
    if (pageIndex === 0 && content.includes('\n')) {
      firstPageSnapshotRef.current = content;
      // Create a backup snapshot as well
      firstPageBackupSnapshotRef.current = content;
      console.log('[Snapshot] Stored first page snapshot:', content.substring(0, 50) + '...');
      console.log('[Snapshot] Newlines detected:', content.split('\n').length - 1);
    }
    if (pages[pageIndex] && content.includes('\n')) {
      lastKnownGoodContentRef.current[pages[pageIndex].id] = content;
      console.log('[Snapshot] Stored snapshot for page', pageIndex, ':', content.substring(0, 50) + '...');
    }
  }, [pages]);
  
  // Initialize first page snapshot when content is first loaded
  useEffect(() => {
    if (currentPageIndex === 0 && !firstPageInitializedRef.current && editor) {
      const initialContent = getCurrentPageContent();
      if (initialContent && initialContent.includes('\n')) {
        firstPageSnapshotRef.current = initialContent;
        firstPageBackupSnapshotRef.current = initialContent;
        firstPageInitializedRef.current = true;
        console.log('[Init] Initialized first page snapshot:', initialContent.substring(0, 50) + '...');
      }
    }
  }, [currentPageIndex, editor, getCurrentPageContent]);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const validateContentIntegrity = useCallback((pageIndex: number, currentContent: string): boolean => {
    if (pageIndex === 0 && firstPageSnapshotRef.current) {
      // Use a more lenient comparison that focuses on meaningful content
      const normalizeContent = (text: string) => text.replace(/\s+/g, ' ').trim();
      const currentNormalized = normalizeContent(currentContent);
      const snapshotNormalized = normalizeContent(firstPageSnapshotRef.current);
      
      // Check if newlines are missing (content collapsed)
      const hasNewlines = currentContent.includes('\n');
      const shouldHaveNewlines = firstPageSnapshotRef.current.includes('\n');
      
      if (shouldHaveNewlines && !hasNewlines && currentNormalized === snapshotNormalized) {
        console.warn('[Validation] First page newlines appear to be lost');
        return false;
      }
    }
    
    const pageId = pages[pageIndex]?.id;
    if (pageId && lastKnownGoodContentRef.current[pageId]) {
      return validatePageBreakIntegrity(
        lastKnownGoodContentRef.current[pageId],
        currentContent,
        ''
      );
    }
    
    return true;
  }, [pages]);
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const restoreFromSnapshot = useCallback((pageIndex: number): string | null => {
    if (pageIndex === 0) {
      // Try primary snapshot first
      let restoredContent = firstPageSnapshotRef.current;
      
      // If primary snapshot doesn't have newlines, try backup
      if (!restoredContent.includes('\n') && firstPageBackupSnapshotRef.current.includes('\n')) {
        restoredContent = firstPageBackupSnapshotRef.current;
        console.log('[Restore] Using backup snapshot for first page');
      }
      
      if (restoredContent && restoredContent.includes('\n')) {
        console.log('[Restore] Restoring first page from snapshot with', restoredContent.split('\n').length - 1, 'newlines');
        setPageBreakMessage('Content integrity restored for first page!');
        setTimeout(() => setPageBreakMessage(''), 3000);
        return restoredContent;
      }
    }
    
    const pageId = pages[pageIndex]?.id;
    if (pageId && lastKnownGoodContentRef.current[pageId]) {
      const restoredContent = lastKnownGoodContentRef.current[pageId];
      if (restoredContent.includes('\n')) {
        console.log('[Restore] Restoring page', pageIndex, 'from snapshot');
        setPageBreakMessage('Content integrity restored!');
        setTimeout(() => setPageBreakMessage(''), 3000);
        return restoredContent;
      }
    }
    
    return null;
  }, [pages]);
  
  // Listen for custom event when returning from preview
  useEffect(() => {
    const handleReturnFromPreview = () => {
      console.log('[Preview] Detected return from preview mode');
      // No longer need to manually manage flags
    };
    
    window.addEventListener('returnFromPreview', handleReturnFromPreview);
    return () => window.removeEventListener('returnFromPreview', handleReturnFromPreview);
  }, [currentPageIndex, getCurrentPageContent]);

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
      const currentEditorHtml = editor.getHTML();
      const currentEditorContent = htmlToTextWithLineBreaks(currentEditorHtml);
      console.log('[Navigation] Current editor content length:', currentEditorContent.length, 'newlines:', currentEditorContent.split('\n').length - 1);
      
      // Step 1.5: Store snapshot before navigation (Content Integrity System)
      // Only store if content has newlines (to avoid storing corrupted content)
      if (currentPageIndex >= 0 && currentPageIndex < pages.length && currentEditorContent.includes('\n')) {
        storeSnapshot(currentPageIndex, currentEditorContent);
      }
      
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
      const currentEditorHtml = editor.getHTML();
      const currentEditorContent = htmlToTextWithLineBreaks(currentEditorHtml);
      console.log('[AddNewPage] Syncing editor content before adding new page:', currentEditorContent.length, 'characters, newlines:', currentEditorContent.split('\n').length - 1);
      syncContentToPage(currentEditorContent);
    }
    // Then proceed with adding new page
    addNewPage();
  }, [editor, syncContentToPage, addNewPage]);

  const handleManualSync = useCallback(() => {
    console.log('[Sync] Manual synchronization triggered');
    if (editor) {
      const currentEditorHtml = editor.getHTML();
      const currentEditorContent = htmlToTextWithLineBreaks(currentEditorHtml);
      syncContentToPage(currentEditorContent);
      setPageBreakMessage(t('editor.pageBreakMessages.syncSuccess'));
      setTimeout(() => setPageBreakMessage(''), 2000);
    } else {
      setPageBreakMessage(t('editor.pageBreakMessages.editorNotReadySync'));
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
      setPageBreakMessage(t('editor.pageBreakMessages.editorNotReady'));
      return;
    }
    
    if (pageInfo.currentPage >= 6) {
      setPageBreakMessage(t('editor.pageBreakMessages.maxPagesReached'));
      return;
    }
    
    // Get HTML content to preserve formatting and line breaks
    const currentHtmlContent = editor.getHTML();
    const currentTextContent = editor.getText();
    
    // Check if there's any content to split
    if (!currentTextContent.trim()) {
      setPageBreakMessage(t('editor.pageBreakMessages.emptyPage'));
      setTimeout(() => setPageBreakMessage(''), 3000);
      return;
    }
    
    // Get current selection range
    const { from } = editor.state.selection;
    
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
      setPageBreakMessage(t('editor.pageBreakMessages.integrityFailed'));
      setTimeout(() => setPageBreakMessage(''), 3000);
      return;
    }
    
    // Show success message
    setPageBreakMessage(t('editor.pageBreakMessages.success'));
    setTimeout(() => setPageBreakMessage(''), 2000);
    
    // Update current page with content before cursor
    if (beforeContent) {
      const beforeHtml = textToHtmlWithLineBreaks(beforeContent);
      updateCurrentPageContent(beforeContent); // Don't trim to preserve whitespace
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
        if (afterContent) {
          const afterHtml = textToHtmlWithLineBreaks(afterContent);
          updateCurrentPageContent(afterContent); // Don't trim to preserve whitespace
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

  useEffect(() => {
    if (!editor || pages.length === 0) {
      return;
    }

    const currentPageContent = getCurrentPageContent() || '';
    const editorContent = htmlToTextWithLineBreaks(editor.getHTML());

    if (currentPageContent !== editorContent) {
      const htmlContent = currentPageContent ?
        textToHtmlWithLineBreaks(currentPageContent) :
        '<p></p>';
      editor.commands.setContent(htmlContent, false, { preserveWhitespace: 'full' });
    }
  }, [editor, currentPageIndex, getCurrentPageContent, pages]);
  // Handle font change
  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const fontFamily = e.target.value;
    setSelectedFont(fontFamily);
    
    // Update global store settings so canvas operations use the correct font
    setFontFamily(fontFamily);
    
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

  // Sync local font state with global settings
  useEffect(() => {
    if (editorSettings.fontFamily !== selectedFont) {
      setSelectedFont(editorSettings.fontFamily);
    }
  }, [editorSettings.fontFamily, selectedFont]);

  // Update font family when it changes - use CSS classes for better consistency
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      
      // Remove any existing font classes
      editorElement.classList.remove('font-korean-body', 'font-korean-title', 'font-korean-regular');
      
      // Add appropriate font class based on selected font
      if (selectedFont === 'CustomFontTTF') {
        editorElement.classList.add('font-korean-body');
      } else if (selectedFont === 'CustomFont') {
        editorElement.classList.add('font-korean-title');
      } else if (selectedFont === 'HakgyoansimBareonbatangR') {
        editorElement.classList.add('font-korean-regular');
      } else {
        // Fallback to inline style for other fonts
        editorElement.style.fontFamily = selectedFont;
      }
    }
  }, [editor, selectedFont]);

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

  // Ensure font consistency - sync selectedFont with global settings
  useEffect(() => {
    const bodyFont = 'HakgyoansimBareonbatangR'; // Regular weight for body text
    
    // Only update if there's actually a mismatch to prevent unnecessary re-renders
    if (editorSettings.fontFamily !== bodyFont || selectedFont !== bodyFont) {
      console.log(`[Font Sync] Ensuring Korean body font: ${bodyFont}`);
      
      // Update global settings only if needed
      if (editorSettings.fontFamily !== bodyFont) {
        setFontFamily(bodyFont);
      }
      
      // Update local state only if needed
      if (selectedFont !== bodyFont) {
        setSelectedFont(bodyFont);
      }
    }
  }, [editorSettings.fontFamily, selectedFont, setFontFamily]); // Removed language dependency

  if (!editor) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p>{t('editor.loading')}</p>
        </div>
      </div>
    );
  }


  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          {t('editor.title')}
        </CardTitle>
        
        {/* Text Alignment Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{t('editor.textAlignment')}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={editorSettings.textAlignment === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextAlignment('left')}
              className="h-8 w-8 p-0"
              title={t('editor.alignLeft')}
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.textAlignment === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextAlignment('center')}
              className="h-8 w-8 p-0"
              title={t('editor.alignCenter')}
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.textAlignment === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTextAlignment('right')}
              className="h-8 w-8 p-0"
              title={t('editor.alignRight')}
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Vertical Alignment Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{t('editor.verticalAlignment')}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={editorSettings.verticalAlignment === 'top' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVerticalAlignment('top')}
              className="h-8 w-8 p-0"
              title={t('editor.alignTop')}
            >
              <AlignHorizontalJustifyStart className="w-4 h-4 rotate-90" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.verticalAlignment === 'middle' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVerticalAlignment('middle')}
              className="h-8 w-8 p-0"
              title={t('editor.alignMiddle')}
            >
              <AlignHorizontalJustifyCenter className="w-4 h-4 rotate-90" />
            </Button>
            
            <Button
              type="button"
              variant={editorSettings.verticalAlignment === 'bottom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setVerticalAlignment('bottom')}
              className="h-8 w-8 p-0"
              title={t('editor.alignBottom')}
            >
              <AlignHorizontalJustifyEnd className="w-4 h-4 rotate-90" />
            </Button>
          </div>
        </div>
        
        {/* Font Size Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{t('editor.fontSize')}</span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={decreaseFontSize}
              className="h-8 w-8 p-0"
              title={t('editor.decreaseFontSize')}
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
              title={t('editor.increaseFontSize')}
              disabled={editorSettings.fontSize >= 72}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Line Height Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">{t('editor.lineHeight')}</span>
          <div className="flex items-center gap-1">
            {LINE_HEIGHT_OPTIONS.map(option => (
              <Button
                key={option.value}
                type="button"
                variant={editorSettings.lineHeight === option.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setLineHeight(option.value)}
                className="text-xs px-2 py-1 h-8"
                title={`${t('editor.lineHeightLabel')} ${option.label}`}
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
            title={t('editor.synchronizeTitle')}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('editor.synchronize')}
          </Button>
          
          {/* Page Break Button */}
          <Button 
            onClick={insertPageBreak}
            disabled={pageInfo.currentPage >= 6}
            size="sm"
            variant="outline"
            title={t('editor.insertPageBreakTitle')}
          >
            {t('editor.insertPageBreak')}
          </Button>
          
          {/* Add New Page Button */}
          <Button 
            onClick={addNewPageWithSync}
            disabled={pages.length >= 6}
            size="sm"
            variant="default"
            title={t('editor.addNewPageTitle')}
          >
            {t('editor.addNewPage')}
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
            <span>{t('editor.characters')} {editor.getText().length}</span>
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
                {t('editor.page')} {pageInfo.currentPage}
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
                    margin-top: 0;
                  }
                  .ProseMirror br {
                    display: block;
                    content: "";
                    margin-top: 0;
                  }
                `}</style>
                <div className="relative z-10 h-full" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: editorSettings.verticalAlignment === 'top' ? 'flex-start' : 
                                   editorSettings.verticalAlignment === 'middle' ? 'center' : 'flex-end'
                }}>
                  {/* Non-editable title section - only show on first page */}
                  {currentPageIndex === 0 && authorInfo.title && (
                    <div 
                      className="px-[60px] pt-[60px] pb-5"
                      style={{
                        fontFamily: getTitleFont(), // Use 학교안심 for title (same as body)
                        fontSize: '60px',
                        color: '#333',
                        textAlign: editorSettings.textAlignment,
                        lineHeight: '1.5',
                        pointerEvents: 'none',
                        userSelect: 'none'
                      }}
                    >
                      {authorInfo.title}
                    </div>
                  )}
                  
                  {/* Editor content with adjusted padding */}
                  <div style={{
                    paddingTop: currentPageIndex === 0 && authorInfo.title ? '0' : undefined,
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <EditorContent editor={editor} />
                  </div>
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
                title={t('editor.previousPageTitle')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('editor.previousPage')}
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
                title={t('editor.nextPageTitle')}
              >
                {t('editor.nextPage')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* Page Info */}
            <div className="text-center sm:text-right">
              <div className="text-lg font-medium text-gray-800">
                {t('editor.pageOf', { current: pageInfo.currentPage, total: pageInfo.totalPages })}
              </div>
              {pageInfo.totalPages > 6 && (
                <div className="text-sm text-red-600 flex items-center justify-center sm:justify-end gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {t('editor.pagesOverLimit', { count: pageInfo.totalPages - 6 })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Page Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3 bg-blue-50 rounded-md">
            <div className="text-lg font-semibold text-blue-600">{pageInfo.totalPages}</div>
            <div className="text-sm text-blue-600">{t('editor.totalPages')}</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-md">
            <div className="text-lg font-semibold text-green-600">{sections.length}</div>
            <div className="text-sm text-green-600">{t('editor.sections')}</div>
          </div>
          
          <div className="p-3 bg-purple-50 rounded-md">
            <div className="text-lg font-semibold text-purple-600">{editor.getText().length}</div>
            <div className="text-sm text-purple-600">{t('editor.characters').replace(':', '')}</div>
          </div>
          
          <div className="p-3 bg-orange-50 rounded-md">
            <div className="text-lg font-semibold text-orange-600">{getCurrentPageContent()?.length || 0}</div>
            <div className="text-sm text-orange-600">{t('editor.pageCharacters')}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Add navigation section wrapper
const PaginatedEditorWithNavigation: React.FC<PaginatedEditorProps> = ({ className }) => {
  const { t } = useTranslation('common');
  const { setCurrentStep, content, syncPagesToSections } = useStoryStore();
  
  const { showWarning } = useToast();

  const handleNext = () => {
    if (!content || content.trim() === '') {
      showWarning(t('editor.incompleteContent'), t('editor.incompleteContentMessage'));
      return;
    }
    // Sync pages to sections before going to image generation
    syncPagesToSections();
    setCurrentStep(2);
  };
  
  const handleBack = () => {
    // Dispatch event to indicate return from preview
    window.dispatchEvent(new CustomEvent('returnFromPreview'));
    setCurrentStep(0);
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
          {t('editor.backToAuthorInfo')}
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
        >
          {t('editor.previewExport')}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export { PaginatedEditor, PaginatedEditorWithNavigation };
export default PaginatedEditorWithNavigation;

