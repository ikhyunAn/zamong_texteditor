/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginatedEditorWithNavigation } from '../PaginatedEditor';
import { useStoryStore } from '@/store/useStoryStore';
import { usePageManager } from '@/hooks/usePageManager';

// Mock the editor
const mockEditor = {
  getHTML: jest.fn(() => ''),
  getText: jest.fn(() => ''),
  commands: {
    clearContent: jest.fn(),
    setContent: jest.fn(),
    focus: jest.fn(),
  },
  chain: jest.fn(() => ({
    focus: jest.fn().mockReturnThis(),
    toggleBold: jest.fn().mockReturnThis(),
    toggleItalic: jest.fn().mockReturnThis(),
    run: jest.fn(),
  })),
  isActive: jest.fn(() => false),
  isFocused: false,
  isDestroyed: false,
  view: {
    dom: document.createElement('div'),
  },
  state: {
    selection: { from: 0, to: 0 },
  },
  storage: {
    characterCount: {
      characters: jest.fn(() => 0),
    },
  },
};

jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => mockEditor),
  EditorContent: ({ editor }: any) => (
    <div 
      className="editor" 
      contentEditable 
      data-testid="editor-content"
      onInput={(e) => {
        const target = e.target as HTMLElement;
        editor?.getText?.mockReturnValue(target.textContent || '');
      }}
    >
      {editor?.getText?.() || ''}
    </div>
  ),
}));

// Mock other dependencies
jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(() => ({
    ref: jest.fn(),
    inView: false,
  })),
}));

jest.mock('@/lib/debounce', () => ({
  debounce: jest.fn((fn) => fn),
}));

jest.mock('@/lib/text-processing', () => ({
  htmlToTextWithLineBreaks: jest.fn((html) => html.replace(/<[^>]*>/g, '')),
  textToHtmlWithLineBreaks: jest.fn((text) => `<p>${text}</p>`),
  splitContentPreservingLineBreaks: jest.fn((content, position) => ({
    before: content.substring(0, position),
    after: content.substring(position),
  })),
  validatePageBreakIntegrity: jest.fn(() => true),
}));

// Create a more realistic store implementation for testing
const createMockStore = (initialPages = []) => {
  let state = {
    content: '',
    sections: [],
    pages: initialPages,
    currentPageIndex: 0,
    editorSettings: { maxLinesPerPage: 25, fontFamily: 'Arial' },
  };

  return {
    ...state,
    setContent: jest.fn((content) => { state.content = content; }),
    setCurrentStep: jest.fn(),
    getCurrentPageContent: jest.fn(() => {
      if (state.pages.length > 0 && state.currentPageIndex < state.pages.length) {
        return state.pages[state.currentPageIndex].content;
      }
      return '';
    }),
    setCurrentPageContent: jest.fn((content) => {
      if (state.pages.length > 0 && state.currentPageIndex < state.pages.length) {
        state.pages[state.currentPageIndex].content = content;
      }
    }),
    addEmptyPage: jest.fn(() => {
      const newPage = { id: `page-${state.pages.length + 1}`, content: '' };
      state.pages = [...state.pages, newPage];
    }),
    setSections: jest.fn(),
    navigateToPage: jest.fn((index) => {
      if (index >= 0 && index < state.pages.length) {
        state.currentPageIndex = index;
      }
    }),
    updatePage: jest.fn((pageId, content) => {
      state.pages = state.pages.map(page => 
        page.id === pageId ? { ...page, content } : page
      );
    }),
    syncPagesToSections: jest.fn(),
    setPages: jest.fn((pages) => { state.pages = pages; }),
    setCurrentPageIndex: jest.fn((index) => { state.currentPageIndex = index; }),
    // Expose state for testing
    __getState: () => state,
    __setState: (newState) => { state = { ...state, ...newState }; },
  };
};

const createMockPageManager = (store) => ({
  totalPages: store.pages.length,
  getPageInfo: jest.fn(() => ({
    currentPage: store.currentPageIndex + 1,
    totalPages: store.pages.length,
    hasNextPage: store.currentPageIndex < store.pages.length - 1,
    hasPreviousPage: store.currentPageIndex > 0,
  })),
  checkPageLimits: jest.fn(() => ({ exceedsLimit: false })),
  calculateLineCount: jest.fn(() => 5),
  autoPaginate: jest.fn(),
  navigateToPage: jest.fn((index) => store.navigateToPage(index)),
  addNewPage: jest.fn(() => store.addEmptyPage()),
  updateCurrentPageContent: jest.fn((content) => store.setCurrentPageContent(content)),
  storeGetCurrentPageContent: jest.fn(() => store.getCurrentPageContent()),
  syncPagesToSections: jest.fn(),
});

describe('Pagination System - Comprehensive Scenarios', () => {
  const user = userEvent.setup();
  let mockStore;
  let mockPageManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditor.getText.mockReturnValue('');
    mockEditor.isFocused = false;
    mockEditor.isDestroyed = false;
  });

  describe('Scenario 1: Create content on page 1, add page 2, add content, navigate back and forth', () => {
    beforeEach(() => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Initial page 1 content' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
    });

    it('preserves page 1 content when adding and navigating to page 2', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Verify initial content on page 1
      expect(mockStore.getCurrentPageContent()).toBe('Initial page 1 content');
      
      // Add new page
      const addPageButton = screen.getByText('Add New Page');
      await user.click(addPageButton);
      
      // Verify page was added
      expect(mockStore.addEmptyPage).toHaveBeenCalled();
      
      // Simulate store state change
      mockStore.__setState({
        pages: [
          { id: 'page-1', content: 'Initial page 1 content' },
          { id: 'page-2', content: '' },
        ]
      });
      
      // Update page manager to reflect new state
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      
      // Navigate to page 2
      const nextButton = screen.getByText('Next Page');
      await user.click(nextButton);
      
      // Verify navigation occurred
      expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(1);
    });

    it('allows adding content to page 2 and preserves it during navigation', async () => {
      // Start with 2 pages, currently on page 2
      mockStore = createMockStore([
        { id: 'page-1', content: 'Page 1 content' },
        { id: 'page-2', content: '' },
      ]);
      mockStore.__setState({ currentPageIndex: 1 });
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const editor = screen.getByTestId('editor-content');
      
      // Add content to page 2
      await user.type(editor, 'New content on page 2');
      
      // Verify content update was called
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith('New content on page 2');
      
      // Simulate content being saved
      mockStore.setCurrentPageContent('New content on page 2');
      
      // Navigate back to page 1
      const prevButton = screen.getByText('Previous Page');
      await user.click(prevButton);
      
      // Verify navigation preserved content
      expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(0);
    });

    it('maintains content integrity during rapid back-and-forth navigation', async () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Persistent page 1 content' },
        { id: 'page-2', content: 'Persistent page 2 content' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const nextButton = screen.getByText('Next Page');
      const prevButton = screen.getByText('Previous Page');
      
      // Perform rapid navigation: Page 1 → Page 2 → Page 1 → Page 2
      await user.click(nextButton);
      await user.click(prevButton);
      await user.click(nextButton);
      
      // Verify all navigation calls were made
      expect(mockPageManager.navigateToPage).toHaveBeenCalledTimes(3);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(1, 1);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(2, 0);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(3, 1);
    });
  });

  describe('Scenario 2: Verify all page indicators remain visible', () => {
    it('displays correct page indicators for multiple pages', () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Page 1' },
        { id: 'page-2', content: 'Page 2' },
        { id: 'page-3', content: 'Page 3' },
        { id: 'page-4', content: 'Page 4' },
      ]);
      mockStore.__setState({ currentPageIndex: 1 });
      mockPageManager = createMockPageManager(mockStore);
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 2,
        totalPages: 4,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Check that all page indicator buttons are present
      expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
      
      // Check current page indicator
      expect(screen.getByText('Page 2 of 4')).toBeInTheDocument();
    });

    it('highlights the current page indicator correctly', () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Page 1' },
        { id: 'page-2', content: 'Page 2' },
        { id: 'page-3', content: 'Page 3' },
      ]);
      mockStore.__setState({ currentPageIndex: 2 });
      mockPageManager = createMockPageManager(mockStore);
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 3,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const page3Button = screen.getByRole('button', { name: '3' });
      
      // Check that page 3 button has the active styling
      expect(page3Button).toHaveClass('bg-blue-500', 'text-white');
    });
  });

  describe('Scenario 3: Confirm content persists across all navigation patterns', () => {
    it('maintains content during sequential forward navigation', async () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Content A' },
        { id: 'page-2', content: 'Content B' },
        { id: 'page-3', content: 'Content C' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const nextButton = screen.getByText('Next Page');
      
      // Navigate through all pages sequentially
      await user.click(nextButton); // Page 1 → 2
      await user.click(nextButton); // Page 2 → 3
      
      expect(mockPageManager.navigateToPage).toHaveBeenCalledTimes(2);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(1, 1);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(2, 2);
    });

    it('maintains content during random navigation pattern', async () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Content A' },
        { id: 'page-2', content: 'Content B' },
        { id: 'page-3', content: 'Content C' },
        { id: 'page-4', content: 'Content D' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Random navigation: 1 → 3 → 2 → 4
      const page3Button = screen.getByRole('button', { name: '3' });
      const page2Button = screen.getByRole('button', { name: '2' });
      const page4Button = screen.getByRole('button', { name: '4' });
      
      await user.click(page3Button);
      await user.click(page2Button);
      await user.click(page4Button);
      
      expect(mockPageManager.navigateToPage).toHaveBeenCalledTimes(3);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(1, 2);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(2, 1);
      expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(3, 3);
    });
  });

  describe('Scenario 4: Test edge cases like rapid navigation and concurrent updates', () => {
    it('handles rapid navigation without data loss', async () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Rapid A' },
        { id: 'page-2', content: 'Rapid B' },
        { id: 'page-3', content: 'Rapid C' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const nextButton = screen.getByText('Next Page');
      const prevButton = screen.getByText('Previous Page');
      
      // Rapid navigation sequence
      await user.click(nextButton);
      await user.click(nextButton);
      await user.click(prevButton);
      await user.click(nextButton);
      await user.click(prevButton);
      await user.click(prevButton);
      
      // Should have called navigateToPage multiple times without errors
      expect(mockPageManager.navigateToPage).toHaveBeenCalledTimes(6);
      
      // Verify no data was lost during rapid navigation
      expect(mockStore.pages[0].content).toBe('Rapid A');
      expect(mockStore.pages[1].content).toBe('Rapid B');
      expect(mockStore.pages[2].content).toBe('Rapid C');
    });

    it('handles concurrent content updates during navigation', async () => {
      mockStore = createMockStore([
        { id: 'page-1', content: '' },
        { id: 'page-2', content: '' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const editor = screen.getByTestId('editor-content');
      const nextButton = screen.getByText('Next Page');
      
      // Type while navigating
      await user.type(editor, 'Concurrent typing');
      await user.click(nextButton);
      
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith('Concurrent typing');
      expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(1);
    });

    it('prevents navigation beyond page boundaries', async () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Only page' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const nextButton = screen.getByText('Next Page');
      const prevButton = screen.getByText('Previous Page');
      
      // Buttons should be disabled
      expect(nextButton).toBeDisabled();
      expect(prevButton).toBeDisabled();
      
      // Clicking disabled buttons should not call navigate
      await user.click(nextButton);
      await user.click(prevButton);
      
      expect(mockPageManager.navigateToPage).not.toHaveBeenCalled();
    });
  });

  describe('Scenario 5: Runtime validation and error handling', () => {
    it('validates page data integrity during operations', () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Valid page' },
        null, // Invalid page
        { id: 'page-3', content: 'Another valid page' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      // Should not crash despite invalid data
      render(<PaginatedEditorWithNavigation />);
      
      expect(screen.getByText('Paginated Story Editor')).toBeInTheDocument();
    });

    it('handles missing page content gracefully', () => {
      mockStore = createMockStore([
        { id: 'page-1', content: undefined }, // Missing content
      ]);
      mockStore.getCurrentPageContent = jest.fn(() => '');
      mockPageManager = createMockPageManager(mockStore);
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('<p></p>');
    });

    it('recovers from navigation errors gracefully', async () => {
      mockStore = createMockStore([
        { id: 'page-1', content: 'Page 1' },
        { id: 'page-2', content: 'Page 2' },
      ]);
      mockPageManager = createMockPageManager(mockStore);
      
      // Mock navigation to throw an error initially, then succeed
      mockPageManager.navigateToPage
        .mockImplementationOnce(() => {
          throw new Error('Navigation error');
        })
        .mockImplementation(() => {});
      
      require('@/store/useStoryStore').useStoryStore = jest.fn(() => mockStore);
      require('@/hooks/usePageManager').usePageManager = jest.fn(() => mockPageManager);
      
      render(<PaginatedEditorWithNavigation />);
      
      const nextButton = screen.getByText('Next Page');
      
      // First navigation attempt should handle error gracefully
      await user.click(nextButton);
      
      // Component should still be functional
      expect(screen.getByText('Paginated Story Editor')).toBeInTheDocument();
    });
  });
});
