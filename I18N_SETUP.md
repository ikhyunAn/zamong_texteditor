# Next.js 15 Internationalization Setup

This project has been configured with next-i18next for internationalization support.

## Configuration Files

- `next-i18next.config.js` - Main i18n configuration
- `src/lib/i18n.ts` - Client-side i18n initialization
- `src/app/providers.tsx` - App-level i18n provider
- `next.config.js` - Next.js i18n routing configuration

## Supported Languages

- English (`en`) - Default language
- Korean (`ko`)

## Translation Files

Translation files are located in:
- `public/locales/en/common.json` - English translations
- `public/locales/ko/common.json` - Korean translations

## Usage

### In App Router (Next.js 13+)

1. Wrap your app with the I18nProvider in your root layout:

```tsx
import { I18nProvider } from './providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html>
      <body>
        <I18nProvider>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
```

2. Use translations in components:

```tsx
import { useTranslation } from 'react-i18next';

export default function MyComponent() {
  const { t } = useTranslation('common');
  
  return <h1>{t('welcome')}</h1>;
}
```

### Language Switching

```tsx
import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <button onClick={() => changeLanguage('en')}>English</button>
      <button onClick={() => changeLanguage('ko')}>한국어</button>
    </div>
  );
}
```

## URL-based Language Routing

The app supports URL-based language routing:
- `/` - Default language (English)
- `/ko` - Korean language
- `/ko/about` - Korean about page

Language detection is enabled and will:
1. Check URL path
2. Check localStorage
3. Check browser language
4. Fall back to English

## Adding New Languages

1. Add the locale to `next.config.js`:
```js
i18n: {
  locales: ['en', 'ko', 'ja'], // Add 'ja' for Japanese
  defaultLocale: 'en',
}
```

2. Add the locale to `next-i18next.config.js`:
```js
i18n: {
  locales: ['en', 'ko', 'ja'],
  // ... other config
}
```

3. Create translation files:
```
public/locales/ja/common.json
```

## Adding New Namespaces

1. Create new translation files:
```
public/locales/en/auth.json
public/locales/ko/auth.json
```

2. Update `next-i18next.config.js`:
```js
ns: ['common', 'auth'],
```

3. Use in components:
```tsx
const { t } = useTranslation('auth');
```
