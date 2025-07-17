import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Instagram Canvas Dimensions
export const INSTAGRAM_DIMENSIONS = {
  SQUARE: { width: 1080, height: 1080 },
  PORTRAIT: { width: 1080, height: 1350 }
} as const;

// Default Text Styles
export const DEFAULT_TEXT_STYLE = {
  fontFamily: 'Arial',
  fontSize: 36,
  color: '#000000',
  position: { x: 50, y: 50 },
  alignment: 'center' as const
};

// Available Fonts
export const AVAILABLE_FONTS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Impact',
  'Courier New'
] as const;

// Font Sizes
export const FONT_SIZES = [
  { label: 'Small', value: 24 },
  { label: 'Medium', value: 36 },
  { label: 'Large', value: 48 },
  { label: 'Extra Large', value: 60 },
  { label: 'Huge', value: 72 }
] as const;

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
