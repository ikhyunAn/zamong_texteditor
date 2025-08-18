'use client';

import { ReactNode } from 'react';
import { appWithTranslation } from 'next-i18next';
import { I18nextProvider } from 'react-i18next';
import i18n from '../lib/i18n';

interface ProvidersProps {
  children: ReactNode;
}

export function I18nProvider({ children }: ProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  );
}

// For pages directory compatibility (if needed)
export default appWithTranslation;
