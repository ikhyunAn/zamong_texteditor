import {
  validateEditorSettings,
  migrateEditorSettings,
  migrateProjectSettings,
  saveEditorSettings,
  loadEditorSettings,
  clearEditorSettings,
  exportEditorSettings,
  importEditorSettings,
  hasSettingsChanged,
  DEFAULT_EDITOR_SETTINGS
} from '../settings-utils';
import { EditorSettings } from '@/types';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock window.localStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

describe('Settings Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateEditorSettings', () => {
    it('should return complete settings with defaults for empty input', () => {
      const result = validateEditorSettings({});
      expect(result).toEqual(DEFAULT_EDITOR_SETTINGS);
    });

    it('should preserve provided values and fill missing ones with defaults', () => {
      const partial: Partial<EditorSettings> = {
        fontSize: 24,
        textAlignment: 'center'
      };

      const result = validateEditorSettings(partial);

      expect(result).toEqual({
        fontFamily: DEFAULT_EDITOR_SETTINGS.fontFamily,
        fontSize: 24,
        lineHeight: DEFAULT_EDITOR_SETTINGS.lineHeight,
        textAlignment: 'center',
        globalTextAlignment: 'center', // Should fall back to textAlignment
        verticalAlignment: DEFAULT_EDITOR_SETTINGS.verticalAlignment
      });
    });

    it('should prefer globalTextAlignment over textAlignment fallback', () => {
      const partial: Partial<EditorSettings> = {
        textAlignment: 'left',
        globalTextAlignment: 'right'
      };

      const result = validateEditorSettings(partial);
      expect(result.globalTextAlignment).toBe('right');
      expect(result.textAlignment).toBe('left');
    });
  });

  describe('migrateEditorSettings', () => {
    it('should return defaults for null or undefined input', () => {
      expect(migrateEditorSettings(null)).toEqual(DEFAULT_EDITOR_SETTINGS);
      expect(migrateEditorSettings(undefined)).toEqual(DEFAULT_EDITOR_SETTINGS);
      expect(migrateEditorSettings({})).toEqual(DEFAULT_EDITOR_SETTINGS);
    });

    it('should migrate valid legacy settings', () => {
      const legacy = {
        fontFamily: 'Arial',
        fontSize: 20,
        lineHeight: 1.6,
        textAlignment: 'center',
        verticalAlignment: 'middle'
      };

      const result = migrateEditorSettings(legacy);

      expect(result).toEqual({
        fontFamily: 'Arial',
        fontSize: 20,
        lineHeight: 1.6,
        textAlignment: 'center',
        globalTextAlignment: 'center', // Should be migrated from textAlignment
        verticalAlignment: 'middle'
      });
    });

    it('should validate and clamp font size within range', () => {
      const legacy = { fontSize: 100 }; // Over max
      const result = migrateEditorSettings(legacy);
      expect(result.fontSize).toBe(72);

      const legacy2 = { fontSize: 5 }; // Under min
      const result2 = migrateEditorSettings(legacy2);
      expect(result2.fontSize).toBe(8);
    });

    it('should validate and clamp line height within range', () => {
      const legacy = { lineHeight: 5.0 }; // Over max
      const result = migrateEditorSettings(legacy);
      expect(result.lineHeight).toBe(3.0);

      const legacy2 = { lineHeight: 0.5 }; // Under min
      const result2 = migrateEditorSettings(legacy2);
      expect(result2.lineHeight).toBe(1.0);
    });

    it('should ignore invalid alignment values', () => {
      const legacy = {
        textAlignment: 'invalid',
        verticalAlignment: 'wrong'
      };

      const result = migrateEditorSettings(legacy);
      expect(result.textAlignment).toBe(DEFAULT_EDITOR_SETTINGS.textAlignment);
      expect(result.verticalAlignment).toBe(DEFAULT_EDITOR_SETTINGS.verticalAlignment);
    });
  });

  describe('migrateProjectSettings', () => {
    it('should detect when migration is needed', () => {
      const legacy = {
        fontFamily: 'Arial',
        fontSize: 20,
        textAlignment: 'center'
        // Missing globalTextAlignment
      };

      const result = migrateProjectSettings(legacy);

      expect(result.wasMigrated).toBe(true);
      expect(result.migrationLog).toContain('Added globalTextAlignment field for backward compatibility');
      expect(result.settings.globalTextAlignment).toBe('center');
    });

    it('should not migrate when settings are already complete', () => {
      const complete: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 18,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const result = migrateProjectSettings(complete);
      expect(result.wasMigrated).toBe(false);
      expect(result.migrationLog).toHaveLength(0);
    });

    it('should log specific migration steps', () => {
      const legacy = {
        fontSize: 100, // Out of range
        lineHeight: 5.0, // Out of range
        // Missing other fields
      };

      const result = migrateProjectSettings(legacy);

      expect(result.wasMigrated).toBe(true);
      expect(result.migrationLog).toContain('Font size 100 was out of range, normalized to 72');
      expect(result.migrationLog).toContain('Line height 5 was out of range, normalized to 3');
      expect(result.migrationLog).toContain('Missing font family, set to default CustomFontTTF');
    });
  });

  describe('localStorage operations', () => {
    it('should save settings to localStorage', () => {
      const settings: EditorSettings = {
        ...DEFAULT_EDITOR_SETTINGS,
        fontSize: 20
      };

      saveEditorSettings(settings);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'zamong-editor-settings',
        JSON.stringify(settings)
      );
    });

    it('should load settings from localStorage', () => {
      const storedSettings: EditorSettings = {
        ...DEFAULT_EDITOR_SETTINGS,
        fontSize: 20
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSettings));

      const result = loadEditorSettings();
      expect(result).toEqual(storedSettings);
    });

    it('should return defaults when localStorage is empty', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = loadEditorSettings();
      expect(result).toEqual(DEFAULT_EDITOR_SETTINGS);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      const result = loadEditorSettings();
      expect(result).toEqual(DEFAULT_EDITOR_SETTINGS);
    });

    it('should clear settings from localStorage', () => {
      clearEditorSettings();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zamong-editor-settings');
    });
  });

  describe('import/export operations', () => {
    it('should export settings as formatted JSON', () => {
      const settings = DEFAULT_EDITOR_SETTINGS;
      const exported = exportEditorSettings(settings);
      const parsed = JSON.parse(exported);
      
      expect(parsed).toEqual(settings);
      expect(exported).toContain('\n'); // Should be formatted with newlines
    });

    it('should import settings from JSON string', () => {
      const settings = { ...DEFAULT_EDITOR_SETTINGS, fontSize: 24 };
      const jsonString = JSON.stringify(settings);
      
      const imported = importEditorSettings(jsonString);
      expect(imported).toEqual(settings);
    });

    it('should return defaults for invalid JSON', () => {
      const invalidJson = '{invalid json}';
      const imported = importEditorSettings(invalidJson);
      expect(imported).toEqual(DEFAULT_EDITOR_SETTINGS);
    });

    it('should migrate imported settings', () => {
      const legacySettings = {
        fontFamily: 'Arial',
        fontSize: 20,
        textAlignment: 'center'
        // Missing globalTextAlignment
      };
      
      const jsonString = JSON.stringify(legacySettings);
      const imported = importEditorSettings(jsonString);
      
      expect(imported.globalTextAlignment).toBe('center');
    });
  });

  describe('hasSettingsChanged', () => {
    it('should detect changes in settings', () => {
      const currentSettings = { ...DEFAULT_EDITOR_SETTINGS, fontSize: 24 };
      const storedSettings = DEFAULT_EDITOR_SETTINGS;
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(storedSettings));
      
      const hasChanged = hasSettingsChanged(currentSettings);
      expect(hasChanged).toBe(true);
    });

    it('should return false for identical settings', () => {
      const settings = DEFAULT_EDITOR_SETTINGS;
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(settings));
      
      const hasChanged = hasSettingsChanged(settings);
      expect(hasChanged).toBe(false);
    });

    it('should return true when no stored settings exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const hasChanged = hasSettingsChanged(DEFAULT_EDITOR_SETTINGS);
      expect(hasChanged).toBe(false); // Defaults match defaults
    });
  });
});
