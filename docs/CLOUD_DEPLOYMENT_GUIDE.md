# Google Cloud Run Deployment Guide with Font Support

This guide explains how to deploy Zamong Text Editor to Google Cloud Run while ensuring custom Korean fonts load correctly for image generation.

## Problem
In some deployments, custom fonts were not loaded in time for canvas export, causing fallback fonts to appear in images.

## Root Causes
- Static font files excluded by ignore rules
- Font loading timing differences in containerized environments
- HTTP accessibility issues for font URLs

## Implemented Solution

1) Robust font loading
- src/components/CloudFontLoader.tsx and src/components/FontPreloader.tsx
- src/lib/server-font-utils.ts and src/lib/font-debug-enhanced.ts
- All canvas flows call ensureFontsLoaded() prior to export

2) Deployment configuration
.gcloudignore should explicitly include font assets:
```
!public/
!public/fonts/
!public/fonts/*.ttf
!public/fonts/*.otf
!public/fonts/*.woff
!public/fonts/*.woff2
```

3) Verification
- document.fonts.check used to confirm availability
- Optional debug: NEXT_PUBLIC_ENABLE_FONT_DEBUG=true

## Deployment

Deploy to Cloud Run
```bash
# optional debugging
env NEXT_PUBLIC_ENABLE_FONT_DEBUG=true \
  gcloud run deploy --source .
```

## Required Font Files
Place these in public/fonts/:
- KoPubWorld Batang Light.ttf (body/title → KoPubWorldBatangLight)
- author-handwriting-font.ttf (author signature → CustomFont)

## Troubleshooting

Enable Debug Mode
```bash
NEXT_PUBLIC_ENABLE_FONT_DEBUG=true
```

Check font accessibility by loading:
- https://<your-app>/fonts/KoPubWorld%20Batang%20Light.ttf
- https://<your-app>/fonts/author-handwriting-font.ttf

Common issues
- 404 on font URL → ensure .gcloudignore includes fonts and files committed
- Fonts not reflected in images → verify ensureFontsLoaded() executed before export

## Notes
- First load may take 1–3s; browser caches fonts afterwards
- See docs/GOOGLE_CLOUD_DEPLOYMENT_FIXES.md for deeper debugging tips
