import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguageStore } from '@/store/useLanguageStore';

/**
 * Hook to initialize language settings and keep Zustand store and i18next in sync
 * Should be called once at the app root level
 */
export const useLanguageInitialization = () => {
  const { i18n, ready } = useTranslation();
  const { language, setLanguage } = useLanguageStore();

  useEffect(() => {
    if (!ready) return;

    // Initial sync: ensure i18next is using the store's language
    if (i18n.language !== language) {
      console.log(`[Language Init] Syncing i18next language from '${i18n.language}' to '${language}'`);
      i18n.changeLanguage(language).catch((error) => {
        console.error('[Language Init] Failed to sync i18next with store:', error);
      });
    }

    // Listen to i18next language changes and sync to store
    // This handles cases where language might be changed directly via i18next
    const handleI18nextLanguageChange = (lng: string) => {
      const normalizedLang = lng === 'ko' ? 'ko' : 'en';
      if (normalizedLang !== language) {
        console.log(`[Language Init] Syncing store language from i18next: ${lng} -> ${normalizedLang}`);
        // Use setState directly to avoid circular updates
        useLanguageStore.setState({ language: normalizedLang });
      }
    };

    // Register language change listener
    i18n.on('languageChanged', handleI18nextLanguageChange);

    // Cleanup
    return () => {
      i18n.off('languageChanged', handleI18nextLanguageChange);
    };
  }, [ready, i18n, language]);

  // Return current language state for components that need it
  return {
    language,
    setLanguage,
    isI18nextReady: ready,
  };
};
