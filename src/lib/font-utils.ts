import { AVAILABLE_FONTS } from './constants';

/**
 * Font configuration interface
 */
export interface FontConfig {
  name: string;
  url: string;
}

/**
 * Load a single font for canvas operations
 */
export async function loadFontForCanvas(
  fontName: string, 
  fontUrl: string
): Promise<void> {
  try {
    // Check if font is already loaded
    if (document.fonts.check(`16px "${fontName}"`)) {
      return;
    }

    // Create and load the font
    const font = new FontFace(fontName, `url(${fontUrl})`);
    await font.load();
    
    // Add font to document fonts
    document.fonts.add(font);
    
    // Wait for font to be fully loaded and available
    await document.fonts.ready;
    
    console.log(`Font loaded successfully: ${fontName}`);
  } catch (error) {
    const errorMessage = `Failed to load font ${fontName}: ${error instanceof Error ? error.message : 'Unknown error'}`;
    console.warn(errorMessage);
    throw new Error(errorMessage);
  }
}

/**
 * Load all custom fonts for canvas operations with enhanced cloud deployment support
 */
export async function loadCustomFonts(): Promise<void> {
  const fonts: FontConfig[] = [
    { name: 'KoPubWorldBatangLight', url: '/fonts/KoPubWorld Batang Light.ttf' }, // PRIMARY: Text and titles
    { name: 'CustomFont', url: '/fonts/author-handwriting-font.ttf' }, // Author names
    // Legacy fonts for backward compatibility
    { name: 'HakgyoansimBareonbatangB', url: '/fonts/HakgyoansimBareonbatangB.ttf' }, // Legacy Bold
    { name: 'HakgyoansimBareonbatangR', url: '/fonts/HakgyoansimBareonbatangR.ttf' }, // Legacy Regular
    { name: 'CustomFontTTF', url: '/fonts/HakgyoansimBareonbatangB.ttf' } // Legacy alias
  ];
  
  console.log('[Font Loading] Starting custom font loading for cloud deployment...');
  
  // First, wait for CSS fonts to be ready (fallback to @font-face declarations)
  await waitForCSSFonts(3000);
  
  // Then attempt to load via FontFace API for canvas operations
  const loadingPromises = fonts.map(async (font) => {
    try {
      // Check if font is already available via CSS
      if (isFontLoaded(font.name)) {
        console.log(`[Font Loading] Font ${font.name} already available via CSS`);
        return;
      }
      
      // Try to load via FontFace API
      await loadFontForCanvas(font.name, font.url);
      console.log(`[Font Loading] Successfully loaded ${font.name} via FontFace API`);
    } catch (error) {
      console.warn(`[Font Loading] Failed to load ${font.name} via FontFace API, relying on CSS fallback:`, error);
      // Don't throw - CSS @font-face might still work
    }
  });
  
  try {
    await Promise.allSettled(loadingPromises);
    
    // Verify final font availability
    const availableFonts = fonts.filter(font => isFontLoaded(font.name));
    const unavailableFonts = fonts.filter(font => !isFontLoaded(font.name));
    
    console.log(`[Font Loading] Font loading complete:`);
    console.log(`[Font Loading] Available fonts: ${availableFonts.map(f => f.name).join(', ')}`);
    if (unavailableFonts.length > 0) {
      console.warn(`[Font Loading] Unavailable fonts: ${unavailableFonts.map(f => f.name).join(', ')}`);
    }
    
  } catch (error) {
    console.warn('[Font Loading] Some fonts failed to load, continuing with available fonts:', error);
  }
}

/**
 * Load fonts from available fonts configuration
 */
export async function loadAvailableFonts(): Promise<void> {
  const loadingPromises = AVAILABLE_FONTS.map(fontConfig => 
    loadFontForCanvas(fontConfig.family, fontConfig.path).catch(error => {
      console.warn(`Font loading failed for ${fontConfig.name}:`, error);
      return null;
    })
  );
  
  try {
    await Promise.all(loadingPromises);
    console.log('Available fonts loaded successfully');
  } catch (error) {
    console.warn('Some available fonts failed to load:', error);
  }
}

/**
 * Check if a font is loaded and available (CSS or JS)
 */
export function isFontLoaded(fontFamily: string): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    // Check both with and without quotes to be comprehensive
    return document.fonts.check(`16px "${fontFamily}"`) || 
           document.fonts.check(`16px ${fontFamily}`);
  } catch (error) {
    console.warn(`Error checking font availability for ${fontFamily}:`, error);
    return false;
  }
}

/**
 * Check if all our custom fonts are loaded
 */
export function areCustomFontsLoaded(): boolean {
  const requiredFonts = ['CustomFontTTF', 'CustomFont', 'HakgyoansimBareonbatangR'];
  return requiredFonts.every(font => isFontLoaded(font));
}

/**
 * Wait for CSS fonts to be ready
 */
export async function waitForCSSFonts(timeout: number = 5000): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  
  try {
    // Race between font loading and timeout
    const fontLoadPromise = document.fonts.ready;
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Font loading timeout')), timeout)
    );
    
    await Promise.race([fontLoadPromise, timeoutPromise]);
    return true;
  } catch (error) {
    console.warn('CSS font loading timed out or failed:', error);
    return false;
  }
}

/**
 * Get fallback font if the specified font is not available
 * Enhanced for KoPubWorld Batang Light and cloud deployment
 */
export function getFallbackFont(preferredFont: string): string {
  // First check if the preferred font is available
  if (isFontLoaded(preferredFont)) {
    console.log(`[Font Fallback] Using preferred font: ${preferredFont}`);
    return preferredFont;
  }
  
  console.warn(`[Font Fallback] Preferred font '${preferredFont}' not available, searching for fallbacks...`);
  
  // Define font-specific fallback chains
  let fallbackChain: string[] = [];
  
  // KoPubWorld Batang Light fallbacks (for text and titles)
  if (preferredFont === 'KoPubWorldBatangLight') {
    fallbackChain = [
      'KoPubWorldBatangLight', // Try again in case it loaded after initial check
      'HakgyoansimBareonbatangR', // Fallback to legacy regular
      'HakgyoansimBareonbatangB', // Fallback to legacy bold
      'CustomFontTTF', // Legacy alias
      'Malgun Gothic', // Korean system font
      'Apple SD Gothic Neo', // macOS Korean font
      'NanumGothic', // Common Korean web font
      'Gulim', // Windows Korean font
      'Dotum', // Another Windows Korean font
      'Arial', // System Latin
      'sans-serif' // Final fallback
    ];
  }
  // Author name font fallbacks (CustomFont -> 나눔손글씨)
  else if (preferredFont === 'CustomFont') {
    fallbackChain = [
      'CustomFont', // Try again in case it loaded after initial check
      'KoPubWorldBatangLight', // Use primary font as fallback
      'HakgyoansimBareonbatangR', // Use regular weight as fallback
      'HakgyoansimBareonbatangB', // Use bold weight if regular not available
      'CustomFontTTF', // Legacy alias
      'Malgun Gothic', // Korean system font
      'Apple SD Gothic Neo', // macOS Korean font
      'NanumGothic', // Common Korean web font
      'Gulim', // Windows Korean font
      'Dotum', // Another Windows Korean font
      'sans-serif' // Final fallback
    ];
  }
  // Legacy font fallbacks (redirect to KoPubWorld)
  else if (preferredFont === 'HakgyoansimBareonbatangB' || preferredFont === 'HakgyoansimBareonbatangR' || preferredFont === 'CustomFontTTF') {
    fallbackChain = [
      'KoPubWorldBatangLight', // Redirect to primary font
      preferredFont, // Try original font
      'Malgun Gothic',
      'Apple SD Gothic Neo',
      'NanumGothic',
      'Arial',
      'sans-serif'
    ];
  }
  // Generic fallback chain
  else {
    fallbackChain = [
      preferredFont,
      'KoPubWorldBatangLight', // Default Korean primary
      'CustomFont', // Korean handwriting
      'HakgyoansimBareonbatangR', // Legacy Korean regular
      'Malgun Gothic', // System Korean
      'Apple SD Gothic Neo', // macOS Korean
      'Arial', // System Latin
      'Helvetica', // Alternative system Latin
      'sans-serif' // Final fallback
    ];
  }
  
  // Try each font in the fallback chain
  for (const fallback of fallbackChain) {
    if (isFontLoaded(fallback)) {
      console.log(`[Font Fallback] Using fallback font: ${fallback} (requested: ${preferredFont})`);
      return fallback;
    }
  }
  
  // Ultimate fallback - should always be available
  console.error(`[Font Fallback] All fallbacks failed for '${preferredFont}', using sans-serif`);
  return 'sans-serif';
}

/**
 * Preload fonts with retry mechanism
 */
export async function preloadFontsWithRetry(
  fonts: FontConfig[], 
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<void> {
  for (const font of fonts) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await loadFontForCanvas(font.name, font.url);
        break; // Success, move to next font
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          console.error(`Failed to load font ${font.name} after ${maxRetries} attempts:`, error);
        } else {
          console.warn(`Font loading attempt ${retries} failed for ${font.name}, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }
}

/**
 * Load fonts with progress tracking
 */
export async function loadFontsWithProgress(
  fonts: FontConfig[],
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  let loaded = 0;
  const total = fonts.length;
  
  const loadPromises = fonts.map(async (font) => {
    try {
      await loadFontForCanvas(font.name, font.url);
    } catch (error) {
      console.warn(`Font loading failed for ${font.name}:`, error);
    } finally {
      loaded++;
      onProgress?.(loaded, total);
    }
  });
  
  await Promise.all(loadPromises);
}
