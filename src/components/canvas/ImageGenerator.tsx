'use client';

import { useState, useEffect, useRef } from 'react';
import { fabric } from 'fabric';

// Type for fabric canvas - using Record for flexibility with fabric.js API
type FabricCanvas = Record<string, unknown> & {
  getObjects(type?: string): unknown[];
  add(object: unknown): void;
  clear(): void;
  dispose(): void;
  renderAll(): void;
}
import { useStoryStore } from '@/store/useStoryStore';
import { useZipDownload } from '@/hooks/useZipDownload';
import { useToast } from '@/hooks/useToast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TextStyler } from './TextStyler';
import { 
  ArrowLeft, 
  Download, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle,
  Square,
  Smartphone
} from 'lucide-react';
import { 
  createCanvas, 
  addBackgroundImage, 
  addTextToCanvas,
  CanvasTextConfig,
  safeRender,
  applyResponsiveScaling,
  disposeCanvas,
  exportCanvasAsImage
} from '@/lib/canvas-utils';
import { STANDARD_DIMENSIONS } from '@/lib/constants';

export function ImageGenerator() {
  const { 
    sections, 
    updateSectionTextStyle, 
    setCurrentStep,
    syncEditorSettingsToSections,
    editorSettings 
  } = useStoryStore();
  const { showError } = useToast();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [canvasFormat, setCanvasFormat] = useState<'square' | 'portrait'>('square');
  const [generatedCanvases, setGeneratedCanvases] = useState<Map<string, string>>(new Map());
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  
  // Clear generated canvases when format changes
  useEffect(() => {
    // Clean up existing blob URLs
    generatedCanvases.forEach((blobUrl) => {
      URL.revokeObjectURL(blobUrl);
    });
    setGeneratedCanvases(new Map());
  }, [canvasFormat]);
  
  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      generatedCanvases.forEach((blobUrl) => {
        URL.revokeObjectURL(blobUrl);
      });
    };
  }, []);
  
  const { generateAndDownloadZip, isGenerating: isDownloading, progress, error: downloadError } = useZipDownload();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);

  const currentSection = sections[currentSectionIndex];
  // Use standard dimensions (900 × 1600) for both formats
  const dimensions = STANDARD_DIMENSIONS;

  // Initialize canvas
  useEffect(() => {
    if (!canvasContainerRef.current || !currentSection) return;

    // Create AbortController for cleanup
    const controller = new AbortController();
    setCanvasError(null);

    try {
      // Clear existing canvas
      if (fabricCanvasRef.current) {
        disposeCanvas(fabricCanvasRef.current);
        fabricCanvasRef.current = null;
      }

      // Create new canvas
      const canvasElement = document.createElement('canvas');
      canvasElement.width = dimensions.width;
      canvasElement.height = dimensions.height;
      canvasElement.style.maxWidth = '100%';
      canvasElement.style.maxHeight = '500px';
      canvasElement.style.border = '1px solid #e5e7eb';
      canvasElement.style.objectFit = 'contain';
      
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = '';
        canvasContainerRef.current.appendChild(canvasElement);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = new (fabric as any).Canvas(canvasElement, {
        width: dimensions.width,
        height: dimensions.height,
        backgroundColor: '#ffffff'
      });

      fabricCanvasRef.current = canvas;
    
      // Apply responsive scaling
      if (canvasContainerRef.current) {
        applyResponsiveScaling(canvas, canvasContainerRef.current, dimensions.width, dimensions.height);
      }
      
      // Add resize listener for responsive scaling
      const handleResize = () => {
        if (canvasContainerRef.current && fabricCanvasRef.current) {
          applyResponsiveScaling(fabricCanvasRef.current, canvasContainerRef.current, dimensions.width, dimensions.height);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Also listen for container size changes (in case parent container changes)
      let resizeObserver: ResizeObserver | null = null;
      if (canvasContainerRef.current && window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          handleResize();
        });
        resizeObserver.observe(canvasContainerRef.current);
      }

      // Load content with abort signal
      loadCanvasContent(canvas, currentSection, controller.signal);

      // Return cleanup function that has access to handleResize
      return () => {
        // Abort any pending operations
        controller.abort();
        
        // Clean up event listeners
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        
        // Guarded disposal
        if (fabricCanvasRef.current) {
          disposeCanvas(fabricCanvasRef.current);
          fabricCanvasRef.current = null;
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize canvas';
      setCanvasError(errorMessage);
      showError('Canvas Initialization Error', errorMessage);
      
      // Show fallback UI
      if (canvasContainerRef.current) {
        canvasContainerRef.current.innerHTML = `
          <div class="flex items-center justify-center h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg">
            <div class="text-center">
              <div class="text-gray-500 text-lg font-medium mb-2">Preview unavailable</div>
              <div class="text-gray-400 text-sm">Canvas failed to initialize</div>
            </div>
          </div>
        `;
      }
      
      // Return cleanup function for error case
      return () => {
        controller.abort();
      };
    }
  }, [currentSectionIndex, canvasFormat, currentSection, dimensions, showError, editorSettings.globalTextAlignment]);


  useEffect(() => {
    syncEditorSettingsToSections();
  }, [editorSettings, syncEditorSettingsToSections]);

  const loadCanvasContent = async (canvas: FabricCanvas, section: typeof currentSection, signal?: AbortSignal) => {
    try {
      // Check if aborted before starting
      if (signal?.aborted) return;

      // Add background image
      if (section.backgroundImage) {
        await addBackgroundImage(canvas, section.backgroundImage);
        // Check if aborted after async operation
        if (signal?.aborted) return;
      }

      // Add text
      const textConfig: CanvasTextConfig = {
        text: section.content,
        textStyle: section.textStyle,
        editorSettings: editorSettings,
        canvasWidth: dimensions.width,
        canvasHeight: dimensions.height,
        globalAlignment: editorSettings.globalTextAlignment
      };

      addTextToCanvas(canvas, textConfig);
      
    } catch (error) {
      // Don't log errors if the operation was aborted
      if (signal?.aborted) return;
      
      // Show error toast instead of console log
      showError('Canvas Error', error instanceof Error ? error.message : 'Failed to load canvas content');
      
      // Display fallback UI directly on canvas
      const context = (canvas as unknown as { getContext(): CanvasRenderingContext2D }).getContext();
      if (context) {
        canvas.clear();
        const canvasElement = (canvas as unknown as { getElement(): HTMLCanvasElement }).getElement();
        const ctx = canvasElement.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#F5F5F5';
          ctx.fillRect(0, 0, dimensions.width, dimensions.height);
          ctx.fillStyle = '#9CA3AF';
          ctx.font = `${editorSettings.fontSize}px ${editorSettings.fontFamily}`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          // Calculate line spacing using fontSize * lineHeight
          const lineSpacing = editorSettings.fontSize * editorSettings.lineHeight;
          const halfLineSpacing = lineSpacing / 2;
          
          ctx.fillText('Preview unavailable', dimensions.width / 2, dimensions.height / 2 - halfLineSpacing);
          ctx.font = `${Math.max(editorSettings.fontSize - 8, 12)}px ${editorSettings.fontFamily}`;
          ctx.fillText('Canvas failed to load', dimensions.width / 2, dimensions.height / 2 + halfLineSpacing);
        }
      }
    }
  };

  const handleStyleChange = () => {
    syncEditorSettingsToSections();
  };

  const handlePositionChange = (position: { x: number; y: number }) => {
    updateSectionTextStyle(currentSection.id, { position });
    
    // Update canvas text position
    if (fabricCanvasRef.current) {
      const textObjects = fabricCanvasRef.current.getObjects('textbox');
      if (textObjects.length > 0) {
        const textbox = textObjects[0] as Record<string, unknown> & { set(options: Record<string, unknown>): void };
        const left = (position.x / 100) * dimensions.width;
        const top = (position.y / 100) * dimensions.height;
        
        textbox.set({ left, top });
        safeRender(fabricCanvasRef.current);
      }
    }
  };

  const handleGenerateAll = async () => {
    setIsGeneratingAll(true);
    const newCanvases = new Map();
    
    try {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        try {
          // Create individual canvas for each section
          const canvas = createCanvas(dimensions.width, dimensions.height);
          
          if (section.backgroundImage) {
            await addBackgroundImage(canvas, section.backgroundImage);
          }
          
          const textConfig: CanvasTextConfig = {
            text: section.content,
            textStyle: section.textStyle,
            editorSettings: editorSettings,
            canvasWidth: dimensions.width,
            canvasHeight: dimensions.height,
            globalAlignment: editorSettings.globalTextAlignment
          };
          
          addTextToCanvas(canvas, textConfig);
          
          // Export canvas to blob, then dispose
          const blob = await exportCanvasAsImage(canvas, 'jpeg', 0.9);
          disposeCanvas(canvas);
          
          // Create a Blob URL and store it
          newCanvases.set(section.id, URL.createObjectURL(blob));
        } catch (sectionError) {
          // Create a fallback image for this section
          const fallbackCanvas = document.createElement('canvas');
          fallbackCanvas.width = dimensions.width;
          fallbackCanvas.height = dimensions.height;
          const ctx = fallbackCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#F5F5F5';
            ctx.fillRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
            ctx.fillStyle = '#9CA3AF';
            ctx.font = `${editorSettings.fontSize}px ${editorSettings.fontFamily}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Calculate line spacing using fontSize * lineHeight
            const lineSpacing = editorSettings.fontSize * editorSettings.lineHeight;
            const halfLineSpacing = lineSpacing / 2;
            
            ctx.fillText('Image unavailable', fallbackCanvas.width / 2, fallbackCanvas.height / 2 - halfLineSpacing);
            ctx.font = `${Math.max(editorSettings.fontSize - 8, 12)}px ${editorSettings.fontFamily}`;
            ctx.fillText(`Section ${i + 1}`, fallbackCanvas.width / 2, fallbackCanvas.height / 2 + halfLineSpacing);
          }
          
          // Convert fallback canvas to blob
          fallbackCanvas.toBlob((blob) => {
            if (blob) {
              newCanvases.set(section.id, URL.createObjectURL(blob));
            }
          }, 'image/jpeg', 0.9);
          
          showError(`Error generating image for section ${i + 1}`, sectionError instanceof Error ? sectionError.message : 'Unknown error');
        }
      }
      
      setGeneratedCanvases(newCanvases);
    } catch (error) {
      showError('Error generating all images', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleBack = () => {
    setCurrentStep(3);
  };

  const goToSection = (index: number) => {
    setCurrentSectionIndex(index);
  };

  if (!currentSection) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>No sections available. Please go back and create your story sections.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Instagram Images</CardTitle>
          <CardDescription>
            Customize the text styling and generate images for each section of your story.
            Currently editing section {currentSectionIndex + 1} of {sections.length}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Format Selection */}
          <div className="flex items-center space-x-4 mb-4">
            <span className="text-sm font-medium">Image Format:</span>
            <Button
              variant={canvasFormat === 'square' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCanvasFormat('square')}
            >
              <Square className="w-4 h-4 mr-2" />
              Square (1:1)
            </Button>
            <Button
              variant={canvasFormat === 'portrait' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCanvasFormat('portrait')}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Portrait (4:5)
            </Button>
          </div>

          {/* Section Navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {sections.map((section, index) => (
                <Button
                  key={section.id}
                  variant={index === currentSectionIndex ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => goToSection(index)}
                  className="text-xs"
                >
                  {index + 1}
                  {generatedCanvases.has(section.id) && (
                    <CheckCircle className="w-3 h-3 ml-1 text-green-500" />
                  )}
                </Button>
              ))}
            </div>
            
            <div className="text-sm text-gray-600">
              &quot;{currentSection.content.substring(0, 30)}...&quot;
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canvas Preview */}
        <Card className="z-0 pointer-events-auto">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <ImageIcon className="w-5 h-5 mr-2" />
              Preview - Section {currentSectionIndex + 1}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center">
              {canvasError ? (
                <div className="flex items-center justify-center h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg w-full max-w-md">
                  <div className="text-center">
                    <div className="text-gray-500 text-lg font-medium mb-2">Preview unavailable</div>
                    <div className="text-gray-400 text-sm">Canvas failed to load</div>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-3 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : (
                <div 
                  ref={canvasContainerRef}
                  className="instagram-canvas relative border rounded-lg bg-gray-50 flex items-center justify-center w-full max-w-full h-auto overflow-hidden"
                  style={{ minHeight: '300px', maxHeight: '500px' }}
                >
                  {/* Canvas will be inserted here */}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Text Styling Controls */}
        <div className="z-10">
          <TextStyler
            textStyle={currentSection.textStyle}
            onStyleChange={handleStyleChange}
            onPositionChange={handlePositionChange}
          />
        </div>
      </div>

      {/* Generation and Download */}
      <Card>
        <CardHeader>
          <CardTitle>Generate and Download</CardTitle>
          <CardDescription>
            Generate all images and download them as a ZIP file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleGenerateAll}
              disabled={isGeneratingAll}
              className="flex-1"
            >
              {isGeneratingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4 mr-2" />
              )}
              Generate All Images ({sections.length})
            </Button>
            
            <Button
              onClick={() => generateAndDownloadZip(generatedCanvases)}
              disabled={generatedCanvases.size === 0 || isDownloading}
              variant="outline"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              Download ZIP
            </Button>
          </div>

          {/* Progress */}
          {isDownloading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Generating ZIP file...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {downloadError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {downloadError}
            </div>
          )}

          {/* Success message */}
          {generatedCanvases.size === sections.length && !isGeneratingAll && (
            <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              All {sections.length} images generated successfully!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Backgrounds
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          Start New Story
        </Button>
      </div>
    </div>
  );
}
