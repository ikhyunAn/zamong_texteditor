export function parseHtmlToSections(htmlContent: string): string[] {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    // Server-side: simple regex-based parsing
    const textContent = htmlContent
      .replace(/<p[^>]*>/gi, '')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    
    return processTextContent(textContent);
  }
  
  // Client-side: use DOM parsing
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  
  // Convert <p> tags to line breaks
  const paragraphs = tempDiv.querySelectorAll('p');
  paragraphs.forEach((p) => {
    p.innerHTML = p.innerHTML + '\n\n';
  });
  
  // Convert <br> tags to line breaks
  const brs = tempDiv.querySelectorAll('br');
  brs.forEach((br) => {
    br.replaceWith('\n');
  });
  
  // Get text content
  const textContent = tempDiv.textContent || tempDiv.innerText || '';
  
  return processTextContent(textContent);
}

function processTextContent(textContent: string): string[] {
  // Clean the content and prepare for processing
  const cleanedContent = textContent.trim();
  
  if (!cleanedContent) {
    return [];
  }
  
  // Split by double line breaks or more
  const sections = cleanedContent
    .split(/\n\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // If no sections found, try to split by sentences
  if (sections.length === 0) {
    // Split by sentences (period followed by space or end of string)
    const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [textContent];
    const result: string[] = [];
    
    // Group sentences into reasonable sections (no hard limit of 6)
    let currentSection = '';
    const maxSectionLength = 500; // characters
    
    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if ((currentSection + ' ' + trimmedSentence).length <= maxSectionLength) {
        currentSection += (currentSection ? ' ' : '') + trimmedSentence;
      } else {
        if (currentSection) {
          result.push(currentSection.trim());
        }
        currentSection = trimmedSentence;
      }
    }
    
    if (currentSection) {
      result.push(currentSection.trim());
    }
    
    return result;
  }
  
  // No arbitrary limit on sections - let content determine natural sections
  return sections;
}

export function estimateLineCount(text: string, charsPerLine: number = 60): number {
  if (!text.trim()) return 0;
  
  // Count actual line breaks
  const lines = text.split('\n');
  const actualLines = lines.filter(line => line.trim().length > 0).length;
  
  // Estimate lines based on character count for long lines
  let estimatedLines = 0;
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    const linesForThisContent = Math.max(1, Math.ceil(line.length / charsPerLine));
    estimatedLines += linesForThisContent;
  }
  
  // Return the maximum of actual lines and estimated lines based on wrapping
  return Math.max(actualLines, estimatedLines);
}

/**
 * Estimate if content will fit within a page limit
 */
export function contentFitsInPages(sections: string[], maxLinesPerPage: number = 25): boolean {
  const totalLines = sections.reduce((total, section) => {
    return total + estimateLineCount(section);
  }, 0);
  
  const pagesNeeded = Math.ceil(totalLines / maxLinesPerPage);
  return pagesNeeded <= 10; // Reasonable limit for social media posts
}
