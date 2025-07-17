'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploaderProps {
  onImageSelect: (imageUrl: string) => void;
  currentImage?: string;
}

export function ImageUploader({ onImageSelect, currentImage }: ImageUploaderProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
// Removed unused 'dragActive' state

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result as string;
        setUploadedImages(prev => [...prev, imageUrl]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp']
    },
    multiple: true,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const handleImageSelect = (imageUrl: string) => {
    onImageSelect(imageUrl);
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`cursor-pointer text-center ${
              isDragActive ? 'bg-blue-50' : ''
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-3">
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {isDragActive
                    ? 'Drop your images here'
                    : 'Drag & drop images here, or click to select'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports: JPG, PNG, GIF, WebP
                </p>
              </div>
              <Button variant="outline" size="sm" type="button">
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <ImageIcon className="w-4 h-4 mr-2" />
            Your Uploaded Images ({uploadedImages.length})
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {uploadedImages.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <Card className={`overflow-hidden cursor-pointer transition-all ${
                  currentImage === imageUrl ? 'ring-2 ring-blue-500' : ''
                }`}>
                  <CardContent className="p-0">
                    <div 
                      className="aspect-square bg-cover bg-center hover:scale-105 transition-transform"
                      style={{ backgroundImage: `url(${imageUrl})` }}
                      onClick={() => handleImageSelect(imageUrl)}
                    />
                    
                    {/* Remove button */}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUploadedImage(index);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                    
                    {/* Selection indicator */}
                    {currentImage === imageUrl && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
