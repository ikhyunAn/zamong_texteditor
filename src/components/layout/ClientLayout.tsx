'use client';

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguageStore } from '@/store/useLanguageStore'
import { FontPreloader } from '@/components/FontPreloader'
import '@/lib/i18n' // Initialize i18n

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { t, i18n } = useTranslation('common')
  const { language, setLanguage } = useLanguageStore()
  const [hasHydrated, setHasHydrated] = useState(false)

  // Track hydration state
  useEffect(() => {
    setHasHydrated(true)
  }, [])

  // Auto-detect browser language after hydration (only if no stored preference)
  useEffect(() => {
    if (hasHydrated && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('language-storage');
        if (!stored) {
          // No stored preference, detect from browser
          const browserLang = navigator.language.toLowerCase();
          if (browserLang.startsWith('ko') && language !== 'ko') {
            setLanguage('ko');
          }
        }
      } catch (error) {
        console.warn('Failed to auto-detect language:', error);
      }
    }
  }, [hasHydrated, language, setLanguage])

  // Sync i18next with language store
  useEffect(() => {
    if (hasHydrated && i18n.language !== language) {
      i18n.changeLanguage(language)
    }
  }, [hasHydrated, language, i18n])

  // Update document attributes when language changes
  useEffect(() => {
    if (hasHydrated && typeof document !== 'undefined') {
      // Update document lang attribute
      document.documentElement.lang = language
      
      // Update document title
      document.title = `${t('app.title')} - Story to Instagram`
      
      // Update meta description
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', t('app.subtitle'))
      }
    }
  }, [hasHydrated, language, t])

  return (
    <FontPreloader>
      {children}
    </FontPreloader>
  );
}
