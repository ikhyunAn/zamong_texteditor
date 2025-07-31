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
    // loadPersistedSettings, // Not available in current store
    // saveCurrentSettings, // Not available in current store
    // validateAndMigrateSettings, // Not available in current store
    // resetSettingsToDefaults // Not available in current store
  } = useStoryStore();

  // Load persisted settings on mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Settings loading would be implemented here if store had the method
      console.log('Settings loading not implemented in store');
    }
  }, []);

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
    // Settings saving would be implemented here if store had the method
    console.log('Settings saving not implemented in store');
  }, []);

  // Reset to default settings
  const resetToDefaults = useCallback(() => {
    // Reset to defaults would be implemented here if store had the method
    console.log('Reset to defaults not implemented in store');
  }, []);

  // Clear all stored settings
  const clearStoredSettings = useCallback(() => {
    clearEditorSettings();
    resetToDefaults();
  }, [resetToDefaults]);

  // Migrate legacy settings
  const migrateSettings = useCallback((legacySettings: unknown) => {
    // Migration would be implemented here if store had the method
    console.log('Settings migration not implemented in store', legacySettings);
    return { success: false, error: 'Migration not implemented' };
  }, []);

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
    loadSettings: () => console.log('Load settings not implemented'),
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
  // Note: validateAndMigrateSettings not available in current store implementation

  const checkAndMigrate = useCallback(async (existingSettings?: unknown) => {
    if (!existingSettings) {
      return null;
    }

    try {
      // Migration would be implemented here if store had the method
      console.log('Settings migration not implemented in store', existingSettings);
      return {
        success: false,
        error: 'Migration not implemented in current store'
      };
    } catch (error) {
      console.error('Settings migration failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration failed'
      };
    }
  }, []);

  return { checkAndMigrate };
}
