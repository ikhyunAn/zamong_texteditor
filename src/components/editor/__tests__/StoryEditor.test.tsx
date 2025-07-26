/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock the store first
const mockSetContent = jest.fn();
const mockSetCurrentStep = jest.fn();

jest.mock('@/store/useStoryStore', () => ({
  useStoryStore: jest.fn(() => ({
    content: '',
    setContent: mockSetContent,
    setCurrentStep: mockSetCurrentStep,
    authorInfo: { name: 'Test Author', title: 'Test Story' },
  })),
}));

// Mock UI components
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, disabled, variant, size }: any) => (
    <button className={className} onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>←</span>,
  ArrowRight: () => <span>→</span>,
  Bold: () => <span>B</span>,
  Italic: () => <span>I</span>,
}));

// Mock TipTap editor
const mockEditor = {
  getHTML: jest.fn(() => '<p>Test content</p>'),
  getText: jest.fn(() => 'Test content'),
  isActive: jest.fn(() => false),
  chain: jest.fn(() => ({
    focus: jest.fn(() => ({
      toggleBold: jest.fn(() => ({
        run: jest.fn(),
      })),
      toggleItalic: jest.fn(() => ({
        run: jest.fn(),
      })),
    })),
  })),
};

jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => mockEditor),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content">
      <div contentEditable={true} data-testid="editor-input">
        {editor?.getHTML?.() || ''}
      </div>
    </div>
  ),
}));

jest.mock('@tiptap/starter-kit', () => jest.fn());
jest.mock('@tiptap/extension-bold', () => jest.fn());
jest.mock('@tiptap/extension-italic', () => jest.fn());
jest.mock('@tiptap/extension-paragraph', () => jest.fn());

import { StoryEditor } from '../StoryEditor';

describe('StoryEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Component Rendering', () => {
    test('renders editor with all necessary elements', () => {
      render(<StoryEditor />);
      
      expect(screen.getByText('Write Your Story')).toBeInTheDocument();
      expect(screen.getByTestId('editor-content')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
      expect(screen.getByText('Continue to Sections')).toBeInTheDocument();
    });

    test('renders formatting toolbar', () => {
      render(<StoryEditor />);
      
      expect(screen.getByText('B')).toBeInTheDocument(); // Bold button
      expect(screen.getByText('I')).toBeInTheDocument(); // Italic button
    });

    test('shows character count', () => {
      render(<StoryEditor />);
      
      expect(screen.getByText(/0 characters/)).toBeInTheDocument();
    });
  });

  describe('Text Input and Store Synchronization', () => {
    test('synchronizes content with store on update', async () => {
      const mockOnUpdate = jest.fn();
      
      // Mock useEditor to capture the onUpdate callback
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        // Store the onUpdate callback for later use
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      // Simulate editor update
      act(() => {
        mockOnUpdate({ editor: mockEditor });
      });

      expect(mockSetContent).toHaveBeenCalledWith('<p>Test content</p>');
    });

    test('handles various text lengths', async () => {
      const testTexts = [
        'Short text',
        'Medium length text that should still work fine',
        'Very long text that spans multiple lines and contains a lot of content to test how the editor handles longer content without any issues. This text should be processed correctly and stored in the application state without any performance degradation or synchronization problems.',
      ];

      testTexts.forEach((text, index) => {
        mockEditor.getHTML.mockReturnValue(`<p>${text}</p>`);
        mockEditor.getText.mockReturnValue(text);

        const mockOnUpdate = jest.fn();
        const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
        mockUseEditor.mockImplementation((config) => {
          mockOnUpdate.mockImplementation(config.onUpdate);
          return mockEditor;
        });

        render(<StoryEditor />);

        act(() => {
          mockOnUpdate({ editor: mockEditor });
        });

        expect(mockSetContent).toHaveBeenCalledWith(`<p>${text}</p>`);
        
        // Clean up for next iteration
        jest.clearAllMocks();
      });
    });

    test('handles rapid typing simulation', async () => {
      let callCount = 0;
      const mockOnUpdate = jest.fn();
      
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      // Simulate rapid typing by calling onUpdate multiple times quickly
      const rapidUpdates = Array.from({ length: 10 }, (_, i) => {
        const content = `<p>Typing ${i}</p>`;
        mockEditor.getHTML.mockReturnValue(content);
        return content;
      });

      rapidUpdates.forEach((content) => {
        act(() => {
          mockOnUpdate({ editor: mockEditor });
        });
        callCount++;
      });

      expect(mockSetContent).toHaveBeenCalledTimes(callCount);
    });
  });

  describe('Formatting Controls', () => {
    test('bold button toggles bold formatting', () => {
      render(<StoryEditor />);
      
      const boldButton = screen.getByText('B').closest('button');
      fireEvent.click(boldButton!);
      
      expect(mockEditor.chain().focus().toggleBold().run).toHaveBeenCalled();
    });

    test('italic button toggles italic formatting', () => {
      render(<StoryEditor />);
      
      const italicButton = screen.getByText('I').closest('button');
      fireEvent.click(italicButton!);
      
      expect(mockEditor.chain().focus().toggleItalic().run).toHaveBeenCalled();
    });
  });

  describe('Navigation Controls', () => {
    test('back button navigates to previous step', () => {
      render(<StoryEditor />);
      
      const backButton = screen.getByText('Back');
      fireEvent.click(backButton);
      
      expect(mockSetCurrentStep).toHaveBeenCalledWith(0);
    });

    test('continue button is disabled when content is too short', () => {
      mockEditor.getHTML.mockReturnValue('<p>Hi</p>');
      
      render(<StoryEditor />);
      
      const continueButton = screen.getByText('Continue to Sections');
      expect(continueButton).toBeDisabled();
    });

    test('continue button navigates when content is sufficient', () => {
      mockEditor.getHTML.mockReturnValue('<p>This is sufficient content for the story editor test.</p>');
      
      render(<StoryEditor />);
      
      const continueButton = screen.getByText('Continue to Sections');
      fireEvent.click(continueButton);
      
      expect(mockSetCurrentStep).toHaveBeenCalledWith(2);
    });
  });

  describe('Error Handling', () => {
    test('shows loading state when editor is not ready', () => {
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockReturnValue(null);
      
      render(<StoryEditor />);
      
      expect(screen.getByText('Loading editor...')).toBeInTheDocument();
    });

    test('handles editor errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation(() => {
        throw new Error('Editor initialization failed');
      });

      expect(() => render(<StoryEditor />)).not.toThrow();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Performance Tests', () => {
    test('handles multiple consecutive updates efficiently', async () => {
      const startTime = performance.now();
      const mockOnUpdate = jest.fn();
      
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      // Simulate 50 rapid updates
      for (let i = 0; i < 50; i++) {
        mockEditor.getHTML.mockReturnValue(`<p>Update ${i}</p>`);
        act(() => {
          mockOnUpdate({ editor: mockEditor });
        });
      }

      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      // Should complete within reasonable time (1 second)
      expect(executionTime).toBeLessThan(1000);
      expect(mockSetContent).toHaveBeenCalledTimes(50);
    });
  });
});
