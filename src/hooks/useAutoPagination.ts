/**
 * useAutoPagination Hook
 * 
 * Manages automatic content overflow and reflow across multiple pages.
 * Monitors content height and automatically distributes content across pages.
 */

import { useCallback, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useStoryStore } from '../store/useStoryStore';
import { 
  calculateAvailableHeight, 
  measureContentHeight,
  isContentOverflowing,
  findOptimalBreakPoint,
  PAGE_DIMENSIONS
} from '../lib/content-measurement';
import { 
  htmlToTextWithLineBreaks, 
  textToHtmlWithLineBreaks 
} from '../lib/text-processing';

interface UseAutoPaginationOptions {
  editor: Editor | null;
  enabled?: boolean;
  debounceMs?: number;
}

export function useAutoPagination({
  editor,
  enabled = true,
  debounceMs = 300
}: UseAutoPaginationOptions) {
  const { 
    pages, 
    currentPageIndex,
    authorInfo,
    editorSettings,
    updatePage,
    getCurrentPageContent
  } = useStoryStore();
  
  const isProcessingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  
  /**
   * Handle content overflow to next page
   */
  const handleOverflow = useCallback(async () => {
    if (!editor || isProcessingRef.current || !enabled) return;
    
    isProcessingRef.current = true;
    
    try {
      const currentContent = htmlToTextWithLineBreaks(editor.getHTML());
      const contentHeight = measureContentHeight(editor);
      
      // Calculate available height for current page
      const hasTitle = currentPageIndex === 0 && authorInfo.title;
      const availableHeight = calculateAvailableHeight(currentPageIndex, hasTitle);
      
      // Check if content overflows
      if (!isContentOverflowing(contentHeight, availableHeight)) {
        isProcessingRef.current = false;
        return;
      }
      
      console.log('[AutoPagination] Content overflow detected', {
        contentHeight,
        availableHeight,
        pageIndex: currentPageIndex
      });
      
      // Don't overflow if we're on the last page (page 3)
      if (currentPageIndex >= 3) {
        console.warn('[AutoPagination] Cannot overflow: already on last page');
        isProcessingRef.current = false;
        return;
      }
      
      // Find optimal break point
      const contentWidth = PAGE_DIMENSIONS.width - (PAGE_DIMENSIONS.padding * 2);
      const estimatedMaxChars = Math.floor(currentContent.length * (availableHeight / contentHeight));
      const breakPoint = findOptimalBreakPoint(currentContent, estimatedMaxChars);
      
      // Split content
      const beforeContent = currentContent.substring(0, breakPoint).trim();
      const afterContent = currentContent.substring(breakPoint).trim();
      
      if (!afterContent) {
        isProcessingRef.current = false;
        return;
      }
      
      console.log('[AutoPagination] Splitting content', {
        totalLength: currentContent.length,
        breakPoint,
        beforeLength: beforeContent.length,
        afterLength: afterContent.length
      });
      
      // Update current page with content before break
      const currentPage = pages[currentPageIndex];
      if (currentPage) {
        updatePage(currentPage.id, beforeContent);
        
        // Update editor with trimmed content
        const beforeHtml = textToHtmlWithLineBreaks(beforeContent);
        editor.commands.setContent(beforeHtml, false);
      }
      
      // Move overflow content to next page
      const nextPageIndex = currentPageIndex + 1;
      if (nextPageIndex < pages.length) {
        const nextPage = pages[nextPageIndex];
        const nextPageContent = nextPage.content || '';
        
        // Prepend overflow content to next page
        const combinedContent = afterContent + (nextPageContent ? '\n' + nextPageContent : '');
        updatePage(nextPage.id, combinedContent);
        
        console.log('[AutoPagination] Moved overflow to page', nextPageIndex);
      }
      
    } catch (error) {
      console.error('[AutoPagination] Error handling overflow:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [editor, enabled, currentPageIndex, pages, authorInfo.title, updatePage, editorSettings]);
  
  /**
   * Handle content reflow from next pages when space becomes available
   */
  const handleReflow = useCallback(async () => {
    if (!editor || isProcessingRef.current || !enabled) return;
    
    isProcessingRef.current = true;
    
    try {
      const currentContent = htmlToTextWithLineBreaks(editor.getHTML());
      const contentHeight = measureContentHeight(editor);
      
      // Calculate available height for current page
      const hasTitle = currentPageIndex === 0 && authorInfo.title;
      const availableHeight = calculateAvailableHeight(currentPageIndex, hasTitle);
      
      // Check if we have space to pull content from next page
      const availableSpace = availableHeight - contentHeight;
      if (availableSpace < 100) { // Need at least 100px of space
        isProcessingRef.current = false;
        return;
      }
      
      // Check if next page has content
      const nextPageIndex = currentPageIndex + 1;
      if (nextPageIndex >= pages.length) {
        isProcessingRef.current = false;
        return;
      }
      
      const nextPage = pages[nextPageIndex];
      const nextPageContent = nextPage.content || '';
      
      if (!nextPageContent.trim()) {
        isProcessingRef.current = false;
        return;
      }
      
      console.log('[AutoPagination] Reflow opportunity detected', {
        availableSpace,
        nextPageContentLength: nextPageContent.length
      });
      
      // Estimate how much content we can pull
      const contentWidth = PAGE_DIMENSIONS.width - (PAGE_DIMENSIONS.padding * 2);
      const spaceRatio = availableSpace / availableHeight;
      const estimatedPullChars = Math.floor(nextPageContent.length * spaceRatio);
      
      // Find break point in next page content
      const pullPoint = findOptimalBreakPoint(nextPageContent, estimatedPullChars);
      const contentToPull = nextPageContent.substring(0, pullPoint).trim();
      const remainingContent = nextPageContent.substring(pullPoint).trim();
      
      if (!contentToPull) {
        isProcessingRef.current = false;
        return;
      }
      
      console.log('[AutoPagination] Pulling content from next page', {
        pullLength: contentToPull.length,
        remainingLength: remainingContent.length
      });
      
      // Update current page
      const currentPage = pages[currentPageIndex];
      if (currentPage) {
        const combinedContent = currentContent + '\n' + contentToPull;
        updatePage(currentPage.id, combinedContent);
        
        // Update editor
        const combinedHtml = textToHtmlWithLineBreaks(combinedContent);
        editor.commands.setContent(combinedHtml, false);
      }
      
      // Update next page with remaining content
      updatePage(nextPage.id, remainingContent);
      
    } catch (error) {
      console.error('[AutoPagination] Error handling reflow:', error);
    } finally {
      isProcessingRef.current = false;
    }
  }, [editor, enabled, currentPageIndex, pages, authorInfo.title, updatePage, editorSettings]);
  
  /**
   * Debounced check for overflow/reflow
   */
  const checkPagination = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      // First check for overflow, then reflow
      handleOverflow().then(() => {
        // Small delay before checking reflow
        setTimeout(() => handleReflow(), 100);
      });
    }, debounceMs);
  }, [handleOverflow, handleReflow, debounceMs]);
  
  /**
   * Set up ResizeObserver to monitor content changes
   */
  useEffect(() => {
    if (!editor || !enabled) return;
    
    const editorElement = editor.view.dom as HTMLElement;
    if (!editorElement) return;
    
    // Create ResizeObserver to watch for content size changes
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Content size changed, check if we need to paginate
        checkPagination();
      }
    });
    
    resizeObserverRef.current.observe(editorElement);
    
    console.log('[AutoPagination] ResizeObserver attached to editor');
    
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        console.log('[AutoPagination] ResizeObserver disconnected');
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [editor, enabled, checkPagination]);
  
  /**
   * Monitor editor updates for content changes
   */
  useEffect(() => {
    if (!editor || !enabled) return;
    
    const handleUpdate = () => {
      checkPagination();
    };
    
    editor.on('update', handleUpdate);
    
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, enabled, checkPagination]);
  
  return {
    isProcessing: isProcessingRef.current,
    checkPagination,
    handleOverflow,
    handleReflow
  };
}
