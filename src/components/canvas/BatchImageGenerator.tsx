'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fabric } from 'fabric';
import { useStoryStore } from '@/store/useStoryStore';
import { useToast } from '@/hooks/useToast';
import type { StorySection } from '@/types';
import { getTitleFont, getAuthorFont } from '@/lib/constants';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Download, 
  Image as ImageIcon, 
  Loader2, 
  CheckCircle,
  ZoomIn,
  Eye,
  FileArchive,
  ImageOff
} from 'lucide-react';
import { DEFAULT_BACKGROUNDS, DEFAULT_TEXT_STYLE } from '@/lib/constants';
import JSZip from 'jszip';

// Export dimensions - 900x1600 as required
const EXPORT_DIMENSIONS = {
  width: 900,
  height: 1600
};

// Types for the preview system
interface PreviewImage {
  pageIndex: number;
  backgroundId: string;
  imageUrl: string;
  isLoading: boolean;
}

interface ExportProgress {
  current: number;
  total: number;
  stage: string;
  isComplete: boolean;
}

export function BatchImageGenerator() {
  const { t } = useTranslation('common');
  const { 
    sections,
    authorInfo,
    setCurrentStep,
    editorSettings,
    syncEditorSettingsToSections
  } = useStoryStore();
  const { showError, showSuccess } = useToast();
  
  // Ensure sections are synced with latest editor settings when component mounts
  useEffect(() => {
    if (sections && sections.length > 0) {
      syncEditorSettingsToSections();
    }
  }, []); // Only run on mount
  
  // State for preview system
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);
  const [isGeneratingPreviews, setIsGeneratingPreviews] = useState(false);
  const [selectedPreviewPage, setSelectedPreviewPage] = useState<number | null>(null);
  const [selectedPreviewBackground, setSelectedPreviewBackground] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState(true);
  
  // State for export system
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // Clean up blob URLs on unmount
  useEffect(() => {
    return () => {
      previewImages.forEach((preview) => {
        URL.revokeObjectURL(preview.imageUrl);
      });
    };
  }, []);
  
  // Function to generate image with background
  const generateImageWithBackground = useCallback(async (
    section: StorySection,
    backgroundPath: string,
    pageNumber: number,
    backgroundId?: string
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const canvasElement = document.createElement('canvas');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const canvas = new (fabric as any).Canvas(canvasElement, {
        width: EXPORT_DIMENSIONS.width,
        height: EXPORT_DIMENSIONS.height,
        backgroundColor: '#ffffff'
      });

      const addTextAndRender = () => {
        // Use the section's textStyle which has been synced with editorSettings
        const textStyle = section.textStyle || DEFAULT_TEXT_STYLE;
        // Also apply lineHeight from editorSettings
        const lineHeight = editorSettings.lineHeight || 1.5;
        
        // Use consistent margins with the editor (60px padding)
        const MARGIN = 60;
        const contentWidth = EXPORT_DIMENSIONS.width - (MARGIN * 2);
        const contentLeft = MARGIN;
        
        // Check if this is the first page (pageNumber === 1)
        const isFirstPage = pageNumber === 1;
        let topOffset = MARGIN;
        
        // Add title on the first page
        if (isFirstPage && authorInfo.title) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const titleText = new (fabric as any).Text(authorInfo.title, {
            left: contentLeft,
            top: topOffset,
            width: contentWidth,
            fontSize: 60,
            fontFamily: getTitleFont(), // Use 학교안심 for title (same as body)
            fill: textStyle.color || '#000000',
            textAlign: editorSettings.globalTextAlignment || 'left',
            selectable: false,
            evented: false
          });
          
          // Center the title horizontally based on alignment
          if (editorSettings.globalTextAlignment === 'center') {
            titleText.set({ left: EXPORT_DIMENSIONS.width / 2 - (titleText.width || 0) / 2 });
          } else if (editorSettings.globalTextAlignment === 'right') {
            titleText.set({ left: EXPORT_DIMENSIONS.width - MARGIN - (titleText.width || 0) });
          }
          
          canvas.add(titleText);
          
          // Add spacing after title (using line height of title)
          topOffset += 60 * 1.5 + 20; // title height * line height + extra spacing
        }
        
        // Process text content for canvas rendering
        let textContent = section.content || '';
        
        // When using line height > 1, double newlines create too much space
        // Convert double newlines to single newlines to maintain paragraph separation
        // without excessive spacing when combined with line height multiplier
        if (lineHeight > 1.0) {
          // Replace multiple consecutive newlines with single newline
          textContent = textContent.replace(/\n{2,}/g, '\n');
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const text = new (fabric as any).Textbox(textContent, {
          left: contentLeft,
          top: topOffset,
          width: contentWidth,
          fontSize: textStyle.fontSize,
          fontFamily: textStyle.fontFamily,
          fill: textStyle.color,
          textAlign: textStyle.alignment,
          lineHeight: lineHeight,
          splitByGrapheme: true,
          selectable: false,
          evented: false
        });

        // Add text to canvas first so Fabric.js can calculate dimensions
        canvas.add(text);
        
        // Add writer's name for stage 4, last page only
        const isLastPage = pageNumber === sections.length;
        if (isLastPage && backgroundId === 'stage_4' && authorInfo.name) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const writerName = new (fabric as any).Text(authorInfo.name, {
            left: EXPORT_DIMENSIONS.width - MARGIN - 200, // Will adjust after measuring
            top: EXPORT_DIMENSIONS.height - MARGIN - 40, // Bottom margin minus font size
            fontSize: 40,
            fontFamily: getAuthorFont(), // Use 나눔손글씨 for author name
            fill: '#000000',
            textAlign: 'right',
            selectable: false,
            evented: false
          });
          
          // Measure and position correctly at the right edge
          canvas.add(writerName);
          const nameWidth = writerName.width || 0;
          writerName.set({ left: EXPORT_DIMENSIONS.width - MARGIN - nameWidth });
        }
        
        // Wait for Fabric.js to calculate dimensions in the next tick
        setTimeout(() => {
          // Calculate total content height including title if on first page
          const textHeight = text.calcTextHeight() || text.height || 0;
          let totalContentHeight = textHeight;
          let contentStartTop = topOffset;
          
          if (isFirstPage && authorInfo.title) {
            // Include title height in total content calculation
            const titleHeight = 60 * 1.5 + 20; // title font size * line height + spacing
            totalContentHeight = textHeight + titleHeight;
            contentStartTop = MARGIN; // Start from the margin
          }
          
          // Use editorSettings.verticalAlignment as fallback if textStyle doesn't have it
          const verticalAlign = textStyle.verticalAlignment || editorSettings.verticalAlignment || 'top';
          
          // Calculate vertical position based on alignment
          let finalTopPosition;
          if (verticalAlign === 'top') {
            finalTopPosition = contentStartTop;
          } else if (verticalAlign === 'bottom') {
            finalTopPosition = EXPORT_DIMENSIONS.height - MARGIN - totalContentHeight;
          } else { // middle/center
            finalTopPosition = (EXPORT_DIMENSIONS.height - totalContentHeight) / 2;
          }
          
          // Adjust text position
          if (isFirstPage && authorInfo.title && verticalAlign !== 'top') {
            // Reposition both title and text when not top-aligned
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const titleElements = canvas.getObjects().filter((obj: any) => obj.type === 'text');
            if (titleElements.length > 0) {
              titleElements[0].set({ top: finalTopPosition });
              text.set({ top: finalTopPosition + 60 * 1.5 + 20 });
            }
          } else if (verticalAlign !== 'top') {
            // Just reposition the text
            text.set({ top: finalTopPosition });
          }
          // For top alignment, text is already in the correct position
          
          // Re-render canvas after positioning
          canvas.renderAll();
          
          // Ensure the export happens after positioning is complete
          setTimeout(() => {
            // Convert canvas to data URL then to blob URL
            const dataURL = canvas.toDataURL({
              format: 'png',
              quality: 1,
              multiplier: 1
            });
            
            // Convert data URL to blob URL
            fetch(dataURL)
              .then(res => res.blob())
              .then(blob => {
                const blobUrl = URL.createObjectURL(blob);
                canvas.dispose();
                resolve(blobUrl);
              })
              .catch(error => {
                canvas.dispose();
                reject(new Error('Failed to export canvas: ' + error.message));
              });
          }, 50); // Small delay to ensure rendering is complete
        }, 10); // Slightly longer delay for initial calculation
      };

      // Only load background image if backgroundPreview is enabled
      if (backgroundPreview) {
        // Load background image
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        fabric.Image.fromURL(backgroundPath, (img: any) => {
          if (!img) {
            reject(new Error('Failed to load background image'));
            return;
          }

          // Scale image to fit canvas maintaining aspect ratio
          const scaleX = EXPORT_DIMENSIONS.width / (img.width || 1);
          const scaleY = EXPORT_DIMENSIONS.height / (img.height || 1);
          const scale = Math.max(scaleX, scaleY);

          img.set({
            scaleX: scale,
            scaleY: scale,
            left: (EXPORT_DIMENSIONS.width - (img.width || 0) * scale) / 2,
            top: (EXPORT_DIMENSIONS.height - (img.height || 0) * scale) / 2,
            selectable: false,
            evented: false
          });

          canvas.add(img);
          canvas.sendToBack(img);
          
          addTextAndRender();
        }, { crossOrigin: 'anonymous' });
      } else {
        // Just add text without background
        addTextAndRender();
      }

    });
  }, [editorSettings, authorInfo, backgroundPreview]);
  
  
  // Function to generate preview images for all sections and backgrounds
  const generatePreviews = useCallback(async () => {
    if (!sections || sections.length === 0) return;
    
    setIsGeneratingPreviews(true);
    const newPreviews: PreviewImage[] = [];
    
    try {
      for (let pageIndex = 0; pageIndex < sections.length; pageIndex++) {
        const section = sections[pageIndex];
        
        for (const background of DEFAULT_BACKGROUNDS) {
          const preview: PreviewImage = {
            pageIndex,
            backgroundId: background.id,
            imageUrl: '',
            isLoading: true
          };
          
          newPreviews.push(preview);
          setPreviewImages([...newPreviews]);
          
          try {
            const imageUrl = await generateImageWithBackground(section, background.path, pageIndex + 1, background.id);
            preview.imageUrl = imageUrl;
            preview.isLoading = false;
          } catch (error) {
            console.error(`Error generating preview for page ${pageIndex + 1}, background ${background.id}:`, error);
            preview.isLoading = false;
          }
          
          // Update state with the new preview
          setPreviewImages(prev => [
            ...prev.filter(p => !(p.pageIndex === pageIndex && p.backgroundId === background.id)),
            preview
          ]);
        }
      }
    } catch (error) {
      console.error('Preview generation error:', error);
      showError(t('export.errors.previewError'), t('export.errors.previewFailed'));
    } finally {
      setIsGeneratingPreviews(false);
    }
  }, [sections, showError, generateImageWithBackground, backgroundPreview]);
  
  // Function to generate and download ZIP file
  const handleGenerateAndDownload = async () => {
    if (!sections || sections.length === 0) {
      showError(t('export.errors.noContent'), t('export.errors.noContentMessage'));
      return;
    }
    
    setIsExporting(true);
    setExportProgress({
      current: 0,
      total: sections.length * DEFAULT_BACKGROUNDS.length,
      stage: t('export.progress.initializing'),
      isComplete: false
    });
    
    try {
      const zip = new JSZip();
      const folderName = `${authorInfo.name.replace(/\s+/g, '_')}_${authorInfo.title.replace(/\s+/g, '_')}`;
      let currentProgress = 0;
      
      // Create folders for each background stage
      for (const background of DEFAULT_BACKGROUNDS) {
        const stageFolder = zip.folder(`${folderName}/${background.name.replace(/\s+/g, '_')}`);
        if (!stageFolder) {
          throw new Error(t('export.errors.folderCreationFailed', { background: background.name }));
        }
        
        // Generate images for each section with this background
        for (let pageIndex = 0; pageIndex < sections.length; pageIndex++) {
          const section = sections[pageIndex];
          
          setExportProgress({
            current: currentProgress,
            total: sections.length * DEFAULT_BACKGROUNDS.length,
            stage: t('export.progress.generating', { background: background.name, page: pageIndex + 1 }),
            isComplete: false
          });
          
          try {
            // Generate the image
            const imageUrl = await generateImageWithBackground(section, background.path, pageIndex + 1, background.id);
            
            // Convert blob URL to blob
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            
            // Add to zip
            const fileName = `${authorInfo.title.replace(/\s+/g, '_')}_Page_${pageIndex + 1}.png`;
            stageFolder.file(fileName, blob);
            
            // Clean up blob URL
            URL.revokeObjectURL(imageUrl);
            
          } catch (error) {
            console.error(`Error generating image for ${background.name} - Page ${pageIndex + 1}:`, error);
            showError(t('export.errors.generationError'), t('export.errors.generationFailed', { background: background.name, page: pageIndex + 1 }));
          }
          
          currentProgress++;
        }
      }
      
      // Generate ZIP file
      setExportProgress({
        current: currentProgress,
        total: sections.length * DEFAULT_BACKGROUNDS.length,
        stage: t('export.progress.creatingZip'),
        isComplete: false
      });
      
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });
      
      // Download ZIP file
      const downloadUrl = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${folderName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      setExportProgress({
        current: currentProgress,
        total: sections.length * DEFAULT_BACKGROUNDS.length,
        stage: t('export.progress.complete'),
        isComplete: true
      });
      
      showSuccess(t('export.success.exportComplete'), t('export.success.downloadSuccess'));
      
    } catch (error) {
      showError(t('export.errors.exportError'), error instanceof Error ? error.message : t('export.errors.exportFailed'));
    } finally {
      setIsExporting(false);
      // Clear progress after a delay
      setTimeout(() => setExportProgress(null), 3000);
    }
  };
  
  // Function to download individual image
  const downloadIndividualImage = async (pageIndex: number, backgroundId: string) => {
    const preview = previewImages.find(p => p.pageIndex === pageIndex && p.backgroundId === backgroundId);
    if (!preview || !preview.imageUrl) return;
    
    const background = DEFAULT_BACKGROUNDS.find(b => b.id === backgroundId);
    if (!background) return;
    
    const response = await fetch(preview.imageUrl);
    const blob = await response.blob();
    
    const downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${authorInfo.title.replace(/\s+/g, '_')}_Page_${pageIndex + 1}_${background.name.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };
  
  // Generate previews when component mounts or sections/alignment change
  useEffect(() => {
    if (sections && sections.length > 0) {
      generatePreviews();
    }
  }, [sections, editorSettings.globalTextAlignment, editorSettings.textAlignment, editorSettings.verticalAlignment, editorSettings.fontSize, editorSettings.lineHeight, backgroundPreview, generatePreviews]);

  const handleBack = useCallback(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  if (!sections || sections.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p>{t('export.noContent')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>{t('export.title')}</CardTitle>
          <CardDescription>
            {t('export.description', { count: sections.length, plural: sections.length !== 1 ? 's' : '' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Background Preview Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBackgroundPreview(!backgroundPreview)}
                className={`px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center gap-2 transition-all transform ease-in-out ${backgroundPreview ? 'bg-blue-100' : 'bg-white'}`}
                title="Toggle background preview in image generation"
              >
                {backgroundPreview ? <ImageOff className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
                {backgroundPreview ? t('export.hideBackgrounds') : t('export.showBackgrounds')}
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>{t('export.totalPages', { count: sections.length })}</p>
                <p>{t('export.totalImages', { count: sections.length * DEFAULT_BACKGROUNDS.length })}</p>
              </div>
              <div className="flex items-center space-x-2">
                {sections.map((section, index) => (
                  <Badge
                    key={section.id}
                    variant={selectedPreviewPage === index ? 'default' : 'outline'}
                    className="cursor-pointer transition-all transform ease-in-out hover:scale-105"
                    onClick={() => setSelectedPreviewPage(index)}
                  >
                    Page {index + 1}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="w-5 h-5 mr-2" />
            {t('export.previewGallery')}
          </CardTitle>
          <CardDescription>
            {t('export.previewDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isGeneratingPreviews ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>{t('export.generatingPreviews')}</span>
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((section, pageIndex) => (
                <div key={section.id} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Page {pageIndex + 1}</Badge>
                    <span className="text-sm text-gray-600 truncate">
                      {section.content.substring(0, 100)}...
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {DEFAULT_BACKGROUNDS.map((background) => {
                      const preview = previewImages.find(
                        p => p.pageIndex === pageIndex && p.backgroundId === background.id
                      );
                      
                      return (
                        <div key={background.id} className="space-y-2">
                          <div className="relative">
                            <div className="aspect-[9/16] bg-gray-100 rounded-lg overflow-hidden border">
                              {preview?.isLoading ? (
                                <div className="flex items-center justify-center h-full">
                                  <Loader2 className="w-6 h-6 animate-spin" />
                                </div>
                              ) : preview?.imageUrl ? (
                                <img
                                  src={preview.imageUrl}
                                  alt={`Page ${pageIndex + 1} - ${background.name}`}
                                  className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                  onClick={() => {
                                    setSelectedPreviewPage(pageIndex);
                                    setSelectedPreviewBackground(background.id);
                                  }}
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            
                            {preview?.imageUrl && (
                              <div className="absolute top-2 right-2 flex space-x-1">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                  onClick={() => {
                                    setSelectedPreviewPage(pageIndex);
                                    setSelectedPreviewBackground(background.id);
                                  }}
                                >
                                  <ZoomIn className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="h-8 w-8 p-0"
                                  onClick={() => downloadIndividualImage(pageIndex, background.id)}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <Badge variant="outline" className="text-xs">
                              {background.name}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate and Download */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileArchive className="w-5 h-5 mr-2" />
            {t('export.generateDownloadZip')}
          </CardTitle>
          <CardDescription>
            {t('export.zipDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleGenerateAndDownload}
            disabled={isExporting}
            className="w-full"
            size="lg"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {t('export.generateDownloadAll')}
          </Button>
          
          {/* Export Progress */}
          {exportProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{exportProgress.stage}</span>
                <span>{exportProgress.current}/{exportProgress.total}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${exportProgress.total > 0 ? (exportProgress.current / exportProgress.total) * 100 : 0}%` 
                  }}
                />
              </div>
              {exportProgress.isComplete && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t('export.exportCompleted')}
                </div>
              )}
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
          {t('export.backToWriteStory')}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={() => window.location.reload()}
        >
          {t('export.startNewStory')}
        </Button>
      </div>
      
      {/* Zoom Modal */}
      {selectedPreviewPage !== null && selectedPreviewBackground && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                Page {selectedPreviewPage + 1} - {DEFAULT_BACKGROUNDS.find(b => b.id === selectedPreviewBackground)?.name}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedPreviewPage(null);
                  setSelectedPreviewBackground(null);
                }}
              >
                ×
              </Button>
            </div>
            
            {(() => {
              const preview = previewImages.find(
                p => p.pageIndex === selectedPreviewPage && p.backgroundId === selectedPreviewBackground
              );
              
              return preview?.imageUrl ? (
                <div className="space-y-4">
                  <img
                    src={preview.imageUrl}
                    alt={`Page ${selectedPreviewPage + 1} - ${DEFAULT_BACKGROUNDS.find(b => b.id === selectedPreviewBackground)?.name}`}
                    className="w-full h-auto rounded-lg"
                  />
                  <Button
                    onClick={() => downloadIndividualImage(selectedPreviewPage, selectedPreviewBackground)}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('export.downloadThisImage')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <div className="text-gray-500">{t('export.imageNotAvailable')}</div>
                </div>
              );
            })()} 
          </div>
        </div>
      )}
    </div>
  );
}
