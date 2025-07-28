import { create } from 'zustand';
import { StoryState, AuthorInfo, Page, EditorSettings, StorySection, TextStyle } from '@/types';
import { splitContentIntoPages } from '@/lib/text-processing';
import { parseHtmlToSections } from '@/lib/content-parser';

interface StoryStore extends StoryState {
  // Actions
  setAuthorInfo: (info: AuthorInfo) => void;
  setContent: (content: string) => void;
  setCurrentStep: (step: number) => void;
  
  // Section management actions
  setSections: (sections: StorySection[]) => void;
  updateSection: (sectionId: string, updates: Partial<StorySection>) => void;
  updateSectionTextStyle: (sectionId: string, style: Partial<TextStyle>) => void;
  
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
  setMaxLinesPerPage: (lines: number) => void;
  setFontFamily: (font: string) => void;
  
  resetStore: () => void;
}

const defaultTextStyle: TextStyle = {
  fontFamily: 'Arial',
  fontSize: 24,
  color: '#000000',
  position: { x: 50, y: 50 },
  alignment: 'center'
};

const initialState: StoryState = {
  authorInfo: { name: '', title: '' },
  content: '',
  sections: [],
  pages: [],
  currentStep: 0,
  currentPageIndex: 0,
  editorSettings: {
    maxLinesPerPage: 25,
    fontFamily: 'Arial'
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
    set({ content: content.trim() });
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
      content: content && typeof content === 'string' ? content.trim() : '',
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
        console.warn('updatePage: invalid pageId provided');
        return state;
      }
      
      if (typeof content !== 'string') {
        console.warn('updatePage: content must be a string');
        return state;
      }
      
      // Check if page exists
      const pageExists = state.pages.some(page => page.id === pageId);
      if (!pageExists) {
        console.warn(`updatePage: page with ID ${pageId} not found`);
        return state;
      }
      
      // Create immutable update
      const updatedPages = state.pages.map((page) =>
        page.id === pageId ? { ...page, content } : { ...page }
      );
      
      return {
        ...state,
        pages: updatedPages
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
      console.warn('Cannot set page content: invalid page index or no pages available');
      return;
    }
    
    const currentPage = pages[currentPageIndex];
    
    // REMOVED: Validation that prevented legitimate empty content updates
    // This was causing issues where valid navigation content updates were blocked
    
    // Don't trim content to preserve line breaks at the beginning and end
    const normalizedContent = content;
    
    // Only update if content actually changed to avoid unnecessary re-renders
    if (currentPage.content !== normalizedContent) {
      console.log(`[setCurrentPageContent] Updating page ${currentPage.id} content: "${currentPage.content}" -> "${normalizedContent}"`);
      get().updatePage(currentPage.id, normalizedContent);
      // Force update of content to ensure synchronization with preserved line breaks
      const updatedPages = get().pages;
      const globalContent = updatedPages.map(page => page.content).join('\n\n');
      set({ content: globalContent });
    }
  },

  syncPagesToSections: () => {
    const { pages } = get();
    const sections = pages.map((page, index) => ({
      id: page.id.replace('page-', 'section-'),
      content: page.content,
      textStyle: { ...defaultTextStyle },
      backgroundImage: undefined
    }));
    
    set({ sections });
    
    // Update global content to be the concatenation of all pages
    const globalContent = pages.map(page => page.content).join('\n\n');
    set({ content: globalContent });
  },

  splitContentIntoPages: (content: string) => {
    const { editorSettings } = get();
    const pages = splitContentIntoPages(content, editorSettings.maxLinesPerPage);
    set({ pages, currentPageIndex: 0 });
  },

  // Editor settings actions
  updateEditorSettings: (settings: Partial<EditorSettings>) => {
    set((state) => {
      const newSettings = { ...state.editorSettings, ...settings };
      
      // Re-split content if maxLinesPerPage changed
      if (settings.maxLinesPerPage !== undefined && state.content.trim()) {
        const pages = splitContentIntoPages(state.content, newSettings.maxLinesPerPage);
        return {
          editorSettings: newSettings,
          pages,
          currentPageIndex: Math.min(state.currentPageIndex, Math.max(0, pages.length - 1))
        };
      }
      
      return { editorSettings: newSettings };
    });
  },

  setMaxLinesPerPage: (lines: number) => {
    if (lines > 0) {
      get().updateEditorSettings({ maxLinesPerPage: lines });
    }
  },

  setFontFamily: (font: string) => {
    get().updateEditorSettings({ fontFamily: font });
  },

  resetStore: () => {
    set(initialState);
  }
}));
