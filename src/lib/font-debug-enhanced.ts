/**
 * Enhanced Font Debugging Utility for Google Cloud Run
 * 
 * This utility provides comprehensive font debugging and validation
 * for both local development and cloud deployment environments.
 */

import { FONT_CONFIGS, isServerEnvironment, isBrowserEnvironment } from './server-font-utils';

export interface FontDebugInfo {
  name: string;
  url: string;
  isAvailable: boolean;
  loadTime?: number;
  error?: string;
  size?: number;
  lastCheck: number;
}

export interface FontSystemInfo {
  environment: 'server' | 'browser' | 'unknown';
  userAgent?: string;
  platform?: string;
  timestamp: number;
  fontsSupported: boolean;
  totalFonts: number;
  loadedFonts: number;
  failedFonts: number;
  fonts: FontDebugInfo[];
}

/**
 * Check if a font is available in the browser
 */
function checkFontInBrowser(fontName: string): boolean {
  if (!isBrowserEnvironment() || !document.fonts) {
    return false;
  }
  
  try {
    return document.fonts.check(`16px "${fontName}"`) || 
           document.fonts.check(`16px ${fontName}`);
  } catch (error) {
    console.warn(`Error checking font ${fontName}:`, error);
    return false;
  }
}

/**
 * Attempt to load a font via HTTP request to test accessibility
 */
async function testFontAccessibility(fontUrl: string): Promise<{ accessible: boolean; size?: number; error?: string }> {
  try {
    const response = await fetch(fontUrl, { method: 'HEAD' });
    
    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      return {
        accessible: true,
        size: contentLength ? parseInt(contentLength, 10) : undefined
      };
    } else {
      return {
        accessible: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    return {
      accessible: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Perform comprehensive font system analysis
 */
export async function analyzeFontSystem(): Promise<FontSystemInfo> {
  const startTime = Date.now();
  const debugInfo: FontDebugInfo[] = [];
  
  // Gather basic environment info
  const environment = isServerEnvironment() ? 'server' : 
                     isBrowserEnvironment() ? 'browser' : 'unknown';
  
  const systemInfo: FontSystemInfo = {
    environment,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    platform: typeof process !== 'undefined' ? process.platform : undefined,
    timestamp: startTime,
    fontsSupported: typeof document !== 'undefined' && 'fonts' in document,
    totalFonts: FONT_CONFIGS.length,
    loadedFonts: 0,
    failedFonts: 0,
    fonts: debugInfo
  };
  
  // console.log(`🔍 Analyzing font system in ${environment} environment...`);
  
  // Test each font configuration
  for (const config of FONT_CONFIGS) {
    const fontStartTime = Date.now();
    const fontDebug: FontDebugInfo = {
      name: config.name,
      url: config.url,
      isAvailable: false,
      lastCheck: fontStartTime
    };
    
    try {
      // Test font accessibility via HTTP
      const accessibilityTest = await testFontAccessibility(config.url);
      fontDebug.size = accessibilityTest.size;
      
      if (!accessibilityTest.accessible) {
        fontDebug.error = `Font file not accessible: ${accessibilityTest.error}`;
        fontDebug.isAvailable = false;
      } else {
        // If accessible, check if it's loaded in browser
        if (isBrowserEnvironment()) {
          fontDebug.isAvailable = checkFontInBrowser(config.name);
          if (!fontDebug.isAvailable) {
            fontDebug.error = 'Font file accessible but not loaded in browser';
          }
        } else {
          // In server environment, assume accessible means available
          fontDebug.isAvailable = true;
        }
      }
      
      fontDebug.loadTime = Date.now() - fontStartTime;
      
      if (fontDebug.isAvailable) {
        systemInfo.loadedFonts++;
        console.log(`✅ Font available: ${config.name} (${fontDebug.loadTime}ms)`);
      } else {
        systemInfo.failedFonts++;
        console.log(`❌ Font unavailable: ${config.name} - ${fontDebug.error}`);
      }
      
    } catch (error) {
      fontDebug.error = error instanceof Error ? error.message : 'Unknown error';
      fontDebug.loadTime = Date.now() - fontStartTime;
      systemInfo.failedFonts++;
      console.error(`💥 Font test failed: ${config.name}`, error);
    }
    
    debugInfo.push(fontDebug);
  }
  
  const totalTime = Date.now() - startTime;
  console.log(`🏁 Font analysis complete in ${totalTime}ms:`);
  console.log(`   Environment: ${systemInfo.environment}`);
  console.log(`   Fonts supported: ${systemInfo.fontsSupported}`);
  console.log(`   Loaded: ${systemInfo.loadedFonts}/${systemInfo.totalFonts}`);
  console.log(`   Failed: ${systemInfo.failedFonts}/${systemInfo.totalFonts}`);
  
  return systemInfo;
}

/**
 * Generate detailed font report for troubleshooting
 */
export function generateFontReport(systemInfo: FontSystemInfo): string {
  const lines = [
    '=== FONT SYSTEM REPORT ===',
    `Timestamp: ${new Date(systemInfo.timestamp).toISOString()}`,
    `Environment: ${systemInfo.environment}`,
    `User Agent: ${systemInfo.userAgent || 'N/A'}`,
    `Platform: ${systemInfo.platform || 'N/A'}`,
    `Font API Supported: ${systemInfo.fontsSupported}`,
    `Total Fonts: ${systemInfo.totalFonts}`,
    `Loaded Fonts: ${systemInfo.loadedFonts}`,
    `Failed Fonts: ${systemInfo.failedFonts}`,
    '',
    '=== INDIVIDUAL FONT STATUS ==='
  ];
  
  systemInfo.fonts.forEach((font, index) => {
    lines.push(`${index + 1}. ${font.name}`);
    lines.push(`   URL: ${font.url}`);
    lines.push(`   Available: ${font.isAvailable ? 'YES' : 'NO'}`);
    lines.push(`   Load Time: ${font.loadTime || 'N/A'}ms`);
    lines.push(`   Size: ${font.size || 'Unknown'} bytes`);
    lines.push(`   Error: ${font.error || 'None'}`);
    lines.push('');
  });
  
  return lines.join('\\n');
}

/**
 * Test font rendering by creating a test canvas element
 */
export function testFontRendering(fontName: string): { success: boolean; error?: string } {
  if (!isBrowserEnvironment()) {
    return { success: false, error: 'Not in browser environment' };
  }
  
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return { success: false, error: 'Cannot get canvas context' };
    }
    
    ctx.font = `24px "${fontName}", Arial, sans-serif`;
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('Test 테스트 文字', 150, 50);
    
    // Test if the font rendered (very basic test)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const hasContent = Array.from(imageData.data).some(value => value > 0);
    
    return { success: hasContent };
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown rendering error' 
    };
  }
}

/**
 * Log detailed font information to console
 */
export async function logFontSystemInfo(): Promise<void> {
  try {
    const systemInfo = await analyzeFontSystem();
    const report = generateFontReport(systemInfo);
    
    console.log(report);
    
    // Test rendering for each available font
    if (isBrowserEnvironment()) {
      console.log('\\n=== FONT RENDERING TESTS ===');
      systemInfo.fonts.forEach(font => {
        if (font.isAvailable) {
          const renderTest = testFontRendering(font.name);
          console.log(`${font.name}: ${renderTest.success ? '✅ Renders OK' : `❌ Render failed - ${renderTest.error}`}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Failed to generate font system info:', error);
  }
}

/**
 * Quick font availability check with logging
 */
export function quickFontCheck(): { [fontName: string]: boolean } {
  const results: { [fontName: string]: boolean } = {};
  
  FONT_CONFIGS.forEach(config => {
    if (isBrowserEnvironment()) {
      results[config.name] = checkFontInBrowser(config.name);
    } else {
      results[config.name] = true; // Assume available in server environment
    }
  });
  
  console.log('📋 Quick Font Check Results:', results);
  return results;
}

/**
 * Initialize font debugging on page load
 */
export function initializeFontDebugging(): void {
  if (isBrowserEnvironment()) {
    // Run analysis after DOM is loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(logFontSystemInfo, 1000);
      });
    } else {
      setTimeout(logFontSystemInfo, 1000);
    }
  } else {
    // In server environment, run immediately
    logFontSystemInfo();
  }
}
