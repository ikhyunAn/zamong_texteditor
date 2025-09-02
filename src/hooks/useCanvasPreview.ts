'use client';

import { useEffect, useRef, useCallback } from 'react';
import { EditorSettings } from '@/types';
import { debounce } from '@/lib/debounce';
import { 
  addBackgroundImage, 
  addTextToCanvas, 
  CanvasTextConfig, 
  safeRender,
  disposeCanvas,
  ensureFontsLoaded
} from '@/lib/canvas-utils';

interface UseCanvasPreviewOptions {
  debounceMs?: number;
  onUpdateStart?: () => void;
  onUpdateComplete?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing real-time canvas preview updates
 * Debounces updates for performance and provides loading states
 */
export function useCanvasPreview(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  editorSettings: EditorSettings,
  content: string,
  options: UseCanvasPreviewOptions = {}
) {
  const {
    debounceMs = 300,
    onUpdateStart,
    onUpdateComplete,
    onError
  } = options;

  const abortControllerRef = useRef<AbortController | null>(null);
  const isUpdatingRef = useRef(false);

  const updateCanvasPreview = useCallback(async (
    canvasElement: HTMLCanvasElement,
    textContent: string,
    settings: EditorSettings,
    backgroundImage?: string,
    signal?: AbortSignal
  ) => {
    try {
      if (signal?.aborted) return;
      
      // Create a temporary fabric canvas for preview
      const { fabric } = await import('fabric');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tempCanvas = new (fabric as any).Canvas(canvasElement, {
        width: canvasElement.width,
        height: canvasElement.height,
        backgroundColor: '#ffffff'
      });

      // Load fonts first
      try {
        await ensureFontsLoaded();
      } catch (fontError) {
        console.warn('Font loading failed, using fallback fonts:', fontError);
      }

      if (signal?.aborted) {
        tempCanvas.dispose();
        return;
      }

      // Add background image if provided
      if (backgroundImage) {
        await addBackgroundImage(tempCanvas, backgroundImage, signal);
        if (signal?.aborted) {
          tempCanvas.dispose();
          return;
        }
      }

      // Add text content
      if (textContent.trim()) {
        const textConfig: CanvasTextConfig = {
          text: textContent,
          textStyle: {
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            color: '#000000', // Default color
            position: { x: 10, y: 10 }, // Default position
            alignment: settings.textAlignment,
            verticalAlignment: settings.verticalAlignment
          },
          editorSettings: settings,
          canvasWidth: tempCanvas.getWidth(),
          canvasHeight: tempCanvas.getHeight(),
          globalAlignment: settings.globalTextAlignment
        };

        addTextToCanvas(tempCanvas, textConfig);
      }

      safeRender(tempCanvas);
      
      // Clean up the temporary fabric canvas
      setTimeout(() => {
        if (!signal?.aborted) {
          disposeCanvas(tempCanvas);
        }
      }, 100);
    } catch (error) {
      if (signal?.aborted) return;
      throw error;
    }
  }, []);

  // Debounced update function
  const debouncedUpdate = useCallback(async () => {
    if (!canvasRef.current || isUpdatingRef.current) return;

    // Cancel any previous update
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      isUpdatingRef.current = true;
      onUpdateStart?.();

      await updateCanvasPreview(
        canvasRef.current,
        content,
        editorSettings,
        undefined, // No background image in basic preview
        controller.signal
      );

      if (!controller.signal.aborted) {
        onUpdateComplete?.();
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        onError?.(error instanceof Error ? error : new Error('Canvas update failed'));
      }
    } finally {
      if (!controller.signal.aborted) {
        isUpdatingRef.current = false;
      }
    }
  }, [editorSettings, content, updateCanvasPreview, onUpdateStart, onUpdateComplete, onError, canvasRef]);

  // Effect to trigger updates when dependencies change
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create debounced function inside useEffect to avoid dependency issues
    const debouncedFn = debounce(debouncedUpdate, debounceMs);
    debouncedFn();

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedUpdate, canvasRef, debounceMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    updateCanvasPreview,
    isUpdating: isUpdatingRef.current
  };
}
