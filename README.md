# Zamong Text Editor

Transform stories into beautiful Instagram-style story cards. Write with a paginated editor, keep Korean typography consistent, and export high-quality images across multiple backgrounds.

## Run locally

Prerequisites
- Node.js 18+
- npm (or yarn)

Steps
1) Install dependencies
   npm install
2) Start the dev server
   npm run dev
3) Open the app
   http://localhost:3000

## Required assets (local development)
- Background images: place 4 images in public/backgrounds/
  - stage_1.png, stage_2.png, stage_3.png, stage_4.png
  - Size 900 × 1600 px (PNG recommended)
- Fonts: place the following in public/fonts/
  - KoPubWorld Batang Light.ttf (body/title)
  - author-handwriting-font.ttf (author signature)

See public/backgrounds/README.md and public/fonts/README.md for details.

## Tech stack
- Next.js 15, React 18, TypeScript
- Tailwind CSS, Lucide React, Radix UI
- Tiptap editor, Fabric.js canvas, JSZip
- Zustand state management, i18next

## Learn more
- Start here for a deep dive: README-COMPREHENSIVE.md
- Feature docs: docs/
  - FONT_LOADING_IMPLEMENTATION.md
  - lineHeight-implementation.md
  - settings-management.md
  - CLOUD_DEPLOYMENT_GUIDE.md

If you run into issues, see docs/AUTO_SYNC_TEST_PLAN.md and docs/NEWLINE_SYNCHRONIZATION_FIX.md for notes on synchronization and content integrity.
