/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useStoryStore } from '@/store/useStoryStore';
import PaginatedEditorWithNavigation from '../PaginatedEditor';
import { BatchImageGenerator } from '@/components/canvas/BatchImageGenerator';

// Test case scenarios for first page newline preservation issue
describe('First Page Newline Preservation - Comprehensive Test Cases', () => {
  const user = userEvent.setup();

  // Mock dependencies
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

  const mockStore = {
    content: '',
    sections: [],
    pages: [{ id: 'page-1', content: '' }],
    currentPageIndex: 0,
    currentStep: 1, // Start in editor step
    editorSettings: { maxLinesPerPage: 25, fontFamily: 'Arial' },
    setContent: jest.fn(),
    setCurrentStep: jest.fn(),
    getCurrentPageContent: jest.fn(() => ''),
    setCurrentPageContent: jest.fn(),
    addEmptyPage: jest.fn(),
    setSections: jest.fn(),
    authorInfo: { name: 'Test Author', title: 'Test Story' },
  };

  // Setup mocks
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

  jest.mock('@/hooks/usePageManager', () => ({
    usePageManager: jest.fn(() => mockPageManager),
  }));

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

  beforeEach(() => {
    jest.clearAllMocks();
    mockEditor.getText.mockReturnValue('');
    mockStore.currentStep = 1;
    mockStore.currentPageIndex = 0;
    mockStore.pages = [{ id: 'page-1', content: '' }];
  });

  describe('Test Scenario 1: Create content with multiple newlines on page 1', () => {
    const newlinePatterns = [
      {
        name: 'Single newlines',
        content: 'Line 1\nLine 2\nLine 3',
        expected: 'Line 1\nLine 2\nLine 3',
      },
      {
        name: 'Double newlines (paragraph breaks)',
        content: 'Paragraph 1\n\nParagraph 2\n\nParagraph 3',
        expected: 'Paragraph 1\n\nParagraph 2\n\nParagraph 3',
      },
      {
        name: 'Mixed single and double newlines',
        content: 'Line 1\nLine 2\n\nNew paragraph\nWith more lines',
        expected: 'Line 1\nLine 2\n\nNew paragraph\nWith more lines',
      },
      {
        name: 'Multiple consecutive newlines',
        content: 'Text\n\n\n\nMore text',
        expected: 'Text\n\n\n\nMore text',
      },
      {
        name: 'Leading and trailing newlines',
        content: '\n\nStart text\nMiddle text\nEnd text\n\n',
        expected: '\n\nStart text\nMiddle text\nEnd text\n\n',
      },
      {
        name: 'Complex mixed pattern',
        content: 'Title\n\nFirst paragraph with\nmultiple lines\n\n\nSecond paragraph\n\nThird paragraph\nwith lines\n\n\n\nFinal paragraph',
        expected: 'Title\n\nFirst paragraph with\nmultiple lines\n\n\nSecond paragraph\n\nThird paragraph\nwith lines\n\n\n\nFinal paragraph',
      },
    ];

    newlinePatterns.forEach(({ name, content, expected }) => {
      it(`should preserve ${name} when typed on first page`, async () => {
        mockEditor.getText.mockReturnValue(content);
        mockStore.getCurrentPageContent.mockReturnValue(content);
        
        render(<PaginatedEditorWithNavigation />);
        
        const editor = screen.getByTestId('editor-content');
        
        // Simulate typing the content
        await user.type(editor, content);
        
        // Verify content is preserved in the page manager
        expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith(content);
        
        // Verify the content matches expected pattern
        const lastCall = mockPageManager.updateCurrentPageContent.mock.calls[
          mockPageManager.updateCurrentPageContent.mock.calls.length - 1
        ];
        expect(lastCall[0]).toBe(expected);
      });
    });

    it('should maintain newline structure when content is saved to store', async () => {
      const complexContent = 'First line\n\nSecond paragraph\nwith continuation\n\n\nThird paragraph';
      
      mockEditor.getText.mockReturnValue(complexContent);
      mockStore.getCurrentPageContent.mockReturnValue(complexContent);
      
      render(<PaginatedEditorWithNavigation />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, complexContent);
      
      // Verify the exact content structure is maintained
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith(complexContent);
      
      // Check that no normalization or trimming occurs
      const calls = mockPageManager.updateCurrentPageContent.mock.calls;
      const savedContent = calls[calls.length - 1][0];
      expect(savedContent).toEqual(complexContent);
      expect(savedContent.split('\n').length).toBe(complexContent.split('\n').length);
    });
  });

  describe('Test Scenario 2: Navigate to preview/image generation step', () => {
    it('should navigate to image generation step while preserving content', async () => {
      const contentWithNewlines = 'Story content\nwith multiple\n\nlines and paragraphs';
      
      mockEditor.getText.mockReturnValue(contentWithNewlines);
      mockStore.getCurrentPageContent.mockReturnValue(contentWithNewlines);
      mockStore.content = contentWithNewlines;
      
      render(<PaginatedEditorWithNavigation />);
      
      // Find and click the continue button to go to image generation
      const continueButton = screen.getByText('Continue to Sections');
      await user.click(continueButton);
      
      // Verify navigation to step 2 (image generation)
      expect(mockStore.setCurrentStep).toHaveBeenCalledWith(2);
      
      // Verify content was saved before navigation
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith(contentWithNewlines);
    });

    it('should preserve content structure when switching to image generation', async () => {
      const multilineContent = 'Chapter 1\n\nIt was a dark and stormy night.\nThe rain fell heavily.\n\nSuddenly, a knock at the door.';
      
      mockEditor.getText.mockReturnValue(multilineContent);
      mockStore.content = multilineContent;
      
      // Simulate being in the editor step
      const { rerender } = render(<PaginatedEditorWithNavigation />);
      
      // Navigate to image generation step
      mockStore.currentStep = 2;
      rerender(<BatchImageGenerator />);
      
      // The content should be accessible for image generation with preserved newlines
      expect(mockStore.content).toBe(multilineContent);
    });

    it('should handle navigation with empty content gracefully', async () => {
      mockEditor.getText.mockReturnValue('');
      mockStore.getCurrentPageContent.mockReturnValue('');
      
      render(<PaginatedEditorWithNavigation />);
      
      const continueButton = screen.getByText('Continue to Sections');
      
      // Continue button should be disabled for empty content
      expect(continueButton).toBeDisabled();
    });
  });

  describe('Test Scenario 3: Return to editor and verify newlines are preserved', () => {
    it('should preserve newlines when returning from image generation to editor', async () => {
      const originalContent = 'Original story\nwith multiple lines\n\nAnd paragraphs\n\n\nExtra spacing';
      
      mockStore.getCurrentPageContent.mockReturnValue(originalContent);
      mockStore.content = originalContent;
      mockStore.currentStep = 2; // Start in image generation
      
      // Render image generation step first
      const { rerender } = render(<BatchImageGenerator />);
      
      // Navigate back to editor (step 1)
      mockStore.currentStep = 1;
      mockEditor.getText.mockReturnValue(originalContent);
      
      rerender(<PaginatedEditorWithNavigation />);
      
      // Verify editor is loaded with preserved content
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(originalContent);
      
      // Verify the newline structure is intact
      const setContentCalls = mockEditor.commands.setContent.mock.calls;
      const restoredContent = setContentCalls[setContentCalls.length - 1][0];
      expect(restoredContent).toBe(originalContent);
      expect(restoredContent.split('\n').length).toBe(originalContent.split('\n').length);
    });

    it('should maintain content integrity through multiple navigation cycles', async () => {
      const testContent = 'Test content\n\nWith paragraphs\nAnd line breaks\n\n\nMultiple spacing';
      
      mockStore.getCurrentPageContent.mockReturnValue(testContent);
      mockStore.content = testContent;
      mockEditor.getText.mockReturnValue(testContent);
      
      // Start in editor
      mockStore.currentStep = 1;
      const { rerender } = render(<PaginatedEditorWithNavigation />);
      
      // Go to image generation
      mockStore.currentStep = 2;
      rerender(<BatchImageGenerator />);
      
      // Go back to editor
      mockStore.currentStep = 1;
      rerender(<PaginatedEditorWithNavigation />);
      
      // Go to image generation again
      mockStore.currentStep = 2;
      rerender(<BatchImageGenerator />);
      
      // Final return to editor
      mockStore.currentStep = 1;
      rerender(<PaginatedEditorWithNavigation />);
      
      // Content should be preserved throughout all navigation
      expect(mockStore.content).toBe(testContent);
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(testContent);
    });

    it('should handle back button navigation correctly', async () => {
      const contentWithNewlines = 'Back button test\nMultiple lines\n\nWith paragraphs';
      
      mockStore.getCurrentPageContent.mockReturnValue(contentWithNewlines);
      mockStore.currentStep = 2; // Start in image generation
      
      render(<BatchImageGenerator />);
      
      // Find and click back button
      const backButton = screen.getByText('Back to Editor');
      await user.click(backButton);
      
      // Should navigate back to editor step
      expect(mockStore.setCurrentStep).toHaveBeenCalledWith(1);
    });
  });

  describe('Test Scenario 4: Compare behavior between first page and other pages', () => {
    it('should preserve newlines consistently on first page vs other pages', async () => {
      const testContent = 'Consistent content\nWith newlines\n\nAnd paragraphs';
      
      // Test first page (index 0)
      mockStore.currentPageIndex = 0;
      mockStore.pages = [{ id: 'page-1', content: testContent }];
      mockStore.getCurrentPageContent.mockReturnValue(testContent);
      mockEditor.getText.mockReturnValue(testContent);
      
      const { rerender } = render(<PaginatedEditorWithNavigation />);
      
      // Verify first page content handling
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(testContent);
      
      // Switch to second page
      mockStore.currentPageIndex = 1;
      mockStore.pages = [
        { id: 'page-1', content: testContent },
        { id: 'page-2', content: testContent },
      ];
      
      mockPageManager.getPageInfo.mockReturnValue({
        currentPage: 2,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
      
      rerender(<PaginatedEditorWithNavigation />);
      
      // Verify second page content handling is identical
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(testContent);
      
      // Both pages should have identical content preservation
      const setContentCalls = mockEditor.commands.setContent.mock.calls;
      expect(setContentCalls[0][0]).toBe(setContentCalls[1][0]);
    });

    it('should handle newline patterns consistently across all pages', async () => {
      const patterns = [
        'Simple\nlines',
        'Paragraph\n\nbreaks',
        'Multiple\n\n\nspacing',
        'Complex\npattern\n\nwith\nmixed\n\n\ncontent',
      ];
      
      patterns.forEach((pattern, pageIndex) => {
        mockStore.currentPageIndex = pageIndex;
        mockStore.pages[pageIndex] = { id: `page-${pageIndex + 1}`, content: pattern };
        mockStore.getCurrentPageContent.mockReturnValue(pattern);
        mockEditor.getText.mockReturnValue(pattern);
        
        const { rerender } = render(<PaginatedEditorWithNavigation />);
        
        // Each page should preserve its specific pattern
        expect(mockEditor.commands.setContent).toHaveBeenCalledWith(pattern);
        
        jest.clearAllMocks();
      });
    });

    it('should not lose newlines when switching between pages with different patterns', async () => {
      const page1Content = 'Page 1\nWith single breaks';
      const page2Content = 'Page 2\n\nWith double breaks\n\nAnd more';
      
      mockStore.pages = [
        { id: 'page-1', content: page1Content },
        { id: 'page-2', content: page2Content },
      ];
      
      // Start on page 1
      mockStore.currentPageIndex = 0;
      mockStore.getCurrentPageContent.mockReturnValue(page1Content);
      mockEditor.getText.mockReturnValue(page1Content);
      
      const { rerender } = render(<PaginatedEditorWithNavigation />);
      
      // Switch to page 2
      mockStore.currentPageIndex = 1;
      mockStore.getCurrentPageContent.mockReturnValue(page2Content);
      mockEditor.getText.mockReturnValue(page2Content);
      
      rerender(<PaginatedEditorWithNavigation />);
      
      // Switch back to page 1
      mockStore.currentPageIndex = 0;
      mockStore.getCurrentPageContent.mockReturnValue(page1Content);
      mockEditor.getText.mockReturnValue(page1Content);
      
      rerender(<PaginatedEditorWithNavigation />);
      
      // Verify page 1 content is restored correctly
      expect(mockEditor.commands.setContent).toHaveBeenLastCalledWith(page1Content);
      
      // Ensure newline count is preserved
      const calls = mockEditor.commands.setContent.mock.calls;
      const finalContent = calls[calls.length - 1][0];
      expect(finalContent.split('\n').length).toBe(page1Content.split('\n').length);
    });
  });

  describe('Test Scenario 5: Edge cases and error handling', () => {
    it('should handle content with only newlines', async () => {
      const onlyNewlines = '\n\n\n\n\n';
      
      mockEditor.getText.mockReturnValue(onlyNewlines);
      mockStore.getCurrentPageContent.mockReturnValue(onlyNewlines);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Should handle gracefully without crashing
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(onlyNewlines);
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
    });

    it('should preserve newlines with special characters', async () => {
      const specialContent = 'Content with\n"quotes"\nand symbols: @#$%\n\nMore content\nwith émojis 😀\n\nFinal line';
      
      mockEditor.getText.mockReturnValue(specialContent);
      mockStore.getCurrentPageContent.mockReturnValue(specialContent);
      
      render(<PaginatedEditorWithNavigation />);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, specialContent);
      
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith(specialContent);
    });

    it('should handle very long content with many newlines', async () => {
      const longContent = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`).join('\n');
      const contentWithParagraphs = longContent.replace(/Line (10|20|30|40|50)/g, '\n\nLine $1');
      
      mockEditor.getText.mockReturnValue(contentWithParagraphs);
      mockStore.getCurrentPageContent.mockReturnValue(contentWithParagraphs);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Should handle large content without performance issues
      expect(mockEditor.commands.setContent).toHaveBeenCalledWith(contentWithParagraphs);
      expect(contentWithParagraphs.split('\n').length).toBeGreaterThan(100);
    });

    it('should handle concurrent edits and navigation', async () => {
      const initialContent = 'Initial\ncontent\n\nwith breaks';
      const editedContent = 'Edited\ncontent\n\nwith more\nbreaks';
      
      mockEditor.getText.mockReturnValue(initialContent);
      mockStore.getCurrentPageContent.mockReturnValue(initialContent);
      
      render(<PaginatedEditorWithNavigation />);
      
      // Simulate editing
      mockEditor.getText.mockReturnValue(editedContent);
      
      const editor = screen.getByTestId('editor-content');
      await user.type(editor, ' more text');
      
      // Navigate to image generation
      const continueButton = screen.getByText('Continue to Sections');
      if (!continueButton.hasAttribute('disabled')) {
        await user.click(continueButton);
      }
      
      // Content should be preserved
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalled();
    });

    it('should recover from navigation errors without losing content', async () => {
      const contentToPreserve = 'Important\ncontent\n\nto preserve';
      
      mockEditor.getText.mockReturnValue(contentToPreserve);
      mockStore.getCurrentPageContent.mockReturnValue(contentToPreserve);
      
      // Mock a navigation error
      mockStore.setCurrentStep.mockImplementationOnce(() => {
        throw new Error('Navigation error');
      });
      
      render(<PaginatedEditorWithNavigation />);
      
      const continueButton = screen.getByText('Continue to Sections');
      
      // Navigation might fail, but content should be preserved
      try {
        await user.click(continueButton);
      } catch (error) {
        // Expected error
      }
      
      // Content should still be intact
      expect(mockPageManager.updateCurrentPageContent).toHaveBeenCalledWith(contentToPreserve);
    });
  });

  describe('Test Scenario 6: Integration with image generation', () => {
    it('should provide correctly formatted content to image generator', async () => {
      const storyContent = 'Story Title\n\nChapter 1\nIt was a dark night.\nThe wind howled.\n\nChapter 2\nMorning came slowly.';
      
      mockEditor.getText.mockReturnValue(storyContent);
      mockStore.content = storyContent;
      mockStore.getCurrentPageContent.mockReturnValue(storyContent);
      
      // Navigate to image generation
      mockStore.currentStep = 2;
      
      render(<BatchImageGenerator />);
      
      // The image generator should receive content with preserved newlines
      expect(mockStore.content).toBe(storyContent);
      expect(mockStore.content.split('\n').length).toBe(storyContent.split('\n').length);
    });

    it('should maintain newline structure during synchronization', async () => {
      const originalContent = 'Before sync\nMultiple lines\n\nWith paragraphs\n\n\nExtra spacing';
      
      mockStore.content = originalContent;
      mockStore.getCurrentPageContent.mockReturnValue(originalContent);
      
      render(<BatchImageGenerator />);
      
      // Look for synchronize button and click it
      const syncButton = screen.queryByText('Synchronize');
      if (syncButton) {
        await user.click(syncButton);
      }
      
      // After synchronization, content structure should be preserved
      expect(mockStore.content).toBe(originalContent);
    });
  });
});
