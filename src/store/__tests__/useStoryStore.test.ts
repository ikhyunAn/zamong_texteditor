/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useStoryStore } from '../useStoryStore';

// Mock the text processing functions
jest.mock('@/lib/text-processing', () => ({
  splitContentIntoPages: jest.fn((content: string, maxLines: number) => [
    { id: 'page-1', content: content.substring(0, Math.min(content.length, 100)) },
    { id: 'page-2', content: content.substring(100) },
  ].filter(page => page.content.length > 0)),
}));

jest.mock('@/lib/content-parser', () => ({
  parseHtmlToSections: jest.fn(() => []),
}));

describe('useStoryStore - Page Management Tests', () => {
  beforeEach(() => {
    // Reset the store before each test
    useStoryStore.getState().resetStore();
  });

  describe('Page Creation and Management', () => {
    it('should add empty page correctly', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addEmptyPage();
      });

      const pages = result.current.pages;
      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe('');
      expect(pages[0].id).toMatch(/^page-\d+-1$/);
    });

    it('should add page with content', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addPage('Test content for new page');
      });

      const pages = result.current.pages;
      expect(pages).toHaveLength(1);
      expect(pages[0].content).toBe('Test content for new page');
    });

    it('should update existing page content', () => {
      const { result } = renderHook(() => useStoryStore());
      
      // Add a page first
      act(() => {
        result.current.addPage('Initial content');
      });

      const pageId = result.current.pages[0].id;

      // Update the page content
      act(() => {
        result.current.updatePage(pageId, 'Updated content');
      });

      expect(result.current.pages[0].content).toBe('Updated content');
    });

    it('should delete page correctly', () => {
      const { result } = renderHook(() => useStoryStore());
      
      // Add multiple pages
      act(() => {
        result.current.addPage('Page 1 content');
        result.current.addPage('Page 2 content');
        result.current.addPage('Page 3 content');
      });

      expect(result.current.pages).toHaveLength(3);

      const pageToDelete = result.current.pages[1].id;

      // Delete middle page
      act(() => {
        result.current.deletePage(pageToDelete);
      });

      expect(result.current.pages).toHaveLength(2);
      expect(result.current.pages[0].content).toBe('Page 1 content');
      expect(result.current.pages[1].content).toBe('Page 3 content');
    });
  });

  describe('Page Navigation', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useStoryStore());
      
      // Setup multiple pages for navigation tests
      act(() => {
        result.current.addPage('Page 1 content');
        result.current.addPage('Page 2 content');
        result.current.addPage('Page 3 content');
      });
    });

    it('should navigate to valid page index', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.setCurrentPageIndex(1);
      });

      expect(result.current.currentPageIndex).toBe(1);
    });

    it('should prevent navigation to invalid page index', () => {
      const { result } = renderHook(() => useStoryStore());
      
      const initialIndex = result.current.currentPageIndex;

      act(() => {
        result.current.setCurrentPageIndex(-1);
      });

      expect(result.current.currentPageIndex).toBe(initialIndex);

      act(() => {
        result.current.setCurrentPageIndex(999);
      });

      expect(result.current.currentPageIndex).toBe(initialIndex);
    });

    it('should get current page content correctly', () => {
      const { result } = renderHook(() => useStoryStore());
      
      // Should return first page content by default
      expect(result.current.getCurrentPageContent()).toBe('Page 1 content');

      act(() => {
        result.current.setCurrentPageIndex(1);
      });

      expect(result.current.getCurrentPageContent()).toBe('Page 2 content');
    });

    it('should return empty string for invalid page index', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.setCurrentPageIndex(999);
      });

      expect(result.current.getCurrentPageContent()).toBe('Page 1 content'); // Should remain at valid index
    });
  });

  describe('Current Page Content Management', () => {
    beforeEach(() => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addPage('Initial content');
      });
    });

    it('should set current page content', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.setCurrentPageContent('New content for current page');
      });

      expect(result.current.getCurrentPageContent()).toBe('New content for current page');
      expect(result.current.pages[0].content).toBe('New content for current page');
    });

    it('should not update if content is the same', () => {
      const { result } = renderHook(() => useStoryStore());
      
      const updatePageSpy = jest.spyOn(result.current, 'updatePage');

      act(() => {
        result.current.setCurrentPageContent('Initial content');
      });

      // updatePage should not be called since content is the same
      expect(updatePageSpy).not.toHaveBeenCalled();
    });

    it('should handle setting content on empty pages array', () => {
      const { result } = renderHook(() => useStoryStore());
      
      // Reset to empty state
      act(() => {
        result.current.resetStore();
      });

      act(() => {
        result.current.setCurrentPageContent('Content for non-existent page');
      });

      // Should not crash, and pages should remain empty
      expect(result.current.pages).toHaveLength(0);
    });
  });

  describe('Sync Pages to Sections', () => {
    it('should sync pages to sections correctly', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addPage('Page 1 content');
        result.current.addPage('Page 2 content');
        result.current.syncPagesToSections();
      });

      const sections = result.current.sections;
      expect(sections).toHaveLength(2);
      expect(sections[0].content).toBe('Page 1 content');
      expect(sections[1].content).toBe('Page 2 content');
      expect(sections[0].id).toMatch(/^section-/);
    });

    it('should update global content when syncing', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addPage('First page');
        result.current.addPage('Second page');
        result.current.syncPagesToSections();
      });

      expect(result.current.content).toBe('First page\n\nSecond page');
    });

    it('should handle empty pages when syncing', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.syncPagesToSections();
      });

      expect(result.current.sections).toHaveLength(0);
      expect(result.current.content).toBe('');
    });
  });

  describe('Page Deletion Edge Cases', () => {
    it('should adjust current page index when deleting current page', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addPage('Page 1');
        result.current.addPage('Page 2');
        result.current.addPage('Page 3');
        result.current.setCurrentPageIndex(1); // Set to middle page
      });

      const currentPageId = result.current.pages[1].id;

      act(() => {
        result.current.deletePage(currentPageId);
      });

      // Current page index should be adjusted to remain valid
      expect(result.current.currentPageIndex).toBe(1);
      expect(result.current.getCurrentPageContent()).toBe('Page 3'); // Now at what was page 3
    });

    it('should adjust current page index when deleting last page', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addPage('Page 1');
        result.current.addPage('Page 2');
        result.current.setCurrentPageIndex(1); // Set to last page
      });

      const lastPageId = result.current.pages[1].id;

      act(() => {
        result.current.deletePage(lastPageId);
      });

      // Should move to previous page
      expect(result.current.currentPageIndex).toBe(0);
      expect(result.current.getCurrentPageContent()).toBe('Page 1');
    });

    it('should handle deleting non-existent page gracefully', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.addPage('Page 1');
      });

      const initialPagesLength = result.current.pages.length;

      act(() => {
        result.current.deletePage('non-existent-id');
      });

      // Pages array should remain unchanged
      expect(result.current.pages).toHaveLength(initialPagesLength);
    });
  });

  describe('Editor Settings Integration', () => {
    it('should update editor settings', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.updateEditorSettings({ fontSize: 18 });
      });

      expect(result.current.editorSettings.fontSize).toBe(18);
    });

    it('should update line height setting', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.updateEditorSettings({ lineHeight: 1.8 });
      });

      expect(result.current.editorSettings.lineHeight).toBe(1.8);
    });
  });

  describe('Content Management', () => {
    it('should set content without auto-processing', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.setContent('Test content for the story');
      });

      expect(result.current.content).toBe('Test content for the story');
    });

    it('should trim content when setting', () => {
      const { result } = renderHook(() => useStoryStore());
      
      act(() => {
        result.current.setContent('   Content with whitespace   ');
      });

      expect(result.current.content).toBe('Content with whitespace');
    });
  });
});
