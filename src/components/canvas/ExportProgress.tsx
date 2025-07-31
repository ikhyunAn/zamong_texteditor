import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, Download, ZoomIn, X } from 'lucide-react';

interface ExportProgressProps {
  current: number;
  total: number;
  stage: string;
  generatedImages: Array<{
    id: string;
    url: string;
    stage: string;
    page: number;
  }>;
  onClose?: () => void;
}

export function ExportProgress({ 
  current, 
  total, 
  stage, 
  generatedImages,
  onClose 
}: ExportProgressProps) {
  const percentage = Math.round((current / total) * 100);
  const isComplete = current === total;
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  
  const handleDownloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              {isComplete ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600 animate-pulse" />
              )}
              Export Progress
            </span>
            {onClose && isComplete && (
              <button
                onClick={onClose}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{stage}</span>
              <span>{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="text-center text-sm text-gray-600">
              {current} of {total} images generated
            </div>
          </div>

          {/* Responsive Preview Grid */}
          {generatedImages.length > 0 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium">Generated Images Preview</h3>
                <span className="text-xs text-gray-600">{generatedImages.length} images</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {generatedImages.map((img) => (
                  <div key={img.id} className="relative group">
                    <div className="aspect-[9/16] bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200">
                      <img
                        src={img.url}
                        alt={`${img.stage} - Page ${img.page}`}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setZoomedImage(img.url)}
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImage(img.url);
                            }}
                          >
                            <ZoomIn className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadImage(img.url, `${img.stage}_page_${img.page}.png`);
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    {/* Image info */}
                    <div className="mt-1 text-xs text-center">
                      <div className="font-medium text-gray-700">{img.stage}</div>
                      <div className="text-gray-500">Page {img.page}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status Messages */}
          {isComplete && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-900">Export Complete!</p>
                <p className="text-sm text-green-800 mt-1">
                  All {total} images have been generated successfully. Your download should start automatically.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Zoom Modal */}
      {zoomedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={zoomedImage}
              alt="Zoomed preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-4 right-4"
              onClick={() => setZoomedImage(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
