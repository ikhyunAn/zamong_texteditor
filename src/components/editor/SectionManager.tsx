'use client';

import { useStoryStore } from '@/store/useStoryStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Scissors, Plus } from 'lucide-react';
import { SectionDivider } from './SectionDivider';

export function SectionManager() {
  const { 
    sections, 
    content, 
    setCurrentStep, 
    addSectionBreak, 
    removeSectionBreak,
    authorInfo 
  } = useStoryStore();

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleNext = () => {
    if (sections.length === 0) {
      alert('Please create at least one section.');
      return;
    }
    setCurrentStep(3);
  };

  const handleAddBreak = (sectionId: string, position: number) => {
    addSectionBreak(position);
  };

  const handleRemoveSection = (sectionId: string) => {
    removeSectionBreak(sectionId);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage Story Sections</CardTitle>
        <CardDescription>
          Your story has been automatically split into {sections.length} sections. 
          You can add or remove section breaks to customize how your story will appear across multiple Instagram posts.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Section Preview */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Scissors className="w-5 h-5 mr-2" />
            Story Sections ({sections.length})
          </h3>
          
          {sections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No sections created yet. Please go back and write your story.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((section, index) => (
                <div key={section.id} className="relative">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">
                          {authorInfo.title} - Page {index + 1}
                        </CardTitle>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">
                            {section.content.length} characters
                          </span>
                          {index > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveSection(section.id)}
                              className="text-xs px-2 py-1"
                            >
                              Merge with Previous
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm whitespace-pre-wrap">
                          {section.content}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Section Divider */}
                  {index < sections.length - 1 && (
                    <SectionDivider 
                      onAddSection={() => handleAddBreak(section.id, 0)}
                      onRemoveSection={() => handleRemoveSection(sections[index + 1].id)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Plus className="w-4 h-4 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Tips for Better Sections</h4>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  <li>• Each section will become one Instagram post</li>
                  <li>• Keep sections under 300 characters for better readability</li>
                  <li>• Consider natural story breaks and cliffhangers</li>
                  <li>• You can merge sections by clicking "Merge with Previous"</li>
                </ul>
              </div>
            </div>
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
            Back to Editor
          </Button>
          
          <Button
            type="button"
            onClick={handleNext}
            disabled={sections.length === 0}
          >
            Choose Backgrounds
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
