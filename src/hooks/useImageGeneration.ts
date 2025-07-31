import { useState, useCallback, useRef } from 'react';
import { StorySection, EditorSettings } from '@/types';
import { 
  createCanvas, 
  addBackgroundImage, 
  addTextToCanvas,
  CanvasTextConfig, 
  disposeCanvas
} from '@/lib/canvas-utils';
import { useToast } from '@/hooks/useToast';
import { STANDARD_DIMENSIONS } from '@/lib/constants';

interface UseImageGenerationReturn {
  generateImage: (section: StorySection, format: 'square' | 'portrait', editorSettings?: EditorSettings) => Promise<HTMLCanvasElement>;
  isGenerating: boolean;
  error: string | null;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { showError } = useToast();

  const generateImage = useCallback(async (
    section: StorySection, 
    format: 'square' | 'portrait' = 'square', // format parameter kept for API compatibility
    editorSettings?: EditorSettings
  ): Promise<HTMLCanvasElement> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Use standard dimensions (900 × 1600) for both formats
      const dimensions = STANDARD_DIMENSIONS;
      
      // Format is available for future use but currently both formats use same dimensions
      console.log('Generating image with format:', format);
      
      // Create canvas
      const canvas = createCanvas(dimensions.width, dimensions.height);
      canvasRef.current = canvas;

      // Add background image if available
      if (section.backgroundImage) {
        await addBackgroundImage(canvas, section.backgroundImage);
      }

      // Add text
      const textConfig: CanvasTextConfig = {
        text: section.content,
        textStyle: section.textStyle,
        editorSettings: editorSettings,
        canvasWidth: dimensions.width,
        canvasHeight: dimensions.height
      };

      addTextToCanvas(canvas, textConfig);

      // Return the canvas element
      return canvas.getElement();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate image';
      setError(errorMessage);

      // Show error toast
      showError('Image Generation Error', errorMessage);

      // Dispose canvas if necessary
      if (canvasRef.current) {
        disposeCanvas(canvasRef.current);
        canvasRef.current = null;
      }

      // Return a fallback canvas
      const canvas = document.createElement('canvas');
      canvas.width = STANDARD_DIMENSIONS.width;
      canvas.height = STANDARD_DIMENSIONS.height;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#F0F0F0';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#888';
        const fallbackFontSize = editorSettings?.fontSize || 20;
        const fallbackFontFamily = editorSettings?.fontFamily || 'Arial';
        context.font = `${fallbackFontSize}px ${fallbackFontFamily}`;
        context.textAlign = 'center';
        context.fillText('Preview unavailable', canvas.width / 2, canvas.height / 2);
      }
      return canvas;
    } finally {
      setIsGenerating(false);
    }
  }, [showError]);

  return {
    generateImage,
    isGenerating,
    error
  };
}
