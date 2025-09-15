# Settings Management System

This document outlines the settings validation, migration, and persistence system for the Zamong Text Editor.

## Overview

The settings management system provides:
- **Validation**: Ensures all settings are valid and complete
- **Migration**: Automatically migrates settings from older versions
- **Persistence**: Saves and loads settings from localStorage
- **Import/Export**: Allows users to share and backup settings

## Core Components

### 1. Settings Utilities (`src/lib/settings-utils.ts`)

#### Key Functions

- `validateEditorSettings(settings)` - Validates and fills missing settings with defaults
- `migrateEditorSettings(legacySettings)` - Migrates old settings to current format
- `saveEditorSettings(settings)` - Saves settings to localStorage  
- `loadEditorSettings()` - Loads settings from localStorage
- `exportEditorSettings(settings)` - Exports settings as JSON string
- `importEditorSettings(jsonString)` - Imports settings from JSON string

#### Default Settings

```typescript
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontFamily: 'KoPubWorldBatangLight',
  fontSize: 32,
  lineHeight: 1.8,
  textAlignment: 'left',
  globalTextAlignment: 'left',
  verticalAlignment: 'top'
};
```

### 2. Store Integration (`src/store/useStoryStore.ts`)

The store automatically handles:
- Loading persisted settings on initialization
- Auto-saving settings when they change
- Settings validation on updates
- Migration when legacy settings are detected

### 3. React Hooks (`src/hooks/useEditorSettings.ts`)

#### `useEditorSettings()`

Primary hook for settings management:

```typescript
const {
  settings,           // Current settings
  updateSettings,     // Update settings function
  saveSettings,       // Manually save settings
  resetToDefaults,    // Reset to default settings
  exportSettings,     // Export as JSON string
  importSettings,     // Import from JSON string
  downloadSettings,   // Download as JSON file
  uploadSettings,     // Upload from file
  hasUnsavedChanges   // Check if settings changed
} = useEditorSettings();
```

#### `useSettingsMigration()`

Hook for settings migration:

```typescript
const { checkAndMigrate } = useSettingsMigration();

const result = await checkAndMigrate(legacySettings);
// Returns: { success: boolean, settings: EditorSettings, wasMigrated: boolean }
```

### 4. UI Component (`src/components/ui/settings-manager.tsx`)

Complete settings management interface with:
- Current settings display
- Import/Export functionality
- Reset options
- Migration testing
- Status messages

## Usage Examples

### Basic Settings Update

```typescript
import { useStoryStore } from '@/store/useStoryStore';

const { updateEditorSettings } = useStoryStore();

// Update font size
updateEditorSettings({ fontSize: 24 });

// Update alignment
updateEditorSettings({ 
  textAlignment: 'center',
  globalTextAlignment: 'center' 
});
```

### Settings Persistence

```typescript
import { useEditorSettings } from '@/hooks/useEditorSettings';

const { 
  saveSettings, 
  loadSettings,
  hasUnsavedChanges 
} = useEditorSettings();

// Check if settings need saving
if (hasUnsavedChanges()) {
  saveSettings();
}

// Manually reload settings
loadSettings();
```

### Import/Export Settings

```typescript
import { useEditorSettings } from '@/hooks/useEditorSettings';

const { 
  exportSettings, 
  importSettings,
  downloadSettings,
  uploadSettings 
} = useEditorSettings();

// Export current settings
const jsonSettings = exportSettings();
console.log(jsonSettings);

// Import settings from JSON
const result = importSettings(jsonString);
if (result.success) {
  console.log('Settings imported successfully!');
}

// Download settings as file
downloadSettings();

// Upload settings from file
const uploadResult = await uploadSettings();
```

### Migration Handling

```typescript
import { useSettingsMigration } from '@/hooks/useEditorSettings';

const { checkAndMigrate } = useSettingsMigration();

// Migrate legacy settings
const legacySettings = {
  fontFamily: 'Arial',
  fontSize: 20,
  textAlignment: 'center'
  // Missing globalTextAlignment and other new fields
};

const result = await checkAndMigrate(legacySettings);

if (result?.wasMigrated) {
  console.log('Settings were migrated successfully');
  console.log('Migration details:', result.migrationLog);
}
```

## Migration Scenarios

The system automatically handles these migration scenarios:

1. **Missing globalTextAlignment**: Uses textAlignment as fallback
2. **Out-of-range fontSize**: Clamps to 8-72 pixel range
3. **Out-of-range lineHeight**: Clamps to 1.0-3.0 range
4. **Missing fields**: Fills with appropriate defaults
5. **Invalid alignment values**: Replaces with defaults

## Validation Rules

- **fontSize**: 8-72 pixels
- **lineHeight**: 1.0-3.0
- **textAlignment**: 'left' | 'center' | 'right'
- **globalTextAlignment**: 'left' | 'center' | 'right'
- **verticalAlignment**: 'top' | 'middle' | 'bottom'
- **fontFamily**: Any valid string (defaults to 'CustomFontTTF')

## Error Handling

The system gracefully handles:
- localStorage unavailable (SSR/privacy mode)
- Corrupted settings data
- Invalid JSON import
- Missing settings fields
- Network errors during file operations

All errors are logged with warnings but don't crash the application.

## Testing

Comprehensive test suite covers:
- Settings validation
- Migration scenarios  
- localStorage operations
- Import/export functionality
- Error handling

Run tests with:
```bash
npm test -- src/lib/__tests__/settings-utils.test.ts
```

## Browser Support

- Chrome/Edge 87+
- Firefox 78+
- Safari 14+

Requires localStorage support. Falls back to defaults in unsupported environments.
