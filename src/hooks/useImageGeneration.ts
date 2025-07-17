import { useState, useCallback, useRef } from 'react';
import { fabric } from 'fabric';
import { StorySection } from '@/types';
import { 
  createCanvas, 
  addBackgroundImage, 
  addTextToCanvas,
  CanvasTextConfig, 
  disposeCanvas
} from '@/lib/canvas-utils';
import { useToast } from '@/hooks/useToast';
import { INSTAGRAM_DIMENSIONS } from '@/lib/constants';

interface UseImageGenerationReturn {
  generateImage: (section: StorySection, format: 'square' | 'portrait') => Promise<HTMLCanvasElement>;
  isGenerating: boolean;
  error: string | null;
}

export function useImageGeneration(): UseImageGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<any>(null);
  const { showError } = useToast();

  const generateImage = useCallback(async (
    section: StorySection, 
    format: 'square' | 'portrait' = 'square'
  ): Promise<HTMLCanvasElement> => {
    setIsGenerating(true);
    setError(null);

    try {
      const dimensions = format === 'square' 
        ? INSTAGRAM_DIMENSIONS.SQUARE 
        : INSTAGRAM_DIMENSIONS.PORTRAIT;
      
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
      canvas.width = INSTAGRAM_DIMENSIONS.SQUARE.width;
      canvas.height = INSTAGRAM_DIMENSIONS.SQUARE.height;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#F0F0F0';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#888';
        context.font = '20px Arial';
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
