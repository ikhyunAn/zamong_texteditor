import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'en' | 'ko';

interface LanguageState {
  language: Language;
}

interface LanguageActions {
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
}

interface LanguageStore extends LanguageState, LanguageActions {}

const defaultLanguage: Language = 'en';

// Helper function to detect browser language (client-side only)
const detectBrowserLanguage = (): Language => {
  if (typeof window === 'undefined') return defaultLanguage;
  
  const browserLang = navigator.language.toLowerCase();
  
  // Check if browser language is Korean
  if (browserLang.startsWith('ko')) {
    return 'ko';
  }
  
  // Default to English for all other languages
  return 'en';
};

// Helper function to get initial language (server-safe)
const getInitialLanguage = (): Language => {
  // Always return default language on server to avoid hydration mismatch
  if (typeof window === 'undefined') return defaultLanguage;
  
  // Try to get language from localStorage first
  try {
    const stored = localStorage.getItem('language-storage');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.state && (parsed.state.language === 'en' || parsed.state.language === 'ko')) {
        return parsed.state.language;
      }
    }
  } catch (error) {
    console.warn('Failed to parse stored language preference:', error);
  }
  
  // Fallback to browser language detection
  return detectBrowserLanguage();
};

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set, get) => ({
      // Initial state - always start with default to avoid hydration mismatch
      language: defaultLanguage,

      // Actions
      setLanguage: (language: Language) => {
        set({ language });
        
        // Also update i18next if available
        if (typeof window !== 'undefined' && window.i18next) {
          window.i18next.changeLanguage(language).catch((error) => {
            console.warn('Failed to sync language with i18next:', error);
          });
        }
      },

      toggleLanguage: () => {
        const { language } = get();
        const newLanguage: Language = language === 'en' ? 'ko' : 'en';
        get().setLanguage(newLanguage);
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => localStorage),
      
      // Only persist the language state, not the actions
      partialize: (state) => ({ language: state.language }),
      
      // Handle rehydration
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Sync with i18next on rehydration
          if (typeof window !== 'undefined' && window.i18next) {
            window.i18next.changeLanguage(state.language).catch((error) => {
              console.warn('Failed to sync rehydrated language with i18next:', error);
            });
          }
        }
      },
    }
  )
);

// Type augmentation for window.i18next
declare global {
  interface Window {
    i18next?: {
      changeLanguage: (lng: string) => Promise<void>;
      language: string;
    };
  }
}

// Hook to sync with i18next (for use in components)
export const useSyncLanguageWithI18next = () => {
  const { language, setLanguage } = useLanguageStore();
  
  // Function to sync from i18next to store
  const syncFromI18next = (i18nextLanguage: string) => {
    const normalizedLang: Language = i18nextLanguage === 'ko' ? 'ko' : 'en';
    if (normalizedLang !== language) {
      // Update store without triggering i18next change to avoid circular updates
      useLanguageStore.setState({ language: normalizedLang });
    }
  };
  
  return {
    language,
    setLanguage,
    syncFromI18next,
  };
};
