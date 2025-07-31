import { StorySection, Page } from '@/types';
import { DEFAULT_TEXT_STYLE } from './constants';

/**
 * Automatically split text into sections based on paragraph breaks
 */
export function autoSplitIntoSections(content: string): StorySection[] {
  // Split by double line breaks or paragraph tags
  const paragraphs = content
    .split(/\n\s*\n|\<\/p\>|\<br\s*\/?\>\s*\<br\s*\/?\>/)
    .map(p => p)
    .filter(p => p.length > 0);

  return paragraphs.map((paragraph, index) => ({
    id: `section-${index + 1}`,
    content: cleanHtmlContent(paragraph),
    textStyle: { 
      ...DEFAULT_TEXT_STYLE,
      verticalAlignment: 'middle' as const
    }
  }));
}

/**
 * Clean HTML content while preserving basic formatting
 */
export function cleanHtmlContent(html: string): string {
  // Remove HTML tags but preserve line breaks and formatting structure
  return html
    .replace(/<\/p>\s*<p>/gi, '\n\n') // Convert paragraph breaks to double newlines
    .replace(/<\/p>/gi, '\n') // Convert closing paragraph tags to single newlines
    .replace(/<p>/gi, '') // Remove opening paragraph tags
    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> tags to single newlines
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
    .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n') // Normalize excessive line breaks to double newlines
    .replace(/^\n+|\n+$/g, ''); // Trim leading and trailing newlines only
}

/**
 * Estimate if text will fit in a single Instagram image
 */
export function estimateTextFit(text: string, fontSize: number): boolean {
  const averageCharWidth = fontSize * 0.6; // Rough estimate
  const maxWidth = 900; // Leaving margin for Instagram canvas
  const maxHeight = 900; // Leaving margin for Instagram canvas
  const lineHeight = fontSize * 1.2;
  
  const words = text.split(' ');
  let currentLineWidth = 0;
  let lines = 1;
  
  for (const word of words) {
    const wordWidth = word.length * averageCharWidth;
    
    if (currentLineWidth + wordWidth > maxWidth) {
      lines++;
      currentLineWidth = wordWidth;
    } else {
      currentLineWidth += wordWidth + (averageCharWidth * 0.3); // space width
    }
  }
  
  const totalHeight = lines * lineHeight;
  return totalHeight <= maxHeight;
}

/**
 * Split long text into multiple sections that fit Instagram dimensions
 */
export function splitLongText(text: string, maxCharsPerSection: number = 300): string[] {
  if (text.length <= maxCharsPerSection) {
    return [text];
  }
  
  const sentences = text.split(/(?<=[.!?])\s+/);
  const sections: string[] = [];
  let currentSection = '';
  
  for (const sentence of sentences) {
    if ((currentSection + sentence).length <= maxCharsPerSection) {
      currentSection += (currentSection ? ' ' : '') + sentence;
    } else {
      if (currentSection) {
        sections.push(currentSection);
        currentSection = sentence;
      } else {
        // Single sentence is too long, split by words
        const words = sentence.split(' ');
        let wordSection = '';
        
        for (const word of words) {
          if ((wordSection + word).length <= maxCharsPerSection) {
            wordSection += (wordSection ? ' ' : '') + word;
          } else {
            if (wordSection) {
              sections.push(wordSection);
              wordSection = word;
            } else {
              // Single word is too long, force split
              sections.push(word.substring(0, maxCharsPerSection));
              wordSection = word.substring(maxCharsPerSection);
            }
          }
        }
        
        if (wordSection) {
          currentSection = wordSection;
        }
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return sections;
}

/**
 * Insert a section break at a specific position in the content
 */
export function insertSectionBreak(content: string, position: number): string {
  const before = content.substring(0, position);
  const after = content.substring(position);
  return before + '\n\n---SECTION_BREAK---\n\n' + after;
}

/**
 * Remove a section break marker
 */
export function removeSectionBreak(content: string, breakPosition: number): string {
  return content.replace(/\n\n---SECTION_BREAK---\n\n/, '\n\n');
}

/**
 * Parse content with manual section breaks
 */
export function parseContentWithBreaks(content: string): StorySection[] {
  const sections = content
    .split('---SECTION_BREAK---')
    .map(section => section)
    .filter(section => section.length > 0);
    
  return sections.map((sectionContent, index) => ({
    id: `section-${index + 1}`,
    content: cleanHtmlContent(sectionContent),
    textStyle: { 
      ...DEFAULT_TEXT_STYLE,
      verticalAlignment: 'middle' as const
    }
  }));
}

/**
 * Split content into pages - now puts all content on a single page without line limits
 */
export function splitContentIntoPages(content: string): Page[] {
  if (!content || content.length === 0) {
    return [];
  }

  const cleanContent = cleanHtmlContent(content);
  
  // Create a single page with all content, allowing user to decide page breaks
  const pages: Page[] = [{
    id: `page-1`,
    content: cleanContent,
    backgroundTemplate: undefined
  }];

  return pages;
}

/**
 * Estimate line count for given content
 */
export function estimateLineCount(content: string): number {
  if (!content || content.length === 0) return 0;
  const cleanContent = cleanHtmlContent(content);
  const lines = cleanContent.split('\n');
  return lines.length;
}

/**
 * Get total line count across multiple pages
 */
export function getTotalLineCount(pages: Page[]): number {
  return pages.reduce((total, page) => {
    return total + estimateLineCount(page.content);
  }, 0);
}

/**
 * Get line count for a specific page
 */
export function getPageLineCount(page: Page): number {
  return estimateLineCount(page.content);
}

/**
 * Preserve line breaks when splitting content at a specific position
 */
export function splitContentPreservingLineBreaks(content: string, position: number): { before: string; after: string } {
  // First, normalize the content to handle various line break formats
  const normalizedContent = content
    .replace(/\r\n/g, '\n') // Convert Windows line endings
    .replace(/\r/g, '\n');  // Convert old Mac line endings
  
  const before = normalizedContent.substring(0, position);
  const after = normalizedContent.substring(position);
  
  // Handle edge cases at split boundaries
  let beforeContent = before;
  let afterContent = after;
  
  // If we're splitting in the middle of consecutive newlines, distribute them properly
  if (beforeContent.endsWith('\n') && afterContent.startsWith('\n')) {
    // Count consecutive newlines at the boundary
    let trailingNewlines = 0;
    let leadingNewlines = 0;
    
    // Count trailing newlines in before content
    for (let i = beforeContent.length - 1; i >= 0 && beforeContent[i] === '\n'; i--) {
      trailingNewlines++;
    }
    
    // Count leading newlines in after content
    for (let i = 0; i < afterContent.length && afterContent[i] === '\n'; i++) {
      leadingNewlines++;
    }
    
    // Distribute the newlines: keep paragraph breaks intact
    const totalNewlines = trailingNewlines + leadingNewlines;
    if (totalNewlines > 2) {
      // Keep double newline (paragraph break) with each side
      beforeContent = beforeContent.substring(0, beforeContent.length - trailingNewlines) + '\n\n';
      afterContent = '\n\n' + afterContent.substring(leadingNewlines);
    } else if (totalNewlines === 2) {
      // Keep one newline with each side
      beforeContent = beforeContent.substring(0, beforeContent.length - trailingNewlines) + '\n';
      afterContent = '\n' + afterContent.substring(leadingNewlines);
    }
  }
  
  return {
    before: beforeContent,
    after: afterContent
  };
}

/**
 * Convert plain text with line breaks to HTML format suitable for TipTap editor
 * Enhanced to preserve all line breaks including consecutive ones
 */
export function textToHtmlWithLineBreaks(text: string): string {
  if (!text.trim()) return '<p></p>';
  
  // Split by double newlines to identify paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return paragraphs
    .map(paragraph => {
      if (!paragraph.trim()) return ' 3cp 3e 3cbr 3e 3c/p 3e';
      
      // Within each paragraph, convert single newlines to <br> tags
      // Preserve empty lines by not trimming and not filtering them out
      const withBreaks = paragraph
        .split('\n')
        .map(line => {
          // Don't trim lines to preserve leading/trailing spaces
          // Replace empty lines with a single space to preserve structure
          return line === '' ? ' ' : line;
        })
        .join('<br>');
      
      return `<p>${withBreaks}</p>`;
    })
    .join('');
}

/**
 * Extract plain text from HTML while preserving line break structure
 * Enhanced to better preserve whitespace and line structure
 */
export function htmlToTextWithLineBreaks(html: string): string {
  return html
    .replace(/<\/p>\s*<p>/gi, '\n\n') // Convert paragraph breaks to double newlines
    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> tags to single newlines
    .replace(/<p>/gi, '') // Remove opening paragraph tags
    .replace(/<\/p>/gi, '\n') // Convert closing paragraph tags to newlines
    .replace(/<[^>]*>/g, '') // Remove remaining HTML tags
    .replace(/&nbsp;/g, ' ') // Convert non-breaking spaces
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Be more conservative with newline normalization to preserve structure
    .replace(/\n{4,}/g, '\n\n\n') // Only normalize excessive line breaks (4+) to triple
    .replace(/^\n+/g, '') // Trim leading newlines only
    .replace(/\n+$/g, '') // Trim trailing newlines only
    .trim();
}

/**
 * Validate that page break operation preserves content integrity
 */
export function validatePageBreakIntegrity(originalContent: string, beforeContent: string, afterContent: string): boolean {
  // Remove excessive whitespace for comparison
  const normalizeForComparison = (text: string) => {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n{2,}/g, '\n\n') // Normalize line breaks
      .trim();
  };
  
  const originalNormalized = normalizeForComparison(originalContent);
  const combinedNormalized = normalizeForComparison(beforeContent + ' ' + afterContent);
  
  // Check if the essential content is preserved (allowing for minor whitespace differences)
  return originalNormalized.replace(/\s/g, '') === combinedNormalized.replace(/\s/g, '');
}
