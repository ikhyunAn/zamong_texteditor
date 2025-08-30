/**
 * Web Worker for batch export processing
 * Handles canvas generation in a separate thread to prevent UI blocking
 */

// Import types
import { TextStyle } from '@/types';

interface ExportTask {
  id: string;
  sectionContent: string;
  textStyle: TextStyle;
  editorSettings?: {
    fontSize: number;
    fontFamily: string;
    lineHeight: number;
  };
  backgroundImage?: string;
  dimensions: { width: number; height: number };
  pageNumber: number;
  globalAlignment?: 'left' | 'center' | 'right';
  title?: string; // Add title property for first page rendering
}

interface ExportResult {
  id: string;
  dataUrl: string;
  pageNumber: number;
  error?: string;
}

// Process a single export task
async function processExportTask(task: ExportTask): Promise<ExportResult> {
  try {
    // Create offscreen canvas
    const canvas = new OffscreenCanvas(task.dimensions.width, task.dimensions.height);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    // Fill background
    if (task.backgroundImage) {
      // Load and draw background image
      const response = await fetch(task.backgroundImage);
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      
      ctx.drawImage(bitmap, 0, 0, task.dimensions.width, task.dimensions.height);
    } else {
      // Default white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, task.dimensions.width, task.dimensions.height);
    }

    // Configure text style - prioritize editorSettings over textStyle
    const fontSize = task.editorSettings?.fontSize || task.textStyle.fontSize || 24;
    const fontFamily = task.editorSettings?.fontFamily || task.textStyle.fontFamily || 'Arial';
    const lineHeight = task.editorSettings?.lineHeight || 1.5;
    const padding = 80;

    let startY = padding + fontSize;
    
    // Add title on the first page if present
    if (task.pageNumber === 1 && task.title) {
      const titleFontSize = Math.max(fontSize + 6, 28);
      const titleLineHeight = 1.2;
      
      // Configure title styling
      ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
      ctx.fillStyle = task.textStyle.color || '#000000';
      ctx.textAlign = 'center'; // Always center-align the title
      
      // Draw title at center of canvas width
      const titleX = task.dimensions.width / 2;
      const titleY = task.dimensions.height * 0.05 + titleFontSize; // Start near top
      
      ctx.fillText(task.title, titleX, titleY);
      
      // Adjust content start position to be below title
      startY = titleY + (titleFontSize * titleLineHeight) + 20; // Add spacing after title
    }

    // Configure text style for content
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.fillStyle = task.textStyle.color || '#000000';
    ctx.textAlign = task.globalAlignment || task.textStyle.alignment || 'left';

    // Word wrap and draw content text
    const maxWidth = task.dimensions.width - (padding * 2);
    const lines = wrapText(ctx, task.sectionContent, maxWidth);
    
    // Calculate actual line spacing using fontSize * lineHeight
    const actualLineSpacing = fontSize * lineHeight;
    let y = startY;
    
    lines.forEach(line => {
      // Calculate x position based on alignment
      let x = padding;
      if (ctx.textAlign === 'center') {
        x = task.dimensions.width / 2;
      } else if (ctx.textAlign === 'right') {
        x = task.dimensions.width - padding;
      }
      
      ctx.fillText(line, x, y);
      y += actualLineSpacing;
    });

    // Convert to blob and then to data URL
    const blob = await canvas.convertToBlob({ type: 'image/png', quality: 0.95 });
    const reader = new FileReader();
    
    return new Promise((resolve) => {
      reader.onloadend = () => {
        resolve({
          id: task.id,
          dataUrl: reader.result as string,
          pageNumber: task.pageNumber
        });
      };
      reader.readAsDataURL(blob);
    });

  } catch (error) {
    return {
      id: task.id,
      dataUrl: '',
      pageNumber: task.pageNumber,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Text wrapping function
function wrapText(ctx: OffscreenCanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

// Listen for messages from main thread
self.addEventListener('message', async (event) => {
  const { type, tasks } = event.data;

  if (type === 'EXPORT_BATCH') {
    // Process tasks in parallel with a limit
    const BATCH_SIZE = 3; // Process 3 at a time to avoid memory issues
    const results: ExportResult[] = [];

    for (let i = 0; i < tasks.length; i += BATCH_SIZE) {
      const batch = tasks.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((task: ExportTask) => processExportTask(task))
      );
      
      results.push(...batchResults);

      // Send progress update
      self.postMessage({
        type: 'PROGRESS',
        progress: results.length,
        total: tasks.length
      });
    }

    // Send final results
    self.postMessage({
      type: 'COMPLETE',
      results
    });
  }
});

// Export empty object to make TypeScript happy
export {};
