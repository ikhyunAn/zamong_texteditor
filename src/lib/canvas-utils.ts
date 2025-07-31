import { fabric } from 'fabric';
import { StorySection, TextStyle, CanvasSettings, EditorSettings } from '@/types';
import { STANDARD_DIMENSIONS } from './constants';
import { loadAvailableFonts, loadCustomFonts } from './font-utils';

/**
 * Safely render canvas only if canvas is truthy and has a valid context
 */
export function safeRender(canvas: any): void {
  if (canvas && canvas.getContext()) {
    canvas.renderAll();
  }
}

export interface CanvasTextConfig {
  text: string;
  textStyle: TextStyle;
  editorSettings?: EditorSettings;
  canvasWidth: number;
  canvasHeight: number;
  globalAlignment?: 'left' | 'center' | 'right';
}

/**
 * Create a fabric.js canvas for image generation
 * Returns canvas with dispose method for cleanup
 */
export function createCanvas(width: number, height: number): any {
  const canvasElement = document.createElement('canvas');
  canvasElement.width = width;
  canvasElement.height = height;
  
  const canvas = new fabric.Canvas(canvasElement, {
    width,
    height,
    backgroundColor: '#ffffff'
  });
  
  return canvas;
}

/**
 * Safely dispose of a fabric.js canvas
 */
export function disposeCanvas(canvas: any): void {
  if (canvas && typeof canvas.dispose === 'function') {
    try {
      canvas.dispose();
    } catch (error) {
      console.warn('Error disposing fabric canvas:', error);
    }
  }
}

/**
 * Apply responsive scaling to a canvas within its container
 */
export function applyResponsiveScaling(
  canvas: any,
  container: HTMLElement,
  originalWidth: number,
  originalHeight: number
): void {
  if (!canvas || !container) return;
  
  const scale = Math.min(1, container.clientWidth / originalWidth);
  canvas.setDimensions(
    { width: originalWidth * scale, height: originalHeight * scale },
    { cssOnly: true }
  );
  canvas.setZoom(scale);
}

/**
 * Load an image and add it as background to canvas
 */
export async function addBackgroundImage(
  canvas: any, 
  imageUrl: string,
  signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Check if already aborted before starting
      if (signal?.aborted) {
        reject(new DOMException('Operation aborted', 'AbortError'));
        return;
      }

      // Set up abort listener
      const abortHandler = () => {
        reject(new DOMException('Operation aborted', 'AbortError'));
      };
      
      signal?.addEventListener('abort', abortHandler);

      fabric.Image.fromURL(imageUrl, { crossOrigin: 'anonymous' }, (img: any) => {
        try {
          // Check if aborted during image loading
          if (signal?.aborted) {
            signal?.removeEventListener('abort', abortHandler);
            reject(new DOMException('Operation aborted', 'AbortError'));
            return;
          }

          if (!img) {
            signal?.removeEventListener('abort', abortHandler);
            reject(new Error('Failed to load image from URL'));
            return;
          }
          
          const canvasWidth = canvas.getWidth();
          const canvasHeight = canvas.getHeight();
          
          // Scale image to cover the entire canvas
          const imgWidth = img.width || 1;
          const imgHeight = img.height || 1;
          const canvasRatio = canvasWidth / canvasHeight;
          const imgRatio = imgWidth / imgHeight;
          
          let scale: number;
          if (canvasRatio > imgRatio) {
            scale = canvasWidth / imgWidth;
          } else {
            scale = canvasHeight / imgHeight;
          }
          
          img.scale(scale);
          img.set({
            left: (canvasWidth - imgWidth * scale) / 2,
            top: (canvasHeight - imgHeight * scale) / 2,
            selectable: false,
            evented: false
          });
          
          // Check if aborted before setting background and rendering
          if (signal?.aborted) {
            signal?.removeEventListener('abort', abortHandler);
            reject(new DOMException('Operation aborted', 'AbortError'));
            return;
          }
          
          canvas.setBackgroundImage(img, () => {
            try {
              // Final check before rendering
              if (signal?.aborted) {
                signal?.removeEventListener('abort', abortHandler);
                reject(new DOMException('Operation aborted', 'AbortError'));
                return;
              }
              
              safeRender(canvas);
              signal?.removeEventListener('abort', abortHandler);
              resolve();
            } catch (renderError) {
              signal?.removeEventListener('abort', abortHandler);
              reject(new Error(`Failed to render background image: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`));
            }
          });
        } catch (imageError) {
          signal?.removeEventListener('abort', abortHandler);
          reject(new Error(`Failed to process background image: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`));
        }
      });
    } catch (error) {
      reject(new Error(`Failed to load background image: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Add styled text to canvas
 */
export function addTextToCanvas(
  canvas: any,
  config: CanvasTextConfig
): any {
  try {
    const { text, textStyle, editorSettings, canvasWidth, canvasHeight } = config;
    
    // Use editorSettings for fontSize and fontFamily if available, otherwise fall back to textStyle
    const fontSize = editorSettings?.fontSize || textStyle.fontSize;
    const fontFamily = editorSettings?.fontFamily || textStyle.fontFamily;
    const lineHeight = editorSettings?.lineHeight || 1.5;
    
    // Get vertical alignment from editorSettings or textStyle
    const verticalAlignment = editorSettings?.verticalAlignment || textStyle.verticalAlignment || 'middle';
    
    // Calculate textbox width (80% of canvas width with some padding)
    const textboxWidth = canvasWidth * 0.8;
    
    // Calculate the total height of the text
    const textHeight = calculateTextHeight(text, fontSize, lineHeight, textboxWidth);
    
    // Calculate vertical position based on alignment
    let calculatedTop: number;
    if (verticalAlignment === 'top' || verticalAlignment === 'middle' || verticalAlignment === 'bottom') {
      // Map 'middle' to 'middle' for the helper function
      const alignmentForCalculation = verticalAlignment === 'middle' ? 'middle' as const : verticalAlignment;
      calculatedTop = calculateVerticalPosition(alignmentForCalculation, canvasHeight, textHeight);
    } else {
      // Fallback to percentage-based positioning if alignment is not recognized
      calculatedTop = (textStyle.position.y / 100) * canvasHeight;
    }
    
    // Calculate horizontal position
    const finalAlignment = config.globalAlignment || textStyle.alignment;
    let calculatedLeft = (textStyle.position.x / 100) * canvasWidth;
    
    // Adjust horizontal position for center alignment
    if (finalAlignment === 'center') {
      calculatedLeft = (canvasWidth - textboxWidth) / 2;
    }
    
    const textbox = new fabric.Textbox(text, {
      left: calculatedLeft,
      top: calculatedTop,
      width: textboxWidth,
      fontSize: fontSize,
      fontFamily: fontFamily,
      lineHeight: lineHeight,
      fill: textStyle.color,
      textAlign: finalAlignment,
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // Slight background for readability
      padding: 10,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      cornerStyle: 'circle',
      cornerColor: '#007bff',
      borderColor: '#007bff',
      transparentCorners: false
    });
    
    canvas.add(textbox);
    canvas.setActiveObject(textbox);
    
    return textbox;
  } catch (error) {
    throw new Error(`Failed to add text to canvas: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Export canvas as image blob
 */
export function exportCanvasAsImage(
  canvas: any,
  format: 'jpeg' | 'png' = 'jpeg',
  quality: number = 0.9
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      // Deselect all objects before export
      canvas.discardActiveObject();
      safeRender(canvas);
      
      const dataURL = canvas.toDataURL({
        format: format === 'jpeg' ? 'image/jpeg' : 'image/png',
        quality: format === 'jpeg' ? quality : 1,
        multiplier: 1 // Full resolution
      });
      
      // Convert data URL to blob
      fetch(dataURL)
        .then(res => {
          if (!res.ok) {
            throw new Error(`Failed to convert canvas to blob: ${res.status} ${res.statusText}`);
          }
          return res.blob();
        })
        .then(blob => resolve(blob))
        .catch(err => reject(new Error(`Failed to export canvas as image: ${err instanceof Error ? err.message : 'Unknown error'}`)));
    } catch (error) {
      reject(new Error(`Failed to export canvas: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Generate filename for image
 */
export function generateImageFilename(
  title: string,
  pageNumber: number,
  format: 'jpg' | 'png' = 'jpg'
): string {
  // Clean title for filename
  const cleanTitle = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  return `${cleanTitle}_${pageNumber}.${format}`;
}

/**
 * Generate zip filename
 */
export function generateZipFilename(authorName: string, title: string): string {
  const cleanAuthor = authorName
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  
  const cleanTitle = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  
  return `${cleanAuthor}_${cleanTitle}.zip`;
}

/**
 * Wrap text to fit within canvas bounds
 */
export function wrapText(
  text: string,
  maxWidth: number,
  fontSize: number,
  fontFamily: string = 'Arial'
): string[] {
  // This is a simplified text wrapping - in a real implementation,
  // you might want to use canvas measureText for more accuracy
  const avgCharWidth = fontSize * 0.6;
  const maxCharsPerLine = Math.floor(maxWidth / avgCharWidth);
  
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    if ((currentLine + word).length <= maxCharsPerLine) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word is too long, force break
        lines.push(word);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * Calculate optimal font size for text to fit in area
 */
export function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  minFontSize: number = 16,
  maxFontSize: number = 72,
  lineHeight: number = 1.5
): number {
  let fontSize = maxFontSize;
  
  while (fontSize >= minFontSize) {
    const lines = wrapText(text, maxWidth, fontSize);
    // Calculate actual line spacing using fontSize * lineHeight
    const actualLineSpacing = fontSize * lineHeight;
    const totalHeight = lines.length * actualLineSpacing;
    
    if (totalHeight <= maxHeight) {
      return fontSize;
    }
    
    fontSize -= 2;
  }
  
  return minFontSize;
}

/**
 * Calculate the total height of text based on number of lines and line height
 */
export function calculateTextHeight(
  text: string,
  fontSize: number,
  lineHeight: number = 1.5,
  maxWidth?: number
): number {
  if (!text || text.length === 0) return 0;
  
  let lines: string[];
  if (maxWidth) {
    lines = wrapText(text, maxWidth, fontSize);
  } else {
    // Count actual line breaks in the text
    lines = text.split('\n');
  }
  
  // Calculate actual line spacing
  const actualLineSpacing = fontSize * lineHeight;
  return lines.length * actualLineSpacing;
}

/**
 * Calculate the starting Y position based on vertical alignment
 */
export function calculateVerticalPosition(
  verticalAlignment: 'top' | 'middle' | 'bottom',
  canvasHeight: number,
  textHeight: number,
  padding: number = 20
): number {
  switch (verticalAlignment) {
    case 'top':
      return padding;
    case 'middle':
      return (canvasHeight - textHeight) / 2;
    case 'bottom':
      return canvasHeight - textHeight - padding;
    default:
      return (canvasHeight - textHeight) / 2; // Default to middle
  }
}

/**
 * Ensure fonts are loaded before canvas operations
 */
export async function ensureFontsLoaded(): Promise<void> {
  try {
    await Promise.allSettled([
      loadAvailableFonts(),
      loadCustomFonts()
    ]);
  } catch (error) {
    console.warn('Font loading failed:', error);
    // Don't throw - continue with fallback fonts
  }
}
