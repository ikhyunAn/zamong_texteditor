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
 * Load all custom fonts for canvas operations
 */
export async function loadCustomFonts(): Promise<void> {
  const fonts: FontConfig[] = [
    { name: 'CustomFontTTF', url: '/fonts/HakgyoansimBareonbatangB.ttf' },
    { name: 'CustomFont', url: '/fonts/작가폰트_나눔손글씨 딸에게 엄마가.ttf' },
    { name: 'HakgyoansimBareonbatangR', url: '/fonts/HakgyoansimBareonbatangR.ttf' }
  ];
  
  const loadingPromises = fonts.map(font => 
    loadFontForCanvas(font.name, font.url).catch(error => {
      // Log error but don't fail the entire loading process
      console.warn(`Font loading failed for ${font.name}:`, error);
      return null;
    })
  );
  
  try {
    await Promise.all(loadingPromises);
    console.log('All custom fonts loaded successfully');
  } catch (error) {
    console.warn('Some fonts failed to load:', error);
    // Don't throw here - we want to continue even if some fonts fail
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
 * Check if a font is loaded and available
 */
export function isFontLoaded(fontFamily: string): boolean {
  return document.fonts.check(`16px "${fontFamily}"`);
}

/**
 * Get fallback font if the specified font is not available
 */
export function getFallbackFont(preferredFont: string): string {
  if (isFontLoaded(preferredFont)) {
    return preferredFont;
  }
  
  // Try common fallbacks
  const fallbacks = ['Arial', 'Helvetica', 'sans-serif'];
  for (const fallback of fallbacks) {
    if (isFontLoaded(fallback)) {
      return fallback;
    }
  }
  
  return 'sans-serif'; // Final fallback
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
