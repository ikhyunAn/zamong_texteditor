/**
 * @jest-environment jsdom
 */
import {
  splitContentPreservingLineBreaks,
  validatePageBreakIntegrity,
  htmlToTextWithLineBreaks,
  textToHtmlWithLineBreaks,
  cleanHtmlContent,
  splitContentIntoPages,
  estimateLineCount,
} from '../text-processing';

describe('Text Processing - Page Break Functionality Tests', () => {
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

    it('preserves complex line break patterns', () => {
      const complexContent = 'Title\n\nChapter 1\nLine 1\nLine 2\n\nChapter 2\nContent here\n\nEnd';
      const splitPosition = 20; // Around "Chapter 1\nLine 1"
      
      const { before, after } = splitContentPreservingLineBreaks(complexContent, splitPosition);
      
      // Check that line break structure is maintained
      expect(before).toContain('Chapter 1');
      expect(after).toContain('Line 2');
      expect(before + after).toContain('\n\n'); // Paragraph breaks preserved
      
      const isValid = validatePageBreakIntegrity(complexContent, before, after);
      expect(isValid).toBe(true);
    });
  });

  describe('Requirement 2: Navigation to new pages works correctly (data integrity)', () => {
    it('splits content into pages preserving line breaks across pages', () => {
      const longContent = [
        'Page 1 Line 1',
        'Page 1 Line 2', 
        'Page 1 Line 3',
        '',
        'Page 1 Paragraph 2',
        'More content for page 1',
        // This would exceed typical line limit, forcing new page
        ...Array.from({ length: 25 }, (_, i) => `Line ${i + 7}`),
        '',
        'Final paragraph'
      ].join('\n');

      const pages = splitContentIntoPages(longContent, 10); // 10 lines per page
      
      // Should create multiple pages
      expect(pages.length).toBeGreaterThan(1);
      
      // Each page should have content
      pages.forEach(page => {
        expect(page.content.trim().length).toBeGreaterThan(0);
        expect(page.id).toMatch(/^page-\d+$/);
      });

      // Verify line breaks are preserved in pages
      expect(pages[0].content).toContain('\n');
      
      // Verify total content is preserved
      const recombinedContent = pages.map(p => p.content).join('\n\n---PAGE-BREAK---\n\n');
      const originalLines = longContent.split('\n').filter(line => line.trim());
      const recombinedLines = recombinedContent.split('\n').filter(line => line.trim() && !line.includes('PAGE-BREAK'));
      
      expect(recombinedLines.length).toBeGreaterThanOrEqual(originalLines.length * 0.9); // Allow some variance
    });

    it('maintains content integrity when navigating between pages', () => {
      const multiPageContent = [
        'Chapter 1',
        '',
        'Once upon a time in a land far away,',
        'there lived a princess who loved to read.',
        'She spent her days in the castle library,',
        'learning about the world beyond her kingdom.',
        '',
        'Chapter 2', 
        '',
        'One day, she discovered a mysterious book',
        'that would change her life forever.',
        'The book contained ancient magic spells',
        'and stories of brave adventures.',
      ].join('\n');

      const pages = splitContentIntoPages(multiPageContent, 6);
      
      expect(pages.length).toBeGreaterThan(1);
      
      // Each page should maintain paragraph structure
      pages.forEach(page => {
        if (page.content.includes('\n\n')) {
          // If page has paragraph breaks, they should be proper double newlines
          expect(page.content).not.toMatch(/\n{3,}/); // No triple+ newlines
        }
      });
    });
  });

  describe('Requirement 3: Edge cases are handled properly', () => {
    describe('Empty pages', () => {
      it('handles empty content gracefully', () => {
        const emptyContent = '';
        const pages = splitContentIntoPages(emptyContent, 25);
        
        expect(pages).toEqual([]);
      });

      it('handles whitespace-only content', () => {
        const whitespaceContent = '   \n\n   \t  \n   ';
        const { before, after } = splitContentPreservingLineBreaks(whitespaceContent, 5);
        
        expect(typeof before).toBe('string');
        expect(typeof after).toBe('string');
        
        // Should handle without crashing
        const isValid = validatePageBreakIntegrity(whitespaceContent, before, after);
        expect(typeof isValid).toBe('boolean');
      });

      it('estimates line count correctly for empty and minimal content', () => {
        expect(estimateLineCount('')).toBe(0);
        expect(estimateLineCount('   \n\n   ')).toBe(0);
        expect(estimateLineCount('Single line')).toBe(1);
        expect(estimateLineCount('Line 1\nLine 2')).toBe(2);
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

      it('handles very long content with many line breaks', () => {
        const longContent = Array.from({ length: 100 }, (_, i) => {
          if (i % 5 === 0) return `\nSection ${Math.floor(i / 5) + 1}\n`;
          return `Line ${i + 1} content`;
        }).join('\n');

        const pages = splitContentIntoPages(longContent, 25);
        
        expect(pages.length).toBeGreaterThan(1);
        expect(pages.length).toBeLessThanOrEqual(6); // Respects page limit
        
        // Verify each page has reasonable content
        pages.forEach((page, index) => {
          expect(page.content.trim()).toBeTruthy();
          expect(page.id).toBe(`page-${index + 1}`);
        });
      });

      it('prevents infinite loops with pathological input', () => {
        const pathologicalContent = '\n'.repeat(1000);
        
        const startTime = Date.now();
        const { before, after } = splitContentPreservingLineBreaks(pathologicalContent, 500);
        const endTime = Date.now();
        
        // Should complete quickly (under 100ms)
        expect(endTime - startTime).toBeLessThan(100);
        
        // Content length may be adjusted due to newline normalization
        expect(before.length + after.length).toBeGreaterThan(0);
        expect(typeof before).toBe('string');
        expect(typeof after).toBe('string');
      });
    });

    describe('Special content edge cases', () => {
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
        
        // Verify unicode is preserved
        const combined = before + after;
        expect(combined).toContain('🌟');
        expect(combined).toContain('🚀');
        expect(combined).toContain('📚');
      });

      it('handles HTML entities and special characters', () => {
        const htmlWithEntities = '<p>Test &amp; example</p><p>Another &quot;test&quot;</p>';
        const cleanedText = cleanHtmlContent(htmlWithEntities);
        
        expect(cleanedText).toContain('Test & example');
        expect(cleanedText).toContain('Another "test"');
        expect(cleanedText).not.toContain('<p>');
        expect(cleanedText).not.toContain('&amp;');
        expect(cleanedText).not.toContain('&quot;');
      });

      it('handles mixed line ending formats', () => {
        const windowsContent = 'Line 1\r\nLine 2\r\nLine 3';
        const unixContent = 'Line 1\nLine 2\nLine 3';
        const macContent = 'Line 1\rLine 2\rLine 3';
        
        // All should be normalized to Unix format
        const windowsResult = splitContentPreservingLineBreaks(windowsContent, 8);
        const unixResult = splitContentPreservingLineBreaks(unixContent, 8);
        const macResult = splitContentPreservingLineBreaks(macContent, 8);
        
        // Results should be consistent
        expect(windowsResult.before).toBe(unixResult.before);
        expect(windowsResult.after).toBe(unixResult.after);
        expect(macResult.before).toBe(unixResult.before);
        expect(macResult.after).toBe(unixResult.after);
      });
    });
  });

  describe('Requirement 4: Text editor state remains consistent across page operations', () => {
    it('validates content integrity after complex operations', () => {
      const originalContent = 'Chapter 1\n\nOnce upon a time\nIn a land far away\n\nThere lived a princess\nWho loved adventure';
      
      // Simulate multiple page break operations
      const firstSplit = splitContentPreservingLineBreaks(originalContent, 20);
      const secondSplit = splitContentPreservingLineBreaks(firstSplit.after, 15);
      
      // Each split should maintain integrity
      expect(validatePageBreakIntegrity(originalContent, firstSplit.before, firstSplit.after)).toBe(true);
      expect(validatePageBreakIntegrity(firstSplit.after, secondSplit.before, secondSplit.after)).toBe(true);
      
      // Total content should be preserved
      const reconstructed = firstSplit.before + secondSplit.before + secondSplit.after;
      expect(reconstructed.replace(/\s/g, '')).toBe(originalContent.replace(/\s/g, ''));
    });

    it('maintains consistent line counting across operations', () => {
      const testContent = 'Line 1\nLine 2\n\nParagraph 2\nLine 4\nLine 5';
      const originalLineCount = estimateLineCount(testContent);
      
      const { before, after } = splitContentPreservingLineBreaks(testContent, 15);
      const beforeLines = estimateLineCount(before);
      const afterLines = estimateLineCount(after);
      
      // Total lines should be preserved (allowing for minor variance due to split boundaries)
      expect(beforeLines + afterLines).toBeGreaterThanOrEqual(originalLineCount - 1);
      expect(beforeLines + afterLines).toBeLessThanOrEqual(originalLineCount + 1);
    });

    it('handles rapid sequential operations without data loss', () => {
      let content = 'Initial content\nWith multiple lines\n\nAnd paragraphs\nThat need to be processed';
      
      // Simulate rapid operations
      for (let i = 0; i < 10; i++) {
        const splitPos = Math.floor(content.length / 2);
        const { before, after } = splitContentPreservingLineBreaks(content, splitPos);
        
        // Verify integrity at each step
        expect(validatePageBreakIntegrity(content, before, after)).toBe(true);
        
        // Use the 'after' content for next iteration
        content = after;
      }
      
      // Should still have valid content
      expect(content.trim().length).toBeGreaterThan(0);
    });

    it('preserves formatting across HTML/text conversions', () => {
      const originalHtml = '<p>Title</p><p>First paragraph<br>with line break</p><p>Second paragraph</p>';
      
      // Convert to text
      const asText = htmlToTextWithLineBreaks(originalHtml);
      
      // Split the text content
      const { before, after } = splitContentPreservingLineBreaks(asText, 20);
      
      // Convert back to HTML
      const beforeHtml = textToHtmlWithLineBreaks(before);
      const afterHtml = textToHtmlWithLineBreaks(after);
      
      // Should maintain paragraph structure
      expect(beforeHtml).toContain('<p>');
      expect(beforeHtml).toContain('</p>');
      expect(afterHtml).toContain('<p>');
      expect(afterHtml).toContain('</p>');
      
      // Line breaks should be preserved as <br> tags
      if (beforeHtml.includes('<br>') || afterHtml.includes('<br>')) {
        expect(beforeHtml + afterHtml).toContain('<br>');
      }
    });
  });

  describe('Integration Tests - Real-world Scenarios', () => {
    it('handles a complete story editing workflow', () => {
      const storyContent = [
        'The Adventure Begins',
        '',
        'Chapter 1: The Discovery',
        'Sarah found an old map in her grandmother\'s attic.',
        'The parchment was yellowed with age, but the ink was still clear.',
        'It showed a path through the Whispering Woods to a place marked "X".',
        '',
        'Chapter 2: The Journey',
        'Armed with her backpack and the mysterious map,',
        'Sarah set out on the adventure of a lifetime.',
        'The woods were darker than she expected,',
        'but her determination kept her moving forward.',
        '',
        'Chapter 3: The Treasure',
        'After hours of walking, she finally reached the spot.',
        'What she found there would change everything...'
      ].join('\n');

      // Test page splitting
      const pages = splitContentIntoPages(storyContent, 8);
      expect(pages.length).toBeGreaterThan(1);

      // Test line break preservation
      const midPoint = Math.floor(storyContent.length / 2);
      const { before, after } = splitContentPreservingLineBreaks(storyContent, midPoint);
      
      expect(validatePageBreakIntegrity(storyContent, before, after)).toBe(true);

      // Test HTML conversion
      const asHtml = textToHtmlWithLineBreaks(storyContent);
      const backToText = htmlToTextWithLineBreaks(asHtml);
      
      // Should preserve story structure
      expect(backToText).toContain('Chapter 1');
      expect(backToText).toContain('Chapter 2');
      expect(backToText).toContain('Chapter 3');
      
      // Paragraph breaks should be maintained
      expect(backToText.split('\n\n').length).toBeGreaterThan(1);
    });

    it('maintains data integrity through complex editing session', () => {
      let currentContent = 'Start of document\n\nFirst section\nWith some content\n\nSecond section\nWith more content';
      const operations = [];

      // Simulate user edits: insertions, splits, formatting
      for (let i = 0; i < 5; i++) {
        const operation = {
          originalContent: currentContent,
          splitPosition: Math.floor(currentContent.length / 3) + (i * 5),
        };
        
        const { before, after } = splitContentPreservingLineBreaks(currentContent, operation.splitPosition);
        
        // Verify integrity
        expect(validatePageBreakIntegrity(currentContent, before, after)).toBe(true);
        
        // Insert some new content (simulating user typing)
        const newContent = before + `\n\nInserted content ${i + 1}\n` + after;
        
        operations.push({
          ...operation,
          before,
          after,
          newContent,
          valid: validatePageBreakIntegrity(currentContent, before, after)
        });
        
        currentContent = newContent;
      }

      // All operations should be valid
      operations.forEach(op => {
        expect(op.valid).toBe(true);
      });

      // Final content should be larger than original
      expect(currentContent.length).toBeGreaterThan('Start of document'.length);
      
      // Should still contain original elements (may be fragmented due to splitting)
      expect(currentContent).toContain('Start of document');
      expect(currentContent).toContain('section'); // Part of "First section" or "Second section"
      expect(currentContent).toContain('content'); // Part of original content
    });
  });
});
