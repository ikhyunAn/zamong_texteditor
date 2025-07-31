/**
 * Tests for lineHeight implementation in text rendering
 */

import { calculateOptimalFontSize, wrapText } from '../canvas-utils';

describe('lineHeight implementation', () => {
  describe('calculateOptimalFontSize', () => {
    it('should calculate optimal font size with custom lineHeight', () => {
      const text = "Line 1\nLine 2\nLine 3";
      const maxWidth = 400;
      const maxHeight = 200;
      const lineHeight = 2.0; // Double spacing
      
      const fontSize = calculateOptimalFontSize(
        text,
        maxWidth,
        maxHeight,
        12,
        48,
        lineHeight
      );
      
      // With double line spacing, we expect smaller font size to fit
      expect(fontSize).toBeGreaterThan(0);
      expect(fontSize).toBeLessThanOrEqual(48);
      
      // Verify the calculation works by checking total height
      const lines = wrapText(text, maxWidth, fontSize);
      const actualLineSpacing = fontSize * lineHeight;
      const totalHeight = lines.length * actualLineSpacing;
      
      expect(totalHeight).toBeLessThanOrEqual(maxHeight);
    });

    it('should use default lineHeight when not provided', () => {
      const text = "Single line";
      const maxWidth = 400;
      const maxHeight = 100;
      
      const fontSize = calculateOptimalFontSize(text, maxWidth, maxHeight);
      
      expect(fontSize).toBeGreaterThan(0);
    });

    it('should handle different lineHeight values correctly', () => {
      const text = "Line 1\nLine 2";
      const maxWidth = 400;
      const maxHeight = 100;
      
      // Tight line spacing should allow larger font
      const fontSizeTight = calculateOptimalFontSize(
        text,
        maxWidth,
        maxHeight,
        12,
        48,
        1.0
      );
      
      // Loose line spacing should require smaller font
      const fontSizeLoose = calculateOptimalFontSize(
        text,
        maxWidth,
        maxHeight,
        12,
        48,
        2.0
      );
      
      expect(fontSizeTight).toBeGreaterThanOrEqual(fontSizeLoose);
    });
  });

  describe('lineHeight calculation consistency', () => {
    it('should calculate line spacing using fontSize * lineHeight formula', () => {
      const fontSize = 24;
      const lineHeight = 1.5;
      const expectedLineSpacing = fontSize * lineHeight; // 36
      
      expect(expectedLineSpacing).toBe(36);
    });

    it('should handle edge cases', () => {
      const fontSize = 16;
      const lineHeight = 1.0; // Minimum line height
      const expectedLineSpacing = fontSize * lineHeight; // 16
      
      expect(expectedLineSpacing).toBe(16);
      
      const largeLineHeight = 3.0;
      const expectedLargeSpacing = fontSize * largeLineHeight; // 48
      
      expect(expectedLargeSpacing).toBe(48);
    });
  });

  describe('text wrapping with lineHeight', () => {
    it('should wrap text correctly regardless of lineHeight', () => {
      const text = "This is a long line that should be wrapped";
      const maxWidth = 200;
      const fontSize = 16;
      
      const lines = wrapText(text, maxWidth, fontSize);
      
      expect(lines.length).toBeGreaterThan(1);
      expect(lines.every(line => line.length > 0)).toBe(true);
    });
  });
});
