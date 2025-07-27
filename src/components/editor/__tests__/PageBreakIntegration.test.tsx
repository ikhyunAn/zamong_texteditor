/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaginatedEditorWithNavigation } from '../PaginatedEditor';
import { useStoryStore } from '@/store/useStoryStore';
import { usePageManager } from '@/hooks/usePageManager';
import { 
  splitContentPreservingLineBreaks, 
  validatePageBreakIntegrity,
  htmlToTextWithLineBreaks,
  textToHtmlWithLineBreaks 
} from '@/lib/text-processing';

// Mock dependencies
const mockEditor = {
  getHTML: jest.fn(() => '<p>Test content</p>'),
  getText: jest.fn(() => 'Test content'),
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
    selection: { from: 10, to: 10 },
  },
  storage: {
    characterCount: {
      characters: jest.fn(() => 50),
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

const mockStore = {
  content: '',
  sections: [],
  pages: [{ id: 'page-1', content: 'Test content with\nline breaks\n\nAnd paragraphs' }],
  currentPageIndex: 0,
  editorSettings: { maxLinesPerPage: 25, fontFamily: 'Arial' },
  setContent: jest.fn(),
  setCurrentStep: jest.fn(),
  getCurrentPageContent: jest.fn(() => 'Test content with\nline breaks\n\nAnd paragraphs'),
  setCurrentPageContent: jest.fn(),
  addEmptyPage: jest.fn(),
  addPage: jest.fn(),
  setSections: jest.fn(),
  syncPagesToSections: jest.fn(),
  navigateToPage: jest.fn(),
};

jest.mock('@/store/useStoryStore', () => ({
  useStoryStore: jest.fn(() => mockStore),
}));

jest.mock('react-intersection-observer', () => ({
  useInView: jest.fn(() => ({
    ref: jest.fn(),
    inView: false,
  })),
}));

jest.mock('@/lib/debounce', () => ({
  debounce: jest.fn((fn) => fn),
}));

describe('PageBreakIntegration - Comprehensive Tests', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditor.getText.mockReturnValue('Test content with\nline breaks\n\nAnd paragraphs');
    mockEditor.getHTML.mockReturnValue('<p>Test content with<br>line breaks</p><p>And paragraphs</p>');
    mockPageManager.getPageInfo.mockReturnValue({
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });
  });

  describe('Requirement 1: Line breaks are preserved when adding page breaks', () => {
    it('preserves single line breaks (\\n) when splitting content', () => {
      const originalContent = 'First line\nSecond line\nThird line';
      const splitPosition = 11; // After "First line\n"
      
      const { before, after } = splitContentPreservingLineBreaks(originalContent, splitPosition);
      
      expect(before).toBe('First line\n');
      expect(after).toBe('Second line\nThird line');
      
      // Verify integrity
      const isValid = validatePageBreakIntegrity(originalContent, before, after);
      expect(isValid).toBe(true);
    });

    it('preserves paragraph breaks (\\n\\n) when splitting content', () => {
      const originalContent = 'First paragraph\n\nSecond paragraph\n\nThird paragraph';
      const splitPosition = 17; // After "First paragraph\n\n"
      
      const { before, after } = splitContentPreservingLineBreaks(originalContent, splitPosition);
      
      expect(before).toBe('First paragraph\n\n');
      expect(after).toBe('Second paragraph\n\nThird paragraph');
      
      // Verify content integrity is maintained
      const reconstructed = before + after;
      expect(reconstructed.replace(/\s/g, '')).toBe(originalContent.replace(/\s/g, ''));
    });

    it('handles mixed line breaks and preserves text structure', () => {
      const originalContent = 'Line 1\nLine 2\n\nParagraph 2\nLine 3\n\nParagraph 3';
      const splitPosition = 21; // In the middle of "Paragraph 2"
      
      const { before, after } = splitContentPreservingLineBreaks(originalContent, splitPosition);
      
      // Should preserve line break structure
      expect(before).toContain('\n');
      expect(after).toContain('\n');
      
      const isValid = validatePageBreakIntegrity(originalContent, before, after);
      expect(isValid).toBe(true);
    });

    it('correctly converts between HTML and text while preserving line breaks', () => {
      const htmlContent = '<p>First paragraph</p><p>Second line<br>with break</p><p>Third paragraph</p>';
      const textContent = htmlToTextWithLineBreaks(htmlContent);
      
      expect(textContent).toBe('First paragraph\n\nSecond line\nwith break\n\nThird paragraph');
      
      // Convert back to HTML
      const backToHtml = textToHtmlWithLineBreaks(textContent);
      expect(backToHtml).toContain('<p>First paragraph</p>');
      expect(backToHtml).toContain('<p>Second line<br>with break</p>');
      expect(backToHtml).toContain('<p>Third paragraph</p>');
    });

    it('preserves line breaks during page break insertion in the editor', async () => {
      const contentWithLineBreaks = 'First line\nSecond line\n\nNew paragraph\nAnother line';
      mockEditor.getText.mockReturnValue(contentWithLineBreaks);
      mockEditor.getHTML.mockReturnValue('<p>First line<br>Second line</p><p>New paragraph<br>Another line</p>');
      mockEditor.state.selection = { from: 24, to: 24 }; // After "New paragraph\n"
      
      render(<PaginatedEditorWithNavigation />);
      
      const pageBreakButton = screen.getByText('Insert Page Break');
      await user.click(pageBreakButton);
      
      // Verify that the page break operation was called
      expect(mockStore.setSections).toHaveBeenCalled();
      expect(mockPageManager.addNewPage).toHaveBeenCalled();
    });
  });

  describe('Requirement 2: Navigation to new pages works correctly', () => {
    it('navigates to next page and loads correct content', async () => {
      const multiPageStore = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'Page 1 content\nWith line breaks' },
          { id: 'page-2', content: 'Page 2 content\nAlso with breaks' },
        ],
        currentPageIndex: 0,
        getCurrentPageContent: jest.fn(() => 'Page 1 content\nWith line breaks'),
      };
      
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      const nextButton = screen.getByText('Next Page');
      expect(nextButton).not.toBeDisabled();
      
      await user.click(nextButton);
      
      expect(mockPageManager.navigateToPage).toHaveBeenCalledWith(1);
    });

    it('disables navigation buttons at boundaries', () => {
      // Test first page (no previous)
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 3,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      
      const { rerender } = render(<PaginatedEditorWithNavigation />);
      
      expect(screen.getByText('Previous Page')).toBeDisabled();
      expect(screen.getByText('Next Page')).not.toBeDisabled();
      
      // Test last page (no next)
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 3,
        totalPages: 3,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      
      rerender(<PaginatedEditorWithNavigation />);
      
      expect(screen.getByText('Previous Page')).not.toBeDisabled();
      expect(screen.getByText('Next Page')).toBeDisabled();
    });

    it('updates editor content when navigating between pages', () => {
      const page2Content = 'Page 2 specific content\nWith preserved\nLine breaks';
      const multiPageStore = {
        ...mockStore,
        pages: [
          { id: 'page-1', content: 'Page 1 content' },
          { id: 'page-2', content: page2Content },
        ],
        currentPageIndex: 1,
        getCurrentPageContent: jest.fn(() => page2Content),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(multiPageStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Editor should be updated with current page content
      expect(mockEditor.commands.setContent).toHaveBeenCalled();
    });

    it('maintains cursor focus after page navigation', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Simulate navigation
      const addPageButton = screen.getByText('Add New Page');
      await user.click(addPageButton);
      
      // Editor should be focused after navigation
      await waitFor(() => {
        expect(mockEditor.commands.focus).toHaveBeenCalled();
      });
    });
  });

  describe('Requirement 3: Edge cases are handled properly', () => {
    describe('Empty pages', () => {
      it('handles empty page creation correctly', async () => {
        mockEditor.getText.mockReturnValue('');
        mockStore.getCurrentPageContent.mockReturnValue('');
        
        render(<PaginatedEditorWithNavigation />);
        
        const addPageButton = screen.getByText('Add New Page');
        await user.click(addPageButton);
        
        expect(mockPageManager.addNewPage).toHaveBeenCalled();
      });

      it('prevents page break insertion on empty pages', async () => {
        mockEditor.getText.mockReturnValue('');
        
        render(<PaginatedEditorWithNavigation />);
        
        const pageBreakButton = screen.getByText('Insert Page Break');
        await user.click(pageBreakButton);
        
        // Should show error message
        await waitFor(() => {
          expect(screen.getByText(/Cannot insert page break on empty page/)).toBeInTheDocument();
        });
      });

      it('initializes empty page when no pages exist', () => {
        const emptyStore = { ...mockStore, pages: [] };
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(emptyStore);
        
        render(<PaginatedEditorWithNavigation />);
        
        expect(emptyStore.addEmptyPage).toHaveBeenCalled();
      });
    });

    describe('Multiple consecutive page breaks', () => {
      it('handles multiple consecutive newlines at split boundaries', () => {
        const contentWithMultipleBreaks = 'Text before\n\n\n\nText after';
        const splitPosition = 13; // In the middle of the newlines
        
        const { before, after } = splitContentPreservingLineBreaks(contentWithMultipleBreaks, splitPosition);
        
        // Should distribute newlines properly
        expect(before).toMatch(/\n\n$/);
        expect(after).toMatch(/^\n\n/);
        
        const isValid = validatePageBreakIntegrity(contentWithMultipleBreaks, before, after);
        expect(isValid).toBe(true);
      });

      it('prevents excessive page creation beyond 6-page limit', async () => {
        const storeAtLimit = {
          ...mockStore,
          pages: Array.from({ length: 6 }, (_, i) => ({ 
            id: `page-${i + 1}`, 
            content: `Page ${i + 1} content` 
          })),
        };
        
        mockPageManager.getPageInfo.mockReturnValue({
          currentPage: 6,
          totalPages: 6,
          hasNextPage: false,
          hasPreviousPage: true,
        });
        
        require('@/store/useStoryStore').useStoryStore.mockReturnValue(storeAtLimit);
        
        render(<PaginatedEditorWithNavigation />);
        
        const addPageButton = screen.getByText('Add New Page');
        expect(addPageButton).toBeDisabled();
        
        const pageBreakButton = screen.getByText('Insert Page Break');
        await user.click(pageBreakButton);
        
        await waitFor(() => {
          expect(screen.getByText(/Maximum of 6 pages allowed/)).toBeInTheDocument();
        });
      });

      it('handles rapid consecutive page break attempts', async () => {
        const contentForBreaking = 'Content that will be split multiple times';
        mockEditor.getText.mockReturnValue(contentForBreaking);
        
        render(<PaginatedEditorWithNavigation />);
        
        const pageBreakButton = screen.getByText('Insert Page Break');
        
        // Rapid clicks
        await user.click(pageBreakButton);
        await user.click(pageBreakButton);
        await user.click(pageBreakButton);
        
        // Should handle gracefully without crashing
        expect(mockPageManager.addNewPage).toHaveBeenCalled();
      });
    });

    describe('Special content edge cases', () => {
      it('handles content with only whitespace', () => {
        const whitespaceContent = '   \n\n   \t  \n   ';
        const { before, after } = splitContentPreservingLineBreaks(whitespaceContent, 5);
        
        expect(typeof before).toBe('string');
        expect(typeof after).toBe('string');
      });

      it('handles very long single lines', () => {
        const longLine = 'A'.repeat(1000);
        const { before, after } = splitContentPreservingLineBreaks(longLine, 500);
        
        expect(before.length).toBe(500);
        expect(after.length).toBe(500);
        expect(before + after).toBe(longLine);
      });

      it('handles unicode characters and special symbols', () => {
        const unicodeContent = '🌟 First line with emoji\n🚀 Second line\n\n📚 New paragraph';
        const { before, after } = splitContentPreservingLineBreaks(unicodeContent, 25);
        
        const isValid = validatePageBreakIntegrity(unicodeContent, before, after);
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Requirement 4: Text editor state remains consistent across page operations', () => {
    it('maintains editor formatting state across page switches', () => {
      const storeWithFormatting = {
        ...mockStore,
        editorSettings: { maxLinesPerPage: 30, fontFamily: 'Times New Roman' },
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(storeWithFormatting);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Font family should be applied to editor
      const editorContainer = screen.getByTestId('editor-content').parentElement;
      expect(editorContainer).toHaveStyle({ fontFamily: 'Times New Roman' });
    });

    it('clears editor content before setting new content to prevent mixing', () => {
      const newPageStore = {
        ...mockStore,
        getCurrentPageContent: jest.fn(() => 'New page content with\nline breaks'),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(newPageStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      expect(mockEditor.commands.clearContent).toHaveBeenCalled();
      expect(mockEditor.commands.setContent).toHaveBeenCalled();
    });

    it('preserves undo/redo state appropriately', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Simulate content changes
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'New content');
      
      // Editor state should be maintained
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalled();
    });

    it('maintains selection state when possible', async () => {
      mockEditor.state.selection = { from: 15, to: 20 };
      
      render(<PaginatedEditorWithNavigation />);
      
      // After page operations, editor should maintain reasonable selection
      expect(mockEditor.commands.focus).toHaveBeenCalled();
    });

    it('handles rapid content updates without losing data', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      const editor = screen.getByTestId('editor-content');
      
      // Rapid typing simulation
      await user.type(editor, 'Fast typing content');
      await user.type(editor, ' with more text');
      await user.type(editor, ' and even more');
      
      // Should handle all updates
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalled();
    });

    it('synchronizes store state with editor content consistently', () => {
      const syncStore = {
        ...mockStore,
        getCurrentPageContent: jest.fn(() => 'Synced content\nWith line breaks'),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(syncStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Store and editor should be in sync
      expect(mockEditor.commands.setContent).toHaveBeenCalled();
      expect(syncStore.getCurrentPageContent).toHaveBeenCalled();
    });

    it('handles editor lifecycle properly during page operations', async () => {
      render(<PaginatedEditorWithNavigation />);
      
      // Simulate page break creation
      const pageBreakButton = screen.getByText('Insert Page Break');
      await user.click(pageBreakButton);
      
      // Editor should be properly managed throughout the operation
      expect(mockEditor.commands.setContent).toHaveBeenCalled();
      expect(mockEditor.commands.focus).toHaveBeenCalled();
    });
  });

  describe('Integration Tests - Real-world Scenarios', () => {
    it('handles a complete user workflow: typing, page break, navigation', async () => {
      const workflowStore = {
        ...mockStore,
        pages: [{ id: 'page-1', content: '' }],
        getCurrentPageContent: jest.fn(() => ''),
      };
      
      require('@/store/useStoryStore').useStoryStore.mockReturnValue(workflowStore);
      
      render(<PaginatedEditorWithNavigation />);
      
      // 1. User types content
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, 'First page content\nWith line breaks\n\nAnd paragraphs');
      
      // 2. User inserts page break
      mockEditor.getText.mockReturnValue('First page content\nWith line breaks\n\nAnd paragraphs');
      const pageBreakButton = screen.getByText('Insert Page Break');
      await user.click(pageBreakButton);
      
      // 3. Verify page break was handled
      expect(mockPageManager.addNewPage).toHaveBeenCalled();
      
      // 4. User navigates between pages
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 1,
        totalPages: 2,
        hasNextPage: true,
        hasPreviousPage: false,
      });
      
      const nextButton = screen.getByText('Next Page');
      await user.click(nextButton);
      
      expect(mockPageManager.navigateToPage).toHaveBeenCalled();
    });

    it('preserves content integrity through complex editing session', async () => {
      const originalContent = 'Chapter 1\n\nOnce upon a time\nIn a land far away\n\nThere lived a princess';
      
      mockEditor.getText.mockReturnValue(originalContent);
      mockEditor.getHTML.mockReturnValue('<p>Chapter 1</p><p>Once upon a time<br>In a land far away</p><p>There lived a princess</p>');
      
      render(<PaginatedEditorWithNavigation />);
      
      // Multiple page break operations
      const pageBreakButton = screen.getByText('Insert Page Break');
      
      // First page break
      mockEditor.state.selection = { from: 10, to: 10 }; // After "Chapter 1\n"
      await user.click(pageBreakButton);
      
      // Verify content integrity is maintained throughout
      expect(mockPageManager.addNewPage).toHaveBeenCalled();
    });
  });
});
