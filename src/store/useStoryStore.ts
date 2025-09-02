import { create } from 'zustand';
import { StoryState, AuthorInfo, Page, EditorSettings, StorySection, TextStyle } from '@/types';

interface StoryStore extends StoryState {
  // Actions
  setAuthorInfo: (info: AuthorInfo) => void;
  setContent: (content: string) => void;
  setCurrentStep: (step: number) => void;
  
  // Section management actions
  setSections: (sections: StorySection[]) => void;
  updateSection: (sectionId: string, updates: Partial<StorySection>) => void;
  updateSectionTextStyle: (sectionId: string, style: Partial<TextStyle>) => void;
  updateAllSectionsTextStyle: (style: Partial<TextStyle>) => void;
  applySectionFontSize: (sectionId: string, fontSize: number) => void;
  applySectionVerticalAlignment: (sectionId: string, verticalAlignment: 'top' | 'middle' | 'bottom') => void;
  applyGlobalSectionFontSize: (fontSize: number) => void;
  applyGlobalSectionVerticalAlignment: (verticalAlignment: 'top' | 'middle' | 'bottom') => void;
  syncEditorSettingsToSections: () => void;
  
  // Page management actions
  setPages: (pages: Page[]) => void;
  setCurrentPageIndex: (index: number) => void;
  navigateToPage: (index: number) => void;
  addPage: (content?: string) => boolean;
  addEmptyPage: () => boolean;
  initializeWithEmptyPage: () => void;
  updatePage: (pageId: string, content: string) => void;
  deletePage: (pageId: string) => void;
  getCurrentPageContent: () => string;
  setCurrentPageContent: (content: string) => void;
  syncPagesToSections: () => void;
  splitContentIntoPages: (content: string) => void;
  
  // Editor settings actions
  updateEditorSettings: (settings: Partial<EditorSettings>) => void;
  setFontFamily: (font: string) => void;
  setTextAlignment: (alignment: 'left' | 'center' | 'right') => void;
  setGlobalTextAlignment: (alignment: 'left' | 'center' | 'right') => void;
  setVerticalAlignment: (alignment: 'top' | 'middle' | 'bottom') => void;
  setFontSize: (size: number) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  setLineHeight: (lineHeight: number) => void;
  
  resetStore: () => void;
}

const defaultTextStyle: TextStyle = {
  fontFamily: 'KoPubWorldBatangLight', // Primary font for all text
  fontSize: 24,
  color: '#000000',
  position: { x: 50, y: 50 },
  alignment: 'center',
  verticalAlignment: 'middle'
};

const initialState: StoryState = {
  authorInfo: { name: '', title: '' },
  content: '',
  sections: [],
  pages: [],
  currentStep: 0,
  currentPageIndex: 0,
  editorSettings: {
    fontFamily: 'KoPubWorldBatangLight', // Primary font for all text
    fontSize: 18,
    lineHeight: 1.5,
    textAlignment: 'left',
    globalTextAlignment: 'left', // Default to left for backward compatibility
    verticalAlignment: 'top'
  }
};

export const useStoryStore = create<StoryStore>()((set, get) => ({
  ...initialState,

  setAuthorInfo: (info: AuthorInfo) => {
    set({ authorInfo: info });
  },

  setContent: (content: string) => {
    // Simply set the content without auto-processing into pages
    // Individual page management will be handled separately
    // Don't trim content to preserve formatting including leading/trailing newlines
    set({ content: content });
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },
  
  // Section management actions
  setSections: (sections: StorySection[]) => {
    set({ sections });
  },

  updateSection: (sectionId: string, updates: Partial<StorySection>) => {
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  },

  updateSectionTextStyle: (sectionId: string, style: Partial<TextStyle>) => {
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === sectionId 
          ? { ...section, textStyle: { ...section.textStyle, ...style } }
          : section
      )
    }));
  },

  // Enhanced section text style management with fontSize and verticalAlignment
  updateAllSectionsTextStyle: (style: Partial<TextStyle>) => {
    set((state) => ({
      sections: state.sections.map((section) => ({
        ...section,
        textStyle: { ...section.textStyle, ...style }
      }))
    }));
  },

  applySectionFontSize: (sectionId: string, fontSize: number) => {
    get().updateSectionTextStyle(sectionId, { fontSize });
  },

  applySectionVerticalAlignment: (sectionId: string, verticalAlignment: 'top' | 'middle' | 'bottom') => {
    get().updateSectionTextStyle(sectionId, { verticalAlignment });
  },

  applyGlobalSectionFontSize: (fontSize: number) => {
    get().updateAllSectionsTextStyle({ fontSize });
  },

  applyGlobalSectionVerticalAlignment: (verticalAlignment: 'top' | 'middle' | 'bottom') => {
    get().updateAllSectionsTextStyle({ verticalAlignment });
  },

  // Sync all current editor settings to sections
  syncEditorSettingsToSections: () => {
    const { editorSettings } = get();
    get().updateAllSectionsTextStyle({
      fontSize: editorSettings.fontSize,
      verticalAlignment: editorSettings.verticalAlignment,
      alignment: editorSettings.globalTextAlignment
    });
  },

  syncEditorSettingsToAllSections: () => {
    const { sections, editorSettings } = get();
    const updatedSections = sections.map(section => ({
      ...section,
      textStyle: {
        ...section.textStyle,
        fontFamily: editorSettings.fontFamily,
        fontSize: editorSettings.fontSize,
        alignment: editorSettings.globalTextAlignment,
        verticalAlignment: editorSettings.verticalAlignment
        // Note: lineHeight is not a property of TextStyle, it's only used in canvas rendering
      }
    }));
    set({ sections: updatedSections });
  },

  // Page management actions
  setPages: (pages: Page[]) => {
    // Ensure pages array is properly validated and immutable
    if (!Array.isArray(pages)) {
      console.warn('setPages: provided pages is not an array');
      return;
    }
    
    // Validate each page has required properties
    const validatedPages = pages.filter(page => {
      if (!page || typeof page !== 'object') {
        console.warn('setPages: found invalid page object');
        return false;
      }
      if (!page.id || typeof page.id !== 'string') {
        console.warn('setPages: found page without valid ID');
        return false;
      }
      if (typeof page.content !== 'string') {
        console.warn(`setPages: page ${page.id} has invalid content type`);
        return false;
      }
      return true;
    });
    
    // Ensure we always have at least one page
    if (validatedPages.length === 0) {
      console.warn('setPages: no valid pages provided, creating default page');
      const defaultPage: Page = {
        id: `page-${Date.now()}-1`,
        content: '',
        backgroundTemplate: undefined
      };
      set({ pages: [defaultPage], currentPageIndex: 0 });
      return;
    }
    
    // Create immutable copy and set
    const immutablePages = validatedPages.map(page => ({ ...page }));
    set((state) => ({
      pages: immutablePages,
      currentPageIndex: Math.min(state.currentPageIndex, immutablePages.length - 1)
    }));
  },

  setCurrentPageIndex: (index: number) => {
    const { pages } = get();
    if (index >= 0 && index < pages.length) {
      set({ currentPageIndex: index });
    }
  },

  navigateToPage: (index: number) => {
    const { pages } = get();
    
    // Validate page existence before navigation
    if (pages.length === 0) {
      console.warn('Cannot navigate: no pages available');
      return;
    }
    
    if (index < 0 || index >= pages.length) {
      console.warn(`Cannot navigate to page ${index}: index out of bounds (0-${pages.length - 1})`);
      return;
    }
    
    // Validate that the target page exists and has valid data
    const targetPage = pages[index];
    if (!targetPage || !targetPage.id) {
      console.warn(`Cannot navigate to page ${index}: page data is invalid`);
      return;
    }
    
    set({ currentPageIndex: index });
  },

  addPage: (content?: string) => {
    const { pages } = get();
    
    console.log(`[Store.addPage] Creating new page, current pages: ${pages.length}`);
    console.trace('[Store.addPage] Call stack:');
    
    // Prevent adding more than 6 pages total
    if (pages.length >= 6) {
      console.warn(`[Store.addPage] Cannot add page, already at maximum (6 pages)`);
      return false; // Return false to indicate failure
    }
    
    // Generate unique ID to prevent collisions
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const newPage: Page = {
      id: `page-${timestamp}-${random}`,
      content: content && typeof content === 'string' ? content : '',
      backgroundTemplate: undefined
    };
    
    // Create immutable update
    const newPages = [...pages, newPage];
    console.log(`[Store.addPage] Created page ${newPage.id}, total pages now: ${newPages.length}`);
    set({ pages: newPages });
    return true; // Return true to indicate success
  },

  addEmptyPage: () => {
    console.log('[Store.addEmptyPage] Called');
    return get().addPage('');
  },

  // Add a method specifically for initialization that's safer against double calls
  initializeWithEmptyPage: () => {
    const { pages } = get();
    console.log('[Store.initializeWithEmptyPage] Called, current pages:', pages.length);
    
    // Only create a page if there are truly no pages
    if (pages.length === 0) {
      console.log('[Store.initializeWithEmptyPage] Creating initial page');
      get().addPage('');
    } else {
      console.log('[Store.initializeWithEmptyPage] Pages already exist, skipping initialization');
    }
  },

  updatePage: (pageId: string, content: string) => {
    set((state) => {
      // Validate input parameters
      if (!pageId || typeof pageId !== 'string') {
        console.warn('[updatePage] Invalid pageId provided');
        return state;
      }
      
      if (typeof content !== 'string') {
        console.warn('[updatePage] Content must be a string');
        return state;
      }
      
      // Find the page index for more efficient lookup
      const pageIndex = state.pages.findIndex(page => page.id === pageId);
      if (pageIndex === -1) {
        console.warn(`[updatePage] Page with ID ${pageId} not found`);
        return state;
      }
      
      // Create immutable update with better performance
      const updatedPages = [...state.pages];
      const oldContent = updatedPages[pageIndex].content || '';
      updatedPages[pageIndex] = { ...updatedPages[pageIndex], content };
      
      // Log detailed update info
      const oldNewlines = oldContent.split('\n').length - 1;
      const newNewlines = content.split('\n').length - 1;
      console.log(`[updatePage] Page ${pageId}:`);
      console.log(`  Old: ${oldContent.length} chars, ${oldNewlines} newlines`);
      console.log(`  New: ${content.length} chars, ${newNewlines} newlines`);
      
      // Update global content - preserve page structures without adding extra newlines
      const globalContent = updatedPages
        .map(page => page.content || '')
        .join(''); // Join directly without separators
      
      return {
        ...state,
        pages: updatedPages,
        content: globalContent
      };
    });
  },

  deletePage: (pageId: string) => {
    set((state) => {
      // Safety check: prevent page deletion during navigation or if it would leave no pages
      if (state.pages.length <= 1) {
        console.warn('Cannot delete page: must maintain at least one page');
        return state; // Return unchanged state
      }
      
      // Check if the page being deleted is the currently active page
      const pageToDelete = state.pages.find(page => page.id === pageId);
      if (!pageToDelete) {
        console.warn(`Cannot delete page: page with ID ${pageId} not found`);
        return state; // Return unchanged state
      }
      
      const pageToDeleteIndex = state.pages.findIndex(page => page.id === pageId);
      
      // Create new pages array (immutable update)
      const newPages = [...state.pages].filter(page => page.id !== pageId);
      
      // Adjust current page index if necessary
      let newCurrentPageIndex = state.currentPageIndex;
      if (pageToDeleteIndex === state.currentPageIndex) {
        // If we're deleting the current page, navigate to the previous page if possible,
        // otherwise navigate to the next available page
        newCurrentPageIndex = Math.min(pageToDeleteIndex, newPages.length - 1);
      } else if (pageToDeleteIndex < state.currentPageIndex) {
        // If we're deleting a page before the current page, adjust the index
        newCurrentPageIndex = state.currentPageIndex - 1;
      }
      
      return {
        ...state,
        pages: newPages,
        currentPageIndex: Math.max(0, newCurrentPageIndex)
      };
    });
  },

  getCurrentPageContent: () => {
    const { pages, currentPageIndex } = get();
    if (pages.length > 0 && currentPageIndex < pages.length) {
      return pages[currentPageIndex].content;
    }
    return '';
  },

  setCurrentPageContent: (content: string) => {
    const { pages, currentPageIndex } = get();
    
    // Validate that we have pages and a valid current page index
    if (pages.length === 0 || currentPageIndex < 0 || currentPageIndex >= pages.length) {
      console.warn('[setCurrentPageContent] Cannot set page content: invalid page index or no pages available');
      return;
    }
    
    const currentPage = pages[currentPageIndex];
    if (!currentPage) {
      console.warn('[setCurrentPageContent] Current page not found');
      return;
    }
    
    // Don't trim content to preserve line breaks at the beginning and end
    const normalizedContent = content ?? '';
    
    // Log detailed content changes including newline counts
    const oldNewlines = (currentPage.content || '').split('\n').length - 1;
    const newNewlines = normalizedContent.split('\n').length - 1;
    console.log(`[setCurrentPageContent] Page ${currentPage.id}:`);
    console.log(`  Old content: ${(currentPage.content || '').length} chars, ${oldNewlines} newlines`);
    console.log(`  New content: ${normalizedContent.length} chars, ${newNewlines} newlines`);
    
    // Use a more robust update approach
    const updatedPages = pages.map((page, index) => 
      index === currentPageIndex 
        ? { ...page, content: normalizedContent }
        : page
    );
    
    // Update pages atomically
    set({ pages: updatedPages });
    
    // Update global content - preserve individual page structures
    const globalContent = updatedPages
      .map(page => page.content || '')
      .join(''); // Join without adding separators to avoid extra newlines
    set({ content: globalContent });
  },

  syncPagesToSections: () => {
    const { pages, editorSettings } = get();
    const sections = pages.map((page) => ({
      id: page.id.replace('page-', 'section-'),
      content: page.content,
      textStyle: { 
        ...defaultTextStyle,
        fontSize: editorSettings.fontSize,
        verticalAlignment: editorSettings.verticalAlignment,
        alignment: editorSettings.globalTextAlignment
      },
      backgroundImage: undefined
    }));
    
    set({ sections });
    
    // Update global content to be the concatenation of all pages
    const globalContent = pages.map(page => page.content || '').join('');
    set({ content: globalContent });
  },

  splitContentIntoPages: (content: string) => {
    // Split content into pages without line limits - let user decide page breaks
    // For now, put all content on a single page unless manually split
    const pages: Page[] = [{
      id: `page-${Date.now()}-1`,
      content: content,
      backgroundTemplate: undefined
    }];
    set({ pages, currentPageIndex: 0 });
  },

  // Editor settings actions
  updateEditorSettings: (settings: Partial<EditorSettings>) => {
    set((state) => ({
      editorSettings: { ...state.editorSettings, ...settings }
    }));
  },


  setFontFamily: (font: string) => {
    get().updateEditorSettings({ fontFamily: font });
  },

  setTextAlignment: (alignment: 'left' | 'center' | 'right') => {
    // Update both editor alignment (for PaginatedEditor) and global alignment (for export)
    set((state) => ({
      editorSettings: {
        ...state.editorSettings,
        textAlignment: alignment,
        globalTextAlignment: alignment
      }
    }));
  },

  setGlobalTextAlignment: (alignment: 'left' | 'center' | 'right') => {
    set((state) => ({
      editorSettings: {
        ...state.editorSettings,
        globalTextAlignment: alignment
      }
    }));
  },

  setVerticalAlignment: (alignment: 'top' | 'middle' | 'bottom') => {
    get().updateEditorSettings({ verticalAlignment: alignment });
    // Also update all existing sections if they exist
    const { sections } = get();
    if (sections.length > 0) {
      get().applyGlobalSectionVerticalAlignment(alignment);
    }
  },

  setFontSize: (size: number) => {
    // Validate font size range
    const validatedSize = Math.max(8, Math.min(72, size));
    get().updateEditorSettings({ fontSize: validatedSize });
    // Also update all existing sections if they exist
    const { sections } = get();
    if (sections.length > 0) {
      get().applyGlobalSectionFontSize(validatedSize);
    }
  },

  // Enhanced font size controls with validation
  increaseFontSize: () => {
    const { editorSettings } = get();
    const newSize = Math.min(72, editorSettings.fontSize + 2);
    get().setFontSize(newSize);
  },

  decreaseFontSize: () => {
    const { editorSettings } = get();
    const newSize = Math.max(8, editorSettings.fontSize - 2);
    get().setFontSize(newSize);
  },

  setLineHeight: (lineHeight: number) => {
    // Validate line height range
    const validatedLineHeight = Math.max(1.0, Math.min(3.0, lineHeight));
    get().updateEditorSettings({ lineHeight: validatedLineHeight });
  },

  resetStore: () => {
    set(initialState);
  }
}));
