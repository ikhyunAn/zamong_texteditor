import JSZip from 'jszip';
import { fabric } from 'fabric';
import { Page, AuthorInfo, TextStyle } from '@/types';
import { DEFAULT_BACKGROUNDS } from './constants';

// Export dimensions matching your requirement
export const EXPORT_DIMENSIONS = {
  width: 900,
  height: 1600
};

interface ExportProgress {
  current: number;
  total: number;
  stage: string;
}

// Generate a single image with background
async function generateImageWithBackground(
  page: Page,
  backgroundPath: string,
  textStyle: TextStyle,
  pageNumber: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = new fabric.Canvas(null, {
      width: EXPORT_DIMENSIONS.width,
      height: EXPORT_DIMENSIONS.height,
      backgroundColor: '#ffffff'
    });

    // Load background image
    // @ts-ignore - Fabric types issue
    fabric.Image.fromURL(backgroundPath, (img) => {
      if (!img) {
        reject(new Error('Failed to load background image'));
        return;
      }

      // Scale image to fit canvas
      const scaleX = EXPORT_DIMENSIONS.width / img.width!;
      const scaleY = EXPORT_DIMENSIONS.height / img.height!;
      const scale = Math.max(scaleX, scaleY);

      img.set({
        scaleX: scale,
        scaleY: scale,
        left: (EXPORT_DIMENSIONS.width - img.width! * scale) / 2,
        top: (EXPORT_DIMENSIONS.height - img.height! * scale) / 2,
        selectable: false,
        evented: false
      });

      canvas.add(img);
      canvas.sendToBack(img);

      // Add text
      const text = new fabric.Textbox(page.content, {
        left: EXPORT_DIMENSIONS.width * 0.1,
        top: EXPORT_DIMENSIONS.height * 0.1,
        width: EXPORT_DIMENSIONS.width * 0.8,
        fontSize: textStyle.fontSize,
        fontFamily: textStyle.fontFamily,
        fill: textStyle.color,
        textAlign: textStyle.alignment,
        lineHeight: 1.5,
        splitByGrapheme: true,
        selectable: false,
        evented: false
      });

      // Position text based on style
      const positionLeft = (textStyle.position.x / 100) * EXPORT_DIMENSIONS.width;
      const positionTop = (textStyle.position.y / 100) * EXPORT_DIMENSIONS.height;
      
      text.set({
        left: positionLeft - text.width! / 2,
        top: positionTop - text.height! / 2
      });

      canvas.add(text);
      canvas.renderAll();

      // Convert canvas to data URL then to blob
      const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1,
        multiplier: 1
      });
      
      // Convert data URL to blob
      fetch(dataURL)
        .then(res => res.blob())
        .then(blob => {
          // Clean up
          canvas.dispose();
          resolve(blob);
        })
        .catch(error => {
          canvas.dispose();
          reject(new Error('Failed to export canvas to blob: ' + error.message));
        });
    }, { crossOrigin: 'anonymous' });
  });
}

// Generate all versions of the story with different backgrounds using Web Workers
export async function generateAllVersions(
  pages: Page[],
  authorInfo: AuthorInfo,
  textStyle: TextStyle,
  onProgress?: (progress: ExportProgress) => void
): Promise<Blob> {
  const zip = new JSZip();
  const folderName = `${authorInfo.name.replace(/\s+/g, '_')}_${authorInfo.title.replace(/\s+/g, '_')}`;
  
  const totalImages = pages.length * DEFAULT_BACKGROUNDS.length;
  let currentImage = 0;

  // Check if Web Workers are supported
  const useWorker = typeof Worker !== 'undefined';
  
  // Create folders for each stage
  for (const background of DEFAULT_BACKGROUNDS) {
    const stageFolder = zip.folder(`${folderName}/${background.name.replace(/\s+/g, '_')}`);
    
    if (!stageFolder) {
      throw new Error('Failed to create stage folder');
    }

    // Generate images for each page
    if (useWorker && pages.length > 3) {
      // Use Web Worker for batch processing when there are many pages
      const worker = new Worker(new URL('../workers/export.worker.ts', import.meta.url));
      
      const tasks = pages.map((page, i) => ({
        id: `${background.id}-page-${i}`,
        sectionContent: page.content,
        textStyle,
        backgroundImage: background.path,
        dimensions: EXPORT_DIMENSIONS,
        pageNumber: i + 1
      }));
      
      const results = await new Promise<any[]>((resolve, reject) => {
        worker.onmessage = (event) => {
          const { type, results, progress, total } = event.data;
          
          if (type === 'PROGRESS') {
            currentImage = progress + (DEFAULT_BACKGROUNDS.indexOf(background) * pages.length);
            if (onProgress) {
              onProgress({
                current: currentImage,
                total: totalImages,
                stage: `${background.name} - Processing...`
              });
            }
          } else if (type === 'COMPLETE') {
            resolve(results);
          }
        };
        
        worker.onerror = reject;
        worker.postMessage({ type: 'EXPORT_BATCH', tasks });
      });
      
      // Process worker results
      for (const result of results) {
        if (result.error) {
          throw new Error(`Failed to generate image: ${result.error}`);
        }
        
        // Convert data URL to blob
        const response = await fetch(result.dataUrl);
        const blob = await response.blob();
        
        const fileName = `${authorInfo.title.replace(/\s+/g, '_')}_Page_${result.pageNumber}.png`;
        stageFolder.file(fileName, blob);
      }
      
      worker.terminate();
      currentImage = (DEFAULT_BACKGROUNDS.indexOf(background) + 1) * pages.length;
      
    } else {
      // Fall back to synchronous processing for small batches
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        if (onProgress) {
          onProgress({
            current: currentImage,
            total: totalImages,
            stage: `${background.name} - Page ${i + 1}`
          });
        }

        try {
          // Generate image with this background
          const imageBlob = await generateImageWithBackground(
            page,
            background.path,
            textStyle,
            i + 1
          );

          // Add to zip with proper naming
          const fileName = `${authorInfo.title.replace(/\s+/g, '_')}_Page_${i + 1}.png`;
          stageFolder.file(fileName, imageBlob);

          currentImage++;
        } catch (error) {
          console.error(`Error generating image for ${background.name} - Page ${i + 1}:`, error);
          throw new Error(`Failed to generate image for ${background.name} - Page ${i + 1}`);
        }
      }
    }
  }

  // Generate zip file
  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9
    }
  }, (metadata) => {
    if (onProgress && metadata.percent) {
      onProgress({
        current: totalImages,
        total: totalImages,
        stage: `Creating ZIP file... ${Math.round(metadata.percent)}%`
      });
    }
  });

  return zipBlob;
}

// Helper function to download the zip file
export function downloadZip(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Helper function to preview a single page with background
export async function previewPageWithBackground(
  page: Page,
  backgroundPath: string,
  textStyle: TextStyle
): Promise<string> {
  const blob = await generateImageWithBackground(page, backgroundPath, textStyle, 1);
  return URL.createObjectURL(blob);
}
