/**
 * Embedded Fonts for Cloud Deployment
 * 
 * This module provides base64-encoded font data for critical fonts
 * to ensure they work reliably in cloud environments where file serving
 * might be inconsistent.
 */

import { promises as fs } from 'fs';
import path from 'path';

export interface EmbeddedFont {
  name: string;
  family: string;
  purpose: 'title' | 'body' | 'author';
  base64Data?: string;
  mimeType: string;
  fallbacks: string[];
}

/**
 * Font configurations for embedding
 */
export const EMBEDDABLE_FONTS: Omit<EmbeddedFont, 'base64Data'>[] = [
  {
    name: 'CustomFont',
    family: 'CustomFont',
    purpose: 'author',
    mimeType: 'font/truetype',
    fallbacks: ['Malgun Gothic', 'Apple SD Gothic Neo', 'NanumGothic', 'cursive', 'sans-serif']
  },
  {
    name: 'HakgyoansimBareonbatangB',
    family: 'HakgyoansimBareonbatangB', 
    purpose: 'title',
    mimeType: 'font/truetype',
    fallbacks: ['Malgun Gothic', 'Apple SD Gothic Neo', 'NanumGothic', 'serif', 'sans-serif']
  }
];

/**
 * Check if we can read font files (server-side only)
 */
export function canReadFontFiles(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined';
}

/**
 * Convert font file to base64 (server-side utility)
 */
export async function fontFileToBase64(filePath: string): Promise<string> {
  if (!canReadFontFiles()) {
    throw new Error('Font file reading only available on server side');
  }

  try {
    const fullPath = path.join(process.cwd(), 'public', filePath);
    const fontBuffer = await fs.readFile(fullPath);
    return fontBuffer.toString('base64');
  } catch (error) {
    console.error(`Failed to convert font file ${filePath} to base64:`, error);
    throw error;
  }
}

/**
 * Generate CSS with embedded fonts
 */
export function generateEmbeddedFontCSS(fonts: EmbeddedFont[]): string {
  return fonts
    .filter(font => font.base64Data)
    .map(font => `
@font-face {
  font-family: "${font.family}";
  src: url("data:${font.mimeType};base64,${font.base64Data}") format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`)
    .join('\n');
}

/**
 * Load embedded font into document.fonts
 */
export async function loadEmbeddedFont(font: EmbeddedFont): Promise<boolean> {
  if (typeof window === 'undefined' || !font.base64Data) {
    return false;
  }

  try {
    // Check if already loaded
    if (document.fonts.check(`16px "${font.family}"`)) {
      console.log(`[Embedded Fonts] ${font.family} already loaded`);
      return true;
    }

    // Create data URL
    const dataUrl = `data:${font.mimeType};base64,${font.base64Data}`;
    
    // Create and load FontFace
    const fontFace = new FontFace(font.family, `url("${dataUrl}")`);
    await fontFace.load();
    
    // Add to document fonts
    document.fonts.add(fontFace);
    
    // Verify it's available
    const isAvailable = document.fonts.check(`16px "${font.family}"`);
    
    if (isAvailable) {
      console.log(`[Embedded Fonts] ✅ Successfully loaded ${font.family} from base64`);
      return true;
    } else {
      console.warn(`[Embedded Fonts] ❌ Font ${font.family} loaded but not available`);
      return false;
    }
    
  } catch (error) {
    console.error(`[Embedded Fonts] Failed to load ${font.family}:`, error);
    return false;
  }
}

/**
 * Load all embedded fonts
 */
export async function loadAllEmbeddedFonts(
  fonts: EmbeddedFont[],
  onProgress?: (loaded: number, total: number, current: string) => void
): Promise<{ loaded: string[]; failed: string[] }> {
  const loaded: string[] = [];
  const failed: string[] = [];
  
  console.log(`[Embedded Fonts] Loading ${fonts.length} embedded fonts...`);
  
  for (let i = 0; i < fonts.length; i++) {
    const font = fonts[i];
    
    onProgress?.(i, fonts.length, font.family);
    
    const success = await loadEmbeddedFont(font);
    
    if (success) {
      loaded.push(font.family);
    } else {
      failed.push(font.family);
    }
  }
  
  onProgress?.(fonts.length, fonts.length, '');
  
  console.log(`[Embedded Fonts] Completed: ${loaded.length} loaded, ${failed.length} failed`);
  
  return { loaded, failed };
}

/**
 * Inject embedded font CSS into document head
 */
export function injectEmbeddedFontCSS(fonts: EmbeddedFont[]): void {
  if (typeof document === 'undefined') return;
  
  const css = generateEmbeddedFontCSS(fonts);
  
  if (!css.trim()) {
    console.warn('[Embedded Fonts] No font data to inject');
    return;
  }
  
  // Remove existing embedded font styles
  const existingStyle = document.getElementById('embedded-fonts');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  // Create and inject new style element
  const styleElement = document.createElement('style');
  styleElement.id = 'embedded-fonts';
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
  
  console.log(`[Embedded Fonts] Injected CSS for ${fonts.length} fonts`);
}

/**
 * Get best available font with embedded fonts as priority
 */
export function getBestEmbeddedFont(
  purpose: 'title' | 'body' | 'author',
  embeddedFonts: EmbeddedFont[]
): string {
  // First try embedded fonts for this purpose
  const embeddedForPurpose = embeddedFonts.filter(f => f.purpose === purpose);
  
  for (const font of embeddedForPurpose) {
    if (typeof document !== 'undefined' && document.fonts.check(`16px "${font.family}"`)) {
      console.log(`[Embedded Fonts] Using embedded font ${font.family} for ${purpose}`);
      return font.family;
    }
  }
  
  // Try fallbacks from the first font config
  if (embeddedForPurpose.length > 0) {
    const fallbacks = embeddedForPurpose[0].fallbacks;
    
    for (const fallback of fallbacks) {
      if (typeof document !== 'undefined' && document.fonts.check(`16px "${fallback}"`)) {
        console.log(`[Embedded Fonts] Using fallback font ${fallback} for ${purpose}`);
        return fallback;
      }
    }
  }
  
  // Ultimate fallbacks by purpose
  const ultimateFallbacks = {
    author: 'cursive',
    title: 'serif', 
    body: 'sans-serif'
  };
  
  console.warn(`[Embedded Fonts] Using ultimate fallback ${ultimateFallbacks[purpose]} for ${purpose}`);
  return ultimateFallbacks[purpose];
}

/**
 * Emergency font loading for cloud environments
 * This is a simplified approach that tries multiple strategies
 */
export async function emergencyFontLoad(
  fontConfigs: { name: string; purpose: 'title' | 'body' | 'author'; filename: string }[]
): Promise<void> {
  console.log('[Emergency Font Load] Starting emergency font loading for cloud environment...');
  
  // Strategy 1: Try to inject CSS @font-face with proper URL encoding
  const cssRules: string[] = [];
  
  for (const config of fontConfigs) {
    const encodedFilename = encodeURIComponent(config.filename);
    const fontUrl = `/fonts/${encodedFilename}`;
    
    const cssRule = `
@font-face {
  font-family: "${config.name}";
  src: url("${fontUrl}") format("truetype");
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}`;
    cssRules.push(cssRule);
  }
  
  // Inject CSS
  const styleId = 'emergency-fonts';
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }
  
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = cssRules.join('\n');
  document.head.appendChild(styleElement);
  
  console.log('[Emergency Font Load] Injected emergency font CSS');
  
  // Strategy 2: Force font loading by creating hidden elements
  const testContainer = document.createElement('div');
  testContainer.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    visibility: hidden;
    pointer-events: none;
    height: 1px;
    width: 1px;
    overflow: hidden;
  `;
  
  for (const config of fontConfigs) {
    const testElement = document.createElement('div');
    testElement.style.fontFamily = `"${config.name}"`;
    testElement.textContent = '작가 샘플 텍스트 Font Sample';
    testContainer.appendChild(testElement);
  }
  
  document.body.appendChild(testContainer);
  
  // Wait a bit for fonts to load
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Clean up test container
  document.body.removeChild(testContainer);
  
  // Check which fonts loaded successfully
  const loadedFonts: string[] = [];
  const failedFonts: string[] = [];
  
  for (const config of fontConfigs) {
    if (document.fonts.check(`16px "${config.name}"`)) {
      loadedFonts.push(config.name);
    } else {
      failedFonts.push(config.name);
    }
  }
  
  console.log(`[Emergency Font Load] Results: ${loadedFonts.length} loaded, ${failedFonts.length} failed`);
  console.log(`[Emergency Font Load] Loaded: ${loadedFonts.join(', ')}`);
  console.log(`[Emergency Font Load] Failed: ${failedFonts.join(', ')}`);
}
