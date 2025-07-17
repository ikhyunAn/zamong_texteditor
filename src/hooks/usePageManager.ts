import { useState, useEffect, useCallback } from 'react';
import { useStoryStore } from '../store/useStoryStore';
import { StorySection, Page } from '../types';

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
  } = useStoryStore();

  const [lineCounts, setLineCounts] = useState<Record<string, number>>({});
  const [totalPages, setTotalPages] = useState(1);

  // Calculate line count for content based on character count and font metrics
  const calculateLineCount = useCallback((content: string): number => {
    if (!content) return 0;
    
    const avgCharPerLine = 60; // Average characters per line
    const lines = Math.ceil(content.length / avgCharPerLine);
    
    // Count explicit line breaks
    const explicitBreaks = (content.match(/\n/g) || []).length;
    
    // Add explicit line breaks as additional lines
    return lines + explicitBreaks;
  }, []);

  // Split content into pages based on line limits
  const splitIntoPages = useCallback((sections: StorySection[]): Page[] => {
    const { maxLinesPerPage } = editorSettings;
    const newPages: Page[] = [];
    let currentPageContent = '';
    let currentPageId = 1;
    let currentLines = 0;

    sections.forEach((section) => {
      const sectionLines = calculateLineCount(section.content);
      
      // If adding this section would exceed the limit, create a new page
      if (currentLines + sectionLines > maxLinesPerPage && currentPageContent.length > 0) {
        newPages.push({
          id: `page-${currentPageId}`,
          content: currentPageContent.trim()
        });
        
        // Check if we've reached the 6-page limit
        if (newPages.length >= 6) {
          return; // Stop processing if we've reached the limit
        }
        
        currentPageId++;
        currentPageContent = '';
        currentLines = 0;
      }
      
      // Add section content to current page
      currentPageContent += (currentPageContent ? '\n\n' : '') + section.content;
      currentLines += sectionLines;
      
      // Update line count tracking
      setLineCounts(prev => ({
        ...prev,
        [section.id]: sectionLines
      }));
    });

    // Add the last page if it has content
    if (currentPageContent.trim().length > 0) {
      newPages.push({
        id: `page-${currentPageId}`,
        content: currentPageContent.trim()
      });
    }

    return newPages.slice(0, 6); // Ensure we never exceed 6 pages
  }, [editorSettings, calculateLineCount]);

  // Navigate to a specific page
  const navigateToPage = useCallback((pageIndex: number) => {
    if (pageIndex >= 0 && pageIndex < totalPages) {
      setCurrentPageIndex(pageIndex);
    }
  }, [totalPages, setCurrentPageIndex]);

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

  // Update pages when content changes
  useEffect(() => {
    if (sections.length > 0) {
      const newPages = splitIntoPages(sections);
      setTotalPages(newPages.length);
      setPages(newPages);
    }
  }, [sections, splitIntoPages, setPages]);

  // Get current page content
  const getCurrentPageContent = useCallback(() => {
    if (pages.length > 0 && currentPageIndex < pages.length) {
      return pages[currentPageIndex];
    }
    return null;
  }, [pages, currentPageIndex]);

  // Get page navigation info
  const getPageInfo = useCallback(() => {
    return {
      currentPage: currentPageIndex + 1,
      totalPages,
      hasNextPage: currentPageIndex < totalPages - 1,
      hasPreviousPage: currentPageIndex > 0,
    };
  }, [currentPageIndex, totalPages]);

  // Auto-paginate content based on line height and content measurements
  const autoPaginate = useCallback(() => {
    if (!content) return;
    
    const limitCheck = checkPageLimits();
    if (limitCheck.exceedsLimit) {
      return false;
    }

    const newPages = splitIntoPages(sections);
    setPages(newPages);
    setTotalPages(newPages.length);
    return true;
  }, [content, sections, checkPageLimits, splitIntoPages, setPages]);

  return {
    // Page data
    pages,
    currentPageIndex,
    totalPages,
    lineCounts,
    
    // Page navigation
    navigateToPage,
    getCurrentPageContent,
    getPageInfo,
    
    // Page management
    autoPaginate,
    splitIntoPages,
    checkPageLimits,
    
    // Utility functions
    calculateLineCount,
  };
};
