/**
 * Content Measurement Utilities for Automatic Pagination
 * 
 * This module provides utilities to measure content height and determine
 * when content should overflow to the next page based on visual height.
 */

import { Editor } from '@tiptap/react';

// Page dimensions matching the editor
export const PAGE_DIMENSIONS = {
  width: 900,
  height: 1600,
  padding: 60,
} as const;

/**
 * Calculate available content height for a specific page
 * @param pageIndex - Zero-based page index
 * @param hasTitle - Whether the page has a title (only page 0)
 * @param titleHeight - Estimated title height in pixels
 * @returns Available height in pixels for content
 */
export function calculateAvailableHeight(
  pageIndex: number,
  hasTitle: boolean = false,
  titleHeight: number = 90
): number {
  const { height, padding } = PAGE_DIMENSIONS;
  
  if (pageIndex === 0 && hasTitle) {
    // First page with title
    const topPadding = 80; // pt-[80px] for title
    const bottomPadding = padding;
    const titleSpacing = 20; // pb-5 class (20px)
    
    // Available height = Total - top padding - title height - spacing - bottom padding
    const availableHeight = height - topPadding - titleHeight - titleSpacing - bottomPadding - 40;
    return Math.max(availableHeight, 100); // Ensure minimum 100px
  } else {
    // Regular page without title
    const availableHeight = height - (padding * 2); // Top and bottom padding
    return availableHeight;
  }
}

/**
 * Measure the actual rendered height of editor content
 * @param editor - Tiptap editor instance
 * @returns Height in pixels
 */
export function measureContentHeight(editor: Editor | null): number {
  if (!editor) return 0;
  
  try {
    const editorElement = editor.view.dom as HTMLElement;
    
    // Get the actual scrollHeight which includes all content
    // This is more reliable than clientHeight or getBoundingClientRect
    const contentHeight = editorElement.scrollHeight;
    
    return contentHeight;
  } catch (error) {
    console.error('[ContentMeasurement] Error measuring content height:', error);
    return 0;
  }
}

/**
 * Calculate the height of rendered text based on font settings
 * @param text - Text content to measure
 * @param fontSize - Font size in pixels
 * @param lineHeight - Line height multiplier
 * @param width - Available width for text
 * @param fontFamily - Font family name
 * @returns Estimated height in pixels
 */
export function estimateTextHeight(
  text: string,
  fontSize: number,
  lineHeight: number,
  width: number,
  fontFamily: string = 'KoPubWorldBatangLight'
): number {
  if (typeof document === 'undefined') return 0;
  
  // Create temporary measurement element
  const measureEl = document.createElement('div');
  measureEl.style.position = 'absolute';
  measureEl.style.left = '-9999px';
  measureEl.style.top = '-9999px';
  measureEl.style.visibility = 'hidden';
  measureEl.style.width = `${width}px`;
  measureEl.style.fontSize = `${fontSize}px`;
  measureEl.style.lineHeight = `${lineHeight}`;
  measureEl.style.fontFamily = fontFamily;
  measureEl.style.whiteSpace = 'pre-wrap';
  measureEl.style.wordBreak = 'break-word';
  measureEl.textContent = text;
  
  document.body.appendChild(measureEl);
  const height = measureEl.scrollHeight;
  document.body.removeChild(measureEl);
  
  return height;
}

/**
 * Find optimal break point in text to split content
 * Prefers breaking at paragraph boundaries, then sentences, then words
 * @param text - Text to split
 * @param maxLength - Maximum length before split
 * @returns Index to split at
 */
export function findOptimalBreakPoint(text: string, maxLength: number): number {
  if (text.length <= maxLength) return text.length;
  
  // Try to break at paragraph boundary (double newline)
  const paragraphBreak = text.lastIndexOf('\n\n', maxLength);
  if (paragraphBreak > maxLength * 0.5) { // At least 50% through
    return paragraphBreak + 2; // Include the newlines
  }
  
  // Try to break at single newline
  const lineBreak = text.lastIndexOf('\n', maxLength);
  if (lineBreak > maxLength * 0.5) {
    return lineBreak + 1;
  }
  
  // Try to break at sentence boundary
  const sentenceBreak = Math.max(
    text.lastIndexOf('. ', maxLength),
    text.lastIndexOf('! ', maxLength),
    text.lastIndexOf('? ', maxLength),
    text.lastIndexOf('。', maxLength),
    text.lastIndexOf('！', maxLength),
    text.lastIndexOf('？', maxLength)
  );
  if (sentenceBreak > maxLength * 0.5) {
    return sentenceBreak + 1;
  }
  
  // Try to break at word boundary
  const wordBreak = text.lastIndexOf(' ', maxLength);
  if (wordBreak > maxLength * 0.5) {
    return wordBreak + 1;
  }
  
  // Last resort: break at maxLength
  return maxLength;
}

/**
 * Check if content exceeds available height
 * @param contentHeight - Measured content height
 * @param availableHeight - Available height for content
 * @param threshold - Buffer threshold (default 20px)
 * @returns True if content overflows
 */
export function isContentOverflowing(
  contentHeight: number,
  availableHeight: number,
  threshold: number = 20
): boolean {
  return contentHeight > (availableHeight + threshold);
}

/**
 * Calculate character count that fits in available height
 * This is a rough estimation based on average character dimensions
 * @param availableHeight - Available height in pixels
 * @param fontSize - Font size in pixels
 * @param lineHeight - Line height multiplier
 * @param width - Available width
 * @returns Approximate character count that fits
 */
export function estimateCharacterCapacity(
  availableHeight: number,
  fontSize: number,
  lineHeight: number,
  width: number
): number {
  // Calculate characters per line (rough estimate)
  const avgCharWidth = fontSize * 0.6; // Approximate for most fonts
  const charsPerLine = Math.floor(width / avgCharWidth);
  
  // Calculate lines that fit
  const lineHeightPx = fontSize * lineHeight;
  const linesThatFit = Math.floor(availableHeight / lineHeightPx);
  
  // Total character capacity
  return charsPerLine * linesThatFit;
}
