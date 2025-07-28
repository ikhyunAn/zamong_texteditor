/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginatedEditorWithNavigation } from '../PaginatedEditor';
import { useStoryStore } from '@/store/useStoryStore';
import { usePageManager } from '@/hooks/usePageManager';

// Mock dependencies and hooks
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
        // Simulate editor content change
        const target = e.target as HTMLElement;
        editor?.getText?.mockReturnValue(target.textContent || '');
      }}
    >
      {editor?.getText?.() || ''}
    </div>
  ),
}));

// Mock the page manager hook
const mockPageManager = {
  totalPages: 1,
  getPageInfo: jest.fn(() => ({
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  })),
  checkPageLimits: jest.fn(() => ({ exceedsLimit: false })),
  calculateLineCount: jest.fn(() => 5),
  autoPaginate: jest.fn(),
  navigateToPage: jest.fn(),
  addNewPage: jest.fn(),
  updateCurrentPageContent: jest.fn(),
  storeGetCurrentPageContent: jest.fn(() => ''),
  syncPagesToSections: jest.fn(),
};

jest.mock('@/hooks/usePageManager', () => ({
  usePageManager: jest.fn(() => mockPageManager),
}));

// Mock the store
const mockStore = {
  content: '',
  sections: [],
  pages: [{ id: 'page-1', content: '' }],
  currentPageIndex: 0,
  editorSettings: { maxLinesPerPage: 25, fontFamily: 'Arial' },
  setContent: jest.fn(),
  setCurrentStep: jest.fn(),
  getCurrentPageContent: jest.fn(() => ''),
  setCurrentPageContent: jest.fn(),
  addEmptyPage: jest.fn(),
  setSections: jest.fn(),
};

jest.mock('@/store/useStoryStore', () => ({
  useStoryStore: jest.fn(() => mockStore),
}));

// Mock intersection observer
jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(() => ({
    ref: jest.fn(),
    inView: false,
  })),
}));

// Mock debounce
jest.mock('@/lib/debounce', () => ({
  debounce: jest.fn((fn) => fn),
}));

// Define the test suite
describe('PaginatedEditorWithNavigation - Comprehensive Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock implementations
    mockEditor.getText.mockReturnValue('');
    mockPageManager.getPageInfo.mockReturnValue({
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  describe('Basic Rendering and Initialization', () => {
    it('renders without crashing', () => {
      render(<PaginatedEditorWithNavigation />);
      expect(screen.getByText('Paginated Story Editor')).toBeInTheDocument();
    });

    it('initializes with empty page when no pages exist', () => {
      const storeWithNoPages = { ...mockStore, pages: [] };
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(storeWithNoPages);
      
      render(<PaginatedEditorWithNavigation />);
      expect(storeWithNoPages.addEmptyPage).toHaveBeenCalled();
    });

    it('displays loading state when editor is not initialized', () => {
      require('@tiptap/react').useEditor.mockReturnValue(null);
      
      render(<PaginatedEditorWithNavigation />);
      expect(screen.getByText('Loading editor...')).toBeInTheDocument();
    });
  });

  describe('Test Requirement 1: Users can type on the first page without seeing [PAGE_BREAK] markers', () => {
    it('allows typing on first page without visible page break markers', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      const editor = screen.getByTestId('editor-content');
      
      // Type some content
      await user.type(editor, 'This is some test content for the first page.');
      
      // Verify no PAGE_BREAK markers are visible in the UI
      expect(screen.queryByText('[PAGE_BREAK]')).not.toBeInTheDocument();
      expect(screen.queryByText('PAGE_BREAK')).not.toBeInTheDocument();
      
      // Verify content is being updated
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalled();
    });

    it('hides page break markers from user view while maintaining functionality', () => {
      // Mock content with page breaks in the background
      mockEditor.getText.mockReturnValue('Content before break[PAGE_BREAK]Content after break');
      
      render(<PaginatedEditorWithNavigation />);
      
      // User should not see the raw page break markers
      expect(screen.queryByText('[PAGE_BREAK]')).not.toBeInTheDocument();
      
      // But the page break functionality should still work
      const pageBreakButton = screen.getByText('Insert Page Break');
      expect(pageBreakButton).toBeInTheDocument();
    });
  });

  describe('Test Requirement 2: Creating a new page properly saves current content and creates blank page', () => {
    it('saves current page content when creating new page', async () => {
      mockEditor.getText.mockReturnValue('Current page content');
      
      render(<PaginatedEditorWithNavigation />);
      
      const addPageButton = screen.getByText('Add New Page');
      await user.click(addPageButton);
      
      // Should save current content and add new page
      expect(mockPageManager.addNewPage).toHaveBeenCalled();
    });

    it('creates blank new page after saving current content', async () => {
      mockEditor.getText.mockReturnValue('Existing content');
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      
      render(<PaginatedEditorWithNavigation />);
      
      const addPageButton = screen.getByText('Add New Page');
      await user.click(addPageButton);
      
      expect(mockPageManager.addNewPage).toHaveBeenCalled();
    });

    it('handles page break insertion correctly', async () => {
      mockEditor.getText.mockReturnValue('Content before cursor');
      mockEditor.state.selection = { from: 10, to: 10 };
      
      render(<PaginatedEditorWithNavigation />);
      
      const pageBreakButton = screen.getByText('Insert Page Break');
      await user.click(pageBreakButton);
      
      // Should update sections and content
      expect(mockStore.setSections).toHaveBeenCalled();
    });
  });

  describe('Test Requirement 3: Navigating between pages loads correct content', () => {
    it('loads correct content when navigating to different pages', async () => {
      const multiPageStore = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'Page 1 content' },
          { id: 'page-2', content: 'Page 2 content' },
          { id: 'page-3', content: 'Page 3 content' },
        ],
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn(() => 'Page 1 content'),
      };
      
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Navigate to next page
      const nextButton = screen.getByText('Next Page');
      await user.click(nextButton);
      
      expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(1);
    });

    it('updates editor content when page changes', () => {
      const multiPageStore = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'Page 1 content' },
          { id: 'page-2', content: 'Page 2 content' },
        ],
        currentPageIndex: 1,
        getCurrentPageContent: jest.fn(() => 'Page 2 content'),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Editor should be updated with current page content
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('Page 2 content');
    });

    it('handles page navigation boundaries correctly', () => {
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      });
      
      render(<PaginatedEditorWithNavigation />);
      
      const prevButton = screen.getByText('Previous Page');
      const nextButton = screen.getByText('Next Page');
      
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Test Requirement 4: Text on any page remains visible and properly saved', () => {
    it('saves text entered on second page', async () => {
      const secondPageStore = {
        ...mockStore,
        currentPageIndex: 1,
        pages: [
          { id: 'page-1', content: 'Page 1 content' },
          { id: 'page-2', content: '' },
        ],
        getCurrentPageContent: jest.fn(() => ''),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(secondPageStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'Text on second page');
      
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalled();
    });

    it('maintains text visibility across page switches', async () => {
      const multiPageStore = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'First page text' },
          { id: 'page-2', content: 'Second page text' },
        ],
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn()
          .mockReturnValueOnce('First page text')
          .mockReturnValueOnce('Second page text'),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
      
      const { rerender } = render(<PaginatedEditorWithNavigation />);
      
      // Switch to page 2
      multiPageStore.currentPageIndex = 1;
      rerender(<PaginatedEditorWithNavigation />);
      
      // Editor should update with page 2 content
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('Second page text');
    });

    it('preserves content when switching between multiple pages', async () => {
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 2,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: true,
      });
      
      render(<PaginatedEditorWithNavigation />);
      
      // Navigate between pages
      const prevButton = screen.getByText('Previous Page');
      const nextButton = screen.getByText('Next Page');
      
      await user.click(prevButton);
      expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(0);
      
      await user.click(nextButton);
      expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(2);
    });
  });

  describe('Test Requirement 5: Editor maintains proper state when switching pages', () => {
    it('clears editor content before setting new content to prevent mixing', () => {
      const storeWithContent = {
        ...mockStore,
        getCurrentPageContent: jest.fn(() => 'New page content'),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(storeWithContent);
      
      render(<PaginatedEditorWithNavigation />);
      
      expect(mockEditor.commands.clearContent).toHaveBeenCalled();
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith('New page content');
    });

    it('focuses editor after content change', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      await waitFor(() => {
        expect(mockEditor.commands.focus).toHaveBeenCalled();
      }, { timeout: 200 });
    });

    it('maintains editor settings across page switches', () => {
      const storeWithSettings = {
        ...mockStore,
        editorSettings: { maxLinesPerPage: 30, fontFamily: 'Times New Roman' },
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(storeWithSettings);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Font should be maintained in editor styling
      const editorContainer = screen.getByTestId('editor-content').parentElement;
      expect(editorContainer).toHaveStyle({ fontFamily: 'Times New Roman' });
    });

    it('updates line count and character count correctly', async () => {
      mockEditor.getText.mockReturnValue('Test content with multiple lines\nLine 2\nLine 3');
      mockPageManager.calculateLineCount.mockReturnValue(3);
      
      render(<PaginatedEditorWithNavigation />);
      
      expect(screen.getByText(/Lines: 3\/25/)).toBeInTheDocument();
    });
  });

  describe('Additional Integration Tests', () => {
    it('handles font changes correctly', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      const fontSelect = screen.getByRole('combobox');
      await user.selectOptions(fontSelect, 'Times New Roman');
      
      // Should update the editor styling
      expect(mockEditor.view.dom.style.fontFamily).toBe('Times New Roman');
    });

    it('displays appropriate warnings for page limits', () => {
      mockPageManager.checkPageLimits.mockReturnValue({
        exceedsLimit: true,
        message: 'Content exceeds 6-page limit',
      });
      
      mockPageManager.calculateLineCount.mockReturnValue(30);
      
      render(<PaginatedEditorWithNavigation />);
      
      expect(screen.getByText('Content exceeds 6-page limit')).toBeInTheDocument();
      expect(screen.getByText('Page line limit exceeded')).toBeInTheDocument();
    });

    it('handles bold and italic formatting', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      const boldButton = screen.getByRole('button', { name: /bold/i });
      const italicButton = screen.getByRole('button', { name: /italic/i });
      
      await user.click(boldButton);
      expect(mockEditor.chain().focus().toggleBold().run).toHaveBeenCalled();
      
      await user.click(italicButton);
      expect(mockEditor.chain().focus().toggleItalic().run).toHaveBeenCalled();
    });

    it('prevents page creation beyond 6-page limit', () => {
      const storeAtLimit = {
        ...mockStore,
        pages: Array.from({ length: 6 }, (_, i) => ({ id: `page-${i + 1}`, content: `Page ${i + 1}` })),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(storeAtLimit);
      
      render(<PaginatedEditorWithNavigation />);
      
      const addPageButton = screen.getByText('Add New Page');
      expect(addPageButton).toBeDisabled();
    });
  });

  describe('Comprehensive Pagination Scenarios', () => {
    describe('Scenario 1: Create content on page 1, add page 2, add content, navigate back and forth', () => {
      it('persists content on page 1 when navigating to page 2', async () => {
        const multiPageStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Original page 1 content' },
            { id: 'page-2', content: '' },
          ],
          currentPageIndex: 0,
          getCurrentPageContent: jest.fn(() => 'Original page 1 content'),
        };
        
        mockPageManager.getPageInfo.mockReturnValue({
          currentPage: 1,
          totalPages: 2,
          hasNextPage: true,
          hasPreviousPage: false,
        });
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        // Navigate to page 2
        const nextButton = screen.getByText('Next Page');
        await user.click(nextButton);
        
        expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(1);
      });

      it('allows adding content on page 2 and preserves it during navigation', async () => {
        const multiPageStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Page 1 content' },
            { id: 'page-2', content: '' },
          ],
          currentPageIndex: 1,
          getCurrentPageContent: jest.fn(() => ''),
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        const editor = screen.getByTestId('editor-content');
        
        // Add content to page 2
        await user.type(editor, 'New content on page 2');
        
        expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith('New content on page 2');
        
        // Navigate back to page 1
        const prevButton = screen.getByText('Previous Page');
        await user.click(prevButton);
        
        expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(0);
      });

      it('preserves content when navigating back and forth multiple times', async () => {
        const multiPageStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Persistent page 1 content' },
            { id: 'page-2', content: 'Persistent page 2 content' },
          ],
          currentPageIndex: 0,
          getCurrentPageContent: jest.fn()
            .mockReturnValueOnce('Persistent page 1 content')
            .mockReturnValueOnce('Persistent page 2 content')
            .mockReturnValueOnce('Persistent page 1 content'),
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        const nextButton = screen.getByText('Next Page');
        const prevButton = screen.getByText('Previous Page');
        
        // Navigate: Page 1 -> Page 2 -> Page 1
        await user.click(nextButton);
        await user.click(prevButton);
        
        expect(mockPageManager.navigateToPage).toHaveBeenCalledTimes(2);
        expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(1, 1);
        expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(2, 0);
      });
    });

    describe('Scenario 2: Verify all page indicators remain visible', () => {
      it('displays correct page numbers in navigation', () => {
        const threePageStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Page 1' },
            { id: 'page-2', content: 'Page 2' },
            { id: 'page-3', content: 'Page 3' },
          ],
          currentPageIndex: 1,
        };
        
        mockPageManager.getPageInfo.mockReturnValue({
          currentPage: 2,
          totalPages: 3,
          hasNextPage: true,
          hasPreviousPage: true,
        });
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(threePageStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        // Check page indicators
        expect(screen.getByText('Page 2 of 3')).toBeInTheDocument();
        expect(screen.getByText('Page 2')).toBeInTheDocument();
      });

      it('shows all page indicator buttons for multiple pages', () => {
        const fourPageStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Page 1' },
            { id: 'page-2', content: 'Page 2' },
            { id: 'page-3', content: 'Page 3' },
            { id: 'page-4', content: 'Page 4' },
          ],
          currentPageIndex: 0,
        };
        
        mockPageManager.getPageInfo.mockReturnValue({
          currentPage: 1,
          totalPages: 4,
          hasNextPage: true,
          hasPreviousPage: false,
        });
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(fourPageStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        // Check that page indicator buttons exist for all pages
        expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '2' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '3' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '4' })).toBeInTheDocument();
      });
    });

    describe('Scenario 3: Confirm content persists across all navigation patterns', () => {
      it('maintains content integrity during sequential forward navigation', async () => {
        const sequentialStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Content A' },
            { id: 'page-2', content: 'Content B' },
            { id: 'page-3', content: 'Content C' },
          ],
          currentPageIndex: 0,
          getCurrentPageContent: jest.fn()
            .mockReturnValueOnce('Content A')
            .mockReturnValueOnce('Content B')
            .mockReturnValueOnce('Content C'),
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(sequentialStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        const nextButton = screen.getByText('Next Page');
        
        // Navigate through all pages sequentially
        await user.click(nextButton); // Page 1 -> 2
        await user.click(nextButton); // Page 2 -> 3
        
        expect(mockPageManager.navigateToPage).toHaveBeenCalledTimes(2);
        expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(1, 1);
        expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(2, 2);
      });

      it('maintains content integrity during sequential backward navigation', async () => {
        const backwardStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Content A' },
            { id: 'page-2', content: 'Content B' },
            { id: 'page-3', content: 'Content C' },
          ],
          currentPageIndex: 2,
          getCurrentPageContent: jest.fn()
            .mockReturnValueOnce('Content C')
            .mockReturnValueOnce('Content B')
            .mockReturnValueOnce('Content A'),
        };
        
        mockPageManager.getPageInfo.mockReturnValue({
          currentPage: 3,
          totalPages: 3,
          hasNextPage: false,
          hasPreviousPage: true,
        });
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(backwardStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        const prevButton = screen.getByText('Previous Page');
        
        // Navigate backward through all pages
        await user.click(prevButton); // Page 3 -> 2
        await user.click(prevButton); // Page 2 -> 1
        
        expect(mockPageManager.navigateToPage).toHaveBeenCalledTimes(2);
        expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(1, 1);
        expect(mockPageManager.navigateToPage).toHaveBeenNthCalledWith(2, 0);
      });

      it('handles random navigation pattern correctly', async () => {
        const randomNavStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Content A' },
            { id: 'page-2', content: 'Content B' },
            { id: 'page-3', content: 'Content C' },
            { id: 'page-4', content: 'Content D' },
          ],
          currentPageIndex: 0,
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(randomNavStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        // Random navigation: 1 -> 3 -> 2 -> 4
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
        const rapidNavStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Rapid A' },
            { id: 'page-2', content: 'Rapid B' },
            { id: 'page-3', content: 'Rapid C' },
          ],
          currentPageIndex: 0,
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(rapidNavStore);
        
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
      });

      it('handles concurrent content updates during navigation', async () => {
        const concurrentStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: '' },
            { id: 'page-2', content: '' },
          ],
          currentPageIndex: 0,
          getCurrentPageContent: jest.fn(() => ''),
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(concurrentStore);
        
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
        const boundaryStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Only page' },
          ],
          currentPageIndex: 0,
        };
        
        mockPageManager.getPageInfo.mockReturnValue({
          currentPage: 1,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        });
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(boundaryStore);
        
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
        const invalidPageStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: 'Valid page' },
            null, // Invalid page
            { id: 'page-3', content: 'Another valid page' },
          ],
          currentPageIndex: 0,
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(invalidPageStore);
        
        // Should not crash despite invalid data
        render(<PaginatedEditorWithNavigation />);
        
        expect(screen.getByText('Paginated Story Editor')).toBeInTheDocument();
      });

      it('handles missing page content gracefully', () => {
        const missingContentStore = {
          ...mockStore,
          pages: [
            { id: 'page-1', content: undefined }, // Missing content
          ],
          currentPageIndex: 0,
          getCurrentPageContent: jest.fn(() => ''),
        };
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(missingContentStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        expect(screen.getByTestId('editor-content')).toBeInTheDocument();
        expect(mockEditor.commands.setContent).toHaveBeenCalledWith('');
      });

      it('recovers from navigation errors', async () => {
        // Mock navigation to throw an error initially, then succeed
        mockPageManager.navigateToPage
          .mockImplementationOnce(() => {
            throw new Error('Navigation error');
          })
          .mockImplementation(() => {});
        
        render(<PaginatedEditorWithNavigation />);
        
        const nextButton = screen.getByText('Next Page');
        
        // First navigation attempt should handle error gracefully
        await user.click(nextButton);
        
        // Component should still be functional
        expect(screen.getByText('Paginated Story Editor')).toBeInTheDocument();
      });
    });
  });
});

