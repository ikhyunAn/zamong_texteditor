# Language Store

This directory contains Zustand stores for managing application state.

## useLanguageStore

The `useLanguageStore` provides centralized language preference management with localStorage persistence.

### Features

- **Type-safe language state**: Supports 'en' and 'ko' languages
- **localStorage persistence**: Automatically saves and restores language preference
- **Browser language detection**: Falls back to browser language if no preference is saved
- **i18next integration**: Syncs with react-i18next for seamless translation support
- **SSR-safe**: Handles server-side rendering without hydration issues

### Usage

#### Basic usage in components

```tsx
import { useLanguageStore } from '@/store/useLanguageStore';

function MyComponent() {
  const { language, setLanguage, toggleLanguage } = useLanguageStore();
  
  return (
    <div>
      <p>Current language: {language}</p>
      <button onClick={() => setLanguage('ko')}>한국어</button>
      <button onClick={() => setLanguage('en')}>English</button>
      <button onClick={toggleLanguage}>Toggle Language</button>
    </div>
  );
}
```

#### App initialization

To ensure proper synchronization between the Zustand store and i18next, use the initialization hook in your app root:

```tsx
// In your app root component or layout
import { useLanguageInitialization } from '@/hooks/useLanguageInitialization';

function App() {
  const { language, isI18nextReady } = useLanguageInitialization();
  
  if (!isI18nextReady) {
    return <div>Loading translations...</div>;
  }
  
  return (
    <div>
      {/* Your app content */}
    </div>
  );
}
```

#### Advanced usage with i18next sync

```tsx
import { useSyncLanguageWithI18next } from '@/store/useLanguageStore';

function AdvancedComponent() {
  const { language, setLanguage, syncFromI18next } = useSyncLanguageWithI18next();
  
  // Manually sync from i18next if needed
  const handleManualSync = () => {
    if (typeof window !== 'undefined' && window.i18next) {
      syncFromI18next(window.i18next.language);
    }
  };
  
  return (
    <div>
      <p>Current language: {language}</p>
      <button onClick={handleManualSync}>Sync from i18next</button>
    </div>
  );
}
```

### Store API

#### State

- `language: 'en' | 'ko'` - Current language preference

#### Actions

- `setLanguage(language: Language)` - Set the language preference and sync with i18next
- `toggleLanguage()` - Toggle between 'en' and 'ko' languages

### Implementation Details

- **localStorage key**: `language-storage`
- **Default language**: `'en'`
- **Browser detection**: Checks `navigator.language` for Korean (`ko*`) patterns
- **Persistence**: Only the language state is persisted (actions are not stored)
- **Rehydration**: Automatically syncs with i18next on store rehydration

### Integration with Existing i18next Setup

The language store works alongside the existing i18next configuration:

1. **Initialization**: On app load, the store reads from localStorage or detects browser language
2. **Synchronization**: Changes to the store automatically update i18next
3. **Bidirectional sync**: Changes to i18next can optionally sync back to the store
4. **Persistence**: i18next's own localStorage detection is complemented by Zustand's persistence

This setup provides a robust, type-safe, and centralized way to manage language preferences while maintaining compatibility with react-i18next.
