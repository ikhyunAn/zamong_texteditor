import { create } from 'zustand';
import { StoryState, StorySection, AuthorInfo, TextStyle } from '@/types';
import { autoSplitIntoSections, parseContentWithBreaks } from '@/lib/text-processing';

interface StoryStore extends StoryState {
  // Actions
  setAuthorInfo: (info: AuthorInfo) => void;
  setContent: (content: string) => void;
  updateSection: (sectionId: string, updates: Partial<StorySection>) => void;
  updateSectionTextStyle: (sectionId: string, textStyle: Partial<TextStyle>) => void;
  addSectionBreak: (position: number) => void;
  removeSectionBreak: (sectionId: string) => void;
  autoGenerateSections: () => void;
  setCurrentStep: (step: number) => void;
  resetStore: () => void;
}

const initialState: StoryState = {
  authorInfo: { name: '', title: '' },
  content: '',
  sections: [],
  currentStep: 0
};

export const useStoryStore = create<StoryStore>()((set, get) => ({
  ...initialState,

  setAuthorInfo: (info: AuthorInfo) => {
    set({ authorInfo: info });
  },

  setContent: (content: string) => {
    set({ content });
    // Auto-generate sections when content changes
    if (content.trim()) {
      get().autoGenerateSections();
    }
  },

  updateSection: (sectionId: string, updates: Partial<StorySection>) => {
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === sectionId ? { ...section, ...updates } : section
      )
    }));
  },

  updateSectionTextStyle: (sectionId: string, textStyle: Partial<TextStyle>) => {
    set((state) => ({
      sections: state.sections.map((section) =>
        section.id === sectionId 
          ? { ...section, textStyle: { ...section.textStyle, ...textStyle } }
          : section
      )
    }));
  },

  addSectionBreak: (position: number) => {
    const { content } = get();
    const newContent = content.substring(0, position) + '\n\n---SECTION_BREAK---\n\n' + content.substring(position);
    set({ content: newContent });
    get().autoGenerateSections();
  },

  removeSectionBreak: (sectionId: string) => {
    const { sections } = get();
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if (sectionIndex > 0) {
      const updatedSections = [...sections];
      // Merge with previous section
      updatedSections[sectionIndex - 1].content += ' ' + updatedSections[sectionIndex].content;
      updatedSections.splice(sectionIndex, 1);
      
      // Update IDs
      const reindexedSections = updatedSections.map((section, index) => ({
        ...section,
        id: `section-${index + 1}`
      }));
      
      set({ sections: reindexedSections });
    }
  },

  autoGenerateSections: () => {
    const { content } = get();
    if (!content.trim()) {
      set({ sections: [] });
      return;
    }

    let sections: StorySection[];
    
    // Check if content has manual section breaks
    if (content.includes('---SECTION_BREAK---')) {
      sections = parseContentWithBreaks(content);
    } else {
      sections = autoSplitIntoSections(content);
    }
    
    set({ sections });
  },

  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  resetStore: () => {
    set(initialState);
  }
}));
