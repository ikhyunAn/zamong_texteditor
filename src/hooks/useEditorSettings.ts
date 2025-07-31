import { useCallback, useEffect } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { 
  exportEditorSettings, 
  importEditorSettings, 
  hasSettingsChanged,
  clearEditorSettings 
} from '@/lib/settings-utils';
import { EditorSettings } from '@/types';

/**
 * Custom hook for managing editor settings with persistence
 */
export function useEditorSettings() {
  const {
    editorSettings,
    updateEditorSettings,
    loadPersistedSettings,
    saveCurrentSettings,
    validateAndMigrateSettings,
    resetSettingsToDefaults
  } = useStoryStore();

  // Load persisted settings on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadPersistedSettings();
    }
  }, [loadPersistedSettings]);

  // Export settings as JSON string
  const exportSettings = useCallback(() => {
    return exportEditorSettings(editorSettings);
  }, [editorSettings]);

  // Import settings from JSON string
  const importSettings = useCallback((jsonString: string) => {
    try {
      const importedSettings = importEditorSettings(jsonString);
      updateEditorSettings(importedSettings);
      return { success: true, settings: importedSettings };
    } catch (error) {
      console.error('Failed to import settings:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [updateEditorSettings]);

  // Check if current settings differ from stored settings
  const hasUnsavedChanges = useCallback(() => {
    return hasSettingsChanged(editorSettings);
  }, [editorSettings]);

  // Save current settings manually
  const saveSettings = useCallback(() => {
    saveCurrentSettings();
  }, [saveCurrentSettings]);

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    resetSettingsToDefaults();
  }, [resetSettingsToDefaults]);

  // Clear all stored settings
  const clearStoredSettings = useCallback(() => {
    clearEditorSettings();
    resetToDefaults();
  }, [resetToDefaults]);

  // Migrate legacy settings
  const migrateSettings = useCallback((legacySettings: any) => {
    return validateAndMigrateSettings(legacySettings);
  }, [validateAndMigrateSettings]);

  // Download settings as JSON file
  const downloadSettings = useCallback(() => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'zamong-editor-settings.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [exportSettings]);

  // Upload and import settings from file
  const uploadSettings = useCallback(() => {
    return new Promise<{ success: boolean; error?: string; settings?: EditorSettings }>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve({ success: false, error: 'No file selected' });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const result = importSettings(content);
            resolve(result);
          } catch (error) {
            resolve({ 
              success: false, 
              error: error instanceof Error ? error.message : 'Failed to read file' 
            });
          }
        };
        
        reader.onerror = () => {
          resolve({ success: false, error: 'Failed to read file' });
        };
        
        reader.readAsText(file);
      };
      
      input.click();
    });
  }, [importSettings]);

  return {
    // Current settings
    settings: editorSettings,
    
    // Update functions
    updateSettings: updateEditorSettings,
    
    // Persistence functions
    saveSettings,
    loadSettings: loadPersistedSettings,
    resetToDefaults,
    clearStoredSettings,
    
    // Import/Export functions
    exportSettings,
    importSettings,
    downloadSettings,
    uploadSettings,
    
    // Migration functions
    migrateSettings,
    
    // Status functions
    hasUnsavedChanges
  };
}

/**
 * Hook for components that need to check for settings migration on mount
 */
export function useSettingsMigration() {
  const { validateAndMigrateSettings } = useStoryStore();

  const checkAndMigrate = useCallback(async (existingSettings?: any) => {
    if (!existingSettings) {
      return null;
    }

    try {
      const migratedSettings = validateAndMigrateSettings(existingSettings);
      return {
        success: true,
        settings: migratedSettings,
        wasMigrated: JSON.stringify(existingSettings) !== JSON.stringify(migratedSettings)
      };
    } catch (error) {
      console.error('Settings migration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      };
    }
  }, [validateAndMigrateSettings]);

  return { checkAndMigrate };
}
