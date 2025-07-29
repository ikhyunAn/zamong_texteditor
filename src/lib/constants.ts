import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Default Text Styles
export const DEFAULT_TEXT_STYLE = {
  fontFamily: 'CustomFontTTF',
  fontSize: 36,
  color: '#000000',
  position: { x: 50, y: 50 },
  alignment: 'center' as const
};

// Default background image path for text editor preview
export const DEFAULT_BACKGROUND_IMAGE = '/backgrounds/stage_3.png';

// Default background templates for different stages
export const DEFAULT_BACKGROUNDS = [
  {
    id: 'stage_1',
    name: 'Stage 1',
    path: '/backgrounds/stage_1.png',
    description: 'First stage background'
  },
  {
    id: 'stage_2',
    name: 'Stage 2',
    path: '/backgrounds/stage_2.png',
    description: 'Second stage background'
  },
  {
    id: 'stage_3',
    name: 'Stage 3',
    path: '/backgrounds/stage_3.png',
    description: 'Third stage background'
  },
  {
    id: 'stage_4',
    name: 'Stage 4',
    path: '/backgrounds/stage_4.png',
    description: 'Fourth stage background'
  }
];

// Available font configurations
export const AVAILABLE_FONTS = [
  {
    name: '나눔손글씨',
    family: 'CustomFont',
    path: '/fonts/작가폰트_나눔손글씨 딸에게 엄마가.ttf',
    type: 'custom' as const
  },
  {
    name: '학교안심',
    family: 'CustomFontTTF',
    path: '/fonts/HakgyoansimBareonbatangB.ttf',
    type: 'custom' as const
  }
];


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
  lineHeight: 1.5,
  fontSize: 16,
  fontFamily: 'CustomFontTTF',
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
  { label: 'Tight (1.2)', value: 1.2 },
  { label: 'Normal (1.5)', value: 1.5 },
  { label: 'Loose (1.8)', value: 1.8 },
  { label: 'Extra Loose (2.0)', value: 2.0 }
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
