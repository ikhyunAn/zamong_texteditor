/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Visual and functional tests specifically for first page newline display
describe('First Page Visual Newline Tests', () => {
  const user = userEvent.setup();

  // Mock editor that simulates real DOM behavior for newlines
  const MockEditor = ({ 
    initialContent = '', 
    onContentChange 
  }: { 
    initialContent?: string; 
    onContentChange?: (content: string) => void;
  }) => {
    const [content, setContent] = React.useState(initialContent);
    const editorRef = React.useRef<HTMLDivElement>(null);

    const handleInput = () => {
      if (editorRef.current) {
        const newContent = editorRef.current.textContent || '';
        setContent(newContent);
        onContentChange?.(newContent);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Simulate proper newline handling
        document.execCommand('insertText', false, '\n');
        e.preventDefault();
      }
    };

    React.useEffect(() => {
      if (editorRef.current && content !== editorRef.current.textContent) {
        editorRef.current.textContent = content;
      }
    }, [content]);

    return (
      <div data-testid="first-page-editor">
        <h3>First Page Editor</h3>
        <div
          ref={editorRef}
          contentEditable
          data-testid="editor-input"
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          style={{
            minHeight: '300px',
            border: '1px solid #ccc',
            padding: '10px',
            whiteSpace: 'pre-wrap', // Preserve whitespace and newlines
            fontFamily: 'monospace',
          }}
        >
          {initialContent}
        </div>
        <div data-testid="content-display">
          Content: "{content}"
        </div>
        <div data-testid="line-count">
          Lines: {content.split('\n').length}
        </div>
        <div data-testid="newline-visualization">
          {content.split('\n').map((line, index) => (
            <div key={index} data-testid={`line-${index}`}>
              {index + 1}: "{line}"
            </div>
          ))}
        </div>
      </div>
    );
  };

  const MockPreview = ({ content }: { content: string }) => {
    return (
      <div data-testid="preview-display">
        <h3>Preview Display</h3>
        <div data-testid="preview-content" style={{ whiteSpace: 'pre-wrap' }}>
          {content}
        </div>
        <div data-testid="preview-lines">
          {content.split('\n').map((line, index) => (
            <div key={index} data-testid={`preview-line-${index}`}>
              {line || '(empty line)'}
            </div>
          ))}
        </div>
      </div>
    );
  };

  describe('Visual Newline Patterns on First Page', () => {
    it('should visually display single newlines correctly', async () => {
      const testContent = 'Line 1\nLine 2\nLine 3';
      let capturedContent = '';

      render(
        <MockEditor 
          onContentChange={(content) => { capturedContent = content; }}
        />
      );

      const editor = screen.getByTestId('editor-input');
      
      // Type content with newlines
      await user.type(editor, testContent);

      // Verify the content structure visually
      expect(screen.getByTestId('line-count')).toHaveTextContent('Lines: 3');
      
      // Check individual lines are displayed correctly
      expect(screen.getByTestId('line-0')).toHaveTextContent('1: "Line 1"');
      expect(screen.getByTestId('line-1')).toHaveTextContent('2: "Line 2"');
      expect(screen.getByTestId('line-2')).toHaveTextContent('3: "Line 3"');

      // Verify captured content matches
      expect(capturedContent).toBe(testContent);
    });

    it('should visually display double newlines (paragraph breaks) correctly', async () => {
      const testContent = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
      let capturedContent = '';

      render(
        <MockEditor 
          onContentChange={(content) => { capturedContent = content; }}
        />
      );

      const editor = screen.getByTestId('editor-input');
      await user.type(editor, testContent);

      // Should show 5 lines (3 content + 2 empty)
      expect(screen.getByTestId('line-count')).toHaveTextContent('Lines: 5');
      
      // Check the paragraph structure
      expect(screen.getByTestId('line-0')).toHaveTextContent('1: "Paragraph 1"');
      expect(screen.getByTestId('line-1')).toHaveTextContent('2: ""'); // Empty line
      expect(screen.getByTestId('line-2')).toHaveTextContent('3: "Paragraph 2"');
      expect(screen.getByTestId('line-3')).toHaveTextContent('4: ""'); // Empty line
      expect(screen.getByTestId('line-4')).toHaveTextContent('5: "Paragraph 3"');

      expect(capturedContent).toBe(testContent);
    });

    it('should visually display multiple consecutive newlines correctly', async () => {
      const testContent = 'Start\n\n\n\nEnd';
      let capturedContent = '';

      render(
        <MockEditor 
          onContentChange={(content) => { capturedContent = content; }}
        />
      );

      const editor = screen.getByTestId('editor-input');
      await user.type(editor, testContent);

      // Should show 5 lines total
      expect(screen.getByTestId('line-count')).toHaveTextContent('Lines: 5');
      
      // Check the structure with multiple empty lines
      expect(screen.getByTestId('line-0')).toHaveTextContent('1: "Start"');
      expect(screen.getByTestId('line-1')).toHaveTextContent('2: ""');
      expect(screen.getByTestId('line-2')).toHaveTextContent('3: ""');
      expect(screen.getByTestId('line-3')).toHaveTextContent('4: ""');
      expect(screen.getByTestId('line-4')).toHaveTextContent('5: "End"');

      expect(capturedContent).toBe(testContent);
    });

    it('should handle complex real-world content visually', async () => {
      const realWorldContent = `Chapter 1: The Adventure Begins

Once upon a time, in a magical kingdom,
there lived a brave young warrior.

The warrior's quest:
- Find the ancient sword
- Defeat the dragon
- Save the princess


Chapter 2: The Journey

And so the adventure began...`;

      let capturedContent = '';

      render(
        <MockEditor 
          onContentChange={(content) => { capturedContent = content; }}
        />
      );

      const editor = screen.getByTestId('editor-input');
      await user.type(editor, realWorldContent);

      // Verify line count
      const expectedLineCount = realWorldContent.split('\n').length;
      expect(screen.getByTestId('line-count')).toHaveTextContent(`Lines: ${expectedLineCount}`);

      // Check specific lines
      expect(screen.getByTestId('line-0')).toHaveTextContent('1: "Chapter 1: The Adventure Begins"');
      expect(screen.getByTestId('line-1')).toHaveTextContent('2: ""'); // Empty line after title
      expect(screen.getByTestId('line-2')).toHaveTextContent('3: "Once upon a time, in a magical kingdom,"');

      // Check for the empty lines between sections
      const emptyLines = Array.from(screen.getAllByTestId(/line-\d+/))
        .filter(element => element.textContent?.includes(': ""'));
      expect(emptyLines.length).toBeGreaterThan(2); // Should have multiple empty lines

      expect(capturedContent).toBe(realWorldContent);
    });

    it('should maintain visual integrity when editing existing content', async () => {
      const initialContent = 'Initial line 1\nInitial line 2';
      const addedContent = '\n\nAdded paragraph\nwith more content';
      
      let capturedContent = initialContent;

      const { rerender } = render(
        <MockEditor 
          initialContent={initialContent}
          onContentChange={(content) => { capturedContent = content; }}
        />
      );

      // Verify initial state
      expect(screen.getByTestId('line-count')).toHaveTextContent('Lines: 2');

      // Add more content
      const editor = screen.getByTestId('editor-input');
      await user.type(editor, addedContent);

      const finalContent = initialContent + addedContent;
      const expectedLineCount = finalContent.split('\n').length;

      // Verify updated line count
      expect(screen.getByTestId('line-count')).toHaveTextContent(`Lines: ${expectedLineCount}`);

      // Verify the combined content is displayed correctly
      expect(capturedContent).toBe(finalContent);
    });
  });

  describe('Preview Display Accuracy', () => {
    it('should display newlines correctly in preview mode', () => {
      const testContent = 'Preview test\n\nWith paragraphs\nAnd line breaks\n\n\nMultiple spacing';

      render(<MockPreview content={testContent} />);

      // Check that preview content preserves whitespace
      const previewContent = screen.getByTestId('preview-content');
      expect(previewContent).toHaveStyle({ whiteSpace: 'pre-wrap' });

      // Check individual preview lines
      const lines = testContent.split('\n');
      lines.forEach((line, index) => {
        const lineElement = screen.getByTestId(`preview-line-${index}`);
        if (line === '') {
          expect(lineElement).toHaveTextContent('(empty line)');
        } else {
          expect(lineElement).toHaveTextContent(line);
        }
      });
    });

    it('should handle empty lines in preview correctly', () => {
      const contentWithEmptyLines = 'Line 1\n\nLine 3\n\n\nLine 6';

      render(<MockPreview content={contentWithEmptyLines} />);

      // Check specific empty line handling
      expect(screen.getByTestId('preview-line-1')).toHaveTextContent('(empty line)');
      expect(screen.getByTestId('preview-line-3')).toHaveTextContent('(empty line)');
      expect(screen.getByTestId('preview-line-4')).toHaveTextContent('(empty line)');

      // Check non-empty lines
      expect(screen.getByTestId('preview-line-0')).toHaveTextContent('Line 1');
      expect(screen.getByTestId('preview-line-2')).toHaveTextContent('Line 3');
      expect(screen.getByTestId('preview-line-5')).toHaveTextContent('Line 6');
    });
  });

  describe('Editor-to-Preview Consistency', () => {
    it('should maintain consistent display between editor and preview', async () => {
      const testContent = 'Consistency test\n\nEditor and preview\nshould match exactly\n\n\nWith all spacing';
      let editorContent = '';

      const ConsistencyTest = () => {
        const [content, setContent] = React.useState('');
        const [showPreview, setShowPreview] = React.useState(false);

        return (
          <div>
            {!showPreview ? (
              <div>
                <MockEditor 
                  onContentChange={(newContent) => {
                    setContent(newContent);
                    editorContent = newContent;
                  }}
                />
                <button 
                  onClick={() => setShowPreview(true)}
                  data-testid="show-preview"
                >
                  Show Preview
                </button>
              </div>
            ) : (
              <div>
                <MockPreview content={content} />
                <button 
                  onClick={() => setShowPreview(false)}
                  data-testid="show-editor"
                >
                  Back to Editor
                </button>
              </div>
            )}
          </div>
        );
      };

      render(<ConsistencyTest />);

      // Type in editor
      const editor = screen.getByTestId('editor-input');
      await user.type(editor, testContent);

      // Verify editor state
      expect(screen.getByTestId('line-count')).toHaveTextContent(`Lines: ${testContent.split('\n').length}`);

      // Switch to preview
      const showPreviewButton = screen.getByTestId('show-preview');
      await user.click(showPreviewButton);

      // Verify preview shows same content structure
      const previewLines = testContent.split('\n');
      previewLines.forEach((line, index) => {
        const lineElement = screen.getByTestId(`preview-line-${index}`);
        if (line === '') {
          expect(lineElement).toHaveTextContent('(empty line)');
        } else {
          expect(lineElement).toHaveTextContent(line);
        }
      });

      // Switch back to editor
      const showEditorButton = screen.getByTestId('show-editor');
      await user.click(showEditorButton);

      // Verify editor still shows correct content
      expect(screen.getByTestId('content-display')).toHaveTextContent(`Content: "${testContent}"`);
      expect(editorContent).toBe(testContent);
    });

    it('should preserve newlines through multiple editor-preview cycles', async () => {
      const testContent = 'Cycle test\n\nMultiple\nround trips\n\n\nShould preserve\nall newlines';
      
      const CycleTest = () => {
        const [content, setContent] = React.useState(testContent);
        const [view, setView] = React.useState<'editor' | 'preview'>('editor');

        return (
          <div>
            {view === 'editor' ? (
              <div>
                <MockEditor 
                  initialContent={content}
                  onContentChange={setContent}
                />
                <button 
                  onClick={() => setView('preview')}
                  data-testid="to-preview"
                >
                  To Preview
                </button>
              </div>
            ) : (
              <div>
                <MockPreview content={content} />
                <button 
                  onClick={() => setView('editor')}
                  data-testid="to-editor"
                >
                  To Editor
                </button>
              </div>
            )}
            <div data-testid="current-content">{JSON.stringify(content)}</div>
          </div>
        );
      };

      render(<CycleTest />);

      // Verify initial state
      expect(screen.getByTestId('current-content')).toHaveTextContent(JSON.stringify(testContent));

      // Cycle 1: Editor → Preview → Editor
      await user.click(screen.getByTestId('to-preview'));
      await user.click(screen.getByTestId('to-editor'));

      // Verify content after first cycle
      expect(screen.getByTestId('current-content')).toHaveTextContent(JSON.stringify(testContent));

      // Cycle 2: Editor → Preview → Editor
      await user.click(screen.getByTestId('to-preview'));
      await user.click(screen.getByTestId('to-editor'));

      // Verify content after second cycle
      expect(screen.getByTestId('current-content')).toHaveTextContent(JSON.stringify(testContent));

      // Final verification - newline count should be preserved
      expect(JSON.parse(screen.getByTestId('current-content').textContent || '""').split('\n').length)
        .toBe(testContent.split('\n').length);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle content with only newlines visually', async () => {
      const onlyNewlines = '\n\n\n\n';
      
      render(<MockEditor initialContent={onlyNewlines} />);

      // Should show correct line count
      expect(screen.getByTestId('line-count')).toHaveTextContent('Lines: 4');

      // All lines should be empty
      expect(screen.getByTestId('line-0')).toHaveTextContent('1: ""');
      expect(screen.getByTestId('line-1')).toHaveTextContent('2: ""');
      expect(screen.getByTestId('line-2')).toHaveTextContent('3: ""');
      expect(screen.getByTestId('line-3')).toHaveTextContent('4: ""');
    });

    it('should handle mixed content with special characters', async () => {
      const specialContent = 'Special: "quotes"\nSymbols: @#$%\n\nEmoji: 😀🎉\nAccented: café résumé';
      
      render(<MockEditor initialContent={specialContent} />);

      // Should handle special characters correctly
      expect(screen.getByTestId('line-0')).toHaveTextContent('1: "Special: "quotes""');
      expect(screen.getByTestId('line-1')).toHaveTextContent('2: "Symbols: @#$%"');
      expect(screen.getByTestId('line-2')).toHaveTextContent('3: ""');
      expect(screen.getByTestId('line-3')).toHaveTextContent('4: "Emoji: 😀🎉"');
      expect(screen.getByTestId('line-4')).toHaveTextContent('5: "Accented: café résumé"');
    });

    it('should handle very long content with many newlines', () => {
      const longContent = Array.from({ length: 50 }, (_, i) => 
        i % 5 === 0 ? `\n\nSection ${Math.floor(i/5) + 1}` : `Line ${i + 1}`
      ).join('\n');

      render(<MockEditor initialContent={longContent} />);

      // Should handle large content without performance issues
      expect(screen.getByTestId('line-count')).toHaveTextContent(`Lines: ${longContent.split('\n').length}`);
      expect(screen.getByTestId('content-display')).toBeInTheDocument();
    });
  });
});
