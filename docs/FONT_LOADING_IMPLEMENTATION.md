# Font Loading and Rendering Consistency Implementation

## Overview

This document explains how fonts are loaded and verified for both editor rendering and canvas-based image export in Zamong Text Editor.

- Primary body/title font: KoPubWorld Batang Light (family: `KoPubWorldBatangLight`)
- Author signature font: author-handwriting-font.ttf (family: `CustomFont`)

## Files Created/Modified

1) src/lib/font-utils.ts
- loadFontForCanvas, ensureFontsLoaded, getFallbackFont
2) src/components/FontPreloader.tsx and src/components/CloudFontLoader.tsx
- Early/robust font loading (client), progress and debug
3) src/lib/canvas-utils.ts and src/lib/export-utils.ts
- Ensure fonts are loaded before any Fabric.js operations
4) src/components/canvas/BatchImageGenerator.tsx
- Calls ensureFontsLoaded before generating/exporting images
5) src/lib/constants.ts
- AVAILABLE_FONTS and helper getters (getBodyFont, getTitleFont, getAuthorFont)

## Implementation Details

### Font Loading Strategy
1. Preload: Use FontFace API to load KoPubWorldBatangLight and CustomFont
2. Verify: document.fonts.check to avoid double-loading
3. Fallback: getFallbackFont returns a safe alternative if preferred is not ready
4. Canvas integration: All canvas text creation happens after ensureFontsLoaded()

Flow:
- App bootstrap: FontPreloader/CloudFontLoader → ensureFontsLoaded()
- Canvas export: BatchImageGenerator → ensureFontsLoaded() → add text → export

### Error Handling
- Loading failures are logged; UI continues with fallbacks
- Canvas export proceeds using getFallbackFont(preferred)

### Performance
- Parallel loads with Promise.allSettled
- Short timeouts to avoid blocking
- Fonts cached by browser after first load

## Supported Fonts and Paths
- Body/Title: public/fonts/KoPubWorld Batang Light.ttf → family: KoPubWorldBatangLight
- Author: public/fonts/author-handwriting-font.ttf → family: CustomFont

## Code Snippets

Ensure before canvas operations:
```ts
await ensureFontsLoaded();
const bodyFont = getBodyFont(); // KoPubWorldBatangLight
```

Create Fabric.js textbox with fallback:
```ts
const family = document.fonts.check('16px "KoPubWorldBatangLight"')
  ? 'KoPubWorldBatangLight'
  : getFallbackFont('KoPubWorldBatangLight');
```

## Cloud Deployment Notes
- For Google Cloud Run, use CloudFontLoader and verify HTTP accessibility of font URLs
- See docs/CLOUD_DEPLOYMENT_GUIDE.md and docs/GOOGLE_CLOUD_DEPLOYMENT_FIXES.md

## Future Enhancements
- Font subsetting to reduce payload
- Download progress UI
- Extended fallback chain based on user agent
