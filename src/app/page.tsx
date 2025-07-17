'use client';

import { useStoryStore } from '@/store/useStoryStore';
import { useToast } from '@/hooks/useToast';
import { AuthorInfoForm } from '@/components/layout/AuthorInfoForm';
import { StoryEditor } from '@/components/editor/StoryEditor';
import { SectionManager } from '@/components/editor/SectionManager';
import { BackgroundSelector } from '@/components/background/BackgroundSelector';
import { ImageGenerator } from '@/components/canvas/ImageGenerator';
import { ProgressStepper } from '@/components/layout/ProgressStepper';
import { ToastContainer } from '@/components/ui/toast';

export default function Home() {
  const { currentStep } = useStoryStore();
  const { messages, removeToast } = useToast();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return <AuthorInfoForm />;
      case 1:
        return <StoryEditor />;
      case 2:
        return <SectionManager />;
      case 3:
        return <BackgroundSelector />;
      case 4:
        return <ImageGenerator />;
      default:
        return <AuthorInfoForm />;
    }
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Zamong Text Editor
            </h1>
            <p className="text-lg text-gray-600">
              Transform your stories into beautiful Instagram posts
            </p>
          </div>
          
          <ProgressStepper />
          
          <div className="mt-8">
            {renderCurrentStep()}
          </div>
        </div>
      </main>
      
      <ToastContainer messages={messages} onClose={removeToast} />
    </>
  );
}
