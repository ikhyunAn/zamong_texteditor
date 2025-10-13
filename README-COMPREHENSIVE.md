# Zamong Text Editor — Comprehensive Guide

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.0.3-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-38B2AC?style=for-the-badge&logo=tailwind-css)

**Transform your stories into beautiful Instagram-style storycards**

*A cutting-edge web application for creating visually engaging story content with Korean typography support*

</div>

## 📖 Table of Contents

- [🌟 Overview](#-overview)
- [✨ Key Features](#-key-features)
- [🔧 Tech Stack](#-tech-stack)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [📝 Feature Documentation](#-feature-documentation)
  - [Author Information](#author-information)
  - [Paginated Story Editor](#paginated-story-editor)
  - [Batch Image Generator](#batch-image-generator)
- [🏗️ Architecture](#️-architecture)
- [🎨 Design System](#-design-system)
- [🌐 Internationalization](#-internationalization)
- [📊 State Management](#-state-management)
- [🔤 Font System](#-font-system)
- [🎯 Canvas Operations](#-canvas-operations)
- [⚙️ Configuration](#️-configuration)
- [🚀 Deployment](#-deployment)
- [🐛 Troubleshooting](#-troubleshooting)
- [📚 API Reference](#-api-reference)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🌟 Overview

Zamong Text Editor is a sophisticated web application designed for content creators, writers, and social media enthusiasts who want to transform their written stories into visually appealing Instagram-style story cards. The application features a seamless three-step workflow that guides users from content creation to final image export.

### 🎯 Core Purpose

The application addresses the growing need for visual storytelling on social media platforms by:

- **Converting text stories into visual content** with professional-quality typography
- **Supporting Korean and English typography** with carefully selected fonts
- **Providing multiple background templates** for different aesthetic preferences
- **Enabling batch export** for efficient content creation workflows
- **Maintaining content integrity** through sophisticated page management

### 👥 Target Audience

- **Content Creators**: Writers and storytellers who want to share their work on social platforms
- **Social Media Managers**: Professionals creating visual content for brands
- **Korean Content Creators**: Native speakers requiring proper Korean typography support
- **Authors and Publishers**: Creating promotional material for their written work

### 🔄 Three-Step Workflow

1. **Author Information** → Enter your name and story title
2. **Story Editor** → Write and format your story with pagination support
3. **Image Generator** → Generate and export professional story cards

## ✨ Key Features

### 📝 Advanced Story Editor
- **Rich Text Editing** with Tiptap integration for professional text formatting
- **Smart Pagination** with automatic overflow/reflow and a fixed 4-page limit
- **Korean Typography** with specialized font rendering and metrics calculation
- **Real-time Preview** with background image overlay for accurate visualization
- **Keyboard Shortcuts** for efficient navigation (previous/next page)
- **Content Synchronization** ensuring data consistency across pages

### 🎨 Professional Image Generation
- **Four Background Templates** (Stage 1-4) for varied visual aesthetics
- **High-Quality Export** in standard Instagram story dimensions (900×1600)
- **Batch Processing** for generating multiple variations simultaneously
- **ZIP Download** with organized folder structure by background type
- **Individual Downloads** for selective image export
- **Canvas-Based Rendering** using Fabric.js for precise typography control

### 🌐 Internationalization
- **Bilingual Support** for English and Korean interfaces
- **Smart Language Detection** based on browser preferences
- **Consistent Typography** regardless of UI language
- **Localized Error Messages** and user feedback

### 🔧 Technical Excellence
- **TypeScript Throughout** for type safety and developer experience
- **Modern React Patterns** with hooks and functional components
- **Responsive Design** with Tailwind CSS utility classes
- **Performance Optimized** with Next.js 15 App Router
- **Memory Efficient** canvas operations with proper cleanup

## 🔧 Tech Stack

### Core Framework
- **[Next.js 15.0.3](https://nextjs.org/)** - React framework with App Router for optimal performance
- **[React 18.3.1](https://react.dev/)** - Modern React with concurrent features
- **[TypeScript 5.7.2](https://www.typescriptlang.org/)** - Type safety and enhanced DX

### UI & Styling
- **[Tailwind CSS 3.4.17](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Tailwind Typography](https://tailwindcss.com/docs/plugins#typography)** - Beautiful typography defaults
- **[Lucide React](https://lucide.dev/)** - Modern icon system
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible UI components

### Text Editing & Canvas
- **[Tiptap](https://tiptap.dev/)** - Headless editor built on ProseMirror
- **[Fabric.js 5.3.0](http://fabricjs.com/)** - Powerful canvas library for image generation
- **[React Window](https://react-window.vercel.app/)** - Efficient rendering for large lists

### State Management & Utils
- **[Zustand 5.0.2](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form 7.54.2](https://react-hook-form.com/)** - Performant form handling
- **[JSZip 3.10.1](https://stuk.github.io/jszip/)** - Client-side ZIP file generation
- **[i18next 25.3.4](https://www.i18next.com/)** - Internationalization framework

### Development Tools
- **[ESLint 9.17.0](https://eslint.org/)** - Code quality and consistency
- **[Jest 30.0.4](https://jestjs.io/)** - Testing framework
- **[Testing Library](https://testing-library.com/)** - Component testing utilities

## 📁 Project Structure

```
zamong_texteditor/
├── 📁 src/
│   ├── 📁 app/                    # Next.js App Router
│   │   ├── layout.tsx             # Root layout component
│   │   ├── page.tsx               # Home page with step routing
│   │   ├── providers.tsx          # Context providers setup
│   │   ├── loading.tsx            # Loading component
│   │   ├── error.tsx              # Error boundary component
│   │   ├── not-found.tsx          # 404 page component
│   │   └── global-error.tsx       # Global error handler
│   │
│   ├── 📁 components/             # React components
│   │   ├── 📁 ui/                 # Base UI components
│   │   │   ├── button.tsx         # Button component with variants
│   │   │   ├── card.tsx           # Card layout component
│   │   │   ├── enhanced-textarea.tsx  # Custom textarea with features
│   │   │   ├── toast.tsx          # Toast notification system
│   │   │   ├── input.tsx          # Input field component
│   │   │   ├── label.tsx          # Label component
│   │   │   ├── badge.tsx          # Badge component
│   │   │   ├── settings-manager.tsx # Settings management UI
│   │   │   ├── LanguageToggle.tsx # Language switching component
│   │   │   └── NotificationSection.tsx # Notification display
│   │   │
│   │   ├── 📁 layout/             # Layout components
│   │   │   ├── AuthorInfoForm.tsx # Author information input form
│   │   │   └── ClientLayout.tsx   # Client-side layout wrapper
│   │   │
│   │   ├── 📁 editor/             # Text editing components
│   │   │   └── PaginatedEditor.tsx # Advanced paginated editor
│   │   │
│   │   ├── 📁 canvas/             # Image generation components
│   │   │   ├── BatchImageGenerator.tsx # Main image generation UI
│   │   │   └── TextStyler.tsx     # Text styling controls
│   │   │
│   │   ├── 📁 background/         # Background management
│   │   │   └── ImageUploader.tsx  # Background image upload component
│   │   │
│   │   └── 📁 Font Components      # Font loading and management
│   │       ├── CloudFontLoader.tsx      # Cloud-based font loader
│   │       ├── FontLoader.tsx           # Main font loading component
│   │       ├── FontPreloader.tsx        # Font preloading utility
│   │       └── FontVerificationPanel.tsx # Font verification debugging
│   │
│   ├── 📁 store/                  # State management
│   │   ├── useStoryStore.ts       # Main Zustand store
│   │   └── useLanguageStore.ts    # Language preference store
│   │
│   ├── 📁 hooks/                  # Custom React hooks
│   │   ├── usePageManager.ts      # Page navigation and management
│   │   ├── useZipDownload.ts      # ZIP file generation hook
│   │   ├── useToast.ts            # Toast notification hook
│   │   ├── useEditorSettings.ts   # Editor configuration hook
│   │   └── useSyncStatus.ts       # Content synchronization hook
│   │
│   ├── 📁 lib/                    # Utility functions
│   │   ├── canvas-utils.ts        # Fabric.js canvas operations
│   │   ├── constants.ts           # Application constants
│   │   ├── font-debug.ts          # Font loading diagnostics
│   │   ├── font-debug-enhanced.ts # Enhanced font debugging
│   │   ├── font-utils.ts          # Font management utilities
│   │   ├── cloud-font-loader.ts   # Cloud font loading logic
│   │   ├── embedded-fonts.ts      # Embedded font configurations
│   │   ├── canvas-font-fallback.ts # Canvas font fallback handling
│   │   ├── server-font-utils.ts   # Server-side font utilities
│   │   ├── export-utils.ts        # Export functionality
│   │   ├── text-processing.ts     # Text manipulation utilities
│   │   ├── settings-utils.ts      # Settings management
│   │   ├── pagination-validation.ts # Page validation logic
│   │   ├── debounce.ts            # Debounce utility functions
│   │   └── i18n.ts                # Internationalization setup
│   │
│   ├── 📁 workers/                # Web Workers
│   │   └── export.worker.ts       # Background export processing
│   │
│   └── 📁 types/                  # TypeScript definitions
│       ├── index.ts               # Main type definitions
│       └── fabric.d.ts            # Fabric.js type declarations
│
├── 📁 public/                     # Static assets
│   ├── 📁 fonts/                  # Custom font files
│   │   ├── KoPubWorld Batang Light.ttf    # Korean body/title font
│   │   └── author-handwriting-font.ttf    # Korean handwriting font for author names
│   │
│   ├── 📁 backgrounds/            # Background images
│   │   ├── stage_1.png           # Background template 1 (좋아요 0회)
│   │   ├── stage_2.png           # Background template 2 (좋아요 1회)
│   │   ├── stage_3.png           # Background template 3 (좋아요 2회)
│   │   └── stage_4.png           # Background template 4 (좋아요 3회 이상)
│   │
│   └── 📁 locales/               # Internationalization
│       ├── 📁 en/               # English translations
│       └── 📁 ko/               # Korean translations
│
├── 📁 docs/                      # Technical documentation
│   ├── FONT_LOADING_IMPLEMENTATION.md
│   ├── lineHeight-implementation.md
│   ├── settings-management.md
│   ├── TEXT_RENDERING_TEST_SUMMARY.md
│   ├── FIRST_PAGE_NEWLINE_TEST_SUMMARY.md
│   ├── NEWLINE_SYNCHRONIZATION_FIX.md
│   ├── CLOUD_DEPLOYMENT_GUIDE.md
│   ├── GOOGLE_CLOUD_DEPLOYMENT_FIXES.md
│   ├── AUTO_SYNC_TEST_PLAN.md
│   └── dynamic-overflow-detection-plan.md
│
└── 📄 Configuration Files
    ├── next.config.js            # Next.js configuration
    ├── next-i18next.config.js    # i18next configuration
    ├── tailwind.config.js        # Tailwind CSS configuration
    ├── tsconfig.json            # TypeScript configuration
    ├── jest.config.js           # Jest testing configuration
    ├── jest.setup.js            # Jest setup file
    ├── postcss.config.js        # PostCSS configuration
    └── package.json             # Project dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 9+** or **yarn 1.22+** - Package manager
- **Git** - Version control system

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zamong_texteditor.git
   cd zamong_texteditor
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to see the application.

### Development Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build production-ready application
npm run start        # Start production server
npm run lint         # Run ESLint for code quality checks

# Testing
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

## 📝 Feature Documentation

### Author Information

The author information form is the entry point of the application, collecting essential metadata for the story creation process.

#### Implementation Details

```typescript
interface AuthorInfo {
  name: string;      // Author's name
  title: string;     // Story title
}
```

#### Features
- **Form Validation**: Real-time validation ensuring both fields are completed
- **Internationalization**: Supports English and Korean interface languages
- **Responsive Design**: Optimized for desktop and mobile devices
- **State Persistence**: Author information is maintained throughout the session

#### Code Example
```tsx
const { authorInfo, setAuthorInfo, setCurrentStep } = useStoryStore();

const handleSubmit = (e: React.FormEvent) => {
  if (!formData.name.trim() || !formData.title.trim()) {
    alert(t('authorForm.validationError'));
    return;
  }
  setAuthorInfo(formData);
  setCurrentStep(1); // Navigate to editor
};
```

### Paginated Story Editor

The heart of the application, featuring a sophisticated text editor with pagination capabilities and Korean typography support.

#### Core Features

**📄 Smart Pagination**
- Automatic page management with a fixed 4-page limit
- Automatic pagination (no manual page breaks or page creation)
- Content synchronization across pages
- Real-time character and line counting

**✏️ Rich Text Editing**
- Tiptap integration for professional text formatting
- Bold and italic text support
- Custom enhanced textarea with cursor preservation
- Smooth typing with debounced content updates

**🎨 Visual Formatting**
- Text alignment options (left, center, right)
- Vertical alignment (top, middle, bottom)
- Font size controls (8px - 72px range)
- Line height adjustment (1.2x - 2.0x)

**⌨️ Keyboard Shortcuts**
```
Ctrl/Cmd + ←       Navigate to previous page
Ctrl/Cmd + →       Navigate to next page
```

#### Technical Implementation

**Page Management System**
```typescript
interface Page {
  id: string;                    // Unique identifier
  content: string;               // Plain text content
  backgroundTemplate?: BackgroundTemplate;
}

interface EditorSettings {
  fontFamily: string;            // Font selection
  fontSize: number;              // Font size (8-72px)
  lineHeight: number;            // Line spacing (1.2-2.0)
  textAlignment: 'left' | 'center' | 'right';
  globalTextAlignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'middle' | 'bottom';
}
```

**Content Synchronization**
The editor implements sophisticated content synchronization to ensure data integrity:

```typescript
const debouncedUpdateContent = useMemo(
  () => debounce((htmlContent: string) => {
    const textContent = htmlToTextWithLineBreaks(htmlContent);
    if (textContent !== getCurrentPageContent()) {
      updateCurrentPageContent(textContent);
    }
  }, 300),
  [getCurrentPageContent, updateCurrentPageContent]
);
```

**Automatic Pagination**
Content automatically overflows and reflows between pages. The editor observes content height and:
- Splits overflowing content to the next page
- Pulls content back when space becomes available
- Preserves the first-page title layout
- Enforces a fixed 4-page limit

No manual page breaks or page creation shortcuts are available.

#### Font System Integration

The editor integrates with the Korean font system:

```typescript
// Ensures Korean font consistency
useEffect(() => {
  const bodyFont = 'KoPubWorldBatangLight'; // Korean light weight
  if (editorSettings.fontFamily !== bodyFont) {
    setFontFamily(bodyFont);
  }
}, [editorSettings.fontFamily, setFontFamily]);
```

### Batch Image Generator

The final step transforms the written story into professional-quality images with multiple background options and export capabilities.

#### Core Features

**🎨 Multiple Background Templates**
- Stage 1-4 background variations
- Preview gallery with thumbnail generation
- Individual image download capability
- Background toggle for preview/export

**📊 Batch Processing**
- Simultaneous generation of all page/background combinations
- Progress tracking with detailed status updates
- ZIP file export with organized folder structure
- Memory-efficient canvas management

**🖼️ High-Quality Export**
- Standard Instagram story dimensions (900×1600px)
- PNG format with transparency support
- Professional typography rendering
- Consistent font rendering across all exports

#### Technical Implementation

**Canvas Integration**
```typescript
const generateImageWithBackground = useCallback(async (
  section: StorySection,
  backgroundPath: string,
  pageNumber: number,
  backgroundId?: string
): Promise<string> => {
  // 1. Ensure fonts are loaded
  await ensureFontsLoaded();
  
  // 2. Create Fabric.js canvas
  const canvas = new fabric.Canvas(canvasElement, {
    width: EXPORT_DIMENSIONS.width,
    height: EXPORT_DIMENSIONS.height,
    backgroundColor: '#ffffff'
  });
  
  // 3. Add background image if enabled
  if (backgroundPreview) {
    fabric.Image.fromURL(backgroundPath, (img) => {
      canvas.add(img);
      canvas.sendToBack(img);
    });
  }
  
  // 4. Add title text (first page only)
  if (pageNumber === 1 && authorInfo.title) {
    const titleElement = new fabric.Textbox(authorInfo.title, {
      fontSize: 60,
      fontFamily: getTitleFont(),
      textAlign: 'center',
      lineHeight: 1.5
    });
    canvas.add(titleElement);
  }
  
  // 5. Add body text with proper styling
  const text = new fabric.Textbox(section.content, {
    fontSize: textStyle.fontSize,
    fontFamily: textStyle.fontFamily,
    fill: textStyle.color,
    textAlign: textStyle.alignment,
    lineHeight: editorSettings.lineHeight
  });
  canvas.add(text);
  
  // 6. Export as blob URL
  const dataURL = canvas.toDataURL({ format: 'png', quality: 1 });
  const blob = await fetch(dataURL).then(res => res.blob());
  return URL.createObjectURL(blob);
}, [editorSettings, authorInfo, backgroundPreview]);
```

**ZIP File Generation**
```typescript
const handleGenerateAndDownload = async () => {
  const zip = new JSZip();
  const folderName = `${authorInfo.name}_${authorInfo.title}`;
  
  // Create folders for each background stage
  for (const background of DEFAULT_BACKGROUNDS) {
    const stageFolder = zip.folder(`${folderName}/${background.name}`);
    
    // Generate images for each page with this background
    for (let pageIndex = 0; pageIndex < sections.length; pageIndex++) {
      const imageUrl = await generateImageWithBackground(
        sections[pageIndex], 
        background.path, 
        pageIndex + 1, 
        background.id
      );
      
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      stageFolder.file(`${authorInfo.title}_Page_${pageIndex + 1}.png`, blob);
    }
  }
  
  // Generate and download ZIP
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  // Trigger download...
};
```

## 🏗️ Architecture

### Component Architecture

The application follows a modular component architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    App Router (Next.js)                 │
├─────────────────────────────────────────────────────────┤
│                   Client Layout                         │
│  ┌─────────────────┬─────────────────┬────────────────┐ │
│  │  Author Form    │   Story Editor  │ Image Generator│ │
│  │                 │                 │                │ │
│  │  - Form         │  - Tiptap       │ - Fabric.js    │ │
│  │  - Validation   │  - Pagination   │ - Canvas       │ │
│  │  - i18n         │  - Typography   │ - Export       │ │
│  └─────────────────┴─────────────────┴────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                  Zustand Store                          │
│  ┌─────────────────┬─────────────────┬────────────────┐ │
│  │   Author Info   │     Content     │   Settings     │ │
│  │   - name        │     - pages     │   - fonts      │ │
│  │   - title       │     - sections  │   - alignment  │ │
│  └─────────────────┴─────────────────┴────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input → Component → Zustand Store → State Update → Re-render
     ↓
Canvas Operations → Fabric.js → Image Generation → Export
```

### State Management Pattern

```typescript
// Zustand store pattern
interface StoryStore extends StoryState {
  // State
  authorInfo: AuthorInfo;
  content: string;
  pages: Page[];
  sections: StorySection[];
  editorSettings: EditorSettings;
  
  // Actions
  setAuthorInfo: (info: AuthorInfo) => void;
  setContent: (content: string) => void;
  addPage: (content?: string) => boolean;
  updatePageContent: (pageId: string, content: string) => void;
  // ... more actions
}
```

## 🎨 Design System

### Color Palette

The application uses a carefully crafted color system built on CSS custom properties:

```css
:root {
  --background: 0 0% 100%;          /* White background */
  --foreground: 222.2 84% 4.9%;     /* Near-black text */
  --primary: 221.2 83.2% 53.3%;     /* Blue primary */
  --secondary: 210 40% 96%;         /* Light gray secondary */
  --muted: 210 40% 96%;             /* Muted backgrounds */
  --border: 214.3 31.8% 91.4%;     /* Border color */
  --accent: 210 40% 94%;            /* Accent color */
}
```

### Typography System

```scss
// Font loading with CSS @font-face
@font-face {
  font-family: 'KoPubWorldBatangLight';
  src: url('/fonts/KoPubWorld Batang Light.ttf') format('truetype');
  font-weight: 300;
  font-display: swap;
}

@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/author-handwriting-font.ttf') format('truetype');
  font-weight: 400;
  font-display: swap;
}

// Tailwind utility classes
.font-korean-light { font-family: 'KoPubWorldBatangLight', sans-serif; }
.font-korean-handwriting { font-family: 'CustomFont', cursive; }
```

### Component Variants

Using `class-variance-authority` for consistent component styling:

```typescript
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
);
```

## 🌐 Internationalization

### Language Support

The application provides comprehensive bilingual support for English and Korean:

**Supported Languages:**
- **English (en)** - Default language for international users
- **Korean (ko)** - Native language support with proper typography

### Implementation Architecture

```typescript
// Language store using Zustand
interface LanguageStore {
  language: 'en' | 'ko';
  setLanguage: (lang: 'en' | 'ko') => void;
}

// i18next configuration
export default {
  fallbackLng: 'en',
  debug: process.env.NODE_ENV === 'development',
  resources: {
    en: { common: require('../public/locales/en/common.json') },
    ko: { common: require('../public/locales/ko/common.json') }
  }
};
```

### Translation Files Structure

```json
// /public/locales/en/common.json
{
  "app": {
    "title": "Zamong Text Editor",
    "subtitle": "Transform your stories into beautiful Storycards"
  },
  "steps": {
    "authorInfo": "Author Info",
    "writeStory": "Write Story",
    "generateImages": "Generate Images"
  },
  "editor": {
    "title": "Paginated Story Editor",
    "textAlignment": "Text Alignment:",
    "insertPageBreak": "Insert Page Break"
  }
}
```

```json
// /public/locales/ko/common.json
{
  "app": {
    "title": "자몽 텍스트 에디터",
    "subtitle": "당신의 이야기를 아름다운 스토리카드로 변환하세요"
  },
  "steps": {
    "authorInfo": "작가 정보",
    "writeStory": "스토리 작성",
    "generateImages": "이미지 생성"
  },
  "editor": {
    "title": "페이지 스토리 에디터",
    "textAlignment": "텍스트 정렬:",
    "insertPageBreak": "페이지 나누기 삽입"
  }
}
```

### Smart Language Detection

```typescript
// Automatic browser language detection
useEffect(() => {
  if (hasHydrated && typeof window !== 'undefined') {
    const stored = localStorage.getItem('language-storage');
    if (!stored) {
      const browserLang = navigator.language.toLowerCase();
      if (browserLang.startsWith('ko') && language !== 'ko') {
        setLanguage('ko');
      }
    }
  }
}, [hasHydrated, language, setLanguage]);
```

### Component Integration

```tsx
// Using translations in components
function AuthorInfoForm() {
  const { t } = useTranslation('common');
  
  return (
    <div>
      <h1>{t('authorForm.title')}</h1>
      <p>{t('authorForm.description')}</p>
      <input placeholder={t('authorForm.namePlaceholder')} />
    </div>
  );
}
```

### Language Independence

**Critical Design Decision:** The font system remains consistent regardless of UI language:

```typescript
// Font selection is independent of UI language
const getRecommendedFontForLanguage = (): string => {
  // Users write in Korean regardless of UI language mode
  return 'HakgyoansimBareonbatangR'; // Korean font always used
};
```

This ensures that:
- Korean content displays correctly in both UI languages
- Font consistency is maintained during language switching
- Canvas rendering uses appropriate typography regardless of interface language

## 📊 State Management

### Zustand Store Architecture

The application uses Zustand for state management, providing a lightweight and intuitive API:

```typescript
interface StoryState {
  // User Information
  authorInfo: AuthorInfo;
  
  // Content Management
  content: string;                    // Global content string
  pages: Page[];                      // Individual pages
  sections: StorySection[];           // Sections for image generation
  
  // Navigation
  currentStep: number;                // Current workflow step (0-2)
  currentPageIndex: number;           // Active page index
  
  // Editor Configuration
  editorSettings: EditorSettings;
}
```

### Store Actions

**Author Management**
```typescript
setAuthorInfo: (info: AuthorInfo) => void;
```

**Content Management**
```typescript
// Global content operations
setContent: (content: string) => void;

// Page management
setPages: (pages: Page[]) => void;
addPage: (content?: string) => boolean;
updatePage: (pageId: string, content: string) => void;
getCurrentPageContent: () => string;
setCurrentPageContent: (content: string) => void;

// Section management (for image generation)
setSections: (sections: StorySection[]) => void;
updateSection: (sectionId: string, updates: Partial<StorySection>) => void;
```

**Navigation**
```typescript
setCurrentStep: (step: number) => void;
navigateToPage: (index: number) => void;
setCurrentPageIndex: (index: number) => void;
```

**Editor Settings**
```typescript
// Text formatting
setFontFamily: (font: string) => void;
setTextAlignment: (alignment: 'left' | 'center' | 'right') => void;
setVerticalAlignment: (alignment: 'top' | 'middle' | 'bottom') => void;
setFontSize: (size: number) => void;
increaseFontSize: () => void;
decreaseFontSize: () => void;
setLineHeight: (lineHeight: number) => void;
```

### State Synchronization Patterns

**Page to Sections Sync**
```typescript
syncPagesToSections: () => {
  const { pages, editorSettings } = get();
  const sections = pages.map((page) => ({
    id: page.id.replace('page-', 'section-'),
    content: page.content,
    textStyle: { 
      ...defaultTextStyle,
      fontSize: editorSettings.fontSize,
      verticalAlignment: editorSettings.verticalAlignment,
      alignment: editorSettings.globalTextAlignment
    },
    backgroundImage: undefined
  }));
  
  set({ sections });
};
```

**Editor Settings to Sections Sync**
```typescript
syncEditorSettingsToSections: () => {
  const { editorSettings } = get();
  get().updateAllSectionsTextStyle({
    fontSize: editorSettings.fontSize,
    verticalAlignment: editorSettings.verticalAlignment,
    alignment: editorSettings.globalTextAlignment
  });
};
```

### Data Flow Patterns

```
User Action → Component Handler → Store Action → State Update → Component Re-render
                                       ↓
                               Side Effects (Canvas, Navigation)
```

Example flow for page content update:
```typescript
// 1. User types in editor
editor.onUpdate({ editor }) => {
  const newContent = editor.getText();
  
  // 2. Debounced update to store
  debouncedUpdateContent(newContent);
}

// 3. Store action
updateCurrentPageContent: (content: string) => {
  set((state) => ({
    pages: state.pages.map((page, index) => 
      index === state.currentPageIndex 
        ? { ...page, content }
        : page
    )
  }));
};
```

### Store Persistence

While the current implementation doesn't include persistence, the store structure supports easy integration:

```typescript
// Future persistence implementation
const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      // store implementation
    }),
    {
      name: 'zamong-story-storage',
      partialize: (state) => ({
        authorInfo: state.authorInfo,
        pages: state.pages,
        editorSettings: state.editorSettings
      })
    }
  )
);
```

### 🔤 Font System

### Korean Typography Excellence

The application implements a sophisticated font system optimized for Korean content creation with professional typography rendering, using carefully selected fonts for different purposes.

### Font Architecture

**Primary Fonts**
- **KoPubWorldBatangLight** - Primary font for body text and titles with excellent Korean character support
- **CustomFont** (나눔손글씨) - Handwriting-style font for author signatures and decorative elements

### Font Loading Strategy

**1. CSS @font-face Declarations**
```css
@font-face {
  font-family: 'KoPubWorldBatangLight';
  src: url('/fonts/KoPubWorld Batang Light.ttf') format('truetype');
  font-weight: 300;
  font-display: swap;
}

@font-face {
  font-family: 'CustomFont';
  src: url('/fonts/author-handwriting-font.ttf') format('truetype');
  font-weight: 400;
  font-display: swap;
}
```

**2. FontFace API Integration**
```typescript
const loadFontForCanvas = async (fontPath: string, fontFamily: string): Promise<boolean> => {
  try {
    // Check if font is already loaded
    if (document.fonts.check(`16px "${fontFamily}"`)) {
      return true;
    }

    // Load font using FontFace API
    const fontFace = new FontFace(fontFamily, `url(${fontPath})`);
    await fontFace.load();
    document.fonts.add(fontFace);
    
    return true;
  } catch (error) {
    console.warn(`Failed to load font ${fontFamily}:`, error);
    return false;
  }
};
```

**3. Canvas Font Preparation**
```typescript
const ensureFontsLoaded = async (): Promise<void> => {
  const fontPromises = [
    loadFontForCanvas('/fonts/KoPubWorld Batang Light.ttf', 'KoPubWorldBatangLight'),
    loadFontForCanvas('/fonts/author-handwriting-font.ttf', 'CustomFont')
  ];
  
  await Promise.allSettled(fontPromises);
};
```

### Font Selection Logic

**Helper Functions**
```typescript
// Body text font (user content)
export function getBodyFont(): string {
  return 'KoPubWorldBatangLight'; // Korean light weight for readability
}

// Title font (story titles)
export function getTitleFont(): string {
  return 'KoPubWorldBatangLight'; // Same font for consistency
}

// Author signature font
export function getAuthorFont(): string {
  return 'CustomFont'; // Handwriting style for author names
}

// Recommended font regardless of UI language
export function getRecommendedFontForLanguage(): string {
  return 'KoPubWorldBatangLight'; // Consistent Korean typography
}
```

### Font Metrics and Calculations

**Line Height Calculations**
```typescript
const calculateTextHeight = (text: string, fontFamily: string, fontSize: number, lineHeight: number): number => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) return 0;
  
  context.font = `${fontSize}px ${fontFamily}`;
  const lines = text.split('\n');
  
  return lines.length * fontSize * lineHeight;
};
```

**Font Metrics Caching**
```typescript
class FontMetricsCache {
  private cache = new Map<string, CanvasRenderingContext2D>();
  private measurementCache = new Map<string, number>();
  
  getContext(fontFamily: string): CanvasRenderingContext2D {
    const fontKey = `${FONT_SIZE}px ${fontFamily}`;
    
    if (!this.cache.has(fontKey)) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      context.font = fontKey;
      this.cache.set(fontKey, context);
    }
    
    return this.cache.get(fontKey)!;
  }
  
  measureText(text: string, fontFamily: string): number {
    const cacheKey = `${text}:${fontFamily}`;
    
    if (this.measurementCache.has(cacheKey)) {
      return this.measurementCache.get(cacheKey)!;
    }
    
    const context = this.getContext(fontFamily);
    const width = context.measureText(text).width;
    
    // LRU-style cache management
    if (this.measurementCache.size > 1000) {
      const entries = Array.from(this.measurementCache.entries());
      entries.slice(0, 500).forEach(([key]) => this.measurementCache.delete(key));
    }
    
    this.measurementCache.set(cacheKey, width);
    return width;
  }
}
```

### Canvas Text Rendering

**Fabric.js Integration**
```typescript
const addTextToCanvas = (canvas: any, config: CanvasTextConfig) => {
  const {
    text,
    textStyle,
    editorSettings,
    canvasWidth,
    canvasHeight,
    globalAlignment
  } = config;
  
  // Process text for canvas rendering
  let processedText = text || '';
  
  // Handle line height > 1.0 by reducing double newlines
  if (editorSettings.lineHeight > 1.0) {
    processedText = processedText.replace(/\n{2,}/g, '\n');
  }
  
  // Create Fabric.js textbox with Korean font support
  const textbox = new fabric.Textbox(processedText, {
    left: MARGIN,
    top: MARGIN,
    width: canvasWidth - (MARGIN * 2),
    fontSize: textStyle.fontSize,
    fontFamily: textStyle.fontFamily,
    fill: textStyle.color,
    textAlign: globalAlignment || textStyle.alignment,
    lineHeight: editorSettings.lineHeight,
    splitByGrapheme: true, // Essential for Korean text
    selectable: false,
    evented: false
  });
  
  canvas.add(textbox);
};
```

### Font Consistency Enforcement

**Editor Font Enforcement**
```typescript
// Ensure Korean font consistency on mount
useEffect(() => {
  const bodyFont = 'KoPubWorldBatangLight';
  if (editorSettings.fontFamily !== bodyFont) {
    console.log(`[Font Init] Setting Korean body font: ${bodyFont}`);
    setFontFamily(bodyFont);
    setSelectedFont(bodyFont);
  }
}, []); // Only run on mount
```

**Language-Independent Font Selection**
```typescript
// Font remains consistent regardless of UI language
useEffect(() => {
  const koreanFont = 'KoPubWorldBatangLight';
  
  // Only update if there's actually a mismatch
  if (editorSettings.fontFamily !== koreanFont || selectedFont !== koreanFont) {
    console.log(`[Font Sync] Ensuring Korean font: ${koreanFont}`);
    
    if (editorSettings.fontFamily !== koreanFont) {
      setFontFamily(koreanFont);
    }
    
    if (selectedFont !== koreanFont) {
      setSelectedFont(koreanFont);
    }
  }
}, [editorSettings.fontFamily, selectedFont, setFontFamily]);
// Note: language dependency removed to prevent visual font switching
```

### Fallback Strategy

```typescript
const getFallbackFont = (preferredFont: string): string => {
  // Check if preferred font is loaded
  if (document.fonts.check(`16px "${preferredFont}"`)) {
    return preferredFont;
  }
  
  // Fallback hierarchy
  const fallbacks = [
    'KoPubWorldBatangLight',
    'Arial Unicode MS',
    'Malgun Gothic',
    'sans-serif'
  ];
  
  for (const fallback of fallbacks) {
    if (document.fonts.check(`16px "${fallback}"`)) {
      return fallback;
    }
  }
  
  return 'sans-serif'; // Ultimate fallback
};
```

## 🎯 Canvas Operations

### Fabric.js Integration Architecture

The application leverages Fabric.js for sophisticated canvas operations, enabling high-quality image generation with precise typography control.

### Canvas Creation and Management

**Canvas Factory Pattern**
```typescript
const createCanvas = (width: number, height: number): any => {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = width;
  canvasElement.height = height;
  
  return new fabric.Canvas(canvasElement, {
    width,
    height,
    backgroundColor: '#ffffff',
    selection: false,
    skipTargetFind: true
  });
};
```

**Memory Management**
```typescript
const disposeCanvas = (canvas: any) => {
  if (canvas && typeof canvas.dispose === 'function') {
    try {
      canvas.getObjects().forEach((obj: any) => {
        if (obj.dispose) obj.dispose();
      });
      canvas.clear();
      canvas.dispose();
    } catch (error) {
      console.warn('Canvas disposal error:', error);
    }
  }
};
```

### Background Image Processing

**Image Loading with Error Handling**
```typescript
const addBackgroundImage = async (canvas: any, imagePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fabric.Image.fromURL(
      imagePath,
      (img: any) => {
        if (!img) {
          reject(new Error('Failed to load background image'));
          return;
        }

        // Calculate scaling to fill canvas while maintaining aspect ratio
        const scaleX = canvas.width / (img.width || 1);
        const scaleY = canvas.height / (img.height || 1);
        const scale = Math.max(scaleX, scaleY);

        img.set({
          scaleX: scale,
          scaleY: scale,
          left: (canvas.width - (img.width || 0) * scale) / 2,
          top: (canvas.height - (img.height || 0) * scale) / 2,
          selectable: false,
          evented: false,
          excludeFromExport: false
        });

        canvas.add(img);
        canvas.sendToBack(img);
        resolve();
      },
      { crossOrigin: 'anonymous' }
    );
  });
};
```

### Advanced Text Rendering

**Multi-Element Text Composition**
```typescript
const addTextToCanvas = (canvas: any, config: CanvasTextConfig) => {
  const { text, textStyle, editorSettings, canvasWidth, canvasHeight } = config;
  
  // Content margins matching editor (60px)
  const MARGIN = 60;
  const contentWidth = canvasWidth - (MARGIN * 2);
  
  // Process text for optimal canvas rendering
  let processedText = text || '';
  
  // Optimize line breaks for line height > 1.0
  if (editorSettings.lineHeight > 1.0) {
    processedText = processedText.replace(/\n{2,}/g, '\n');
  }
  
  // Create main text element
  const textbox = new fabric.Textbox(processedText, {
    left: MARGIN,
    top: MARGIN,
    width: contentWidth,
    fontSize: textStyle.fontSize,
    fontFamily: textStyle.fontFamily,
    fill: textStyle.color,
    textAlign: textStyle.alignment,
    lineHeight: editorSettings.lineHeight,
    splitByGrapheme: true, // Essential for Korean text
    selectable: false,
    evented: false
  });
  
  canvas.add(textbox);
  return textbox;
};
```

**Dynamic Title Positioning**
```typescript
const addTitleToCanvas = (canvas: any, title: string, pageNumber: number): any => {
  if (pageNumber !== 1 || !title) return null;
  
  const MARGIN = 60;
  const contentWidth = canvas.width - (MARGIN * 2);
  
  const titleElement = new fabric.Textbox(title, {
    left: MARGIN,
    top: MARGIN,
    width: contentWidth,
    fontSize: 60,
    fontFamily: getTitleFont(),
    fill: '#000000',
    textAlign: 'center', // Always center titles
    lineHeight: 1.5,
    splitByGrapheme: true,
    selectable: false,
    evented: false
  });
  
  canvas.add(titleElement);
  
  // Return for positioning calculations
  return titleElement;
};
```

### Vertical Alignment System

**Dynamic Content Positioning**
```typescript
const applyVerticalAlignment = (canvas: any, elements: any[], alignment: 'top' | 'middle' | 'bottom') => {
  const MARGIN = 60;
  const availableHeight = canvas.height - (MARGIN * 2);
  
  // Calculate total content height
  const totalHeight = elements.reduce((sum, element) => {
    const height = element.calcTextHeight ? element.calcTextHeight() : element.height || 0;
    return sum + height;
  }, 0);
  
  // Calculate vertical position based on alignment
  let startY;
  switch (alignment) {
    case 'top':
      startY = MARGIN;
      break;
    case 'bottom':
      startY = canvas.height - MARGIN - totalHeight;
      break;
    case 'middle':
    default:
      startY = (canvas.height - totalHeight) / 2;
      break;
  }
  
  // Position elements
  let currentY = startY;
  elements.forEach(element => {
    element.set({ top: currentY });
    const elementHeight = element.calcTextHeight ? element.calcTextHeight() : element.height || 0;
    currentY += elementHeight + 20; // 20px spacing between elements
  });
  
  canvas.renderAll();
};
```

### Export System

**High-Quality Image Export**
```typescript
const exportCanvasAsImage = async (canvas: any, format: 'jpeg' | 'png' = 'png', quality: number = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Ensure canvas is rendered
      canvas.renderAll();
      
      // Convert to data URL with specified quality
      const dataURL = canvas.toDataURL({
        format,
        quality,
        multiplier: 1 // Use actual canvas size
      });
      
      // Convert data URL to blob
      fetch(dataURL)
        .then(response => response.blob())
        .then(blob => resolve(blob))
        .catch(error => reject(error));
        
    } catch (error) {
      reject(new Error(`Canvas export failed: ${error}`));
    }
  });
};
```

**Batch Export with Progress Tracking**
```typescript
const exportAllImages = async (
  sections: StorySection[], 
  backgrounds: BackgroundTemplate[],
  onProgress?: (current: number, total: number, stage: string) => void
): Promise<Map<string, Blob>> => {
  const results = new Map<string, Blob>();
  const total = sections.length * backgrounds.length;
  let current = 0;
  
  for (const section of sections) {
    for (const background of backgrounds) {
      onProgress?.(current, total, `Generating ${background.name} - Page ${sections.indexOf(section) + 1}`);
      
      try {
        // Create canvas for this combination
        const canvas = createCanvas(EXPORT_DIMENSIONS.width, EXPORT_DIMENSIONS.height);
        
        // Add background
        if (background.path) {
          await addBackgroundImage(canvas, background.path);
        }
        
        // Add text content
        addTextToCanvas(canvas, {
          text: section.content,
          textStyle: section.textStyle,
          editorSettings: getEditorSettings(),
          canvasWidth: EXPORT_DIMENSIONS.width,
          canvasHeight: EXPORT_DIMENSIONS.height
        });
        
        // Export as blob
        const blob = await exportCanvasAsImage(canvas, 'png', 1);
        const key = `${section.id}-${background.id}`;
        results.set(key, blob);
        
        // Clean up
        disposeCanvas(canvas);
        
      } catch (error) {
        console.error(`Failed to export ${background.id} for section ${section.id}:`, error);
      }
      
      current++;
    }
  }
  
  return results;
};
```

### Performance Optimization

**Canvas Pool Management**
```typescript
class CanvasPool {
  private available: any[] = [];
  private inUse = new Set<any>();
  
  acquire(width: number, height: number): any {
    let canvas = this.available.pop();
    
    if (!canvas) {
      canvas = createCanvas(width, height);
    } else {
      canvas.setDimensions({ width, height });
      canvas.clear();
    }
    
    this.inUse.add(canvas);
    return canvas;
  }
  
  release(canvas: any): void {
    if (this.inUse.has(canvas)) {
      this.inUse.delete(canvas);
      canvas.clear();
      this.available.push(canvas);
    }
  }
  
  dispose(): void {
    [...this.available, ...this.inUse].forEach(canvas => {
      disposeCanvas(canvas);
    });
    this.available = [];
    this.inUse.clear();
  }
}
```

**Memory-Conscious Rendering**
```typescript
const renderWithMemoryManagement = async (sections: StorySection[]): Promise<string[]> => {
  const results: string[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    
    // Create canvas
    const canvas = createCanvas(EXPORT_DIMENSIONS.width, EXPORT_DIMENSIONS.height);
    
    try {
      // Render content
      await renderSectionToCanvas(canvas, section);
      
      // Export immediately
      const blob = await exportCanvasAsImage(canvas);
      const url = URL.createObjectURL(blob);
      results.push(url);
      
    } finally {
      // Always clean up canvas
      disposeCanvas(canvas);
      
      // Yield control to prevent blocking
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }
  
  return results;
};
```

## ⚙️ Configuration

### Environment Variables

The application uses environment variables for configuration and feature flags:

```bash
# .env.local
NODE_ENV=development                    # Environment mode
NEXT_PUBLIC_ENABLE_FONT_DEBUG=true     # Enable font loading diagnostics
NEXT_PUBLIC_CANVAS_DEBUG=false         # Enable canvas debugging
```

### Next.js Configuration

**next.config.js**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Web worker support for potential future features
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: 'static/[contenthash].worker.js',
          publicPath: '/_next/',
        },
      },
    });
    
    // Prevent webpack from polyfilling Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    return config;
  },
  
  // Experimental features
  experimental: {
    // Enable if using server components with advanced features
    serverComponentsExternalPackages: ['fabric'],
  }
};
```

### Tailwind CSS Configuration

**tailwind.config.js**
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      // Custom font families
      fontFamily: {
        'korean-light': ['KoPubWorldBatangLight', 'sans-serif'],
        'korean-handwriting': ['CustomFont', 'cursive'],
      },
      
      // Canvas-specific dimensions
      spacing: {
        'canvas': '900px',
        'canvas-height': '1600px',
      },
      
      // Animation for smooth transitions
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(100%)", opacity: 0 },
          to: { transform: "translateX(0)", opacity: 1 },
        },
      },
      animation: {
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography")
  ],
};
```

### TypeScript Configuration

**tsconfig.json**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts"
  ],
  "exclude": ["node_modules"]
}
```

### Testing Configuration

**jest.config.js**
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/app/layout.tsx',
  ],
  testPathIgnorePatterns: ['<rootDir>/.next/', '<rootDir>/node_modules/'],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
};

module.exports = createJestConfig(customJestConfig);
```

**jest.setup.js**
```javascript
import '@testing-library/jest-dom';

// Mock fabric.js for testing
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn(() => ({
      add: jest.fn(),
      renderAll: jest.fn(),
      dispose: jest.fn(),
      toDataURL: jest.fn(() => 'data:image/png;base64,mock'),
    })),
    Textbox: jest.fn(),
    Image: {
      fromURL: jest.fn((url, callback) => callback({ width: 100, height: 100 })),
    },
  },
}));

// Mock canvas context
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  measureText: jest.fn(() => ({ width: 100 })),
  font: '',
}));
```

### Application Constants

**src/lib/constants.ts**
```typescript
// Export dimensions (Instagram story format)
export const STANDARD_DIMENSIONS = {
  width: 900,
  height: 1600
} as const;

// Page constraints
export const PAGE_CONSTRAINTS = {
  MAX_PAGES: 6,
  MAX_CHARACTERS_PER_PAGE: 2000,
  PAGE_PADDING: 60
} as const;

// Font configurations
export const AVAILABLE_FONTS = [
  {
    name: 'KoPub 바탕 라이트',
    family: 'KoPubWorldBatangLight',
    path: '/fonts/KoPubWorld Batang Light.ttf',
    type: 'custom',
    languages: ['ko', 'en'],
    purpose: ['title', 'body']
  },
  {
    name: '나눔손글씨',
    family: 'CustomFont',
    path: '/fonts/author-handwriting-font.ttf',
    type: 'custom',
    languages: ['ko'],
    purpose: ['author']
  }
] as const;

// Background templates
export const DEFAULT_BACKGROUNDS = [
  {
    id: 'stage_1',
    name: '좋아요 0회',
    path: '/backgrounds/stage_1.png',
    description: 'First stage background'
  },
  {
    id: 'stage_2',
    name: '좋아요 1회',
    path: '/backgrounds/stage_2.png',
    description: 'Second stage background'
  },
  {
    id: 'stage_3',
    name: '좋아요 2회',
    path: '/backgrounds/stage_3.png',
    description: 'Third stage background'
  },
  {
    id: 'stage_4',
    name: '좋아요 3회 이상',
    path: '/backgrounds/stage_4.png',
    description: 'Fourth stage background'
  }
] as const;
```

## 🚀 Deployment

### Build Process

The application uses Next.js's optimized build process for production deployment:

```bash
# Production build
npm run build

# Start production server
npm start

# Or use PM2 for process management
pm2 start ecosystem.config.js
```

### Production Optimizations

**Built-in Next.js Optimizations:**
- **Automatic Code Splitting** - Pages and components are split automatically
- **Image Optimization** - Next.js optimizes background images
- **Font Optimization** - Custom fonts are optimized for loading
- **Bundle Analysis** - Built-in bundle analyzer for size optimization

**Custom Optimizations:**
```typescript
// Dynamic imports for heavy components
const BatchImageGenerator = dynamic(
  () => import('@/components/canvas/BatchImageGenerator'),
  { 
    loading: () => <LoadingSpinner />,
    ssr: false // Canvas operations require client-side rendering
  }
);

// Font preloading in document head
<link
  rel="preload"
  href="/fonts/KoPubWorld Batang Light.ttf"
  as="font"
  type="font/truetype"
  crossOrigin=""
/>
<link
  rel="preload"
  href="/fonts/author-handwriting-font.ttf"
  as="font"
  type="font/truetype"
  crossOrigin=""
/>
```

### Deployment Platforms

**Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to Vercel
vercel --prod

# Environment variables via Vercel dashboard
# NEXT_PUBLIC_ENABLE_FONT_DEBUG=false
```

**Docker Deployment**
```dockerfile
# Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

**Kubernetes Deployment**
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: zamong-texteditor
spec:
  replicas: 3
  selector:
    matchLabels:
      app: zamong-texteditor
  template:
    metadata:
      labels:
        app: zamong-texteditor
    spec:
      containers:
      - name: zamong-texteditor
        image: zamong-texteditor:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### Performance Monitoring

**Core Web Vitals Optimization**
- **LCP (Largest Contentful Paint)** < 2.5s - Optimized with font preloading
- **FID (First Input Delay)** < 100ms - Minimized with code splitting
- **CLS (Cumulative Layout Shift)** < 0.1 - Prevented with font-display: swap

**Monitoring Setup**
```typescript
// pages/_app.tsx
import { reportWebVitals } from 'next/web-vitals';

export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Send metrics to analytics
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric value),
    event_label: metric.id,
    non_interaction: true,
  });
}
```

### Security Considerations

**Content Security Policy**
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
      font-src 'self' data:;
      connect-src 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};
```

**Environment Security**
```bash
# .env.production
NODE_ENV=production
NEXT_PUBLIC_ENABLE_FONT_DEBUG=false
NEXT_PUBLIC_CANVAS_DEBUG=false

# Never commit sensitive data
# Use deployment platform's secure environment variable storage
```

## 🐛 Troubleshooting

### Common Issues and Solutions

#### Font Loading Problems

```
Symptom: Canvas-generated images show fallback fonts instead of Korean fonts
Cause: Fonts not properly loaded before canvas operations
```

**Solution:**
```typescript
// Ensure fonts are loaded before canvas operations
const generateImage = async () => {
  try {
    // Wait for fonts to load
    await ensureFontsLoaded();
    
    // Verify font is available
    if (!document.fonts.check('16px "HakgyoansimBareonbatangR"')) {
      console.warn('Korean font not loaded, using fallback');
    }
    
    // Proceed with canvas generation
    createCanvasWithText();
  } catch (error) {
    console.error('Font loading failed:', error);
  }
};
```

**Debug font loading:**
```typescript
// Enable font debugging in development
if (process.env.NODE_ENV === 'development') {
  document.fonts.ready.then(() => {
    console.log('All fonts loaded');
    document.fonts.forEach(font => {
      console.log(`Font: ${font.family}, Status: ${font.status}`);
    });
  });
}
```

#### Canvas Memory Issues

```
Symptom: Browser becomes unresponsive or crashes when generating many images
Cause: Canvas objects not properly disposed, memory accumulation
```

**Solution:**
```typescript
// Implement proper canvas cleanup
const generateImages = async (sections: StorySection[]) => {
  const results = [];
  
  for (const section of sections) {
    let canvas: any = null;
    
    try {
      canvas = createCanvas(EXPORT_DIMENSIONS.width, EXPORT_DIMENSIONS.height);
      
      // Generate image
      await renderSectionToCanvas(canvas, section);
      const blob = await exportCanvasAsImage(canvas);
      results.push(blob);
      
    } finally {
      // Always dispose canvas
      if (canvas) {
        disposeCanvas(canvas);
      }
      
      // Yield control periodically
      if (results.length % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }
  
  return results;
};
```

#### Editor Content Synchronization

```
Symptom: Text written on one page disappears or appears on wrong page
Cause: Race conditions in content updates, improper state synchronization
```

**Solution:**
```typescript
// Use debounced updates with proper sequencing
const debouncedUpdateContent = useMemo(
  () => debounce((htmlContent: string) => {
    const textContent = htmlToTextWithLineBreaks(htmlContent);
    
    // Check if content actually changed
    if (textContent !== getCurrentPageContent()) {
      console.log('[Sync] Updating page content:', textContent.length, 'chars');
      updateCurrentPageContent(textContent);
    }
  }, 300), // Sufficient delay to avoid race conditions
  [getCurrentPageContent, updateCurrentPageContent]
);

// Navigation with content synchronization
const navigateWithSync = async (pageIndex: number) => {
  // Save current content first
  if (editor) {
    const currentContent = htmlToTextWithLineBreaks(editor.getHTML());
    syncContentToPage(currentContent);
  }
  
  // Then navigate
  await navigateToPage(pageIndex);
  
  // Load new content after navigation completes
  setTimeout(() => {
    const newContent = getCurrentPageContent();
    if (editor && newContent !== htmlToTextWithLineBreaks(editor.getHTML())) {
      editor.commands.setContent(textToHtmlWithLineBreaks(newContent));
    }
  }, 100);
};
```

#### Performance Issues

```
Symptom: Noticeable delay when typing, editor feels unresponsive
Cause: Excessive re-renders, heavy computations on main thread
```

**Solution:**
```typescript
// Optimize re-renders with proper dependencies
const Editor = React.memo(() => {
  // Use refs for values that don't need re-renders
  const isNavigatingRef = useRef(false);
  
  // Debounce expensive operations
  const debouncedCalculation = useMemo(
    () => debounce((content: string) => {
      // Heavy calculations here
      calculateLineMetrics(content);
    }, 500),
    []
  );
  
  // Optimize useEffect dependencies
  useEffect(() => {
    if (!isNavigatingRef.current) {
      debouncedCalculation(content);
    }
  }, [content, debouncedCalculation]); // Only essential dependencies
  
  return <EditorContent editor={editor} />;
});
```

#### Browser Compatibility

```
Symptom: Features missing or errors in specific browsers
Cause: Modern API usage without polyfills
```

**Solution:**
```javascript
// Add polyfills for older browsers
// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false
    };
    
    return config;
  },
  
  // Enable SWC compiler for better compatibility
  swcMinify: true,
  
  // Transpile ES6+ features
  experimental: {
    esmExternals: false
  }
};
```

**Feature detection:**
```typescript
// Check for required APIs
const checkBrowserSupport = (): boolean => {
  const required = [
    'FontFace' in window,
    'fetch' in window,
    'Promise' in window,
    'Map' in window,
    'Set' in window
  ];
  
  const unsupported = required.filter(Boolean);
  
  if (unsupported.length > 0) {
    console.warn('Browser missing required features:', unsupported);
    return false;
  }
  
  return true;
};
```

### Debug Modes

**Enable comprehensive debugging:**
```bash
# .env.local
NEXT_PUBLIC_ENABLE_FONT_DEBUG=true
NEXT_PUBLIC_CANVAS_DEBUG=true
NEXT_PUBLIC_EDITOR_DEBUG=true
```

**Debug utilities:**
```typescript
// Font debugging
export const debugFonts = () => {
  console.group('Font Debug Info');
  console.log('Available fonts:', Array.from(document.fonts.values()));
  console.log('Korean font check:', document.fonts.check('16px "HakgyoansimBareonbatangR"'));
  console.groupEnd();
};

// Canvas debugging
export const debugCanvas = (canvas: any) => {
  console.group('Canvas Debug Info');
  console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
  console.log('Objects count:', canvas.getObjects().length);
  console.log('Memory usage estimate:', canvas.getObjects().length * 1000, 'bytes');
  console.groupEnd();
};

// Store debugging  
export const debugStore = () => {
  const state = useStoryStore.getState();
  console.group('Store Debug Info');
  console.log('Pages count:', state.pages.length);
  console.log('Sections count:', state.sections.length);
  console.log('Current step:', state.currentStep);
  console.log('Editor settings:', state.editorSettings);
  console.groupEnd();
};
```

## 📚 API Reference

### Core Types

#### Story Management
```typescript
interface AuthorInfo {
  name: string;      // Author's display name
  title: string;     // Story title
}

interface Page {
  id: string;                    // Unique identifier (UUID format)
  content: string;               // Plain text content with preserved line breaks
  backgroundTemplate?: BackgroundTemplate; // Optional background for this page
}

interface StorySection {
  id: string;                    // Section identifier
  content: string;               // Section text content
  textStyle: TextStyle;          // Typography and positioning
  backgroundImage?: string;      // Background image URL
}
```

#### Typography System
```typescript
interface TextStyle {
  fontFamily: string;            // Font family name
  fontSize: number;              // Font size in pixels (8-72)
  color: string;                 // Text color (hex format)
  position: TextPosition;        // Canvas positioning
  alignment: 'left' | 'center' | 'right';        // Horizontal alignment
  verticalAlignment: 'top' | 'middle' | 'bottom'; // Vertical alignment
}

interface TextPosition {
  x: number;                     // X coordinate (percentage)
  y: number;                     // Y coordinate (percentage)
}

interface EditorSettings {
  fontFamily: string;            // Current font selection
  fontSize: number;              // Editor font size
  lineHeight: number;            // Line spacing multiplier (1.2-2.0)
  textAlignment: 'left' | 'center' | 'right';
  globalTextAlignment: 'left' | 'center' | 'right'; // For canvas export
  verticalAlignment: 'top' | 'middle' | 'bottom';
}
```

#### Canvas and Export
```typescript
interface CanvasSettings {
  width: number;                 // Canvas width (900px standard)
  height: number;                // Canvas height (1600px standard)
  format: 'square' | 'portrait'; // Aspect ratio (currently both use 900x1600)
}

interface ExportSettings {
  format: 'jpg' | 'png';        // Output image format
  quality: number;               // Compression quality (0-1)
}

interface BackgroundTemplate {
  id: string;                    // Background identifier
  name: string;                  // Display name
  imageUrl?: string;             // Background image URL
  color?: string;                // Solid color fallback
  gradient?: {                   // Gradient definition
    colors: string[];
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
}
```

### Zustand Store Actions

#### Author Management
```typescript
// Set author information
setAuthorInfo: (info: AuthorInfo) => void;

// Usage
const { setAuthorInfo } = useStoryStore();
setAuthorInfo({ name: "작가명", title: "스토리 제목" });
```

#### Content Management
```typescript
// Global content operations
setContent: (content: string) => void;

// Page management
setPages: (pages: Page[]) => void;
addPage: (content?: string) => boolean;
addEmptyPage: () => boolean;
updatePage: (pageId: string, content: string) => void;
getCurrentPageContent: () => string;
setCurrentPageContent: (content: string) => void;

// Usage examples
const { addPage, updatePage, getCurrentPageContent } = useStoryStore();

// Add new page with content
const success = addPage("새로운 페이지 내용");

// Update specific page
updatePage("page-123", "수정된 내용");

// Get current active page content
const content = getCurrentPageContent();
```

#### Navigation and State
```typescript
// Workflow navigation
setCurrentStep: (step: number) => void; // 0: Author, 1: Editor, 2: Generator

// Page navigation
navigateToPage: (index: number) => void;
setCurrentPageIndex: (index: number) => void;

// Usage
const { setCurrentStep, navigateToPage } = useStoryStore();
setCurrentStep(1); // Go to editor
navigateToPage(2); // Go to page 3
```

#### Editor Settings
```typescript
// Font and typography
setFontFamily: (font: string) => void;
setFontSize: (size: number) => void;
increaseFontSize: () => void;
decreaseFontSize: () => void;
setLineHeight: (lineHeight: number) => void;

// Text alignment
setTextAlignment: (alignment: 'left' | 'center' | 'right') => void;
setVerticalAlignment: (alignment: 'top' | 'middle' | 'bottom') => void;

// Usage
const { 
  setFontFamily, 
  increaseFontSize, 
  setTextAlignment 
} = useStoryStore();

setFontFamily('HakgyoansimBareonbatangR');
increaseFontSize(); // Increases by 2px
setTextAlignment('center');
```

#### Section Management (Image Generation)
```typescript
// Section operations
setSections: (sections: StorySection[]) => void;
updateSection: (sectionId: string, updates: Partial<StorySection>) => void;
updateSectionTextStyle: (sectionId: string, style: Partial<TextStyle>) => void;
syncPagesToSections: () => void;
syncEditorSettingsToSections: () => void;

// Usage
const { updateSection, syncPagesToSections } = useStoryStore();

// Update section content
updateSection("section-1", { content: "새로운 내용" });

// Sync pages to sections before export
syncPagesToSections();
```

### Custom Hooks

#### usePageManager
```typescript
interface PageManagerReturn {
  totalPages: number;
  getPageInfo: () => PageInfo;
  navigateToPage: (index: number) => void;
  addNewPage: () => void;
  updateCurrentPageContent: (content: string) => void;
  syncContentToPage: (content: string) => void;
  checkPageLimits: () => PageLimitCheck;
}

// Usage
const {
  totalPages,
  getPageInfo,
  navigateToPage,
  addNewPage
} = usePageManager();

const pageInfo = getPageInfo();
console.log(`Page ${pageInfo.currentPage} of ${pageInfo.totalPages}`);
```

#### useZipDownload
```typescript
interface ZipDownloadReturn {
  generateAndDownloadZip: (images: Map<string, string>) => Promise<void>;
  isGenerating: boolean;
  progress: number;
  error: string | null;
}

// Usage
const { generateAndDownloadZip, isGenerating, progress } = useZipDownload();

await generateAndDownloadZip(imageMap);
```

#### useToast
```typescript
interface ToastReturn {
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
  messages: ToastMessage[];
  removeToast: (id: string) => void;
}

// Usage
const { showSuccess, showError } = useToast();

showSuccess('저장 완료', '내용이 성공적으로 저장되었습니다.');
showError('오류 발생', '파일을 저장할 수 없습니다.');
```

### Utility Functions

#### Canvas Operations
```typescript
// Canvas creation and management
createCanvas: (width: number, height: number) => any;
disposeCanvas: (canvas: any) => void;
applyResponsiveScaling: (canvas: any, container: HTMLElement, width: number, height: number) => void;

// Background and text operations
addBackgroundImage: (canvas: any, imagePath: string) => Promise<void>;
addTextToCanvas: (canvas: any, config: CanvasTextConfig) => void;
exportCanvasAsImage: (canvas: any, format?: 'jpeg' | 'png', quality?: number) => Promise<Blob>;

// Usage
const canvas = createCanvas(900, 1600);
await addBackgroundImage(canvas, '/backgrounds/stage_1.png');
addTextToCanvas(canvas, {
  text: "텍스트 내용",
  textStyle: textStyle,
  editorSettings: settings,
  canvasWidth: 900,
  canvasHeight: 1600
});
const blob = await exportCanvasAsImage(canvas, 'png', 1);
disposeCanvas(canvas);
```

#### Font Operations
```typescript
// Font loading and management
ensureFontsLoaded: () => Promise<void>;
loadFontForCanvas: (fontPath: string, fontFamily: string) => Promise<boolean>;
getFallbackFont: (preferredFont: string) => string;

// Font helper functions
getBodyFont: () => string;          // Returns 'KoPubWorldBatangLight'
getTitleFont: () => string;         // Returns 'KoPubWorldBatangLight'  
getAuthorFont: () => string;        // Returns 'CustomFont'

// Usage
await ensureFontsLoaded();
const isLoaded = await loadFontForCanvas('/fonts/KoPubWorld Batang Light.ttf', 'KoPubWorldBatangLight');
const fallback = getFallbackFont('NonexistentFont'); // Returns available fallback
```

#### Text Processing
```typescript
// Content transformation utilities
htmlToTextWithLineBreaks: (html: string) => string;
textToHtmlWithLineBreaks: (text: string) => string;
splitContentPreservingLineBreaks: (content: string, position: number) => { before: string; after: string };
validatePageBreakIntegrity: (original: string, before: string, after: string) => boolean;

// Usage
const htmlContent = '<p>첫 번째 줄</p><p>두 번째 줄</p>';
const textContent = htmlToTextWithLineBreaks(htmlContent); // "첫 번째 줄\n두 번째 줄"
const { before, after } = splitContentPreservingLineBreaks(textContent, 5);
const isValid = validatePageBreakIntegrity(textContent, before, after);
```

### Constants

#### Dimensions and Limits
```typescript
const STANDARD_DIMENSIONS = {
  width: 900,
  height: 1600
};

const PAGE_CONSTRAINTS = {
  MAX_PAGES: 6,
  MAX_CHARACTERS_PER_PAGE: 2000,
  PAGE_PADDING: 60
};
```

#### Font Configurations
```typescript
const AVAILABLE_FONTS = [
  {
    name: 'KoPub 바탕 라이트',
    family: 'KoPubWorldBatangLight',
    path: '/fonts/KoPubWorld Batang Light.ttf',
    type: 'custom',
    languages: ['ko', 'en'],
    purpose: ['title', 'body']
  },
  {
    name: '나눔손글씨',
    family: 'CustomFont',
    path: '/fonts/author-handwriting-font.ttf',
    type: 'custom',
    languages: ['ko'],
    purpose: ['author']
  }
];
```

#### Background Templates
```typescript
const DEFAULT_BACKGROUNDS = [
  {
    id: 'stage_1',
    name: '좋아요 0회',
    path: '/backgrounds/stage_1.png',
    description: 'First stage background'
  },
  {
    id: 'stage_2',
    name: '좋아요 1회',
    path: '/backgrounds/stage_2.png',
    description: 'Second stage background'
  },
  {
    id: 'stage_3',
    name: '좋아요 2회',
    path: '/backgrounds/stage_3.png',
    description: 'Third stage background'
  },
  {
    id: 'stage_4',
    name: '좋아요 3회 이상',
    path: '/backgrounds/stage_4.png',
    description: 'Fourth stage background'
  }
];
```

## 🤝 Contributing

### Development Guidelines

We welcome contributions to the Zamong Text Editor! Please follow these guidelines:

#### Code Standards
- **TypeScript**: All code must be written in TypeScript with proper typing
- **ESLint**: Follow the ESLint configuration for code quality
- **Prettier**: Use Prettier for consistent code formatting
- **Testing**: Include tests for new features and bug fixes

#### Git Workflow
```bash
# 1. Fork and clone the repository
git clone https://github.com/yourusername/zamong_texteditor.git

# 2. Create a feature branch
git checkout -b feature/your-feature-name

# 3. Make your changes with proper commits
git add .
git commit -m "feat: add new feature description"

# 4. Push and create a pull request
git push origin feature/your-feature-name
```

#### Pull Request Guidelines
- **Clear Description**: Explain what your PR does and why
- **Testing**: Ensure all tests pass and add new tests if needed
- **Documentation**: Update documentation for new features
- **Screenshots**: Include screenshots for UI changes

#### Areas for Contribution

**High Priority:**
- 🐛 Bug fixes and stability improvements
- 🌐 Additional language support
- ♿ Accessibility improvements
- 📱 Mobile responsiveness enhancements

**Medium Priority:**
- ✨ New background templates
- 🎨 Additional text styling options
- 🔧 Performance optimizations
- 📊 Analytics integration

**Low Priority:**
- 🎵 Sound effects
- 🎨 Theme system
- 📱 Mobile app version
- 🔌 Third-party integrations

### Issue Reporting

When reporting bugs or requesting features:

```markdown
## Bug Report Template

**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome 90, Firefox 88]
- Version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem.
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Zamong Text Editor

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**Built with ❤️ for the Korean content creation community**

*Transform your stories into visual masterpieces*

[🌟 Star on GitHub](https://github.com/yourusername/zamong_texteditor) | 
[🐛 Report Issues](https://github.com/yourusername/zamong_texteditor/issues) | 
[💡 Request Features](https://github.com/yourusername/zamong_texteditor/issues/new?template=feature_request.yml)

</div>