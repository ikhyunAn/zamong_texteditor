'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { usePageManager } from '@/hooks/usePageManager';
import { AVAILABLE_FONTS } from '@/lib/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import EnhancedTextarea, { EnhancedTextareaRef } from '@/components/ui/enhanced-textarea';
import { 
  ArrowLeft, 
  ArrowRight, 
  AlertCircle, 
  Type, 
  BookOpen,
  FileText,
  Plus,
  Image,
  ImageOff,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';

interface PagedDocumentEditorProps {
  className?: string;
}

const PAGE_WIDTH = 900;
const PAGE_HEIGHT = 1600;
const PAGE_PADDING = 60;
const LINE_HEIGHT = 32; // pixels per line
const FONT_SIZE = 18;

// Font metrics cache to avoid recreating canvas contexts
class FontMetricsCache {
  private cache = new Map<string, CanvasRenderingContext2D>();
  private measurementCache = new Map<string, number>();
  
  getContext(fontFamily: string): CanvasRenderingContext2D {
    const fontKey = `${FONT_SIZE}px ${fontFamily}`;
    
    if (!this.cache.has(fontKey)) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Could not create canvas context');
      
      context.font = fontKey;
      this.cache.set(fontKey, context);
    }
    
    return this.cache.get(fontKey)!;
  }
  
  measureText(text: string, fontFamily: string): number {
    const cacheKey = `${text}:${fontFamily}`;
    
    if (this.measurementCache.has(cacheKey)) {
      return this.measurementCache.get(cacheKey)!;
    }
    
    const context = this.getContext(fontFamily);
    const width = context.measureText(text).width;
    
    // Limit cache size to prevent memory issues
    if (this.measurementCache.size > 1000) {
      // Clear oldest entries (simple LRU-like behavior)
      const entries = Array.from(this.measurementCache.entries());
      entries.slice(0, 500).forEach(([key]) => this.measurementCache.delete(key));
    }
    
    this.measurementCache.set(cacheKey, width);
    return width;
  }
  
  clear() {
    this.cache.clear();
    this.measurementCache.clear();
  }
}

// Global font metrics cache instance
const fontMetricsCache = new FontMetricsCache();

// Line calculation cache with memoization
class LineCalculationCache {
  private cache = new Map<string, number>();
  
  get(text: string, fontFamily: string, width: number): number | undefined {
    const key = `${text}:${fontFamily}:${width}`;
    return this.cache.get(key);
  }
  
  set(text: string, fontFamily: string, width: number, lines: number): void {
    const key = `${text}:${fontFamily}:${width}`;
    
    // Limit cache size to prevent memory issues
    if (this.cache.size > 500) {
      // Clear oldest entries (simple LRU-like behavior)
      const entries = Array.from(this.cache.entries());
      entries.slice(0, 250).forEach(([cacheKey]) => this.cache.delete(cacheKey));
    }
    
    this.cache.set(key, lines);
  }
  
  clear() {
    this.cache.clear();
  }
}

// Global line calculation cache instance
const lineCalculationCache = new LineCalculationCache();

const PagedDocumentEditor: React.FC<PagedDocumentEditorProps> = ({ className }) => {
  const { 
    editorSettings, 
    pages,
    currentPageIndex,
    getCurrentPageContent,
    initializeWithEmptyPage,
    setTextAlignment
  } = useStoryStore();
  
  const {
    getPageInfo,
    checkPageLimits,
    navigateToPage,
    addNewPage,
    updateCurrentPageContent
  } = usePageManager();
  
  const [selectedFont, setSelectedFont] = useState(AVAILABLE_FONTS[0].family);
const [showLineWarning, setShowLineWarning] = useState(false);
  const [backgroundPreview, setBackgroundPreview] = useState(true);
  
  // Initialize with an empty page if no pages exist
  useEffect(() => {
    initializeWithEmptyPage();
  }, [initializeWithEmptyPage]);
  
  // Clear caches when font changes
  useEffect(() => {
    fontMetricsCache.clear();
    lineCalculationCache.clear();
  }, [selectedFont]);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const textareaRefs = useRef<Map<string, EnhancedTextareaRef>>(new Map());
  
  // Get current page info from page manager
  const pageInfo = getPageInfo();
  const currentPageContent = getCurrentPageContent() || '';
  const limitCheck = checkPageLimits();
  
  // Show warning when exceeding page limits
  useEffect(() => {
    setShowLineWarning(limitCheck.exceedsLimit);
  }, [limitCheck.exceedsLimit]);
  
  // Handle content changes using the unified page management system
  const handlePageContentChange = useCallback((newContent: string) => {
    updateCurrentPageContent(newContent);
  }, [updateCurrentPageContent]);
  
  // Handle page focus to track current page with content synchronization
  const handlePageFocus = (index: number) => {
    // Only navigate if we're actually switching to a different page
    if (index !== currentPageIndex) {
      navigateToPage(index);
    }
  };
  
  // Scroll to current page when editor focuses
  const scrollToEditor = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
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
          
          {/* Text Alignment Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Align:</span>
            <div className="flex border rounded-md overflow-hidden">
              <Button
                variant={editorSettings.textAlignment === 'left' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTextAlignment('left')}
                className="rounded-none border-0 px-2"
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={editorSettings.textAlignment === 'center' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTextAlignment('center')}
                className="rounded-none border-0 px-2 border-l"
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={editorSettings.textAlignment === 'right' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTextAlignment('right')}
                className="rounded-none border-0 px-2 border-l"
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
{/* Toggle Background Preview */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBackgroundPreview(!backgroundPreview)}
              className={`px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 transition-all transform ease-in-out ${backgroundPreview ? 'bg-blue-100' : 'bg-white'}`}
            >
              {backgroundPreview ? <ImageOff className="w-4 h-4" /> : <Image className="w-4 h-4" />}
              {backgroundPreview ? 'Disable Background' : 'Enable Background'}
            </button>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              Page {currentPageIndex + 1} of {pages.length}
            </span>
            <span>
              Page Content: {pages[currentPageIndex]?.content?.length || 0} characters
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
                    backgroundImage: backgroundPreview ? `url('/backgrounds/stage_1.png')` : 'none',
                    backgroundSize: 'cover',
                    opacity: backgroundPreview ? 0.2 : 1
                  }}
                >
                  <EnhancedTextarea
                    ref={(ref) => {
                      if (ref) textareaRefs.current.set(page.id, ref);
                    }}
                    value={index === currentPageIndex ? currentPageContent : page.content}
                    onChange={(e) => {
                      if (index === currentPageIndex) {
                        handlePageContentChange(e.target.value);
                      }
                    }}
                    onFocus={() => handlePageFocus(index)}
                    autosize={false} // Disable autosize since we have fixed page height
                    preserveCursor={true}
                    smoothTyping={true}
                    className="w-full h-full resize-none outline-none bg-transparent"
                    style={{
                      padding: `${PAGE_PADDING}px`,
                      fontFamily: selectedFont,
                      fontSize: `${FONT_SIZE}px`,
                      lineHeight: `${LINE_HEIGHT}px`,
                      color: '#333',
                      textAlign: editorSettings.textAlignment
                    }}
                    placeholder={index === 0 ? "Start writing your story here..." : "Continue writing..."}
                  />
                  
                  {/* Character count indicator */}
                  <div className="absolute bottom-4 right-4 text-xs text-gray-500 bg-white px-2 py-1 rounded">
                    {page.content?.length || 0} chars
                  </div>
                </div>
              </div>
            ))}
            
            {/* Add Page Button */}
            {pages.length < 6 && (
              <div className="mx-auto" style={{ width: `${PAGE_WIDTH}px` }}>
                <Button
                  variant="outline"
                  className="w-full h-32 border-2 border-dashed border-gray-300 hover:border-gray-400"
                  onClick={() => {
                    addNewPage();
                    scrollToEditor();
                  }}
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Add New Page
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Enhanced Page Navigation */}
        <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 shadow-inner">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Navigation Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="default"
                disabled={!pageInfo.hasPreviousPage}
                onClick={() => {
                  navigateToPage(pageInfo.currentPage - 2);
                  scrollToEditor();
                }}
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous Page
              </Button>
              
              {/* Page Indicators */}
              <div className="flex items-center gap-1 max-w-[300px]">
                {Array.from({ length: Math.min(pageInfo.totalPages, 6) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      navigateToPage(i);
                      scrollToEditor();
                    }}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-all duration-200 hover:scale-110 ${
                      pageInfo.currentPage === i + 1
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-200 border border-gray-300'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="default"
                disabled={!pageInfo.hasNextPage}
                onClick={() => {
                  navigateToPage(pageInfo.currentPage);
                  scrollToEditor();
                }}
                className="transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                Next Page
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* Page Info */}
            <div className="text-center sm:text-right">
              <div className="text-lg font-medium text-gray-800">
                Page {pageInfo.currentPage} of {Math.min(pageInfo.totalPages, 6)}
              </div>
              {pageInfo.totalPages > 6 && (
                <div className="text-sm text-red-600 flex items-center justify-center sm:justify-end gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {pageInfo.totalPages - 6} pages over limit
                </div>
              )}
            </div>
          </div>
        </div>
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
