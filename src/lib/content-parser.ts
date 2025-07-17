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
  
  // Split by double line breaks or more
  const sections = textContent
    .split(/\n\n+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  // If no sections found, try to split by sentences
  if (sections.length === 0 && textContent.trim()) {
    // Split by sentences (period followed by space or end of string)
    const sentences = textContent.match(/[^.!?]+[.!?]+/g) || [textContent];
    const sectionSize = Math.ceil(sentences.length / 6); // Target ~6 sections
    const result: string[] = [];
    
    for (let i = 0; i < sentences.length; i += sectionSize) {
      const section = sentences.slice(i, i + sectionSize).join(' ').trim();
      if (section) {
        result.push(section);
      }
    }
    
    return result;
  }
  
  // Limit to 6 sections by combining smaller sections if needed
  if (sections.length > 6) {
    const targetSections = 6;
    const sectionSize = Math.ceil(sections.length / targetSections);
    const result: string[] = [];
    
    for (let i = 0; i < sections.length; i += sectionSize) {
      const combined = sections.slice(i, i + sectionSize).join('\n\n');
      result.push(combined);
    }
    
    return result.slice(0, 6);
  }
  
  return sections;
}

export function estimateLineCount(text: string, charsPerLine: number = 60): number {
  // Count actual line breaks
  const lineBreaks = (text.match(/\n/g) || []).length;
  
  // Estimate lines based on character count
  const charLines = Math.ceil(text.length / charsPerLine);
  
  // Return the maximum of the two
  return Math.max(lineBreaks + 1, charLines);
}
