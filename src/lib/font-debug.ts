/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Font debugging utilities for troubleshooting font loading issues
 */

import { isFontLoaded, areCustomFontsLoaded } from './font-utils';

export interface FontDebugInfo {
  fontFamily: string;
  isLoaded: boolean;
  isAvailable: boolean;
  cssCheck: boolean;
  jsCheck: boolean;
}

/**
 * Debug font loading status
 */
export function debugFontStatus(fontFamily: string): FontDebugInfo {
  const cssCheck = typeof document !== 'undefined' && 
    document.fonts.check(`16px "${fontFamily}"`);
  const jsCheck = typeof document !== 'undefined' && 
    document.fonts.check(`16px ${fontFamily}`);
  const isLoaded = isFontLoaded(fontFamily);
  
  return {
    fontFamily,
    isLoaded,
    isAvailable: cssCheck || jsCheck,
    cssCheck,
    jsCheck
  };
}

/**
 * Debug all custom fonts
 */
export function debugAllFonts(): FontDebugInfo[] {
  const fonts = [
    'HakgyoansimBareonbatangB', // Bold for titles
    'HakgyoansimBareonbatangR', // Regular for body text
    'CustomFont',               // 나눔손글씨 for author names
    'CustomFontTTF'             // Legacy alias
  ];
  return fonts.map(debugFontStatus);
}

/**
 * Log font debug information to console
 */
export function logFontDebugInfo(enableDebug: boolean = false): void {
  if (!enableDebug && process.env.NODE_ENV === 'production') return;
  
  console.group('🔤 Font Debug Information');
  
  const fontInfo = debugAllFonts();
  
  fontInfo.forEach(info => {
    const status = info.isLoaded ? '✅' : '❌';
    console.log(`${status} ${info.fontFamily}:`, {
      loaded: info.isLoaded,
      available: info.isAvailable,
      cssCheck: info.cssCheck,
      jsCheck: info.jsCheck
    });
  });
  
  const allLoaded = areCustomFontsLoaded();
  console.log(`\n📊 Overall Status: ${allLoaded ? '✅ All fonts loaded' : '⚠️ Some fonts missing'}`);
  
  if (typeof document !== 'undefined') {
    console.log(`📄 Document fonts ready state:`, document.fonts.ready);
    console.log(`🔢 Total fonts loaded:`, document.fonts.size);
  }
  
  console.groupEnd();
}

/**
 * Create a test element to verify font rendering
 */
export function createFontTestElement(fontFamily: string, text: string = '한글 English 123'): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  
  const testElement = document.createElement('div');
  testElement.style.fontFamily = fontFamily;
  testElement.style.fontSize = '16px';
  testElement.style.position = 'absolute';
  testElement.style.left = '-9999px';
  testElement.style.top = '-9999px';
  testElement.style.visibility = 'hidden';
  testElement.textContent = text;
  
  document.body.appendChild(testElement);
  
  // Return element for cleanup
  return testElement;
}

/**
 * Measure text width to verify font is actually being used
 */
export function measureFontWidth(fontFamily: string, text: string = '한글 English 123'): number | null {
  if (typeof document === 'undefined') return null;
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) return null;
  
  context.font = `16px ${fontFamily}`;
  const metrics = context.measureText(text);
  
  return metrics.width;
}

/**
 * Compare font widths to detect if fallback font is being used
 */
export function compareFontWidths(primaryFont: string, fallbackFont: string, text: string = '한글'): {
  primaryWidth: number | null;
  fallbackWidth: number | null;
  isDifferent: boolean;
  likelyUsingPrimary: boolean;
} {
  const primaryWidth = measureFontWidth(primaryFont, text);
  const fallbackWidth = measureFontWidth(fallbackFont, text);
  
  const isDifferent = primaryWidth !== null && fallbackWidth !== null && 
    Math.abs(primaryWidth - fallbackWidth) > 1; // Allow for small rounding differences
  
  const likelyUsingPrimary = isDifferent && primaryWidth !== null && fallbackWidth !== null &&
    primaryWidth !== fallbackWidth;
  
  return {
    primaryWidth,
    fallbackWidth,
    isDifferent,
    likelyUsingPrimary
  };
}

/**
 * Comprehensive font test
 */
export async function runFontTest(enableDebug: boolean = false): Promise<{
  allFontsLoaded: boolean;
  fontStatus: FontDebugInfo[];
  measurementTest: any;
  recommendations: string[];
}> {
  logFontDebugInfo(enableDebug);
  
  const fontStatus = debugAllFonts();
  const allFontsLoaded = areCustomFontsLoaded();
  
  // Test actual font rendering
  const measurementTest = {
    CustomFontTTF: compareFontWidths('CustomFontTTF', 'Arial', '한글 테스트'),
    CustomFont: compareFontWidths('CustomFont', 'Arial', '한글 테스트'),
    HakgyoansimBareonbatangR: compareFontWidths('HakgyoansimBareonbatangR', 'Arial', '한글 테스트')
  };
  
  const recommendations: string[] = [];
  
  if (!allFontsLoaded) {
    recommendations.push('Some fonts are not loaded. Check @font-face declarations in globals.css');
  }
  
  Object.entries(measurementTest).forEach(([fontName, test]) => {
    if (!test.likelyUsingPrimary) {
      recommendations.push(`Font ${fontName} might be falling back to system font`);
    }
  });
  
  if (recommendations.length === 0) {
    recommendations.push('All fonts appear to be working correctly! ✅');
  }
  
  return {
    allFontsLoaded,
    fontStatus,
    measurementTest,
    recommendations
  };
}

/**
 * Enable font debugging in development
 */
export function enableFontDebugging(): void {
  if (typeof window !== 'undefined') {
    // Add to window for easy console access
    (window as any).fontDebug = {
      status: debugAllFonts,
      log: () => logFontDebugInfo(true),
      test: () => runFontTest(true),
      measure: measureFontWidth,
      compare: compareFontWidths
    };
    
    console.log('🔤 Font debugging enabled. Use window.fontDebug.* methods');
  }
}
