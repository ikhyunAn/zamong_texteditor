import { EditorSettings } from '@/types';

// Key for localStorage
const EDITOR_SETTINGS_KEY = 'zamong-editor-settings';

/**
 * Default editor settings that match the store's initiexport function migrateProjectSettings(existingSettings: unknown): {
  settings: EditorSettings;
  wasMigrated: boolean;
  migrationLog: string[];
} {ate
 */
export const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontFamily: 'KoPubWorldBatangLight',
  fontSize: 32,
  lineHeight: 1.8,
  textAlignment: 'left',
  globalTextAlignment: 'left',
  verticalAlignment: 'top'
};

/**
 * Validates and normalizes editor settings, ensuring backward compatibility
 * @param settings Partial editor settings to validate
 * @param existingSettings Optional existing settings to merge with (for partial updates)
 * @returns Complete, validated EditorSettings object
 */
export function validateEditorSettings(
  settings: Partial<EditorSettings>,
  existingSettings?: EditorSettings
): EditorSettings {
  const base = existingSettings || DEFAULT_EDITOR_SETTINGS;
  
  return {
    fontFamily: settings.fontFamily !== undefined ? settings.fontFamily : base.fontFamily,
    fontSize: settings.fontSize !== undefined ? settings.fontSize : base.fontSize,
    lineHeight: settings.lineHeight !== undefined ? settings.lineHeight : base.lineHeight,
    textAlignment: settings.textAlignment !== undefined ? settings.textAlignment : base.textAlignment,
    globalTextAlignment: settings.globalTextAlignment !== undefined ? settings.globalTextAlignment : 
                        (settings.textAlignment !== undefined ? settings.textAlignment : base.globalTextAlignment),
    verticalAlignment: settings.verticalAlignment !== undefined ? settings.verticalAlignment : base.verticalAlignment
  };
}

/**
 * Migrates legacy editor settings to current format
 * @param legacySettings Settings from older versions
 * @returns Migrated and validated settings
 */
export function migrateEditorSettings(legacySettings: unknown): EditorSettings {
  // Handle cases where settings might be undefined or null
  if (!legacySettings || typeof legacySettings !== 'object') {
    return { ...DEFAULT_EDITOR_SETTINGS };
  }

  // Type guard to safely access properties
  const settings = legacySettings as Record<string, unknown>;
  const migrated: Partial<EditorSettings> = {};

  // Font family migration
  if (settings.fontFamily && typeof settings.fontFamily === 'string') {
    migrated.fontFamily = settings.fontFamily;
  }

  // Font size migration with validation
  if (typeof settings.fontSize === 'number' && settings.fontSize > 0) {
    migrated.fontSize = Math.max(8, Math.min(72, settings.fontSize));
  }

  // Line height migration with validation
  if (typeof settings.lineHeight === 'number' && settings.lineHeight > 0) {
    migrated.lineHeight = Math.max(1.0, Math.min(3.0, settings.lineHeight));
  }

  // Text alignment migration
  if (settings.textAlignment && 
      ['left', 'center', 'right'].includes(settings.textAlignment as string)) {
    migrated.textAlignment = settings.textAlignment as 'left' | 'center' | 'right';
  }

  // Global text alignment migration (new field, fall back to textAlignment if not present)
  if (settings.globalTextAlignment && 
      ['left', 'center', 'right'].includes(settings.globalTextAlignment as string)) {
    migrated.globalTextAlignment = settings.globalTextAlignment as 'left' | 'center' | 'right';
  } else if (migrated.textAlignment) {
    // For backward compatibility, use textAlignment as globalTextAlignment
    migrated.globalTextAlignment = migrated.textAlignment;
  }

  // Vertical alignment migration
  if (settings.verticalAlignment && 
      ['top', 'middle', 'bottom'].includes(settings.verticalAlignment as string)) {
    migrated.verticalAlignment = settings.verticalAlignment as 'top' | 'middle' | 'bottom';
  }

  return validateEditorSettings(migrated);
}

/**
 * Saves editor settings to localStorage
 * @param settings Editor settings to save
 */
export function saveEditorSettings(settings: EditorSettings): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const serialized = JSON.stringify(settings);
      localStorage.setItem(EDITOR_SETTINGS_KEY, serialized);
    }
  } catch (error) {
    console.warn('Failed to save editor settings to localStorage:', error);
  }
}

/**
 * Loads editor settings from localStorage
 * @returns Validated editor settings or defaults if none found
 */
export function loadEditorSettings(): EditorSettings {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(EDITOR_SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return migrateEditorSettings(parsed);
      }
    }
  } catch (error) {
    console.warn('Failed to load editor settings from localStorage:', error);
  }
  
  return { ...DEFAULT_EDITOR_SETTINGS };
}

/**
 * Clears editor settings from localStorage
 */
export function clearEditorSettings(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(EDITOR_SETTINGS_KEY);
    }
  } catch (error) {
    console.warn('Failed to clear editor settings from localStorage:', error);
  }
}

/**
 * Exports editor settings as a JSON string
 * @param settings Editor settings to export
 * @returns JSON string representation of settings
 */
export function exportEditorSettings(settings: EditorSettings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * Imports editor settings from a JSON string
 * @param jsonString JSON string containing editor settings
 * @returns Validated editor settings
 */
export function importEditorSettings(jsonString: string): EditorSettings {
  try {
    const parsed = JSON.parse(jsonString);
    return migrateEditorSettings(parsed);
  } catch (error) {
    console.warn('Failed to import editor settings:', error);
    return { ...DEFAULT_EDITOR_SETTINGS };
  }
}

/**
 * Checks if the current settings differ from the stored settings
 * @param currentSettings Current editor settings
 * @returns True if settings have changed and should be saved
 */
export function hasSettingsChanged(currentSettings: EditorSettings): boolean {
  const storedSettings = loadEditorSettings();
  return JSON.stringify(currentSettings) !== JSON.stringify(storedSettings);
}

/**
 * Migration check for existing projects - validates and migrates if needed
 * @param existingSettings Settings from existing project
 * @returns Object containing migrated settings and migration info
 */
export function migrateProjectSettings(existingSettings: Partial<EditorSettings> | Record<string, unknown>): {
  settings: EditorSettings;
  wasMigrated: boolean;
  migrationLog: string[];
} {
  const migrationLog: string[] = [];
  let wasMigrated = false;

  if (!existingSettings) {
    migrationLog.push('No existing settings found, using defaults');
    return {
      settings: { ...DEFAULT_EDITOR_SETTINGS },
      wasMigrated: false,
      migrationLog
    };
  }

  const originalJson = JSON.stringify(existingSettings);
  const migratedSettings = migrateEditorSettings(existingSettings);
  const migratedJson = JSON.stringify(migratedSettings);

  if (originalJson !== migratedJson) {
    wasMigrated = true;
    
        // Log specific migrations
    if (!('globalTextAlignment' in existingSettings)) {
      migrationLog.push('Added globalTextAlignment field for backward compatibility');
    }
    
    if ('fontSize' in existingSettings && typeof existingSettings.fontSize === 'number' && 
        (existingSettings.fontSize < 8 || existingSettings.fontSize > 72)) {
      migrationLog.push(`Font size ${existingSettings.fontSize} was out of range, normalized to ${migratedSettings.fontSize}`);
    }
    
    if ('lineHeight' in existingSettings && typeof existingSettings.lineHeight === 'number' && 
        (existingSettings.lineHeight < 1.0 || existingSettings.lineHeight > 3.0)) {
      migrationLog.push(`Line height ${existingSettings.lineHeight} was out of range, normalized to ${migratedSettings.lineHeight}`);
    }
    
    if (!('fontFamily' in existingSettings)) {
      migrationLog.push('Missing font family, set to default CustomFontTTF');
    }
    
    if (!('textAlignment' in existingSettings)) {
      migrationLog.push('Missing text alignment, set to default left');
    }
    
    if (!('verticalAlignment' in existingSettings)) {
      migrationLog.push('Missing vertical alignment, set to default middle');
    }
  }

  return {
    settings: migratedSettings,
    wasMigrated,
    migrationLog
  };
}
