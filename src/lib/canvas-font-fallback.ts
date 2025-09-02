/**
 * Canvas Font Fallback System for Cloud Deployment
 * 
 * This module provides robust font fallback mechanisms specifically
 * for canvas operations when custom fonts fail to load in cloud environments.
 */

export interface FontFallbackConfig {
  primary: string;
  fallbacks: string[];
  purpose: 'title' | 'body' | 'author';
  testText: string;
}

/**
 * Font fallback configurations for different purposes
 */
export const CANVAS_FONT_FALLBACKS: FontFallbackConfig[] = [
  {
    primary: 'CustomFont',
    fallbacks: [
      'NanumGothic',           // Common Korean web font
      'Malgun Gothic',         // Windows Korean system font
      'Apple SD Gothic Neo',   // macOS Korean system font
      'Gulim',                 // Alternative Windows Korean font
      'Dotum',                 // Another Windows Korean font
      'sans-serif'            // Ultimate fallback
    ],
    purpose: 'author',
    testText: '작가 이름'
  },
  {
    primary: 'HakgyoansimBareonbatangB',
    fallbacks: [
      'KoPubWorldBatangLight',  // Our primary body font as fallback
      'NanumGothic',           // Common Korean web font
      'Malgun Gothic',         // Windows Korean system font
      'Apple SD Gothic Neo',   // macOS Korean system font
      'serif',                 // Serif fallback
      'sans-serif'            // Ultimate fallback
    ],
    purpose: 'title',
    testText: '스토리 제목'
  },
  {
    primary: 'KoPubWorldBatangLight',
    fallbacks: [
      'HakgyoansimBareonbatangR', // Legacy font as fallback
      'NanumGothic',            // Common Korean web font
      'Malgun Gothic',          // Windows Korean system font
      'Apple SD Gothic Neo',    // macOS Korean system font
      'serif',                  // Serif fallback
      'sans-serif'             // Ultimate fallback
    ],
    purpose: 'body',
    testText: '본문 텍스트'
  }
];

/**
 * Test if a font is available and working
 */
export function testFontAvailability(fontFamily: string, testText: string = 'Test 테스트'): boolean {
  if (typeof document === 'undefined') return false;
  
  try {
    // Method 1: Use document.fonts.check
    if (document.fonts.check(`16px "${fontFamily}"`)) {
      return true;
    }
    
    // Method 2: Canvas-based font detection (more reliable for actual rendering)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return false;
    
    // Test with a fallback font first
    context.font = `16px sans-serif`;
    const fallbackWidth = context.measureText(testText).width;
    
    // Test with the target font
    context.font = `16px "${fontFamily}", sans-serif`;
    const testWidth = context.measureText(testText).width;
    
    // If widths are significantly different, the font is likely available
    return Math.abs(testWidth - fallbackWidth) > 1;
    
  } catch (error) {
    console.warn(`Error testing font availability for ${fontFamily}:`, error);
    return false;
  }
}

/**
 * Get the best available font for a specific purpose
 */
export function getBestCanvasFont(purpose: 'title' | 'body' | 'author'): string {
  const config = CANVAS_FONT_FALLBACKS.find(f => f.purpose === purpose);
  
  if (!config) {
    console.warn(`No font config found for purpose: ${purpose}`);
    return 'sans-serif';
  }
  
  // Test primary font first
  if (testFontAvailability(config.primary, config.testText)) {
    console.log(`[Canvas Font] Using primary font: ${config.primary} for ${purpose}`);
    return config.primary;
  }
  
  console.warn(`[Canvas Font] Primary font ${config.primary} not available, trying fallbacks...`);
  
  // Try fallbacks in order
  for (const fallback of config.fallbacks) {
    if (testFontAvailability(fallback, config.testText)) {
      console.log(`[Canvas Font] Using fallback font: ${fallback} for ${purpose}`);
      return fallback;
    }
  }
  
  // If all else fails, use the last fallback (should always be available)
  const ultimateFallback = config.fallbacks[config.fallbacks.length - 1] || 'sans-serif';
  console.warn(`[Canvas Font] All fonts failed, using ultimate fallback: ${ultimateFallback} for ${purpose}`);
  return ultimateFallback;
}

/**
 * Create a CSS font stack string for maximum compatibility
 */
export function createFontStack(purpose: 'title' | 'body' | 'author'): string {
  const config = CANVAS_FONT_FALLBACKS.find(f => f.purpose === purpose);
  
  if (!config) {
    return 'sans-serif';
  }
  
  const fonts = [config.primary, ...config.fallbacks];
  return fonts.map(font => {
    // Add quotes to font names with spaces or special characters
    if (font.includes(' ') || /[^a-zA-Z0-9-]/.test(font)) {
      return `"${font}"`;
    }
    return font;
  }).join(', ');
}

/**
 * Comprehensive font testing for canvas operations
 */
export async function testAllCanvasFonts(): Promise<{
  available: { purpose: string; font: string }[];
  unavailable: { purpose: string; font: string; fallback: string }[];
  summary: {
    allPrimary: boolean;
    totalAvailable: number;
    totalTested: number;
  };
}> {
  const available: { purpose: string; font: string }[] = [];
  const unavailable: { purpose: string; font: string; fallback: string }[] = [];
  
  console.log('[Canvas Font Test] Testing all canvas fonts...');
  
  for (const config of CANVAS_FONT_FALLBACKS) {
    const bestFont = getBestCanvasFont(config.purpose);
    
    if (bestFont === config.primary) {
      available.push({
        purpose: config.purpose,
        font: config.primary
      });
    } else {
      unavailable.push({
        purpose: config.purpose,
        font: config.primary,
        fallback: bestFont
      });
    }
  }
  
  const summary = {
    allPrimary: unavailable.length === 0,
    totalAvailable: available.length,
    totalTested: CANVAS_FONT_FALLBACKS.length
  };
  
  console.log('[Canvas Font Test] Results:', {
    available: available.length,
    unavailable: unavailable.length,
    allPrimaryAvailable: summary.allPrimary
  });
  
  return { available, unavailable, summary };
}

/**
 * Verify fonts are ready for canvas operations with fallback support
 */
export async function verifyCanvasFonts(): Promise<{
  ready: boolean;
  fonts: { [purpose: string]: string };
  report: string[];
}> {
  console.log('[Canvas Font Verify] Verifying fonts for canvas operations...');
  
  const fonts: { [purpose: string]: string } = {};
  const report: string[] = [];
  
  // Test each purpose and get the best available font
  for (const purpose of ['title', 'body', 'author'] as const) {
    const bestFont = getBestCanvasFont(purpose);
    fonts[purpose] = bestFont;
    
    const config = CANVAS_FONT_FALLBACKS.find(f => f.purpose === purpose);
    if (config) {
      if (bestFont === config.primary) {
        report.push(`✅ ${purpose}: Using primary font ${bestFont}`);
      } else {
        report.push(`⚠️  ${purpose}: Using fallback font ${bestFont} (primary ${config.primary} unavailable)`);
      }
    }
  }
  
  // We're always "ready" because we have fallbacks
  const ready = true;
  
  console.log('[Canvas Font Verify] Verification complete:', fonts);
  
  return { ready, fonts, report };
}

/**
 * Force load Korean system fonts for better fallback support
 */
export function loadKoreanSystemFonts(): void {
  if (typeof document === 'undefined') return;
  
  console.log('[Canvas Font] Loading Korean system fonts...');
  
  // Create CSS with Korean system fonts
  const koreanSystemFonts = `
/* Ensure Korean system fonts are loaded */
@font-face {
  font-family: 'KoreanSystemFont';
  src: local('Malgun Gothic'), 
       local('Apple SD Gothic Neo'), 
       local('NanumGothic'),
       local('Gulim'),
       local('Dotum');
  font-display: swap;
}

/* Override our custom fonts with system fallbacks in case of loading failure */
@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/작가폰트_나눔손글씨%20딸에게%20엄마가.ttf') format('truetype'),
       local('Malgun Gothic'), 
       local('Apple SD Gothic Neo'), 
       local('NanumGothic');
  font-display: swap;
}

@font-face {
  font-family: 'HakgyoansimBareonbatangB';
  src: url('/fonts/HakgyoansimBareonbatangB.ttf') format('truetype'),
       local('Malgun Gothic'), 
       local('Apple SD Gothic Neo'), 
       local('NanumGothic');
  font-weight: bold;
  font-display: swap;
}

@font-face {
  font-family: 'KoPubWorldBatangLight';
  src: url('/fonts/KoPubWorld%20Batang%20Light.ttf') format('truetype'),
       local('Malgun Gothic'), 
       local('Apple SD Gothic Neo'), 
       local('NanumGothic');
  font-display: swap;
}`;

  // Inject the CSS
  const styleId = 'korean-system-fonts';
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = koreanSystemFonts;
  document.head.appendChild(styleElement);

  console.log('[Canvas Font] Korean system fonts CSS injected');

  // Force loading by creating test elements
  const testContainer = document.createElement('div');
  testContainer.style.cssText = `
    position: absolute;
    left: -9999px;
    top: -9999px;
    visibility: hidden;
    font-size: 16px;
    line-height: 1;
  `;

  const koreanFonts = ['Malgun Gothic', 'Apple SD Gothic Neo', 'NanumGothic', 'Gulim', 'Dotum'];
  
  for (const font of koreanFonts) {
    const testElement = document.createElement('div');
    testElement.style.fontFamily = `"${font}"`;
    testElement.textContent = '한글 테스트 Korean Test 작가 이름 스토리 제목';
    testContainer.appendChild(testElement);
  }

  document.body.appendChild(testContainer);
  
  // Remove after a short delay
  setTimeout(() => {
    if (testContainer.parentNode) {
      testContainer.parentNode.removeChild(testContainer);
    }
  }, 1000);
}
