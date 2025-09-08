/**
 * Server-side font loading utilities for Google Cloud Run deployment
 * 
 * This module provides enhanced font loading that works in both client-side 
 * and server-side environments, including containerized deployments.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface FontConfig {
  name: string;
  url: string;
  path?: string;
  data?: ArrayBuffer;
}

// Font configurations with both client and server paths
export const FONT_CONFIGS: FontConfig[] = [
  {
    name: 'HakgyoansimBareonbatangB',
    url: '/fonts/HakgyoansimBareonbatangB.ttf',
    path: 'public/fonts/HakgyoansimBareonbatangB.ttf'
  },
  {
    name: 'HakgyoansimBareonbatangR', 
    url: '/fonts/HakgyoansimBareonbatangR.ttf',
    path: 'public/fonts/HakgyoansimBareonbatangR.ttf'
  },
  {
    name: 'CustomFont',
    url: '/fonts/author-handwriting-font.ttf',
    path: 'public/fonts/author-handwriting-font.ttf'
  },
  {
    name: 'CustomFontTTF', // Legacy alias
    url: '/fonts/HakgyoansimBareonbatangB.ttf', 
    path: 'public/fonts/HakgyoansimBareonbatangB.ttf'
  }
];

/**
 * Check if we're running in a server environment
 */
export function isServerEnvironment(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if we're running in a browser environment
 */
export function isBrowserEnvironment(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * Load font file as ArrayBuffer (server-side)
 */
export async function loadFontFileBuffer(fontPath: string): Promise<ArrayBuffer> {
  try {
    // Try different possible paths for the font file
    const possiblePaths = [
      fontPath,
      path.join(process.cwd(), fontPath),
      path.join(process.cwd(), 'public', fontPath.replace('/fonts/', 'fonts/')),
      path.join(__dirname, '../../public', fontPath.replace('/fonts/', 'fonts/'))
    ];

    let buffer: Buffer | null = null;
    let usedPath = '';

    for (const testPath of possiblePaths) {
      try {
        buffer = await fs.readFile(testPath);
        usedPath = testPath;
        console.log(`Successfully loaded font from: ${usedPath}`);
        break;
      } catch (error) {
        console.warn(`Failed to load font from ${testPath}:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    if (!buffer) {
      throw new Error(`Font file not found at any of the attempted paths: ${possiblePaths.join(', ')}`);
    }

    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  } catch (error) {
    console.error(`Failed to load font file ${fontPath}:`, error);
    throw error;
  }
}

/**
 * Load font using fetch (client-side)
 */
export async function loadFontViaFetch(fontUrl: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`Failed to fetch font ${fontUrl}:`, error);
    throw error;
  }
}

/**
 * Load a single font with cross-environment support
 */
export async function loadFontCrossEnvironment(config: FontConfig): Promise<FontConfig> {
  try {
    let fontData: ArrayBuffer;

    if (isServerEnvironment()) {
      // Server-side: Load from file system
      console.log(`Loading font ${config.name} from server filesystem...`);
      fontData = await loadFontFileBuffer(config.path || config.url);
    } else {
      // Client-side: Load via fetch
      console.log(`Loading font ${config.name} via fetch...`);
      fontData = await loadFontViaFetch(config.url);
    }

    return {
      ...config,
      data: fontData
    };
  } catch (error) {
    console.warn(`Failed to load font ${config.name}:`, error);
    throw error;
  }
}

/**
 * Load all fonts with cross-environment support
 */
export async function loadAllFontsCrossEnvironment(): Promise<FontConfig[]> {
  const loadedFonts: FontConfig[] = [];
  const errors: Error[] = [];

  console.log('Loading fonts for cross-environment support...');

  for (const config of FONT_CONFIGS) {
    try {
      const loadedFont = await loadFontCrossEnvironment(config);
      loadedFonts.push(loadedFont);
      console.log(`✅ Successfully loaded font: ${config.name}`);
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(`Failed to load ${config.name}`));
      console.error(`❌ Failed to load font: ${config.name}`, error);
    }
  }

  if (errors.length > 0) {
    console.warn(`Font loading completed with ${errors.length} errors out of ${FONT_CONFIGS.length} fonts`);
  } else {
    console.log(`✅ All ${FONT_CONFIGS.length} fonts loaded successfully`);
  }

  return loadedFonts;
}

/**
 * Register fonts in the browser FontFace API
 */
export async function registerFontsInBrowser(fonts: FontConfig[]): Promise<void> {
  if (!isBrowserEnvironment()) {
    console.warn('registerFontsInBrowser called in non-browser environment');
    return;
  }

  for (const font of fonts) {
    if (!font.data) {
      console.warn(`Skipping font ${font.name}: no data available`);
      continue;
    }

    try {
      // Check if font is already loaded
      if (document.fonts.check(`16px "${font.name}"`)) {
        console.log(`Font ${font.name} already registered`);
        continue;
      }

      // Create and register the font face
      const fontFace = new FontFace(font.name, font.data);
      await fontFace.load();
      
      document.fonts.add(fontFace);
      console.log(`✅ Registered font in browser: ${font.name}`);
    } catch (error) {
      console.error(`Failed to register font ${font.name} in browser:`, error);
    }
  }

  // Wait for all fonts to be ready
  try {
    await document.fonts.ready;
    console.log('All fonts are ready in the browser');
  } catch (error) {
    console.warn('Error waiting for fonts to be ready:', error);
  }
}

/**
 * Get fallback font name if preferred font is not available
 */
export function getFallbackFont(preferredFont: string): string {
  // In server environment, always return the preferred font since we load them all
  if (isServerEnvironment()) {
    return preferredFont;
  }

  // In browser environment, check if font is loaded
  if (isBrowserEnvironment()) {
    try {
      if (document.fonts.check(`16px "${preferredFont}"`)) {
        return preferredFont;
      }
    } catch (error) {
      console.warn(`Error checking font availability for ${preferredFont}:`, error);
    }
  }

  // Return fallback
  return 'Arial, Helvetica, sans-serif';
}

/**
 * Comprehensive font loading for both server and client environments
 */
export async function initializeFonts(): Promise<FontConfig[]> {
  try {
    console.log('Initializing fonts for cross-environment support...');
    
    // Load all fonts
    const loadedFonts = await loadAllFontsCrossEnvironment();
    
    // If in browser, register fonts
    if (isBrowserEnvironment()) {
      await registerFontsInBrowser(loadedFonts);
    }
    
    console.log('Font initialization completed');
    return loadedFonts;
  } catch (error) {
    console.error('Font initialization failed:', error);
    throw error;
  }
}

/**
 * Check if all required fonts are loaded
 */
export function checkFontAvailability(): { [fontName: string]: boolean } {
  const results: { [fontName: string]: boolean } = {};
  
  if (!isBrowserEnvironment()) {
    // In server environment, assume all fonts are available
    FONT_CONFIGS.forEach(config => {
      results[config.name] = true;
    });
    return results;
  }

  // In browser environment, check each font
  FONT_CONFIGS.forEach(config => {
    try {
      results[config.name] = document.fonts.check(`16px "${config.name}"`);
    } catch (error) {
      console.warn(`Error checking availability of font ${config.name}:`, error);
      results[config.name] = false;
    }
  });

  return results;
}
