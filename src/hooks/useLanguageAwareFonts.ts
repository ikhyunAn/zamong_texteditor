import { useEffect } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { useStoryStore } from '@/store/useStoryStore';
import { getRecommendedFontForLanguage } from '@/lib/constants';

/**
 * Hook that provides language-aware font recommendations and automatic switching
 */
export function useLanguageAwareFonts(options?: {
  autoSwitch?: boolean; // Automatically switch font when language changes
  suggestOnly?: boolean; // Only provide suggestions without auto-switching
}) {
  const { language } = useLanguageStore();
  const { editorSettings, setFontFamily } = useStoryStore();
  
  const { autoSwitch = false, suggestOnly = false } = options || {};
  
  // Get recommended font for current language
  const recommendedFont = getRecommendedFontForLanguage();
  
  // Auto-switch font when language changes (if enabled)
  useEffect(() => {
    if (autoSwitch && !suggestOnly) {
      const currentFont = editorSettings.fontFamily;
      const recommended = getRecommendedFontForLanguage();
      
      // Only switch if the current font is different from recommended
      if (currentFont !== recommended) {
        console.log(`Auto-switching font from ${currentFont} to ${recommended} for language ${language}`);
        setFontFamily(recommended);
      }
    }
  }, [language, autoSwitch, suggestOnly, editorSettings.fontFamily, setFontFamily]);
  
  return {
    currentLanguage: language,
    recommendedFont,
    currentFont: editorSettings.fontFamily,
    isUsingRecommendedFont: editorSettings.fontFamily === recommendedFont,
    switchToRecommendedFont: () => setFontFamily(recommendedFont),
  };
}

/**
 * Hook for automatic font switching based on language
 */
export function useAutoFontSwitching() {
  return useLanguageAwareFonts({ autoSwitch: true });
}

/**
 * Hook for font suggestions without automatic switching
 */
export function useFontSuggestions() {
  return useLanguageAwareFonts({ suggestOnly: true });
}
