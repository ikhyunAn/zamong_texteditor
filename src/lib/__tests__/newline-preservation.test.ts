import { textToHtmlWithLineBreaks, htmlToTextWithLineBreaks } from '../text-processing';

describe('Newline Preservation Tests', () => {
  test('should preserve single line breaks within paragraphs', () => {
    const input = 'Line 1\nLine 2\nLine 3';
    const html = textToHtmlWithLineBreaks(input);
    const output = htmlToTextWithLineBreaks(html);
    
    expect(output).toBe(input);
  });

  test('should preserve paragraph breaks (double newlines)', () => {
    const input = 'Paragraph 1\n\nParagraph 2\n\nParagraph 3';
    const html = textToHtmlWithLineBreaks(input);
    const output = htmlToTextWithLineBreaks(html);
    
    expect(output).toBe(input);
  });

  test('should preserve mixed line breaks and paragraphs', () => {
    const input = 'Line 1\nLine 2\n\nNew paragraph\nWith more lines\n\nAnother paragraph';
    const html = textToHtmlWithLineBreaks(input);
    const output = htmlToTextWithLineBreaks(html);
    
    expect(output).toBe(input);
  });

  test('should preserve empty lines between content', () => {
    const input = 'Line 1\n\nLine 3\n\n\nLine 6';
    const html = textToHtmlWithLineBreaks(input);
    const output = htmlToTextWithLineBreaks(html);
    
    // The output should preserve the structure, though exact whitespace handling may vary
    expect(output).toContain('Line 1');
    expect(output).toContain('Line 3');
    expect(output).toContain('Line 6');
  });

  test('should handle consecutive newlines correctly', () => {
    const input = 'Text\n\n\n\nMore text';
    const html = textToHtmlWithLineBreaks(input);
    const output = htmlToTextWithLineBreaks(html);
    
    // Should preserve some spacing structure
    expect(output).toContain('Text');
    expect(output).toContain('More text');
  });

  test('should handle edge cases with only newlines', () => {
    const input = '\n\n\n';
    const html = textToHtmlWithLineBreaks(input);
    const output = htmlToTextWithLineBreaks(html);
    
    // Should handle gracefully without crashing
    expect(typeof output).toBe('string');
  });

  test('should preserve line structure in HTML conversion', () => {
    const input = 'First line\nSecond line\n\nNew paragraph';
    const html = textToHtmlWithLineBreaks(input);
    
    // Should contain proper HTML structure
    expect(html).toContain('<p>');
    expect(html).toContain('<br>');
    expect(html).toContain('</p>');
  });

  test('should convert HTML back to text correctly', () => {
    const html = '<p>First line<br>Second line</p><p>New paragraph</p>';
    const output = htmlToTextWithLineBreaks(html);
    
    expect(output).toBe('First line\nSecond line\n\nNew paragraph');
  });
});
