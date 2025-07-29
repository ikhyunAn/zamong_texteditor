import { useState, useEffect, useCallback, useRef } from 'react';
import { useStoryStore } from '../store/useStoryStore';
import { StorySection, Page } from '../types';
import { validatePages, validateNavigation, logNavigation, logPageState, detectAnomalies } from '../lib/pagination-validation';
import { useToast } from './useToast';

export const usePageManager = () => {
  const {
    content,
    sections,
    pages,
    currentPageIndex,
    editorSettings,
    setCurrentStep,
    setPages,
    setCurrentPageIndex,
    addEmptyPage,
    updatePage,
    getCurrentPageContent,
    setCurrentPageContent,
    syncPagesToSections,
    navigateToPage: storeNavigateToPage,
  } = useStoryStore();

  const [lineCounts, setLineCounts] = useState<Record<string, number>>({});
  const addPageInProgressRef = useRef(false);
  const { showWarning, showError } = useToast();

  // Calculate line count for content based on character count and font metrics with line break preservation
  const calculateLineCount = useCallback((content: string): number => {
    if (!content) return 0;
    
    // Clean HTML content and count actual lines while preserving line break structure
    const cleanContent = content
      .replace(/<\/p>\s*<p>/gi, '\n\n') // Convert paragraph breaks to double newlines
      .replace(/<br\s*\/?>/gi, '\n') // Convert <br> tags to single newlines
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    // Split by actual line breaks and count ALL lines (including empty ones)
    const lines = cleanContent.split('\n');
    let lineCount = 0;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0) {
        // Calculate how many visual lines this text content will take
        const avgCharPerLine = 60; // Average characters per line based on font size and page width
        const visualLines = Math.max(1, Math.ceil(trimmedLine.length / avgCharPerLine));
        lineCount += visualLines;
      } else {
        // Empty lines are important for formatting and should count as one line
        lineCount += 1;
      }
    }
    
    return lineCount;
  }, []);

  // Split content into pages - now creates one page per section without line limits
  const splitIntoPages = useCallback((sections: StorySection[]): Page[] => {
    console.log('[splitIntoPages] Called with sections:', sections.length, sections);
    const newPages: Page[] = [];
    
    sections.forEach((section, index) => {
      // Create one page per section, allowing user to decide page breaks
      newPages.push({
        id: `page-${index + 1}`,
        content: section.content.trim()
      });
      
      // Check if we've reached the 6-page limit
      if (newPages.length >= 6) {
        return; // Stop processing if we've reached the limit
      }
      
      // Update line count tracking (keep for compatibility)
      const sectionLines = calculateLineCount(section.content);
      setLineCounts(prev => ({
        ...prev,
        [section.id]: sectionLines
      }));
    });

    return newPages.slice(0, 6); // Ensure we never exceed 6 pages
  }, [calculateLineCount]);

  // Navigate to a specific page
  const navigateToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < pages.length) {
      setCurrentPageIndex(pageIndex);
    }
  }, [pages.length, setCurrentPageIndex]);

  // Check if content exceeds page limits
  const checkPageLimits = useCallback(() => {
    const estimatedPages = Math.ceil(sections.length / 3); // Rough estimation
    
    if (estimatedPages > 6) {
      return {
        exceedsLimit: true,
        message: `Your content would create ${estimatedPages} pages, but the limit is 6 pages. Please reduce your content.`,
      };
    }
    
    return {
      exceedsLimit: false,
      message: '',
    };
  }, [sections]);

  // Update pages when content changes - DISABLED to prevent conflicts with manual page management
  // This effect was causing pages to be regenerated from sections, overwriting manually created pages
  useEffect(() => {
    console.log('[usePageManager.useEffect] Effect triggered with:', {
      sectionsLength: sections.length,
      pagesLength: pages.length,
      sections: sections,
      pages: pages.map(p => ({ id: p.id, contentLength: p.content.length }))
    });
    
    // Only auto-generate pages from sections if there are no manually created pages
    // and we have sections but no pages (initial state)
    if (sections.length > 0 && pages.length === 0) {
      console.log('[usePageManager] Auto-generating initial pages from sections');
      const newPages = splitIntoPages(sections);
      
      // Runtime validation of new pages
      const validationResult = validatePages(newPages);
      if (!validationResult.isValid) {
        console.error('[usePageManager] Page validation failed:', validationResult.errors);
      }
      
      // Detect potential anomalies
      const anomalies = detectAnomalies(newPages, currentPageIndex);
      if (anomalies.length > 0) {
        console.warn('[usePageManager] Pagination anomalies detected:', anomalies);
      }
      
      setPages(newPages);
      
      // Enhanced debugging with state logging
      logPageState('Pages Updated', {
        currentPageIndex,
        totalPages: newPages.length,
        pages: newPages,
        currentPageContent: newPages[currentPageIndex]?.content
      });
    }
  }, [sections, splitIntoPages, setPages, currentPageIndex]);

  // Get current page content (returns page object)
  const getCurrentPage = useCallback(() => {
    if (pages.length > 0 && currentPageIndex < pages.length) {
      return pages[currentPageIndex];
    }
    return null;
  }, [pages, currentPageIndex]);

  // Get page navigation info
  const getPageInfo = useCallback(() => {
    // Always reflect the actual pages.length for accurate page indicators
    const actualTotalPages = pages.length;
    console.log('[usePageManager] Page info calculated:', {
      currentPageIndex,
      pagesLength: pages.length,
      actualTotalPages,
      currentPage: currentPageIndex + 1
    });
    
    return {
      currentPage: currentPageIndex + 1,
      totalPages: actualTotalPages,
      hasNextPage: currentPageIndex < actualTotalPages - 1,
      hasPreviousPage: currentPageIndex > 0,
    };
  }, [currentPageIndex, pages.length]);

  // Auto-paginate content based on line height and content measurements
  const autoPaginate = useCallback(() => {
    if (!content) return;
    
    const limitCheck = checkPageLimits();
    if (limitCheck.exceedsLimit) {
      return false;
    }

    const newPages = splitIntoPages(sections);
    setPages(newPages);
    return true;
  }, [content, sections, checkPageLimits, splitIntoPages, setPages]);

  // Add a new empty page
  const addNewPage = useCallback(() => {
    const timestamp = Date.now();
    console.log(`[addNewPage-${timestamp}] Function called START`);
    console.log(`[addNewPage-${timestamp}] Flag status:`, addPageInProgressRef.current);
    
    // Prevent multiple simultaneous calls
    if (addPageInProgressRef.current) {
      console.log(`[addNewPage-${timestamp}] Already adding a page, ignoring request`);
      return;
    }
    
    // Get the current pages state directly from the store to avoid stale closure values
    const { pages: currentPages } = useStoryStore.getState();
    console.log(`[addNewPage-${timestamp}] Current pages:`, currentPages.length);
    
    // Prevent adding more than 6 pages
    if (currentPages.length >= 6) {
      console.warn(`[addNewPage-${timestamp}] Cannot add more pages, already at maximum (6)`);
      showWarning('Page Limit Reached', 'You can have a maximum of 6 pages in your story.');
      return;
    }
    
    // Set the flag to prevent concurrent calls
    addPageInProgressRef.current = true;
    console.log(`[addNewPage-${timestamp}] Flag set to true, calling addEmptyPage`);
    
    try {
      const success = addEmptyPage();
      
      if (!success) {
        console.warn(`[addNewPage-${timestamp}] Failed to add page (likely at maximum)`);
        showError('Failed to Add Page', 'Unable to create a new page. You may have reached the maximum page limit.');
        return;
      }
      
      // Calculate the new page index based on the current pages count
      const newPageIndex = currentPages.length; // This will be the index of the newly created page
      console.log(`[addNewPage-${timestamp}] Will navigate to new page index:`, newPageIndex);
      
      // Use a small timeout to ensure the store has updated
      setTimeout(() => {
        const { pages: updatedPages } = useStoryStore.getState();
        console.log(`[addNewPage-${timestamp}] Pages after creation:`, updatedPages.length);
        
        if (newPageIndex < updatedPages.length) {
          console.log(`[addNewPage-${timestamp}] Navigating to page:`, newPageIndex);
          storeNavigateToPage(newPageIndex);
        } else {
          console.warn(`[addNewPage-${timestamp}] New page index out of bounds, navigating to last page`);
          storeNavigateToPage(updatedPages.length - 1);
        }
        
        console.log(`[addNewPage-${timestamp}] Function END`);
      }, 50);
    } finally {
      // Always reset the flag, even if an error occurs
      setTimeout(() => {
        addPageInProgressRef.current = false;
        console.log(`[addNewPage-${timestamp}] Flag reset to false`);
      }, 100);
    }
  }, [addEmptyPage, storeNavigateToPage]);

  // Update the current page content
  const updateCurrentPageContent = useCallback((content: string) => {
    setCurrentPageContent(content);
    // DISABLED: Don't automatically sync pages to sections as this causes page regeneration
    // setTimeout(() => syncPagesToSections(), 500);
  }, [setCurrentPageContent]);

  // Save current page content before navigation with validation
  const syncContentToPage = useCallback((editorContent?: string) => {
    // Get fresh state from store to avoid stale closure values
    const { pages: currentPages, currentPageIndex: currentIndex } = useStoryStore.getState();
    
    if (currentPages.length > 0 && currentIndex >= 0 && currentIndex < currentPages.length) {
      // Use provided editor content, or fall back to store content
      const currentContent = editorContent !== undefined ? editorContent : getCurrentPageContent();
      // Get the current page object
      const currentPage = currentPages[currentIndex];
      
      console.log('[syncContentToPage] Syncing page:', currentIndex, 'with content length:', currentContent?.length || 0);
      console.log('[syncContentToPage] Using editor content:', editorContent !== undefined);
      
      if (currentPage) {
        // Always update the page content to ensure synchronization
        // This handles cases where the editor content might be newer than the stored page content
        updatePage(currentPage.id, currentContent);
        
        // DISABLED: Don't sync pages to sections as this causes page regeneration
        // syncPagesToSections();
        
        // Validate that the content was properly saved by checking the updated state
        // Note: Since Zustand updates are synchronous, we can verify immediately
        const updatedState = useStoryStore.getState();
        const updatedPages = updatedState.pages;
        const updatedPage = updatedPages.find(p => p.id === currentPage.id);
        
        if (!updatedPage || updatedPage.content !== currentContent) {
          // If validation fails, log the issue but continue with navigation
          // In a production environment, you might want to handle this differently
          console.warn('Content synchronization validation failed for page:', currentPage.id);
        }
        
        console.log('[syncContentToPage] Successfully synced page:', currentPage.id, 'with content length:', currentContent?.length || 0);
        return true; // Indicate successful sync
      }
    }
    return false; // Indicate failed sync
  }, [getCurrentPageContent, updatePage, syncPagesToSections]);

  // Load content for a specific page with validation
  const loadPageContent = useCallback((pageIndex: number) => {
    // Get fresh pages data from store to avoid stale closure values
    const { pages: currentPages } = useStoryStore.getState();
    
    if (currentPages.length > 0 && pageIndex >= 0 && pageIndex < currentPages.length) {
      const targetPage = currentPages[pageIndex];
      if (targetPage) {
        // Set the content for the target page
        setCurrentPageContent(targetPage.content);
        
        // Validate that the content was properly set by checking the store
        // Since Zustand updates are synchronous, we can verify immediately
        const verificationContent = getCurrentPageContent();
        if (verificationContent !== targetPage.content) {
          // If there's a mismatch, try setting the content again
          console.warn('Content loading verification failed, retrying for page:', targetPage.id);
          setCurrentPageContent(targetPage.content);
          
          // Final verification
          const finalVerification = getCurrentPageContent();
          if (finalVerification !== targetPage.content) {
            console.error('Critical: Content loading failed for page:', targetPage.id);
          }
        }
        
        return targetPage.content;
      }
    }
    return '';
  }, [setCurrentPageContent, getCurrentPageContent]);

  // Enhanced navigation that ensures proper page loading
  const navigateToPageWithSync = useCallback((pageIndex: number) => {
    const navigationStartTime = performance.now();
    
    // Get the current pages state directly from the store to avoid stale closure values
    const { pages: currentPages, currentPageIndex: currentIndex } = useStoryStore.getState();
    
    // Runtime validation of navigation parameters using fresh store data
    const navigationValidation = validateNavigation(currentIndex, pageIndex, currentPages.length);
    if (!navigationValidation.isValid) {
      logNavigation('Navigation Failed', currentIndex, pageIndex, false, navigationValidation.errors.join(', '));
      console.error('[PageManager] Navigation validation failed:', navigationValidation.errors);
      return;
    }
    
    // Log warnings if any
    if (navigationValidation.warnings.length > 0) {
      console.warn('[PageManager] Navigation warnings:', navigationValidation.warnings);
    }
    
    console.group(`[PageManager] Navigation: ${currentIndex} → ${pageIndex}`);
    console.log('Pages available:', currentPages.length);
    console.log('Target page index:', pageIndex);
    
    // Additional bounds check (redundant but safe)
    if (pageIndex < 0 || pageIndex >= currentPages.length) {
      logNavigation('Navigation Bounds Check Failed', currentIndex, pageIndex, false, 'Index out of bounds');
      console.warn('Navigation aborted: index out of bounds');
      console.groupEnd();
      return;
    }

    // Step 1: Save current page content before navigating away
    console.log('Step 1: Syncing current page content');
    const syncResult = syncContentToPage();
    console.log('Sync result:', syncResult);
    
    // Step 2: Validate that content is properly saved by checking the current page
    const currentPage = currentPages[currentIndex];
    const currentContent = getCurrentPageContent();
    console.log('Step 2: Validating content sync');
    console.log('Current page ID:', currentPage?.id);
    console.log('Current content length:', currentContent?.length || 0);
    
    if (currentPage && currentContent !== currentPage.content) {
      console.log('Content mismatch detected, forcing update');
      // Force update if there's a mismatch
      updatePage(currentPage.id, currentContent);
      // DISABLED: Don't sync sections as this causes page regeneration
      // syncPagesToSections();
    }
    
    // Step 3: Navigate to the new page synchronously
    console.log('Step 3: Navigating to new page');
    storeNavigateToPage(pageIndex);
    
    // Step 4: Load content for the new page immediately after navigation
    console.log('Step 4: Loading target page content');
    // Since Zustand updates are synchronous, we can load content immediately
    const targetPageContent = loadPageContent(pageIndex);
    console.log('Target page content length:', targetPageContent?.length || 0);
    
    // Step 5: Verify the content was loaded correctly
    console.log('Step 5: Verifying content load');
    if (currentPages[pageIndex] && targetPageContent !== currentPages[pageIndex].content) {
      console.warn('Content load verification failed, retrying');
      // Retry loading if there's a mismatch
      setCurrentPageContent(currentPages[pageIndex].content);
    }
    
    // Final validation and logging
    const navigationEndTime = performance.now();
    const navigationDuration = navigationEndTime - navigationStartTime;
    
    logNavigation('Navigation Success', currentIndex, pageIndex, true);
    logPageState('Navigation Complete', {
      currentPageIndex: pageIndex,
      totalPages: currentPages.length,
      pages: currentPages,
      currentPageContent: currentPages[pageIndex]?.content
    });
    
    console.log(`Navigation completed successfully in ${navigationDuration.toFixed(2)}ms`);
    console.groupEnd();
  }, [syncContentToPage, storeNavigateToPage, loadPageContent, getCurrentPageContent, updatePage, syncPagesToSections, setCurrentPageContent]);

  return {
    // Page data
    pages,
    currentPageIndex,
    totalPages: pages.length, // Always reflect actual pages.length
    lineCounts,
    
    // Page navigation
    navigateToPage: navigateToPageWithSync,
    getCurrentPageContent: getCurrentPage,
    getPageInfo,
    
    // Enhanced page management
    addNewPage,
    updateCurrentPageContent,
    autoPaginate,
    splitIntoPages,
    checkPageLimits,
    
    // Synchronization functions
    syncContentToPage,
    loadPageContent,
    
    // Store functions
    storeGetCurrentPageContent: getCurrentPageContent,
    storeSetCurrentPageContent: setCurrentPageContent,
    storeUpdatePage: updatePage,
    syncPagesToSections,
    
    // Utility functions
    calculateLineCount,
  };
};
