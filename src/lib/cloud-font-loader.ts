/**
 * Cloud-Compatible Font Loading Utilities
 * 
 * This module provides robust font loading mechanisms specifically designed
 * for cloud deployment environments like Google Cloud Run, with special
 * handling for Korean fonts with complex filenames.
 */

export interface CloudFontConfig {
  name: string;
  filename: string;
  displayName: string;
  purpose: 'title' | 'body' | 'author';
  fallbacks: string[];
}

export interface FontLoadResult {
  name: string;
  success: boolean;
  method: 'arraybuffer' | 'css' | 'preloaded' | 'failed';
  loadTime: number;
  error?: string;
}

export interface FontLoadProgress {
  current: number;
  total: number;
  currentFont: string;
  stage: 'loading' | 'verifying' | 'complete' | 'failed';
}

/**
 * Font configurations with proper URL encoding - Only two fonts used
 */
export const CLOUD_FONT_CONFIGS: CloudFontConfig[] = [
  {
    name: 'KoPubWorldBatangLight',
    filename: 'KoPubWorld Batang Light.ttf',
    displayName: 'KoPub World Batang Light',
    purpose: 'body', // Used for both body text and titles
    fallbacks: ['Malgun Gothic', 'Apple SD Gothic Neo', 'NanumGothic', 'Arial', 'sans-serif']
  },
  {
    name: 'CustomFont',
    filename: '작가폰트_나눔손글씨 딸에게 엄마가.ttf',
    displayName: 'Nanum Handwriting (나눔손글씨)',
    purpose: 'author',
    fallbacks: ['KoPubWorldBatangLight', 'Malgun Gothic', 'Apple SD Gothic Neo', 'cursive', 'sans-serif']
  }
];

/**
 * Properly encode font filename for HTTP requests
 */
export function encodeFontUrl(filename: string): string {
  // First encode the filename, then construct the full URL
  const encodedFilename = encodeURIComponent(filename);
  return `/fonts/${encodedFilename}`;
}

/**
 * Load font using ArrayBuffer method (primary method for cloud environments)
 */
export async function loadFontViaArrayBuffer(
  fontName: string, 
  filename: string, 
  timeout: number = 10000
): Promise<FontLoadResult> {
  const startTime = Date.now();
  
  try {
    console.log(`[Cloud Font Loader] Loading ${fontName} via ArrayBuffer...`);
    
    const fontUrl = encodeFontUrl(filename);
    console.log(`[Cloud Font Loader] Font URL: ${fontUrl}`);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    // Fetch the font file
    const response = await fetch(fontUrl, {
      signal: controller.signal,
      mode: 'same-origin',
      cache: 'force-cache'
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const fontBuffer = await response.arrayBuffer();
    console.log(`[Cloud Font Loader] Downloaded ${fontBuffer.byteLength} bytes for ${fontName}`);
    
    // Create FontFace and load it
    const fontFace = new FontFace(fontName, fontBuffer);
    await fontFace.load();
    
    // Add to document fonts
    document.fonts.add(fontFace);
    
    // Verify the font is available
    const isAvailable = document.fonts.check(`16px "${fontName}"`);
    if (!isAvailable) {
      throw new Error('Font loaded but not available for use');
    }
    
    const loadTime = Date.now() - startTime;
    console.log(`[Cloud Font Loader] ✅ Successfully loaded ${fontName} in ${loadTime}ms`);
    
    return {
      name: fontName,
      success: true,
      method: 'arraybuffer',
      loadTime
    };
    
  } catch (error) {
    const loadTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[Cloud Font Loader] ❌ Failed to load ${fontName} via ArrayBuffer: ${errorMessage}`);
    
    return {
      name: fontName,
      success: false,
      method: 'failed',
      loadTime,
      error: errorMessage
    };
  }
}

/**
 * Load font using CSS @font-face injection (fallback method)
 */
export async function loadFontViaCSS(
  fontName: string, 
  filename: string,
  timeout: number = 5000
): Promise<FontLoadResult> {
  const startTime = Date.now();
  
  try {
    console.log(`[Cloud Font Loader] Loading ${fontName} via CSS @font-face...`);
    
    const fontUrl = encodeFontUrl(filename);
    
    // Create and inject CSS @font-face rule
    const styleId = `font-${fontName}-${Date.now()}`;
    const existingStyle = document.getElementById(styleId);
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @font-face {
        font-family: "${fontName}";
        src: url("${fontUrl}") format("truetype");
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
    
    // Force the browser to load the font
    const testElement = document.createElement('div');
    testElement.style.fontFamily = `"${fontName}"`;
    testElement.style.fontSize = '16px';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.top = '-9999px';
    testElement.style.visibility = 'hidden';
    testElement.textContent = 'Font test 폰트 테스트';
    document.body.appendChild(testElement);
    
    // Wait for font to load with timeout
    const startCheck = Date.now();
    const checkInterval = 50;
    
    while (Date.now() - startCheck < timeout) {
      if (document.fonts.check(`16px "${fontName}"`)) {
        document.body.removeChild(testElement);
        const loadTime = Date.now() - startTime;
        console.log(`[Cloud Font Loader] ✅ Successfully loaded ${fontName} via CSS in ${loadTime}ms`);
        
        return {
          name: fontName,
          success: true,
          method: 'css',
          loadTime
        };
      }
      
      await new Promise(resolve => setTimeout(resolve, checkInterval));
    }
    
    // Timeout reached
    document.body.removeChild(testElement);
    throw new Error(`Font loading timeout after ${timeout}ms`);
    
  } catch (error) {
    const loadTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`[Cloud Font Loader] ❌ Failed to load ${fontName} via CSS: ${errorMessage}`);
    
    return {
      name: fontName,
      success: false,
      method: 'failed',
      loadTime,
      error: errorMessage
    };
  }
}

/**
 * Check if a font is already loaded and available
 */
export function isFontPreloaded(fontName: string): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    return document.fonts.check(`16px "${fontName}"`);
  } catch (error) {
    console.warn(`[Cloud Font Loader] Error checking font ${fontName}:`, error);
    return false;
  }
}

/**
 * Load a single font with multiple strategies and retry logic
 */
export async function loadSingleFont(
  config: CloudFontConfig,
  maxRetries: number = 2,
  onProgress?: (progress: FontLoadProgress) => void
): Promise<FontLoadResult> {
  let lastResult: FontLoadResult;
  
  // Check if font is already loaded
  if (isFontPreloaded(config.name)) {
    console.log(`[Cloud Font Loader] Font ${config.name} already loaded`);
    return {
      name: config.name,
      success: true,
      method: 'preloaded',
      loadTime: 0
    };
  }
  
  onProgress?.({
    current: 0,
    total: 1,
    currentFont: config.displayName,
    stage: 'loading'
  });
  
  // Strategy 1: ArrayBuffer loading (primary)
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`[Cloud Font Loader] Attempt ${attempt}/${maxRetries} for ${config.name} via ArrayBuffer`);
    
    lastResult = await loadFontViaArrayBuffer(config.name, config.filename);
    
    if (lastResult.success) {
      onProgress?.({
        current: 1,
        total: 1,
        currentFont: config.displayName,
        stage: 'complete'
      });
      return lastResult;
    }
    
    if (attempt < maxRetries) {
      console.log(`[Cloud Font Loader] Retrying in 1 second...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Strategy 2: CSS @font-face fallback
  console.log(`[Cloud Font Loader] ArrayBuffer failed, trying CSS fallback for ${config.name}`);
  const cssResult = await loadFontViaCSS(config.name, config.filename);
  
  if (cssResult.success) {
    onProgress?.({
      current: 1,
      total: 1,
      currentFont: config.displayName,
      stage: 'complete'
    });
    return cssResult;
  }
  
  // Both methods failed
  onProgress?.({
    current: 1,
    total: 1,
    currentFont: config.displayName,
    stage: 'failed'
  });
  
  return cssResult; // Return the last attempt result
}

/**
 * Load all fonts with progress reporting
 */
export async function loadAllCloudFonts(
  onProgress?: (progress: FontLoadProgress) => void,
  onFontLoaded?: (result: FontLoadResult) => void
): Promise<FontLoadResult[]> {
  const results: FontLoadResult[] = [];
  const total = CLOUD_FONT_CONFIGS.length;
  
  console.log(`[Cloud Font Loader] Starting to load ${total} fonts...`);
  
  for (let i = 0; i < CLOUD_FONT_CONFIGS.length; i++) {
    const config = CLOUD_FONT_CONFIGS[i];
    
    onProgress?.({
      current: i,
      total,
      currentFont: config.displayName,
      stage: 'loading'
    });
    
    const result = await loadSingleFont(config, 2, (fontProgress) => {
      onProgress?.({
        current: i + fontProgress.current,
        total,
        currentFont: config.displayName,
        stage: fontProgress.stage
      });
    });
    
    results.push(result);
    onFontLoaded?.(result);
  }
  
  onProgress?.({
    current: total,
    total,
    currentFont: '',
    stage: 'complete'
  });
  
  const successful = results.filter(r => r.success).length;
  const failed = results.length - successful;
  
  console.log(`[Cloud Font Loader] Font loading complete: ${successful} successful, ${failed} failed`);
  
  return results;
}

/**
 * Get the best available font for a purpose
 */
export function getBestAvailableFont(purpose: 'title' | 'body' | 'author'): string {
  // Map title and body to use the same font (KoPubWorldBatangLight)
  if (purpose === 'title' || purpose === 'body') {
    if (isFontPreloaded('KoPubWorldBatangLight')) {
      console.log(`[Cloud Font Loader] Using KoPubWorldBatangLight for ${purpose}`);
      return 'KoPubWorldBatangLight';
    }
    // Try fallbacks for body font
    const bodyFallbacks = ['Malgun Gothic', 'Apple SD Gothic Neo', 'NanumGothic', 'Arial', 'sans-serif'];
    for (const fallback of bodyFallbacks) {
      if (isFontPreloaded(fallback)) {
        console.log(`[Cloud Font Loader] Using fallback ${fallback} for ${purpose}`);
        return fallback;
      }
    }
  }
  
  // Handle author font
  if (purpose === 'author') {
    if (isFontPreloaded('CustomFont')) {
      console.log(`[Cloud Font Loader] Using CustomFont for ${purpose}`);
      return 'CustomFont';
    }
    // Try fallbacks for author font
    const authorFallbacks = ['KoPubWorldBatangLight', 'Malgun Gothic', 'Apple SD Gothic Neo', 'cursive', 'sans-serif'];
    for (const fallback of authorFallbacks) {
      if (isFontPreloaded(fallback)) {
        console.log(`[Cloud Font Loader] Using fallback ${fallback} for ${purpose}`);
        return fallback;
      }
    }
  }
  
  // Ultimate fallback
  console.warn(`[Cloud Font Loader] No fonts available for ${purpose}, using sans-serif`);
  return 'sans-serif';
}

/**
 * Verify all fonts are loaded and ready for canvas operations
 */
export async function verifyFontsForCanvas(): Promise<{ ready: boolean; report: FontLoadResult[] }> {
  console.log('[Cloud Font Loader] Verifying fonts for canvas operations...');
  
  const report: FontLoadResult[] = [];
  let allReady = true;
  
  for (const config of CLOUD_FONT_CONFIGS) {
    const isReady = isFontPreloaded(config.name);
    
    report.push({
      name: config.name,
      success: isReady,
      method: isReady ? 'preloaded' : 'failed',
      loadTime: 0,
      error: isReady ? undefined : 'Font not available'
    });
    
    if (!isReady) {
      allReady = false;
      console.warn(`[Cloud Font Loader] Font ${config.name} not ready for canvas`);
    } else {
      console.log(`[Cloud Font Loader] ✅ Font ${config.name} ready for canvas`);
    }
  }
  
  console.log(`[Cloud Font Loader] Canvas font verification: ${allReady ? 'All ready' : 'Some missing'}`);
  
  return { ready: allReady, report };
}

/**
 * Create a debug report of font loading status
 */
export function generateFontDebugReport(): {
  timestamp: string;
  userAgent: string;
  fonts: Array<{
    name: string;
    displayName: string;
    purpose: string;
    loaded: boolean;
    available: boolean;
    fallbacks: string[];
  }>;
  summary: {
    total: number;
    loaded: number;
    failed: number;
    readyForCanvas: boolean;
  };
} {
  const timestamp = new Date().toISOString();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  
  const fonts = CLOUD_FONT_CONFIGS.map(config => ({
    name: config.name,
    displayName: config.displayName,
    purpose: config.purpose,
    loaded: isFontPreloaded(config.name),
    available: isFontPreloaded(config.name),
    fallbacks: config.fallbacks
  }));
  
  const loaded = fonts.filter(f => f.loaded).length;
  const failed = fonts.length - loaded;
  const readyForCanvas = fonts.every(f => f.loaded);
  
  return {
    timestamp,
    userAgent,
    fonts,
    summary: {
      total: fonts.length,
      loaded,
      failed,
      readyForCanvas
    }
  };
}
