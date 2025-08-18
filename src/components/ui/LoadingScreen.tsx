'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingScreenProps {
  showTranslatedText?: boolean;
  className?: string;
}

export function LoadingScreen({ showTranslatedText = false, className = "flex min-h-screen items-center justify-center" }: LoadingScreenProps) {
  const { t } = useTranslation('common');
  const [canShowTranslation, setCanShowTranslation] = useState(false);

  useEffect(() => {
    // Small delay to ensure i18n is fully hydrated
    const timer = setTimeout(() => {
      setCanShowTranslation(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const loadingText = showTranslatedText && canShowTranslation 
    ? t('app.loading')
    : 'Loading...';

  return (
    <div className={className}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{loadingText}</p>
      </div>
    </div>
  );
}
