'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { AVAILABLE_FONTS, DEFAULT_TEXT_STYLE } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { debounce } from '@/lib/debounce';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  Type, 
  BookOpen,
  FileText,
  Plus
} from 'lucide-react';

interface Page {
  id: string;
  content: string;
  lineCount: number;
}

interface PagedDocumentEditorProps {
  className?: string;
}

const PAGE_WIDTH = 900;
const PAGE_HEIGHT = 1600;
const PAGE_PADDING = 60;
const LINE_HEIGHT = 32; // pixels per line
const FONT_SIZE = 18;
const MAX_LINES_PER_PAGE = 40; // Calculated to fit within 1600px height with padding
const CHARACTERS_PER_LINE = 50; // Average characters per line at 900px width

const PagedDocumentEditor: React.FC<PagedDocumentEditorProps> = ({ className }) => {
  const { content, setContent, editorSettings, sections, setSections, setCurrentStep } = useStoryStore();
  const [pages, setPages] = useState<Page[]>([{ id: 'page-1', content: '', lineCount: 0 }]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedFont, setSelectedFont] = useState(AVAILABLE_FONTS[0].family);
  const [showLineWarning, setShowLineWarning] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  
  // Calculate lines for given text
  const calculateLines = useCallback((text: string, width: number = PAGE_WIDTH - (PAGE_PADDING * 2)) => {
    if (!text) return 0;
    
    // Create a temporary canvas to measure text
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return 0;
    
    context.font = `${FONT_SIZE}px ${selectedFont}`;
    
    const words = text.split(/\s+/);
    let lines = 1;
    let currentLine = '';
    
    // Account for newlines
    const paragraphs = text.split('\n');
    lines = paragraphs.length - 1; // Start with newline count
    
    paragraphs.forEach(paragraph => {
      if (!paragraph) return; // Empty line counts as 1
      
      const words = paragraph.split(' ');
      let currentLineText = '';
      
      words.forEach(word => {
        const testLine = currentLineText ? `${currentLineText} ${word}` : word;
        const metrics = context.measureText(testLine);
        
        if (metrics.width > width && currentLineText) {
          lines++;
          currentLineText = word;
        } else {
          currentLineText = testLine;
        }
      });
      
      if (currentLineText) lines++;
    });
    
    return lines;
  }, [selectedFont]);
  
  // Debounced content processing
  const processContent = useMemo(
    () => debounce((text: string) => {
      if (!text) {
        setPages([{ id: 'page-1', content: '', lineCount: 0 }]);
        return;
      }
      
      const lines = text.split('\n');
      const newPages: Page[] = [];
      let currentPage: Page = { id: `page-${Date.now()}-1`, content: '', lineCount: 0 };
      
      lines.forEach((line, index) => {
        const lineCount = line ? Math.ceil(line.length / CHARACTERS_PER_LINE) : 1;
        
        if (currentPage.lineCount + lineCount > MAX_LINES_PER_PAGE) {
          // Save current page and start new one
          newPages.push(currentPage);
          currentPage = {
            id: `page-${Date.now()}-${newPages.length + 1}`,
            content: line,
            lineCount: lineCount
          };
        } else {
          // Add to current page
          currentPage.content += (currentPage.content ? '\n' : '') + line;
          currentPage.lineCount += lineCount;
        }
      });
      
      // Don't forget the last page
      if (currentPage.content || newPages.length === 0) {
        newPages.push(currentPage);
      }
      
      setPages(newPages);
      
      // Update sections for export
      const newSections = newPages.map((page, index) => ({
        id: page.id,
        content: page.content,
        textStyle: sections[0]?.textStyle || DEFAULT_TEXT_STYLE,
        backgroundImage: undefined
      }));
      
      setSections(newSections);
    }, 300),
    [selectedFont, setSections, sections]
  );
  
  // Handle content changes
  const handlePageContentChange = (pageIndex: number, newContent: string) => {
    const updatedPages = [...pages];
    const page = updatedPages[pageIndex];
    
    if (!page) return;
    
    const lines = calculateLines(newContent);
    
    if (lines > MAX_LINES_PER_PAGE) {
      setShowLineWarning(true);
      // Prevent further input if exceeding limit
      return;
    }
    
    setShowLineWarning(false);
    page.content = newContent;
    page.lineCount = lines;
    
    // Check if we need to create a new page
    if (lines >= MAX_LINES_PER_PAGE - 5 && pageIndex === pages.length - 1) {
      // User is near the limit on the last page, prepare a new page
      updatedPages.push({
        id: `page-${Date.now()}`,
        content: '',
        lineCount: 0
      });
    }
    
    setPages(updatedPages);
    
    // Update global content
    const fullContent = updatedPages.map(p => p.content).join('\n[PAGE_BREAK]\n');
    setContent(fullContent);
    processContent(fullContent);
  };
  
  // Handle page focus to track current page
  const handlePageFocus = (index: number) => {
    setCurrentPageIndex(index);
  };
  
  // Handle Enter key to potentially create new page
  const handleKeyDown = (e: React.KeyboardEvent, pageIndex: number) => {
    const page = pages[pageIndex];
    if (!page) return;
    
    // Check if we're at the line limit
    if (page.lineCount >= MAX_LINES_PER_PAGE && e.key === 'Enter') {
      e.preventDefault();
      
      // Create new page if this is the last page
      if (pageIndex === pages.length - 1) {
        const newPage: Page = {
          id: `page-${Date.now()}`,
          content: '',
          lineCount: 0
        };
        setPages([...pages, newPage]);
        
        // Focus the new page
        setTimeout(() => {
          const newPageEl = pageRefs.current.get(newPage.id);
          if (newPageEl) {
            const textArea = newPageEl.querySelector('textarea');
            textArea?.focus();
          }
        }, 100);
      }
    }
  };
  
  // Scroll to page
  const scrollToPage = (pageIndex: number) => {
    const pageId = pages[pageIndex]?.id;
    if (!pageId) return;
    
    const pageEl = pageRefs.current.get(pageId);
    if (pageEl && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const pageRect = pageEl.getBoundingClientRect();
      const scrollTop = pageRect.top - containerRect.top + containerRef.current.scrollTop;
      
      containerRef.current.scrollTo({
        top: scrollTop - 20, // 20px padding
        behavior: 'smooth'
      });
    }
  };
  
  // Initialize with content if exists
  useEffect(() => {
    if (content) {
      processContent(content);
    }
  }, []);
  
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Story Editor
        </CardTitle>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          {/* Font Selection */}
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            <select 
              value={selectedFont} 
              onChange={(e) => setSelectedFont(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font.name} value={font.family}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* Page Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Page {currentPageIndex + 1} of {pages.length}
            </span>
            <span>
              Lines: {pages[currentPageIndex]?.lineCount || 0}/{MAX_LINES_PER_PAGE}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Line Limit Warning */}
        {showLineWarning && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">Page line limit reached</p>
              <p>Press Enter to continue on the next page.</p>
            </div>
          </div>
        )}
        
        {/* Pages Container */}
        <div 
          ref={containerRef}
          className="overflow-y-auto overflow-x-hidden"
          style={{ maxHeight: '80vh' }}
        >
          <div className="space-y-8 pb-8">
            {pages.map((page, index) => (
              <div
                key={page.id}
                ref={(el) => {
                  if (el) pageRefs.current.set(page.id, el);
                }}
                className="mx-auto"
                style={{ width: `${PAGE_WIDTH}px` }}
              >
                {/* Page Number */}
                <div className="text-center text-sm text-gray-500 mb-2">
                  Page {index + 1}
                </div>
                
                {/* Page Container */}
                <div 
                  className="relative bg-white border-2 border-gray-300 shadow-lg rounded-lg overflow-hidden"
                  style={{
                    width: `${PAGE_WIDTH}px`,
                    height: `${PAGE_HEIGHT}px`,
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, #f0f0f0 31px, #f0f0f0 32px)',
                    backgroundSize: '100% 32px',
                    backgroundPosition: `0 ${PAGE_PADDING}px`
                  }}
                >
                  <textarea
                    value={page.content}
                    onChange={(e) => handlePageContentChange(index, e.target.value)}
                    onFocus={() => handlePageFocus(index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className="w-full h-full resize-none outline-none bg-transparent"
                    style={{
                      padding: `${PAGE_PADDING}px`,
                      fontFamily: selectedFont,
                      fontSize: `${FONT_SIZE}px`,
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: '#333'
                    }}
                    placeholder={index === 0 ? "Start writing your story here..." : "Continue writing..."}
                  />
                  
                  {/* Line count indicator */}
                  <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    {page.lineCount}/{MAX_LINES_PER_PAGE} lines
                  </div>
                  
                  {/* Visual indicator when approaching limit */}
                  {page.lineCount > MAX_LINES_PER_PAGE - 5 && (
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-yellow-200 to-transparent opacity-50" />
                  )}
                </div>
              </div>
            ))}
            
            {/* Add Page Button */}
            {pages[pages.length - 1]?.content && (
              <div className="mx-auto" style={{ width: `${PAGE_WIDTH}px` }}>
                <Button
                  variant="outline"
                  className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400"
                  onClick={() => {
                    const newPage: Page = {
                      id: `page-${Date.now()}`,
                      content: '',
                      lineCount: 0
                    };
                    setPages([...pages, newPage]);
                    setTimeout(() => scrollToPage(pages.length), 100);
                  }}
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Add New Page
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Quick Navigation */}
        {pages.length > 1 && (
          <div className="mt-4 flex justify-center gap-2">
            {pages.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToPage(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentPageIndex 
                    ? 'bg-blue-500 w-8' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                title={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Navigation wrapper
export const PagedDocumentEditorWithNavigation: React.FC<PagedDocumentEditorProps> = ({ className }) => {
  const { setCurrentStep, sections } = useStoryStore();
  
  const handleBack = () => {
    setCurrentStep(0);
  };
  
  const handleNext = () => {
    if (!sections.length || !sections[0].content) {
      alert('Please write some content before proceeding.');
      return;
    }
    setCurrentStep(2);
  };
  
  return (
    <div className="space-y-6">
      <PagedDocumentEditor className={className} />
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Author Info
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
        >
          Preview & Export
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default PagedDocumentEditor;
