import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Default Text Styles
export const DEFAULT_TEXT_STYLE = {
  fontFamily: 'KoPubWorldBatangLight', // KoPubWorld Batang Light for body text
  fontSize: 32,
  color: '#000000',
  position: { x: 50, y: 50 },
  alignment: 'center' as const,
  verticalAlignment: 'middle' as const
};

// Default background image path for text editor preview
export const DEFAULT_BACKGROUND_IMAGE = '/backgrounds/stage_3.png';

// Default background templates for different stages
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
];

// Available font configurations - Only two fonts used
export const AVAILABLE_FONTS = [
  {
    name: 'KoPub 바탕 라이트',
    family: 'KoPubWorldBatangLight',
    path: '/fonts/KoPubWorld Batang Light.ttf',
    type: 'custom' as const,
    languages: ['ko', 'en'] as const,
    purpose: ['title', 'body'] as const // Used for titles and body text
  },
  {
    name: '나눔손글씨',
    family: 'CustomFont',
    path: '/fonts/author-handwriting-font.ttf',
    type: 'custom' as const,
    languages: ['ko'] as const,
    purpose: ['author'] as const // Used for author names only
  }
];

// Helper function to get recommended font based on language
export function getRecommendedFontForLanguage(): string {
  // Since users write in Korean regardless of UI language mode,
  // use KoPubWorld Batang Light for body text
  return 'KoPubWorldBatangLight';
}

// Helper function to get body text font (user-typed content)
export function getBodyFont(): string {
  return 'KoPubWorldBatangLight'; // KoPubWorld Batang Light - for body text
}

// Helper function to get title font
export function getTitleFont(): string {
  return 'KoPubWorldBatangLight'; // KoPubWorld Batang Light - for titles
}

// Helper function to get author name font
export function getAuthorFont(): string {
  return 'CustomFont'; // 나눔손글씨 딸에게 엄마가 - keep handwriting font for author names
}

// Text Colors
export const TEXT_COLORS = [
  '#000000', // Black
  '#FFFFFF', // White
  '#333333', // Dark Gray
  '#666666', // Medium Gray
  '#999999', // Light Gray
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#008000', // Dark Green
  '#000080'  // Navy
] as const;

// Default editor settings
export const EDITOR_SETTINGS = {
  maxLines: 25,
  lineHeight: 1.8,
  fontSize: 32,
  fontFamily: 'KoPubWorldBatangLight', // KoPubWorld Batang Light for body text
  titleFontFamily: 'KoPubWorldBatangLight', // KoPubWorld Batang Light for titles
  authorFontFamily: 'CustomFont', // Author name font - 나눔손글씨 (문체 유지)
  backgroundColor: 'transparent',
  textColor: '#000000',
  padding: {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20
  },
  borderRadius: 8,
  showLineNumbers: false,
  wordWrap: true,
  spellCheck: true,
  autoFocus: true
};

// Line height options
export const LINE_HEIGHT_OPTIONS = [
  { label: 'Normal (1.8)', value: 1.8 },
  { label: 'Loose (2.0)', value: 2.0 },
  { label: 'Extra Loose (2.2)', value: 2.2 }
];

// Standard image dimensions (900 × 1600 pixels)
export const STANDARD_DIMENSIONS = {
  width: 900,
  height: 1600
};

// Font size options
export const FONT_SIZES = [
  { label: 'Small', value: 24 },
  { label: 'Medium', value: 36 },
  { label: 'Large', value: 48 },
  { label: 'Extra Large', value: 64 }
];
