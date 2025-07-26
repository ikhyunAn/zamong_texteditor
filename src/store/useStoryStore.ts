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
  addPage: (content?: string) => void;
  addEmptyPage: () => void;
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
    set({ pages });
  },

  setCurrentPageIndex: (index: number) => {
    const { pages } = get();
    if (index >= 0 && index < pages.length) {
      set({ currentPageIndex: index });
    }
  },

  navigateToPage: (index: number) => {
    get().setCurrentPageIndex(index);
  },

  addPage: (content?: string) => {
    const { pages } = get();
    const newPage: Page = {
      id: `page-${Date.now()}-${pages.length + 1}`,
      content: content ? content.trim() : '',
      backgroundTemplate: undefined
    };
    
    set({ pages: [...pages, newPage] });
  },

  addEmptyPage: () => {
    get().addPage('');
  },

  updatePage: (pageId: string, content: string) => {
    set((state) => ({
      pages: state.pages.map((page) =>
        page.id === pageId ? { ...page, content: content.trim() } : page
      )
    }));
  },

  deletePage: (pageId: string) => {
    set((state) => {
      const newPages = state.pages.filter(page => page.id !== pageId);
      const newCurrentPageIndex = Math.min(state.currentPageIndex, Math.max(0, newPages.length - 1));
      return {
        pages: newPages,
        currentPageIndex: newCurrentPageIndex
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
    if (pages.length > 0 && currentPageIndex >= 0 && currentPageIndex < pages.length) {
      const currentPage = pages[currentPageIndex];
      // Only update if content actually changed to avoid unnecessary re-renders
      if (currentPage.content !== content.trim()) {
        get().updatePage(currentPage.id, content);
      }
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
