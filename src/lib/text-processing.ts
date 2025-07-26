import { StorySection, Page } from '@/types';
import { DEFAULT_TEXT_STYLE } from './constants';

/**
 * Automatically split text into sections based on paragraph breaks
 */
export function autoSplitIntoSections(content: string): StorySection[] {
  // Split by double line breaks or paragraph tags
  const paragraphs = content
    .split(/\n\s*\n|\<\/p\>|\<br\s*\/?\>\s*\<br\s*\/?\>/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  return paragraphs.map((paragraph, index) => ({
    id: `section-${index + 1}`,
    content: cleanHtmlContent(paragraph),
    textStyle: { ...DEFAULT_TEXT_STYLE }
  }));
}

/**
 * Clean HTML content while preserving basic formatting
 */
export function cleanHtmlContent(html: string): string {
  // Remove HTML tags but preserve line breaks
  return html
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
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
        sections.push(currentSection.trim());
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
              sections.push(wordSection.trim());
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
    sections.push(currentSection.trim());
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
    .map(section => section.trim())
    .filter(section => section.length > 0);
    
  return sections.map((sectionContent, index) => ({
    id: `section-${index + 1}`,
    content: cleanHtmlContent(sectionContent),
    textStyle: { ...DEFAULT_TEXT_STYLE }
  }));
}

/**
 * Split content into pages based on line limit
 */
export function splitContentIntoPages(content: string, maxLinesPerPage: number = 25): Page[] {
  if (!content.trim()) {
    return [];
  }

  const cleanContent = cleanHtmlContent(content);
  const lines = cleanContent.split('\n');
  const pages: Page[] = [];

  let currentPageLines: string[] = [];
  let pageIndex = 0;

  for (const line of lines) {
    // Check if adding this line would exceed the line limit
    if (currentPageLines.length >= maxLinesPerPage) {
      // Save the current page
      pages.push({
        id: `page-${pageIndex + 1}`,
        content: currentPageLines.join('\n').trim(),
        backgroundTemplate: undefined
      });

      // Prepare for the next page
      currentPageLines = [];
      pageIndex++;
    }
    currentPageLines.push(line);
  }

  // Add any remaining lines as the last page
  if (currentPageLines.length > 0) {
    pages.push({
      id: `page-${pageIndex + 1}`,
      content: currentPageLines.join('\n').trim(),
      backgroundTemplate: undefined
    });
  }

  return pages;
}

/**
 * Estimate line count for given content
 */
export function estimateLineCount(content: string): number {
  if (!content.trim()) return 0;
  const cleanContent = cleanHtmlContent(content);
  const lines = cleanContent.split('\n').filter(line => line.trim().length > 0);
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
