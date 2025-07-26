/**
 * @jest-environment jsdom
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { usePageManager } from '../../../hooks/usePageManager';
import { useStoryStore } from '../../../store/useStoryStore';

// Mock the store
jest.mock('../../../store/useStoryStore');

const mockUseStoryStore = useStoryStore as jest.MockedFunction<typeof useStoryStore>;

describe('usePageManager Hook', () => {
  const mockStore = {
    content: '',
    sections: [],
    pages: [],
    currentPageIndex: 0,
    editorSettings: { maxLinesPerPage: 25, fontFamily: 'Arial' },
    setCurrentStep: jest.fn(),
    setPages: jest.fn(),
    setCurrentPageIndex: jest.fn(),
    addEmptyPage: jest.fn(),
    updatePage: jest.fn(),
    getCurrentPageContent: jest.fn(() => ''),
    setCurrentPageContent: jest.fn(),
    syncPagesToSections: jest.fn(),
    navigateToPage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseStoryStore.mockReturnValue(mockStore);
  });

  describe('Page Navigation', () => {
    it('should navigate between pages correctly', () => {
      const mockStoreWithPages = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'Page 1 content' },
          { id: 'page-2', content: 'Page 2 content' },
          { id: 'page-3', content: 'Page 3 content' },
        ],
        currentPageIndex: 0,
      };
      
      mockUseStoryStore.mockReturnValue(mockStoreWithPages);

      const { result } = renderHook(() => usePageManager());

      // Test navigation info
      const pageInfo = result.current.getPageInfo();
      expect(pageInfo.currentPage).toBe(1);
      expect(pageInfo.hasNextPage).toBe(true);
      expect(pageInfo.hasPreviousPage).toBe(false);

      // Test navigation to next page
      act(() => {
        result.current.navigateToPage(1);
      });

      expect(mockStoreWithPages.navigateToPage).toHaveBeenCalledWith(1);
    });

    it('should handle navigation boundaries correctly', () => {
      const mockStoreWithPages = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'Page 1 content' },
          { id: 'page-2', content: 'Page 2 content' },
        ],
        currentPageIndex: 1,
      };
      
      mockUseStoryStore.mockReturnValue(mockStoreWithPages);

      const { result } = renderHook(() => usePageManager());

      const pageInfo = result.current.getPageInfo();
      expect(pageInfo.currentPage).toBe(2);
      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.hasPreviousPage).toBe(true);
    });
  });

  describe('Page Content Management', () => {
    it('should update current page content correctly', () => {
      const mockStoreWithPages = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'Initial content' },
        ],
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn(() => 'Initial content'),
        setCurrentPageContent: jest.fn(),
      };
      
      mockUseStoryStore.mockReturnValue(mockStoreWithPages);

      const { result } = renderHook(() => usePageManager());

      act(() => {
        result.current.updateCurrentPageContent('Updated content');
      });

      expect(mockStoreWithPages.setCurrentPageContent).toHaveBeenCalledWith('Updated content');
    });

    it('should create new page with proper content isolation', () => {
      const { result } = renderHook(() => usePageManager());

      act(() => {
        result.current.addNewPage();
      });

      expect(mockStore.addEmptyPage).toHaveBeenCalled();
    });
  });

  describe('Line Count Calculation', () => {
    it('should calculate line count correctly for various content', () => {
      const { result } = renderHook(() => usePageManager());

      // Test empty content
      const emptyLines = result.current.calculateLineCount('');
      expect(emptyLines).toBe(0);

      // Test short content
      const shortLines = result.current.calculateLineCount('Hello world');
      expect(shortLines).toBeGreaterThan(0);

      // Test content with line breaks
      const multiLineContent = 'Line 1\nLine 2\nLine 3';
      const multiLines = result.current.calculateLineCount(multiLineContent);
      expect(multiLines).toBeGreaterThanOrEqual(3);

      // Test long content that would wrap
      const longContent = 'A'.repeat(200);
      const longLines = result.current.calculateLineCount(longContent);
      expect(longLines).toBeGreaterThan(1);
    });
  });

  describe('Page Limits', () => {
    it('should check page limits correctly', () => {
      const mockStoreWithManySections = {
        ...mockStore,
        sections: Array.from({ length: 20 }, (_, i) => ({
          id: `section-${i}`,
          content: `Section ${i} content`,
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const },
        })),
      };
      
      mockUseStoryStore.mockReturnValue(mockStoreWithManySections);

      const { result } = renderHook(() => usePageManager());

      const limitCheck = result.current.checkPageLimits();
      expect(limitCheck.exceedsLimit).toBe(true);
      expect(limitCheck.message).toContain('6 pages');
    });

    it('should allow content within limits', () => {
      const mockStoreWithFewSections = {
        ...mockStore,
        sections: Array.from({ length: 3 }, (_, i) => ({
          id: `section-${i}`,
          content: `Section ${i} content`,
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const },
        })),
      };
      
      mockUseStoryStore.mockReturnValue(mockStoreWithFewSections);

      const { result } = renderHook(() => usePageManager());

      const limitCheck = result.current.checkPageLimits();
      expect(limitCheck.exceedsLimit).toBe(false);
    });
  });

  describe('Content Splitting', () => {
    it('should split content into appropriate pages', () => {
      const mockSections = [
        {
          id: 'section-1',
          content: 'Short content',
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const },
        },
        {
          id: 'section-2',
          content: 'A'.repeat(1000), // Long content
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const },
        },
        {
          id: 'section-3',
          content: 'Another short content',
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const },
        },
      ];

      const { result } = renderHook(() => usePageManager());

      const pages = result.current.splitIntoPages(mockSections);
      
      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBeGreaterThan(0);
      expect(pages.length).toBeLessThanOrEqual(6); // Should not exceed limit
      
      // Each page should have content
      pages.forEach(page => {
        expect(page.content.trim().length).toBeGreaterThan(0);
        expect(page.id).toMatch(/^page-\d+$/);
      });
    });
  });
});
