'use client';

import { useState, useCallback, useMemo } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { useUnsplash } from '@/hooks/useUnsplash';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageUploader } from './ImageUploader';
import { ArrowLeft, ArrowRight, Search, Image as ImageIcon, Upload, Loader2, Check } from 'lucide-react';

// Optimized Image Component to prevent flashing
function OptimizedImageCard({ 
  image, 
  isSelected, 
  onSelect 
}: { 
  image: any; 
  isSelected: boolean; 
  onSelect: () => void; 
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(true);
  }, []);

  const handleClick = useCallback(() => {
    if (imageLoaded && !imageError) {
      onSelect();
    }
  }, [imageLoaded, imageError, onSelect]);

  return (
    <Card 
      className={`overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] ${
        isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'
      } ${!imageLoaded ? 'animate-pulse' : ''}`}
      onClick={handleClick}
    >
      <CardContent className="p-0 relative">
        {!imageLoaded && (
          <div className="aspect-square bg-gray-200 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
        
        {!imageError ? (
          <img
            src={image.urls.small}
            alt={image.alt_description || 'Background image'}
            className={`aspect-square w-full object-cover transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
            }`}
            onLoad={handleImageLoad}
            onError={handleImageError}
            loading="lazy"
          />
        ) : (
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        {/* Selection indicator */}
        {isSelected && imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        
        {/* Loading overlay */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-100" />
        )}
      </CardContent>
    </Card>
  );
}

export function BackgroundSelector() {
  const { sections, updateSection, setCurrentStep } = useStoryStore();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('abstract backgrounds');
  const { images, loading, error, searchImages, loadMore, hasMore } = useUnsplash({
    query: 'abstract minimalist backgrounds',
    autoFetch: true
  });

  const currentSection = sections[currentSectionIndex];

  // Memoize expensive operations
  const sectionsWithoutBackground = useMemo(() => 
    sections.filter(section => !section.backgroundImage),
    [sections]
  );

  const handleBack = useCallback(() => {
    setCurrentStep(2);
  }, [setCurrentStep]);

  const handleNext = useCallback(() => {
    if (sectionsWithoutBackground.length > 0) {
      alert(`Please select a background for all sections. ${sectionsWithoutBackground.length} sections still need backgrounds.`);
      return;
    }
    setCurrentStep(4);
  }, [sectionsWithoutBackground.length, setCurrentStep]);

  const handleImageSelect = useCallback((imageUrl: string) => {
    updateSection(currentSection.id, { backgroundImage: imageUrl });
  }, [currentSection.id, updateSection]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      searchImages(searchQuery);
    }
  }, [searchQuery, searchImages]);

  const goToSection = useCallback((index: number) => {
    setCurrentSectionIndex(index);
  }, []);

  const goToNextSection = useCallback(() => {
    if (currentSectionIndex < sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
    }
  }, [currentSectionIndex, sections.length]);

  const goToPreviousSection = useCallback(() => {
    if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
    }
  }, [currentSectionIndex]);

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
      {/* Section Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Background Images</CardTitle>
          <CardDescription>
            Select a background image for each section of your story. Currently editing section {currentSectionIndex + 1} of {sections.length}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousSection}
                disabled={currentSectionIndex === 0}
              >
                ← Previous Section
              </Button>
              <span className="text-sm font-medium">
                Section {currentSectionIndex + 1}: "{currentSection.content.substring(0, 50)}..."
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextSection}
                disabled={currentSectionIndex === sections.length - 1}
              >
                Next Section →
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              {sections.map((section, index) => (
                <button
                  key={section.id}
                  className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                    index === currentSectionIndex
                      ? 'bg-blue-500'
                      : section.backgroundImage
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                  }`}
                  onClick={() => goToSection(index)}
                  title={`Section ${index + 1}${section.backgroundImage ? ' (Background selected)' : ' (No background)'}`}
                />
              ))}
            </div>
          </div>

          {/* Current section preview */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {currentSection.content}
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Background Selection */}
      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="unsplash" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="unsplash" className="flex items-center">
                <ImageIcon className="w-4 h-4 mr-2" />
                Unsplash Photos
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </TabsTrigger>
            </TabsList>

            <TabsContent value="unsplash" className="space-y-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="flex space-x-2">
                <Input
                  type="text"
                  placeholder="Search for backgrounds (e.g., nature, abstract, minimal)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </form>

              {/* Error message */}
              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {/* Images grid */}
              <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <OptimizedImageCard
                    key={image.id}
                    image={image}
                    isSelected={currentSection.backgroundImage === image.urls.regular}
                    onSelect={() => handleImageSelect(image.urls.regular)}
                  />
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    onClick={loadMore}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Load More Images
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload">
              <ImageUploader 
                onImageSelect={handleImageSelect}
                currentImage={currentSection.backgroundImage}
              />
            </TabsContent>
          </Tabs>
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
          Back to Sections
        </Button>
        
        <Button
          type="button"
          onClick={handleNext}
          disabled={sectionsWithoutBackground.length > 0}
        >
          Generate Images
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
