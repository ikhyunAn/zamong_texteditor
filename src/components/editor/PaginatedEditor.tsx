'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { useTranslation } from 'react-i18next';
import StarterKit from '@tiptap/starter-kit';
import { FixedSizeList as List } from 'react-window';
import { useStoryStore } from '../../store/useStoryStore';
import { usePageManager } from '../../hooks/usePageManager';
import { useSyncStatus } from '../../hooks/useSyncStatus';
import { useUniversalPagination } from '../../hooks/useUniversalPagination';
import { LINE_HEIGHT_OPTIONS, getTitleFont } from '@/lib/constants';
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
  BookOpen, 
  Bold as BoldIcon, 
  Italic as ItalicIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Plus,
  Minus,
  Check
} from 'lucide-react';

interface PaginatedEditorProps {
  className?: string;
}

// Page styling constants - Base dimensions for aspect ratio
const PAGE_ASPECT_RATIO = 9 / 16; // width / height
const BASE_PAGE_WIDTH = 900;
const BASE_PAGE_HEIGHT = 1600;
const BASE_PAGE_PADDING = 60;

import { Editor } from '@tiptap/core';
import { ResponsiveEditorWrapper } from './ResponsiveEditorWrapper';

const PaginatedEditor: React.FC<PaginatedEditorProps & { onEditorReady?: (editor: Editor) => void }> = ({ className, onEditorReady }) => {
  const { t } = useTranslation('common');
  const { 
    editorSettings, 
    sections, 
    pages, 
    currentPageIndex,
    getCurrentPageContent,
    initializeWithEmptyPage,
    setTextAlignment,
    setFontFamily,
    increaseFontSize,
    decreaseFontSize,
    setLineHeight,
    authorInfo
  } = useStoryStore();
  const { 
    totalPages, 
    getPageInfo, 
    navigateToPage,
    addNewPage,
    updateCurrentPageContent,
  } = usePageManager();
  
  // Using only KoPubWorldBatangLight font - no font selection needed
  const [pageBreakMessage, setPageBreakMessage] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageScale, setPageScale] = useState(1);

  // Calculate responsive scale to fit entire page in viewport
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const viewportHeight = window.innerHeight;
        
        // Reduce reserved space - CardHeader (~200px) + toolbar (~60px) + padding/margins (~40px) = ~300px
        const availableHeight = viewportHeight - 300;
        const availableWidth = containerWidth - 60; // Padding
        
        // Calculate scale to fit both dimensions
        const scaleByHeight = availableHeight / BASE_PAGE_HEIGHT;
        const scaleByWidth = availableWidth / BASE_PAGE_WIDTH;
        
        // Use the smaller scale to ensure full page fits
        const scale = Math.max(0.1, Math.min(scaleByWidth, scaleByHeight, 1));
        
        console.log('[Scaling]', {
          viewportHeight,
          containerWidth,
          availableHeight,
          availableWidth,
          scaleByHeight: scaleByHeight.toFixed(3),
          scaleByWidth: scaleByWidth.toFixed(3),
          finalScale: scale.toFixed(3)
        });
        
        setPageScale(scale);
      }
    };

    setTimeout(updateDimensions, 100);
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Enhanced sync status management
  const { 
    syncNow, 
    queueSync, 
    isSyncing,
    syncStatus
  } = useSyncStatus();

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

  // Force KoPubWorld Batang Light font on component mount (ensure consistency)
  useEffect(() => {
    const primaryFont = 'KoPubWorldBatangLight'; // Primary font for all text
    if (editorSettings.fontFamily !== primaryFont) {
      console.log(`[Font Init] Setting primary font on mount: ${primaryFont}`);
      setFontFamily(primaryFont);
    }
  }, [editorSettings.fontFamily, setFontFamily]); // Include dependencies

  const EDT_PAGE_PADDING = BASE_PAGE_PADDING - 35;
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: getCurrentPageContent() || '',
    editorProps: {
      attributes: {
        class: `w-full h-full resize-none outline-none bg-transparent`,
        style: `padding-left: ${EDT_PAGE_PADDING}px; padding-right: ${EDT_PAGE_PADDING}px; padding-bottom: ${EDT_PAGE_PADDING}px; padding-top: ${currentPageIndex === 0 && authorInfo.title ? '0' : EDT_PAGE_PADDING}px; font-family: ${editorSettings.fontFamily}; font-size: ${editorSettings.fontSize}px; line-height: ${editorSettings.lineHeight}; color: #333; text-align: ${editorSettings.textAlignment}; display: flex; flex-direction: column; justify-content: ${editorSettings.verticalAlignment === 'top' ? 'flex-start' : editorSettings.verticalAlignment === 'middle' ? 'center' : 'flex-end'};`,
        contenteditable: 'true',
      },
    },
  });
  
  // Automatic pagination system - must be after editor is created
  const {
    isProcessing: isAutoPaginating,
    repaginate
  } = useUniversalPagination({
    editor,
    enabled: true,
    debounceMs: 150 // Faster reflow to prevent temporary overlap with title
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
        
        // Queue sync with the updated content
        queueSync(textContent, 'editor-update');
      }
    }, 100),
    [getCurrentPageContent, updateCurrentPageContent, queueSync]
  );

  useEffect(() => {
    if (editor) {
      const handleUpdate = ({ editor }: { editor: Editor }) => {
        const newHtmlContent = editor.getHTML();
        debouncedUpdateContent(newHtmlContent);
        updateTextAlignment();
      };

      editor.setOptions({
        onUpdate: handleUpdate,
      });
    }
  }, [editor, debouncedUpdateContent, updateTextAlignment]);

  // Add auto-sync on window blur (user switching tabs/windows)
  useEffect(() => {
    if (!editor) return;

    const handleBlur = () => {
      if (editor && !isNavigatingRef.current) {
        const currentContent = htmlToTextWithLineBreaks(editor.getHTML());
        syncNow(currentContent, 'window-blur');
      }
    };

    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [editor, syncNow]);


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
      
      // Step 2: Sync current page content immediately and wait for confirmation
      syncNow(currentEditorContent, 'navigation').then(syncSuccess => {
        if (!syncSuccess) {
          console.warn('[Navigation] Sync failed, continuing with navigation anyway');
        }
        
        // Step 3: Navigate to new page
        console.log('[Navigation] Navigating to page:', pageIndex);
        navigateToPage(pageIndex);
        
        // Step 4: Load new page content with a delay to ensure state has updated
        setTimeout(() => {
          try {
            // CRITICAL FIX: Get fresh pages state from store to avoid stale closure
            const { pages: freshPages } = useStoryStore.getState();
            const targetPageContent = freshPages[pageIndex]?.content || '';
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
      });
      
    } catch (error) {
      console.error('[Navigation] Error during navigation:', error);
      isNavigatingRef.current = false;
    }
  }, [editor, currentPageIndex, pages, navigateToPage, syncNow, storeSnapshot]);


  // Display sync status notification (replaces manual sync)  
  useEffect(() => {
    // Only show error messages, not success messages (for less intrusive UX)
    if (syncStatus.state === 'error') {
      setPageBreakMessage(`Sync error: ${syncStatus.errorMessage || 'Unknown error'}`);
      setTimeout(() => setPageBreakMessage(''), 3000);
    }
  }, [syncStatus.state, syncStatus.errorMessage]);

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
   * KEYBOARD SHORTCUTS FOR PAGE NAVIGATION
   * 
   * This effect sets up global keyboard shortcuts for page navigation:
   * - Ctrl/Cmd + Left Arrow: Navigate to previous page (with smooth scrolling)
   * - Ctrl/Cmd + Right Arrow: Navigate to next page (with smooth scrolling)
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
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, pageInfo, navigateToPageWithEditorSync, scrollToEditor]);

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
  // Font is fixed to KoPubWorldBatangLight - no font change handler needed

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

  // Font is fixed to KoPubWorldBatangLight - no need to sync state

  // Update font family when it changes - KoPubWorldBatangLight only
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      
      // Remove any existing font classes
      editorElement.classList.remove('font-korean-body', 'font-korean-title', 'font-korean-regular');
      
      // Use KoPubWorldBatangLight font
      editorElement.style.fontFamily = 'KoPubWorldBatangLight';
    }
  }, [editor]);

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

  // Update top padding when page or title changes
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      const shouldHaveTopPadding = !(currentPageIndex === 0 && authorInfo.title);
      editorElement.style.paddingTop = shouldHaveTopPadding ? `${BASE_PAGE_PADDING}px` : '0px';
    }
  }, [editor, currentPageIndex, authorInfo.title]);

  // Calculate available height for text content using base dimensions (scaled visually)
  const calculateAvailableTextHeight = useCallback(() => {
    const totalPageHeight = BASE_PAGE_HEIGHT;
    const topPadding = 80; // pt-[80px] for title
    const bottomPadding = BASE_PAGE_PADDING; // 60px bottom padding
    const titleSpacing = 20; // pb-5 class (20px)
    
    if (currentPageIndex === 0 && authorInfo.title) {
      // First page with title
      const titleFontSize = 60;
      const titleLineHeight = 1.5;
      const estimatedTitleHeight = titleFontSize * titleLineHeight; // ~90px for single line
      
      const availableHeight = totalPageHeight - topPadding - estimatedTitleHeight - titleSpacing - bottomPadding - 40;
      return `${Math.max(availableHeight, 100)}px`; // Ensure minimum 100px
    } else {
      // Regular page without title
      const availableHeight = totalPageHeight - BASE_PAGE_PADDING - bottomPadding; // 2 * PADDING
      return `${availableHeight}px`;
    }
  }, [currentPageIndex, authorInfo.title]);

  // Ensure font consistency - KoPubWorldBatangLight only
  useEffect(() => {
    const primaryFont = 'KoPubWorldBatangLight'; // Primary font for all text
    
    // Only update if there's actually a mismatch to prevent unnecessary re-renders
    if (editorSettings.fontFamily !== primaryFont) {
      console.log(`[Font Sync] Ensuring primary font: ${primaryFont}`);
      setFontFamily(primaryFont);
    }
  }, [editorSettings.fontFamily, setFontFamily]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

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
        {/* <div className="flex items-center gap-2">
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
        </div> */}
        
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
        {/* Sync Status Indicator */}
        <div className="flex items-center gap-2">
          {isSyncing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin"></div>
              <span>Syncing...</span>
            </div>
          )}
          {!isSyncing && syncStatus.state === 'synced' && syncStatus.lastSyncTime && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="w-4 h-4" />
              <span>Auto-sync enabled</span>
            </div>
          )}
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

        {/* Pages Container - Display all pages */}
        <div ref={containerRef} className="w-full">
          <div 
            ref={editorRef}
            className="overflow-y-auto overflow-x-hidden"
            style={{ maxHeight: `${Math.max(400, window.innerHeight - 300)}px` }}
          >
            <div className="space-y-6 pb-8 flex flex-col items-center">
              {/* Render all pages */}
              {pages.map((page, pageIndex) => (
                <div
                  key={page.id}
                  className="relative mx-auto"
                  style={{ width: `${BASE_PAGE_WIDTH * pageScale}px`, height: `${BASE_PAGE_HEIGHT * pageScale}px` }}
                >
                {/* Page Number */}
                <div className="text-center text-sm text-gray-500 mb-2">
                  {t('editor.page')} {pageIndex + 1}
                </div>

                {/* Page Container */}
                <div 
                  className={`relative bg-white border-2 shadow-lg rounded-lg overflow-hidden ${
                    currentPageIndex === pageIndex ? 'border-blue-500' : 'border-gray-300'
                  }`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    width: `${BASE_PAGE_WIDTH}px`,
                    height: `${BASE_PAGE_HEIGHT}px`,
                    transform: `translateX(-50%) scale(${pageScale})`,
                    transformOrigin: 'top center',
                    backgroundImage: 'url(/backgrounds/stage_3.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                  onClick={() => {
                    if (currentPageIndex !== pageIndex) {
                      navigateToPageWithEditorSync(pageIndex);
                    }
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
                    {pageIndex === 0 && authorInfo.title && (
                      <div 
                        style={{
                          paddingLeft: `${BASE_PAGE_PADDING}px`,
                          paddingRight: `${BASE_PAGE_PADDING}px`,
                          paddingTop: '80px',
                          paddingBottom: '20px',
                          fontFamily: getTitleFont(),
                          fontSize: '60px',
                          color: '#333',
                          textAlign: 'center',
                          lineHeight: '1.8',
                          pointerEvents: 'none',
                          userSelect: 'none'
                        }}
                      >
                        {authorInfo.title}
                      </div>
                    )}
                    
                    {/* Page content - Editable only if it's the current page */}
                    <div 
                      className="relative"
                      style={{
                        paddingLeft: `${BASE_PAGE_PADDING}px`,
                        paddingRight: `${BASE_PAGE_PADDING}px`,
                        paddingBottom: `${BASE_PAGE_PADDING}px`,
                        paddingTop: pageIndex === 0 && authorInfo.title ? '0' : `${BASE_PAGE_PADDING}px`,
                        height: calculateAvailableTextHeight(),
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        fontFamily: editorSettings.fontFamily,
                        fontSize: `${editorSettings.fontSize}px`,
                        lineHeight: editorSettings.lineHeight,
                        color: '#333',
                        textAlign: editorSettings.textAlignment,
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {/* Show editor only for current page, otherwise show read-only content */}
                      {currentPageIndex === pageIndex ? (
                        <EditorContent editor={editor} />
                      ) : (
                        <div 
                          className="w-full h-full cursor-pointer"
                          dangerouslySetInnerHTML={{ __html: textToHtmlWithLineBreaks(page.content || '') }}
                        />
                      )}
                      
                      {/* Visual indicator when approaching text limit - only on current page */}
                      {currentPageIndex === pageIndex && (
                        <>
                          <div 
                            className="absolute bottom-10 left-0 right-0 pointer-events-none"
                            style={{
                              height: '100px',
                              background: 'rgba(255, 255, 255, 0.8)',
                              zIndex: 10
                            }}
                          />
                          
                          {/* Text limit warning */}
                          <div 
                            className="absolute bottom-12 right-2 text-xs text-gray-600 pointer-events-none"
                            style={{ zIndex: 11, fontSize: '25px' }}
                          >
                            주의: 해당 블럭부터 이미지에 표시되지 않습니다
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              ))}
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
              {pageInfo.totalPages > 4 && (
                <div className="text-sm text-red-600 flex items-center justify-center sm:justify-end gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {t('editor.pagesOverLimit', { count: pageInfo.totalPages - 4 })}
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
  const { setCurrentStep, content, syncPagesToSections, pages, sections } = useStoryStore();
  const { syncNow } = useSyncStatus();
  
  const { showWarning, showError } = useToast();
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Reference to the editor instance so we can access current content
  const editorRef = useRef<Editor | null>(null);
  
  // Callback to receive the editor instance from child component
  const handleEditorReady = useCallback((editor: Editor) => {
    editorRef.current = editor;
    console.log('[Wrapper] Editor instance received:', !!editor);
  }, []);

  const handleNext = async () => {
    setIsTransitioning(true);
    
    // PRIORITY SYNC: Always sync current editor content first
    console.log('[Priority Sync] Starting mandatory sync before transition...');
    
    // Get current editor content if we have access to the editor instance
    let currentEditorContent: string | null = null;
    if (editorRef.current && typeof editorRef.current.getHTML === 'function') {
      console.log('[Priority Sync] Using live editor content from editor instance');
      const editorHtml = editorRef.current.getHTML();
      currentEditorContent = htmlToTextWithLineBreaks(editorHtml);
    } else {
      console.log('[Priority Sync] Editor not available, using stored content');
      const { getCurrentPageContent } = useStoryStore.getState();
      currentEditorContent = getCurrentPageContent();
    }
    
    // Force sync the current editor content before any validation
    if (currentEditorContent) {
      const { currentPageIndex, pages: currentPages } = useStoryStore.getState();
      const currentPage = currentPages[currentPageIndex];
      
      console.log('[Priority Sync] Syncing editor content:', {
        pageIndex: currentPageIndex,
        pageId: currentPage?.id,
        contentLength: currentEditorContent.length,
        contentPreview: currentEditorContent.substring(0, 50) + '...'
      });
      
      const prioritySyncSuccess = await syncNow(currentEditorContent, 'priority-sync-before-transition');
      if (prioritySyncSuccess) {
        console.log('[Priority Sync] Successfully synced current editor content');
      } else {
        console.warn('[Priority Sync] Failed to sync current editor content, but continuing...');
      }
    }
    
    // Now validate content after sync
    const { content: freshContent, pages: freshPages } = useStoryStore.getState();
    
    // Check if we have any meaningful content after sync
    const hasContent = freshContent && freshContent.trim() !== '';
    const hasPages = freshPages.length > 0;
    const hasPageContent = freshPages.some(page => page.content && page.content.trim() !== '');
    
    if (!hasContent && !hasPageContent) {
      showWarning(t('editor.incompleteContent'), 'Please write some content before proceeding to preview.');
      setIsTransitioning(false);
      return;
    }
    
    if (!hasPages) {
      showWarning('No Pages', 'Please create at least one page before proceeding.');
      setIsTransitioning(false);
      return;
    }

    // Get store state once at the beginning to avoid scoping issues
    const storeState = useStoryStore.getState();
    console.log('Initial store state captured for transition');
    console.log(storeState);
    
    try {
      // DEBUG: Log current state before transition
      console.group('[Transition Debug] Pre-transition state');
      console.log('Pages count:', pages.length);
      console.log('Pages data:', pages.map(p => ({ id: p.id, contentLength: p.content?.length || 0, preview: p.content?.substring(0, 50) + '...' })));
      console.log('Current sections count:', sections.length);
      console.log('Current sections data:', sections.map(s => ({ id: s.id, contentLength: s.content?.length || 0, preview: s.content?.substring(0, 50) + '...' })));
      console.groupEnd();

      // Step 1: Additional sync verification (priority sync already done above)
      console.log('[Transition] Verifying sync completion before image generation...');
      
      // At this point, priority sync has already been completed
      // Just do a final verification of the state
      const { currentPageIndex, pages: verifyPages } = useStoryStore.getState();
      const verifyCurrentPage = verifyPages[currentPageIndex];
      
      console.log('[Transition] Post-priority-sync verification:', {
        pageIndex: currentPageIndex,
        pageId: verifyCurrentPage?.id,
        storedContentLength: verifyCurrentPage?.content?.length || 0,
        storedContentPreview: (verifyCurrentPage?.content || '').substring(0, 50) + '...'
      });
      
      // Step 2: Validate page state 
      console.log('[Transition] Validating page state after sync...');
      const { pages: updatedPages } = useStoryStore.getState();
      const allPagesHaveContent = updatedPages.every(page => 
        typeof page.content === 'string' && page.id
      );
      
      if (!allPagesHaveContent) {
        throw new Error('Invalid page content detected');
      }

      // Step 2: Sync pages to sections with validation
      console.log('[Transition] Syncing pages to sections...');
      syncPagesToSections();
      
      // DEBUG: Check what happened after sync
      const { sections: updatedSections } = useStoryStore.getState();
      console.group('[Transition Debug] Post-sync state');
      console.log('Updated sections count:', updatedSections.length);
      console.log('Updated sections data:', updatedSections.map(s => ({ id: s.id, contentLength: s.content?.length || 0, preview: s.content?.substring(0, 50) + '...' })));
      console.groupEnd();
      
      // Step 4: Brief delay to ensure all sync operations complete
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 5: Navigate to image generation
      console.log('[Transition] All sync operations completed, navigating to image generation');
      setCurrentStep(2);
      
    } catch (error) {
      console.error('[Transition] Error during step transition:', error);
      showError(
        t('transition.syncError'), 
        `${t('transition.syncErrorMessage')}: ${error instanceof Error ? error.message : t('transition.unknownError')}. ${t('transition.pleaseRetry')}.`
      );
    } finally {
      setIsTransitioning(false);
    }
  };
  
  const handleBack = async () => {
    setIsTransitioning(true);
    
    try {
      // Sync current state before navigating back
      if (content && content.trim()) {
        await syncNow(content, 'back-navigation');
      }
      
      // Dispatch event to indicate return from preview
      window.dispatchEvent(new CustomEvent('returnFromPreview'));
      setCurrentStep(0);
    } catch (error) {
      console.warn('[Transition] Error syncing during back navigation:', error);
      // Don't block navigation for back button
      setCurrentStep(0);
    } finally {
      setIsTransitioning(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <PaginatedEditor className={className} onEditorReady={handleEditorReady} />
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={isTransitioning}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('editor.backToAuthorInfo')}
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
          disabled={isTransitioning}
          className="relative"
        >
          {isTransitioning && (
            <div className="w-4 h-4 mr-2 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
          )}
          {!isTransitioning && (
            <ArrowRight className="w-4 h-4 ml-2" />
          )}
          {isTransitioning ? 'Syncing...' : t('editor.previewExport')}
        </Button>
      </div>
    </div>
  );
};

export { PaginatedEditor, PaginatedEditorWithNavigation };
export default PaginatedEditorWithNavigation;

// Auto-sync implementation notes:
// 1. Automatic sync triggers have been added to:
//    - Editor content changes (via debouncedUpdateContent)
//    - Page navigation (via navigateToPageWithEditorSync)
//    - Window blur events (via window blur listener)
//    - Page break operations (in insertPageBreak)
//    - Adding new pages (in addNewPageWithSync)
// 2. The manual sync button has been replaced with status indicators
// 3. Sync operations are managed through the useSyncStatus hook
//    with proper error handling and retry mechanisms

