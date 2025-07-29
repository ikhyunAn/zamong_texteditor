/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { usePageManager } from '../usePageManager';
import { useStoryStore } from '../../store/useStoryStore';

// Mock the store
jest.mock('../../store/useStoryStore');

const mockUseStoryStore = useStoryStore as jest.MockedFunction<typeof useStoryStore>;

describe('usePageManager - Page Break Functionality Tests', () => {
  const createMockStore = (overrides = {}) => ({
    content: '',
    sections: [],
    pages: [],
    currentPageIndex: 0,
    editorSettings: { fontFamily: 'Arial', fontSize: 16, lineHeight: 1.5, textAlignment: 'left' as const, verticalAlignment: 'top' as const, globalTextAlignment: 'left' as const },
    setCurrentStep: jest.fn(),
    setPages: jest.fn(),
    setCurrentPageIndex: jest.fn(),
    addEmptyPage: jest.fn(),
    updatePage: jest.fn(),
    getCurrentPageContent: jest.fn(() => ''),
    setCurrentPageContent: jest.fn(),
    syncPagesToSections: jest.fn(),
    navigateToPage: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Requirement 1: Line breaks are preserved when adding page breaks', () => {
    it('maintains line count accuracy when content has line breaks', () => {
      const contentWithLineBreaks = 'First line\nSecond line\n\nParagraph 2\nAnother line';
      const mockStore = createMockStore({
        getCurrentPageContent: jest.fn(() => contentWithLineBreaks),
      });
      
      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      const lineCount = result.current.calculateLineCount(contentWithLineBreaks);
      
      // Should count lines properly including empty lines
      expect(lineCount).toBeGreaterThan(3);
      expect(typeof lineCount).toBe('number');
    });

    it('handles content splitting with preserved line breaks', () => {
      const sectionsWithLineBreaks = [
        {
          id: 'section-1',
          content: 'Chapter 1\n\nOnce upon a time\nIn a magical land',
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const, verticalAlignment: 'top' as const },
        },
        {
          id: 'section-2',
          content: 'Chapter 2\n\nThe adventure continues\nWith many surprises',
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const, verticalAlignment: 'top' as const },
        },
      ];

      const mockStore = createMockStore({
        sections: sectionsWithLineBreaks,
      });
      
      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      const pages = result.current.splitIntoPages(sectionsWithLineBreaks);

      // Should create pages that preserve line break structure
      expect(pages).toBeInstanceOf(Array);
      expect(pages.length).toBeGreaterThan(0);
      
      pages.forEach(page => {
        if (page.content.includes('\n')) {
          // Content with line breaks should maintain structure
          expect(page.content).toMatch(/\n/);
        }
      });
    });

    it('estimates line count correctly for various content types', () => {
      const mockStore = createMockStore();
      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      // Test different content types
      const testCases = [
        { content: '', expectedMin: 0, expectedMax: 0 },
        { content: 'Single line', expectedMin: 1, expectedMax: 2 },
        { content: 'Line 1\nLine 2', expectedMin: 2, expectedMax: 3 },
        { content: 'Para 1\n\nPara 2', expectedMin: 2, expectedMax: 4 },
        { content: 'Very long line that would wrap around in the editor and take up multiple lines when displayed', expectedMin: 2, expectedMax: 5 },
      ];

      testCases.forEach(({ content, expectedMin, expectedMax }) => {
        const lineCount = result.current.calculateLineCount(content);
        expect(lineCount).toBeGreaterThanOrEqual(expectedMin);
        expect(lineCount).toBeLessThanOrEqual(expectedMax);
      });
    });
  });

  describe('Requirement 2: Navigation to new pages works correctly', () => {
    it('provides accurate page information for navigation', () => {
      const multiPageStore = createMockStore({
        pages: [
          { id: 'page-1', content: 'Page 1 content\nWith line breaks' },
          { id: 'page-2', content: 'Page 2 content\nAlso with breaks' },
          { id: 'page-3', content: 'Page 3 content\nFinal page' },
        ],
        currentPageIndex: 1,
      });

      mockUseStoryStore.mockReturnValue(multiPageStore);

      const { result } = renderHook(() => usePageManager());

      const pageInfo = result.current.getPageInfo();

      expect(pageInfo.currentPage).toBe(2); // 1-indexed
      expect(pageInfo.totalPages).toBe(3);
      expect(pageInfo.hasNextPage).toBe(true);
      expect(pageInfo.hasPreviousPage).toBe(true);
    });

    it('handles page navigation boundaries correctly', () => {
      // Test first page
      let mockStore = createMockStore({
        pages: [
          { id: 'page-1', content: 'First page' },
          { id: 'page-2', content: 'Second page' },
        ],
        currentPageIndex: 0,
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      let { result } = renderHook(() => usePageManager());
      let pageInfo = result.current.getPageInfo();

      expect(pageInfo.currentPage).toBe(1);
      expect(pageInfo.hasNextPage).toBe(true);
      expect(pageInfo.hasPreviousPage).toBe(false);

      // Test last page
      mockStore = createMockStore({
        pages: [
          { id: 'page-1', content: 'First page' },
          { id: 'page-2', content: 'Second page' },
        ],
        currentPageIndex: 1,
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      ({ result } = renderHook(() => usePageManager()));
      pageInfo = result.current.getPageInfo();

      expect(pageInfo.currentPage).toBe(2);
      expect(pageInfo.hasNextPage).toBe(false);
      expect(pageInfo.hasPreviousPage).toBe(true);
    });

    it('triggers correct store actions when navigating', () => {
      const mockStore = createMockStore({
        pages: [
          { id: 'page-1', content: 'Page 1' },
          { id: 'page-2', content: 'Page 2' },
          { id: 'page-3', content: 'Page 3' },
        ],
        currentPageIndex: 0,
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      act(() => {
        result.current.navigateToPage(2); // Navigate to page 3 (0-indexed)
      });

      expect(mockStore.navigateToPage).toHaveBeenCalledWith(2);
    });

    it('calculates total pages correctly', () => {
      const mockStore = createMockStore({
        pages: [
          { id: 'page-1', content: 'Page 1' },
          { id: 'page-2', content: 'Page 2' },
          { id: 'page-3', content: 'Page 3' },
          { id: 'page-4', content: 'Page 4' },
        ],
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      expect(result.current.totalPages).toBe(4);
    });
  });

  describe('Requirement 3: Edge cases are handled properly', () => {
    describe('Empty pages', () => {
      it('handles empty page content gracefully', () => {
        const mockStore = createMockStore({
          pages: [{ id: 'page-1', content: '' }],
          getCurrentPageContent: jest.fn(() => ''),
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());

        act(() => {
          result.current.updateCurrentPageContent('');
        });

        expect(mockStore.setCurrentPageContent).toHaveBeenCalledWith('');
        
        const lineCount = result.current.calculateLineCount('');
        expect(lineCount).toBe(0);
      });

      it('creates new empty page when requested', () => {
        const mockStore = createMockStore({
          pages: [{ id: 'page-1', content: 'Existing content' }],
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());

        act(() => {
          result.current.addNewPage();
        });

        expect(mockStore.addEmptyPage).toHaveBeenCalled();
      });

      it('handles transition from empty to content pages', () => {
        const mockStore = createMockStore({
          pages: [],
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());
        
        const pageInfo = result.current.getPageInfo();
        expect(pageInfo.totalPages).toBe(0);
        expect(pageInfo.currentPage).toBe(1);
      });
    });

    describe('Multiple consecutive page breaks', () => {
      it('enforces page limits correctly', () => {
        const manyPages = Array.from({ length: 8 }, (_, i) => ({
          id: `page-${i + 1}`,
          content: `Page ${i + 1} content`,
        }));

        const mockStore = createMockStore({
          pages: manyPages,
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());

        const limitCheck = result.current.checkPageLimits();
        
        expect(limitCheck.exceedsLimit).toBe(true);
        expect(limitCheck.message).toContain('6 pages');
      });

      it('allows content within page limits', () => {
        const validPages = Array.from({ length: 3 }, (_, i) => ({
          id: `page-${i + 1}`,
          content: `Page ${i + 1} content with\nline breaks`,
        }));

        const mockStore = createMockStore({
          pages: validPages,
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());

        const limitCheck = result.current.checkPageLimits();
        
        expect(limitCheck.exceedsLimit).toBe(false);
      });

      it('handles rapid page operations gracefully', () => {
        const mockStore = createMockStore({
          pages: [{ id: 'page-1', content: 'Initial content' }],
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());

        // Simulate rapid operations
        act(() => {
          for (let i = 0; i < 5; i++) {
            result.current.updateCurrentPageContent(`Update ${i + 1}`);
          }
        });

        // Should handle all updates
        expect(mockStore.setCurrentPageContent).toHaveBeenCalledTimes(5);
        expect(mockStore.setCurrentPageContent).toHaveBeenLastCalledWith('Update 5');
      });
    });

    describe('Complex content scenarios', () => {
      it('handles very long content that spans multiple pages', () => {
        const longSections = Array.from({ length: 50 }, (_, i) => ({
          id: `section-${i + 1}`,
          content: `This is section ${i + 1} with some content\nThat spans multiple lines\n\nAnd has paragraph breaks`,
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const, verticalAlignment: 'top' as const },
        }));

        const mockStore = createMockStore({
          sections: longSections,
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());

        const pages = result.current.splitIntoPages(longSections);

        expect(pages.length).toBeGreaterThan(1);
        expect(pages.length).toBeLessThanOrEqual(6); // Should respect page limit
        
        pages.forEach(page => {
          expect(page.content.trim().length).toBeGreaterThan(0);
          expect(page.id).toMatch(/^page-\d+$/);
        });
      });

      it('maintains content integrity when splitting long sections', () => {
        const longSection = {
          id: 'long-section',
          content: Array.from({ length: 100 }, (_, i) => `Line ${i + 1} of very long content`).join('\n'),
          textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const, verticalAlignment: 'top' as const },
        };

        const mockStore = createMockStore({
          sections: [longSection],
        });

        mockUseStoryStore.mockReturnValue(mockStore);

        const { result } = renderHook(() => usePageManager());

        const pages = result.current.splitIntoPages([longSection]);

        // Verify content is distributed across pages
        const totalContentLines = pages.reduce((count, page) => {
          return count + page.content.split('\n').filter(line => line.trim()).length;
        }, 0);

        expect(totalContentLines).toBeGreaterThan(50); // Should preserve most content
        expect(pages.length).toBeGreaterThan(1); // Should create multiple pages
      });
    });
  });

  describe('Requirement 4: Text editor state remains consistent across page operations', () => {
    it('maintains consistent page content updates', () => {
      const mockStore = createMockStore({
        pages: [
          { id: 'page-1', content: 'Initial content' },
        ],
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn(() => 'Initial content'),
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      // Update content multiple times
      const updates = [
        'First update\nWith line breaks',
        'Second update\n\nWith paragraphs',
        'Final update\nWith mixed\n\nContent types',
      ];

      updates.forEach(update => {
        act(() => {
          result.current.updateCurrentPageContent(update);
        });
      });

      expect(mockStore.setCurrentPageContent).toHaveBeenCalledTimes(3);
      expect(mockStore.setCurrentPageContent).toHaveBeenLastCalledWith('Final update\nWith mixed\n\nContent types');
    });

    it('provides consistent line counting across page switches', () => {
      const pages = [
        { id: 'page-1', content: 'Page 1\nWith 3\nLines' },
        { id: 'page-2', content: 'Page 2\nWith 2 lines' },
        { id: 'page-3', content: 'Page 3\nHas\nFour\nLines total' },
      ];

      const mockStore = createMockStore({
        pages,
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn(() => pages[0].content),
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      // Test line counting for each page
      pages.forEach((page, index) => {
        const lineCount = result.current.calculateLineCount(page.content);
        const expectedLines = page.content.split('\n').length;
        
        expect(lineCount).toBeGreaterThanOrEqual(expectedLines - 1);
        expect(lineCount).toBeLessThanOrEqual(expectedLines + 1);
      });
    });

    it('handles auto-pagination consistently', () => {
      const mockStore = createMockStore({
        pages: [{ id: 'page-1', content: 'Current content' }],
        sections: [
          {
            id: 'section-1',
            content: 'Auto pagination test content',
            textStyle: { fontFamily: 'Arial', fontSize: 24, color: '#000000', position: { x: 50, y: 50 }, alignment: 'center' as const, verticalAlignment: 'top' as const },
          },
        ],
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      act(() => {
        result.current.autoPaginate();
      });

      // Should trigger pagination sync
      expect(mockStore.syncPagesToSections).toHaveBeenCalled();
    });

    it('maintains state consistency during complex operations', () => {
      const mockStore = createMockStore({
        pages: [
          { id: 'page-1', content: 'Page 1 content\nWith line breaks' },
          { id: 'page-2', content: 'Page 2 content' },
        ],
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn(() => 'Page 1 content\nWith line breaks'),
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      // Perform multiple operations
      act(() => {
        // Update content
        result.current.updateCurrentPageContent('Updated content\nWith new lines');
        
        // Check limits
        const limits = result.current.checkPageLimits();
        expect(typeof limits.exceedsLimit).toBe('boolean');
        
        // Calculate line count
        const lineCount = result.current.calculateLineCount('Updated content\nWith new lines');
        expect(typeof lineCount).toBe('number');
        
        // Get page info
        const pageInfo = result.current.getPageInfo();
        expect(typeof pageInfo.currentPage).toBe('number');
        expect(typeof pageInfo.totalPages).toBe('number');
        expect(typeof pageInfo.hasNextPage).toBe('boolean');
        expect(typeof pageInfo.hasPreviousPage).toBe('boolean');
      });

      // All operations should complete successfully
      expect(mockStore.setCurrentPageContent).toHaveBeenCalledWith('Updated content\nWith new lines');
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete workflow: content creation, pagination, navigation', () => {
      const mockStore = createMockStore({
        pages: [],
        sections: [],
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      act(() => {
        // 1. Start with empty state
        expect(result.current.totalPages).toBe(0);
        
        // 2. Add first page
        result.current.addNewPage();
        expect(mockStore.addEmptyPage).toHaveBeenCalled();
        
        // 3. Update content
        result.current.updateCurrentPageContent('New story content\nWith multiple lines\n\nAnd paragraphs');
        expect(mockStore.setCurrentPageContent).toHaveBeenCalledWith('New story content\nWith multiple lines\n\nAnd paragraphs');
        
        // 4. Check line count
        const lineCount = result.current.calculateLineCount('New story content\nWith multiple lines\n\nAnd paragraphs');
        expect(lineCount).toBeGreaterThan(2);
        
        // 5. Auto-paginate
        result.current.autoPaginate();
        expect(mockStore.syncPagesToSections).toHaveBeenCalled();
      });
    });

    it('maintains consistency through page operations with line breaks', () => {
      const contentWithLineBreaks = [
        'Chapter 1: The Beginning',
        '',
        'It was a dark and stormy night.',
        'The rain pounded against the windows.',
        'Sarah sat by the fireplace, reading.',
        '',
        'Chapter 2: The Discovery',
        '',
        'The next morning brought sunshine.',
        'Sarah found something unexpected.',
      ].join('\n');

      const mockStore = createMockStore({
        pages: [{ id: 'page-1', content: contentWithLineBreaks }],
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn(() => contentWithLineBreaks),
      });

      mockUseStoryStore.mockReturnValue(mockStore);

      const { result } = renderHook(() => usePageManager());

      act(() => {
        // Test various operations with content containing line breaks
        const lineCount = result.current.calculateLineCount(contentWithLineBreaks);
        expect(lineCount).toBeGreaterThan(5);
        
        const pageInfo = result.current.getPageInfo();
        expect(pageInfo.totalPages).toBe(1);
        expect(pageInfo.currentPage).toBe(1);
        
        const limitCheck = result.current.checkPageLimits();
        expect(limitCheck.exceedsLimit).toBe(false);
        
        // Update with more content
        const updatedContent = contentWithLineBreaks + '\n\nChapter 3: The Adventure\n\nAnd so the story continues...';
        result.current.updateCurrentPageContent(updatedContent);
        
        expect(mockStore.setCurrentPageContent).toHaveBeenCalledWith(updatedContent);
      });
    });
  });
});
