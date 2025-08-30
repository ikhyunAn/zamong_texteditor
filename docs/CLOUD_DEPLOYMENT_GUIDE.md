# Google Cloud Run Deployment Guide with Font Support

This guide explains how to deploy the Zamong Text Editor to Google Cloud Run while ensuring custom Korean fonts work correctly for image generation.

## Problem

When deploying to Google Cloud Run, the custom Korean fonts (특히 작가폰트_나눔손글씨 딸에게 엄마가.ttf) were not being loaded correctly, causing the author font to not appear in generated images.

## Root Cause

1. **Font files not included in deployment**: Static files in `public/` directory need to be explicitly included
2. **Server-side font loading**: Google Cloud Run runs in a containerized server environment where browser-based font loading behaves differently
3. **Font accessibility**: Font files need to be accessible via HTTP URLs in the cloud environment

## Solution Implemented

### 1. Enhanced Font Loading System

Created a comprehensive font loading system that works in both client and server environments:

- **`src/lib/server-font-utils.ts`**: Cross-environment font loading utilities
- **`src/lib/font-debug-enhanced.ts`**: Advanced font debugging and troubleshooting
- Enhanced `FontPreloader.tsx` with cloud-ready font loading
- Updated `BatchImageGenerator.tsx` to ensure fonts are loaded before canvas operations

### 2. Deployment Configuration

Created `.gcloudignore` file to ensure font files are included in deployment:

```
# Keep public directory with fonts - DO NOT IGNORE
!public/
!public/fonts/
!public/fonts/*.ttf
!public/fonts/*.otf
!public/fonts/*.woff
!public/fonts/*.woff2
```

### 3. Font Loading Strategy

The system now uses a multi-layered approach:

1. **Primary**: Enhanced cross-environment font loading via ArrayBuffer
2. **Fallback**: Traditional CSS-based font loading 
3. **Graceful degradation**: Continue with fallback fonts if loading fails

## Deployment Commands

### Deploy to Google Cloud Run

```bash
# Enable font debugging (optional, for troubleshooting)
export NEXT_PUBLIC_ENABLE_FONT_DEBUG=true

# Deploy to Google Cloud Run
gcloud run deploy --source .
```

### Verify Font Deployment

After deployment, check the browser console for font loading messages:

```
🚀 Starting enhanced font preloading for cloud deployment...
✅ Enhanced font loading successful
📊 Font availability after preload: { ... }
```

## Font Files Required

Ensure these font files exist in `public/fonts/`:

1. **`HakgyoansimBareonbatangB.ttf`** - Bold weight for titles
2. **`HakgyoansimBareonbatangR.ttf`** - Regular weight for body text  
3. **`작가폰트_나눔손글씨 딸에게 엄마가.ttf`** - Handwriting font for author names

## Troubleshooting

### Enable Debug Mode

Set environment variable to enable comprehensive font debugging:

```bash
NEXT_PUBLIC_ENABLE_FONT_DEBUG=true
```

### Check Font Accessibility

In the deployed app, open browser console and look for font loading messages. You should see:

```
🔍 Analyzing font system in browser environment...
✅ Font available: CustomFont (XXXms)  
✅ Font available: HakgyoansimBareonbatangB (XXXms)
✅ Font available: HakgyoansimBareonbatangR (XXXms)
```

### Common Issues and Solutions

#### Issue: "Font file not accessible"
- **Cause**: Font files not included in deployment
- **Solution**: Check `.gcloudignore` doesn't exclude `public/fonts/`

#### Issue: "Font file accessible but not loaded in browser"
- **Cause**: Browser font loading API issues
- **Solution**: System will fallback to CSS loading automatically

#### Issue: Author font not appearing in images
- **Cause**: Font not loaded before canvas generation
- **Solution**: `BatchImageGenerator` now calls `ensureFontsLoaded()` before canvas operations

### Manual Font Verification

You can manually test font accessibility by visiting:
- `https://your-app-url/fonts/HakgyoansimBareonbatangB.ttf`
- `https://your-app-url/fonts/HakgyoansimBareonbatangR.ttf`
- `https://your-app-url/fonts/작가폰트_나눔손글씨 딸에게 엄마가.ttf`

These URLs should download the font files if deployment was successful.

## Architecture

```
┌─────────────────────┐
│   ClientLayout      │
│  ┌───────────────┐  │
│  │ FontPreloader │  │ ← Enhanced with cloud support
│  │               │  │
│  │ ┌───────────┐ │  │
│  │ │ App       │ │  │
│  │ │ Components│ │  │
│  │ └───────────┘ │  │
│  └───────────────┘  │
└─────────────────────┘

Font Loading Flow:
1. Enhanced cross-environment loading
2. CSS-based fallback loading  
3. Font availability verification
4. Debug logging and troubleshooting
```

## Performance Impact

- **Font files**: ~9MB total (3 TTF files)
- **Loading time**: 1-3 seconds additional on first page load
- **Caching**: Fonts cached by browser after initial load
- **Graceful degradation**: App works even if fonts fail to load

## Next Steps

1. **Deploy**: Use `gcloud run deploy --source .`
2. **Test**: Generate images and verify author font appears correctly
3. **Debug**: Check console for font loading status if issues occur
4. **Monitor**: Watch for any font-related errors in production logs

The enhanced font loading system ensures robust font support across all deployment environments while maintaining backward compatibility and graceful fallback behavior.
