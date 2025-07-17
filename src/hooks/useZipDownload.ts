import { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { useStoryStore } from '@/store/useStoryStore';
import { useToast } from '@/hooks/useToast';
import { 
  exportCanvasAsImage, 
  generateImageFilename, 
  generateZipFilename 
} from '@/lib/canvas-utils';

interface UseZipDownloadReturn {
  generateAndDownloadZip: (generatedCanvases: Map<string, string>) => Promise<void>;
  isGenerating: boolean;
  progress: number;
  error: string | null;
}

export function useZipDownload(): UseZipDownloadReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { authorInfo } = useStoryStore();
  const { showError, showSuccess } = useToast();

  const generateAndDownloadZip = useCallback(async (generatedCanvases: Map<string, string>) => {
    setIsGenerating(true);
    setProgress(0);
    setError(null);

    try {
      const zip = new JSZip();
      
      if (generatedCanvases.size === 0) {
        throw new Error('No images found to download');
      }

      const blobUrls = Array.from(generatedCanvases.values());
      
      for (let i = 0; i < blobUrls.length; i++) {
        const blobUrl = blobUrls[i];
        
        try {
          // Fetch the blob from the URL
          const response = await fetch(blobUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch image ${i + 1}: ${response.status} ${response.statusText}`);
          }
          const blob = await response.blob();

          // Generate filename
          const filename = generateImageFilename(authorInfo.title, i + 1, 'jpg');
          
          // Add to zip
          zip.file(filename, blob);
          
          // Update progress
          setProgress(((i + 1) / blobUrls.length) * 100);
        } catch (imageError) {
          throw new Error(`Failed to process image ${i + 1}: ${imageError instanceof Error ? imageError.message : 'Unknown error'}`);
        }
      }

      // Generate zip file
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });

      // Download zip file
      const zipFilename = generateZipFilename(authorInfo.name, authorInfo.title);
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = zipFilename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      
      // Safely remove the link with a timeout
      setTimeout(() => {
        try {
          if (link.parentNode) {
            link.parentNode.removeChild(link);
          }
          URL.revokeObjectURL(url);
        } catch (error) {
          console.warn('Error removing download link:', error);
        }
      }, 100);

      // Show success message
      showSuccess('ZIP file downloaded successfully', `${blobUrls.length} images exported`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate ZIP file';
      setError(errorMessage);
      showError('ZIP Download Error', errorMessage);
    } finally {
      setIsGenerating(false);
    }
  }, [authorInfo, showError, showSuccess]);

  return {
    generateAndDownloadZip,
    isGenerating,
    progress,
    error
  };
}
