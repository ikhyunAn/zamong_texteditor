'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Hook to safely use translations during hydration.
 * Returns a flag indicating if translations are safe to use.
 */
export function useHydrationSafeTranslation() {
  const { t, i18n } = useTranslation('common');
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Mark as hydrated after a short delay to ensure i18n is fully initialized
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return {
    t: isHydrated ? t : () => '', // Return empty string during hydration
    isHydrated,
    i18n,
  };
}
