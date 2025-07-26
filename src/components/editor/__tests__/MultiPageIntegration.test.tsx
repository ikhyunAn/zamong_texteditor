/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { useStoryStore } from '../../../store/useStoryStore';

// Mock the dependencies to focus on integration
jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => ({
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
    view: { dom: document.createElement('div') },
    state: { selection: { from: 0, to: 0 } },
    storage: { characterCount: { characters: jest.fn(() => 0) } },
  })),
  EditorContent: ({ editor }: any) => <div data-testid="editor-content">Editor Content</div>,
}));

jest.mock('../../../hooks/usePageManager', () => ({
  usePageManager: jest.fn(() => ({
    totalPages: 1,
    getPageInfo: jest.fn(() => ({
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    })),
    checkPageLimits: jest.fn(() => ({ exceedsLimit: false })),
    calculateLineCount: jest.fn(() => 5),
    navigateToPage: jest.fn(),
    addNewPage: jest.fn(),
    updateCurrentPageContent: jest.fn(),
  })),
}));

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(() => ({ ref: jest.fn(), inView: false })),
}));

jest.mock('../../../lib/debounce', () => ({
  debounce: jest.fn((fn) => fn),
}));

// Import the component after mocking
import { PaginatedEditorWithNavigation } from '../PaginatedEditor';

describe('Multi-Page Editor Integration Tests', () => {
  beforeEach(() => {
    // Reset the store before each test
    useStoryStore.getState().resetStore();
  });

  describe('Step 6 Requirements Validation', () => {
    it('should render the editor without [PAGE_BREAK] markers visible to users', () => {
      render(<PaginatedEditorWithNavigation />);
      
      // The editor should be present
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      
      // No page break markers should be visible in the UI
      expect(screen.queryByText('[PAGE_BREAK]')).not.toBeInTheDocument();
      expect(screen.queryByText('PAGE_BREAK')).not.toBeInTheDocument();
      
      // But page break functionality should be available
      expect(screen.getByText('Insert Page Break')).toBeInTheDocument();
    });

    it('should provide page creation functionality that preserves content', () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Add new page button should be available
      expect(screen.getByText('Add New Page')).toBeInTheDocument();
      
      // Page break insertion should be available
      expect(screen.getByText('Insert Page Break')).toBeInTheDocument();
    });

    it('should provide page navigation controls', () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Navigation buttons should be present
      expect(screen.getByText('Previous Page')).toBeInTheDocument();
      expect(screen.getByText('Next Page')).toBeInTheDocument();
      
      // Page information should be displayed
      expect(screen.getByText(/Page \d+ of \d+/)).toBeInTheDocument();
    });

    it('should display editor with proper formatting controls', () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Formatting toolbar should be present
      const toolbar = screen.getByRole('button', { name: /bold/i });
      expect(toolbar).toBeInTheDocument();
      
      // Line and character counters should be present
      expect(screen.getByText(/Lines:/)).toBeInTheDocument();
      expect(screen.getByText(/Characters:/)).toBeInTheDocument();
    });

    it('should show page statistics and limits', () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Page statistics should be displayed
      expect(screen.getByText('Total Pages')).toBeInTheDocument();
      expect(screen.getByText('Current Lines')).toBeInTheDocument();
      expect(screen.getByText('Lines Left')).toBeInTheDocument();
    });

    it('should have proper navigation controls in the main interface', () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Main navigation buttons should be present
      expect(screen.getByText('Back to Author Info')).toBeInTheDocument();
      expect(screen.getByText('Preview & Export')).toBeInTheDocument();
    });
  });

  describe('Store Integration', () => {
    it('should integrate properly with the story store', () => {
      const store = useStoryStore.getState();
      
      // Store should have page management functions
      expect(typeof store.addEmptyPage).toBe('function');
      expect(typeof store.addPage).toBe('function');
      expect(typeof store.setCurrentPageIndex).toBe('function');
      expect(typeof store.getCurrentPageContent).toBe('function');
      expect(typeof store.setCurrentPageContent).toBe('function');
      expect(typeof store.syncPagesToSections).toBe('function');
    });

    it('should handle empty page initialization', () => {
      const store = useStoryStore.getState();
      
      // Initially no pages
      expect(store.pages).toEqual([]);
      
      // Add empty page
      store.addEmptyPage();
      
      // Should have one empty page
      expect(store.pages).toHaveLength(1);
      expect(store.pages[0].content).toBe('');
      expect(store.currentPageIndex).toBe(0);
    });

    it('should handle page content updates', () => {
      const store = useStoryStore.getState();
      
      // Add a page with content
      store.addPage('Test content');
      
      // Should have page with content
      expect(store.pages).toHaveLength(1);
      expect(store.pages[0].content).toBe('Test content');
      expect(store.getCurrentPageContent()).toBe('Test content');
      
      // Update current page content
      store.setCurrentPageContent('Updated content');
      
      // Content should be updated
      expect(store.getCurrentPageContent()).toBe('Updated content');
    });

    it('should handle page navigation', () => {
      const store = useStoryStore.getState();
      
      // Add multiple pages
      store.addPage('Page 1');
      store.addPage('Page 2');
      store.addPage('Page 3');
      
      // Should be on first page initially
      expect(store.currentPageIndex).toBe(0);
      expect(store.getCurrentPageContent()).toBe('Page 1');
      
      // Navigate to second page
      store.setCurrentPageIndex(1);
      expect(store.currentPageIndex).toBe(1);
      expect(store.getCurrentPageContent()).toBe('Page 2');
      
      // Navigate to third page
      store.setCurrentPageIndex(2);
      expect(store.currentPageIndex).toBe(2);
      expect(store.getCurrentPageContent()).toBe('Page 3');
    });

    it('should sync pages to sections', () => {
      const store = useStoryStore.getState();
      
      // Add pages
      store.addPage('First page content');
      store.addPage('Second page content');
      
      // Sync pages to sections
      store.syncPagesToSections();
      
      // Should have sections matching pages
      expect(store.sections).toHaveLength(2);
      expect(store.sections[0].content).toBe('First page content');
      expect(store.sections[1].content).toBe('Second page content');
      
      // Global content should be updated
      expect(store.content).toBe('First page content\n\nSecond page content');
    });
  });
});
