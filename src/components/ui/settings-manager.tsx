"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { useEditorSettings, useSettingsMigration } from '@/hooks/useEditorSettings';
import { EditorSettings } from '@/types';

interface SettingsManagerProps {
  onSettingsChange?: (settings: EditorSettings) => void;
  showMigrationStatus?: boolean;
}

export function SettingsManager({ 
  onSettingsChange, 
  showMigrationStatus = true 
}: SettingsManagerProps) {
  const {
    settings,
    saveSettings,
    resetToDefaults,
    clearStoredSettings,
    exportSettings,
    importSettings,
    downloadSettings,
    uploadSettings,
    hasUnsavedChanges
  } = useEditorSettings();

  const { checkAndMigrate } = useSettingsMigration();

  const [migrationStatus, setMigrationStatus] = useState<{
    wasMigrated: boolean;
    migrationLog: string[];
  } | null>(null);

  const [importStatus, setImportStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleImportFromText = () => {
    const jsonText = prompt('Paste your settings JSON here:');
    if (!jsonText) return;

    const result = importSettings(jsonText);
    setImportStatus({
      success: result.success,
      message: result.success ? 'Settings imported successfully!' : result.error || 'Import failed'
    });

    if (result.success && onSettingsChange) {
      onSettingsChange(result.settings!);
    }

    // Clear status after 3 seconds
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleUploadSettings = async () => {
    try {
      const result = await uploadSettings();
      setImportStatus({
        success: result.success,
        message: result.success ? 'Settings uploaded successfully!' : result.error || 'Upload failed'
      });

      if (result.success && onSettingsChange) {
        onSettingsChange(result.settings!);
      }
    } catch (error) {
      console.error('Settings upload error:', error);
      setImportStatus({
        success: false,
        message: 'Failed to upload settings'
      });
    }

    // Clear status after 3 seconds
    setTimeout(() => setImportStatus(null), 3000);
  };

  const handleMigrationCheck = async () => {
    // Simulate checking legacy settings
    const legacySettings = {
      fontFamily: 'Arial',
      fontSize: 20,
      textAlignment: 'center',
      // Missing globalTextAlignment and other new fields
    };

    const result = await checkAndMigrate(legacySettings);
    if (result) {
      setMigrationStatus({
        wasMigrated: result.success || false,
        migrationLog: result.success ? ['Settings migrated successfully'] : [result.error || 'Migration failed']
      });
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      resetToDefaults();
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    }
  };

  const handleClearStoredSettings = () => {
    if (confirm('Are you sure you want to clear all stored settings? This will reset everything to defaults.')) {
      clearStoredSettings();
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Settings Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Current Editor Settings
            {hasUnsavedChanges() && (
              <Badge variant="secondary">Unsaved Changes</Badge>
            )}
          </CardTitle>
          <CardDescription>
            Manage your editor preferences and settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Font Family:</span> {settings.fontFamily}
            </div>
            <div>
              <span className="font-medium">Font Size:</span> {settings.fontSize}px
            </div>
            <div>
              <span className="font-medium">Line Height:</span> {settings.lineHeight}
            </div>
            <div>
              <span className="font-medium">Text Alignment:</span> {settings.textAlignment}
            </div>
            <div>
              <span className="font-medium">Global Alignment:</span> {settings.globalTextAlignment}
            </div>
            <div>
              <span className="font-medium">Vertical Alignment:</span> {settings.verticalAlignment}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Management</CardTitle>
          <CardDescription>
            Save, load, import, and export your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={saveSettings} variant="outline">
              Save Settings
            </Button>
            
            <Button onClick={downloadSettings} variant="outline">
              Download Settings
            </Button>
            
            <Button onClick={handleUploadSettings} variant="outline">
              Upload Settings
            </Button>
            
            <Button onClick={handleImportFromText} variant="outline">
              Import from Text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset/Clear Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Reset Options</CardTitle>
          <CardDescription>
            Reset or clear your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button onClick={handleResetSettings} variant="destructive">
              Reset to Defaults
            </Button>
            
            <Button onClick={handleClearStoredSettings} variant="destructive">
              Clear Stored Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Migration Testing (Development/Debug) */}
      {showMigrationStatus && (
        <Card>
          <CardHeader>
            <CardTitle>Migration Testing</CardTitle>
            <CardDescription>
              Test settings migration functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleMigrationCheck} variant="outline">
              Test Migration
            </Button>
            
            {migrationStatus && (
              <div className="mt-3 p-3 rounded bg-muted">
                <div className="font-medium">
                  Migration Status: {migrationStatus.wasMigrated ? 'Migrated' : 'No Migration Needed'}
                </div>
                {migrationStatus.migrationLog.length > 0 && (
                  <ul className="mt-2 text-sm list-disc list-inside">
                    {migrationStatus.migrationLog.map((log, index) => (
                      <li key={index}>{log}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Status Messages */}
      {importStatus && (
        <Card className={importStatus.success ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="pt-6">
            <div className={`text-sm ${importStatus.success ? 'text-green-700' : 'text-red-700'}`}>
              {importStatus.message}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Export Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Settings Export Preview</CardTitle>
          <CardDescription>
            Current settings in JSON format
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-40">
            {exportSettings()}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
