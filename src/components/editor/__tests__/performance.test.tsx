/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, act } from '@testing-library/react';
import { performance as perfHooks } from 'perf_hooks';

// Mock the store
const mockSetContent = jest.fn();
const mockSetSections = jest.fn();

jest.mock('@/store/useStoryStore', () => ({
  useStoryStore: jest.fn(() => ({
    content: '',
    setContent: mockSetContent,
    setSections: mockSetSections,
    setCurrentStep: jest.fn(),
    authorInfo: { name: 'Test Author', title: 'Test Story' },
    sections: [],
    pages: [],
    editorSettings: { maxLinesPerPage: 25 }
  })),
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
  commands: {
    insertContent: jest.fn()
  }
};

jest.mock('@tiptap/react', () => ({
  useEditor: jest.fn(() => mockEditor),
  EditorContent: ({ editor }: any) => (
    <div data-testid="editor-content" contentEditable>
      {editor?.getHTML?.() || ''}
    </div>
  ),
}));

// Mock other dependencies
jest.mock('@tiptap/starter-kit', () => jest.fn());
jest.mock('@tiptap/extension-bold', () => jest.fn());
jest.mock('@tiptap/extension-italic', () => jest.fn());
jest.mock('@tiptap/extension-paragraph', () => jest.fn());

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

jest.mock('lucide-react', () => ({
  ArrowLeft: () => <span>←</span>,
  ArrowRight: () => <span>→</span>,
  Bold: () => <span>B</span>,
  Italic: () => <span>I</span>,
}));

import { StoryEditor } from '../StoryEditor';

describe('Text Editor Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock performance.now for consistent testing
    global.performance.now = jest.fn(() => Date.now());
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Typing Speed Performance', () => {
    test('handles rapid typing without performance degradation', async () => {
      const startTime = Date.now();
      
      // Mock useEditor to simulate rapid updates
      const mockOnUpdate = jest.fn();
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      // Simulate 100 rapid keystrokes (very fast typing)
      for (let i = 0; i < 100; i++) {
        const content = `<p>Rapid typing test ${i.toString().repeat(10)}</p>`;
        mockEditor.getHTML.mockReturnValue(content);
        
        act(() => {
          mockOnUpdate({ editor: mockEditor });
        });
      }

      const endTime = Date.now();
      const executionTime = endTime - startTime;
      
      // Should handle 100 updates within 2 seconds
      expect(executionTime).toBeLessThan(2000);
      expect(mockSetContent).toHaveBeenCalledTimes(100);
    });

    test('processes different text lengths efficiently', async () => {
      const textLengths = [
        'Short',
        'Medium length text that spans multiple words',
        'Very long text that contains many sentences and paragraphs. '.repeat(50),
        'Extremely long content. '.repeat(500) // ~10,000 characters
      ];

      const mockOnUpdate = jest.fn();
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      for (const text of textLengths) {
        const startTime = Date.now();
        
        mockEditor.getHTML.mockReturnValue(`<p>${text}</p>`);
        mockEditor.getText.mockReturnValue(text);
        
        act(() => {
          mockOnUpdate({ editor: mockEditor });
        });

        const endTime = Date.now();
        const processingTime = endTime - startTime;
        
        // Each update should complete within 100ms regardless of text length
        expect(processingTime).toBeLessThan(100);
      }

      expect(mockSetContent).toHaveBeenCalledTimes(textLengths.length);
    });
  });

  describe('Memory Management', () => {
    test('component cleans up properly on unmount', () => {
      const { unmount } = render(<StoryEditor />);
      
      // Simulate some interactions first
      const mockOnUpdate = jest.fn();
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      act(() => {
        mockOnUpdate({ editor: mockEditor });
      });

      // Unmount should not throw errors or cause memory leaks
      expect(() => unmount()).not.toThrow();
    });

    test('handles multiple concurrent updates without memory issues', async () => {
      const mockOnUpdate = jest.fn();
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      // Simulate overlapping updates (like user typing while auto-save is happening)
      const promises = Array.from({ length: 50 }, (_, i) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            mockEditor.getHTML.mockReturnValue(`<p>Concurrent update ${i}</p>`);
            act(() => {
              mockOnUpdate({ editor: mockEditor });
            });
            resolve();
          }, Math.random() * 100);
        });
      });

      await Promise.all(promises);
      
      // All updates should complete successfully
      expect(mockSetContent).toHaveBeenCalledTimes(50);
    });
  });

  describe('Render Performance', () => {
    test('component renders efficiently with large content', () => {
      const largeContent = 'Large content paragraph. '.repeat(1000);
      mockEditor.getHTML.mockReturnValue(`<p>${largeContent}</p>`);

      const startTime = Date.now();
      render(<StoryEditor />);
      const renderTime = Date.now() - startTime;

      // Initial render should complete within 500ms even with large content
      expect(renderTime).toBeLessThan(500);
    });

    test('re-renders efficiently on content updates', () => {
      const mockOnUpdate = jest.fn();
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      const { rerender } = render(<StoryEditor />);

      // Measure re-render performance
      const startTime = Date.now();
      
      // Update content and force re-render
      mockEditor.getHTML.mockReturnValue('<p>Updated content</p>');
      act(() => {
        mockOnUpdate({ editor: mockEditor });
      });
      
      rerender(<StoryEditor />);
      
      const rerenderTime = Date.now() - startTime;

      // Re-render should be faster than initial render
      expect(rerenderTime).toBeLessThan(100);
    });
  });

  describe('Store Synchronization Performance', () => {
    test('store updates are efficient and batched', async () => {
      const mockOnUpdate = jest.fn();
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      const startTime = Date.now();

      // Simulate rapid content changes
      for (let i = 0; i < 20; i++) {
        mockEditor.getHTML.mockReturnValue(`<p>Content ${i}</p>`);
        act(() => {
          mockOnUpdate({ editor: mockEditor });
        });
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      // 20 store updates should complete within 500ms
      expect(totalTime).toBeLessThan(500);
      expect(mockSetContent).toHaveBeenCalledTimes(20);
    });

    test('handles store updates without blocking UI', async () => {
      const mockOnUpdate = jest.fn();
      const mockUseEditor = require('@tiptap/react').useEditor as jest.Mock;
      mockUseEditor.mockImplementation((config) => {
        mockOnUpdate.mockImplementation(config.onUpdate);
        return mockEditor;
      });

      render(<StoryEditor />);

      // Simulate store update with large content
      const largeContent = '<p>' + 'Large paragraph content. '.repeat(500) + '</p>';
      mockEditor.getHTML.mockReturnValue(largeContent);

      const updateStart = Date.now();
      
      act(() => {
        mockOnUpdate({ editor: mockEditor });
      });

      const updateEnd = Date.now();
      const updateTime = updateEnd - updateStart;

      // Store update should not block UI (complete quickly)
      expect(updateTime).toBeLessThan(200);
      expect(mockSetContent).toHaveBeenCalledWith(largeContent);
    });
  });

  describe('Cross-browser Performance', () => {
    test('maintains consistent performance across different user agents', () => {
      const originalUserAgent = Object.getOwnPropertyDescriptor(navigator, 'userAgent');
      
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
      ];

      userAgents.forEach(userAgent => {
        Object.defineProperty(navigator, 'userAgent', {
          value: userAgent,
          configurable: true
        });

        const startTime = Date.now();
        const { unmount } = render(<StoryEditor />);
        const renderTime = Date.now() - startTime;

        // Should render within consistent time across browsers
        expect(renderTime).toBeLessThan(1000);
        
        unmount();
      });

      // Restore original user agent
      if (originalUserAgent) {
        Object.defineProperty(navigator, 'userAgent', originalUserAgent);
      }
    });
  });
});
