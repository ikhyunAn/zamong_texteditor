'use client';

import { useEffect, useState } from 'react';
import { useStoryStore } from '@/store/useStoryStore';
import { AuthorInfoForm } from '@/components/layout/AuthorInfoForm';
import { PagedDocumentEditorWithNavigation } from '@/components/editor/PagedDocumentEditor';
import { BatchImageGenerator } from '@/components/canvas/BatchImageGenerator';
// import { ProgressStepper } from '@/components/layout/ProgressStepper';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return <HomeContent />;
}

function HomeContent() {
  const { currentStep } = useStoryStore();
  const { messages, removeToast } = useToast();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayStep, setDisplayStep] = useState(currentStep);

  // Handle smooth transitions between steps
  useEffect(() => {
    if (currentStep !== displayStep) {
      setIsTransitioning(true);
      
      // Wait for fade out
      setTimeout(() => {
        setDisplayStep(currentStep);
        
        // Wait a bit then fade in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 300);
    }
  }, [currentStep, displayStep]);

  const renderCurrentStep = () => {
    switch (displayStep) {
      case 0:
        return <AuthorInfoForm />;
      case 1:
        return <PagedDocumentEditorWithNavigation />;
      case 2:
        return <BatchImageGenerator />;
      default:
        return <AuthorInfoForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Zamong Text Editor
          </h1>
          <p className="text-lg text-gray-600">
            Transform your stories into beautiful Storycards
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-4">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 0 ? 'bg-blue-500 text-white' : 'bg-gray-300'
              }`}>
                1
              </div>
              <div className={`w-16 h-1 ${
                currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'
              }`}>
                2
              </div>
              <div className={`w-16 h-1 ${
                currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'
              }`}></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-300'
              }`}>
                3
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-12 text-sm">
              <span className={currentStep >= 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Author Info</span>
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Write Story</span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Generate Images</span>
            </div>
          </div>
        </div>
        
        <div 
          className={`mt-8 transition-all duration-300 ease-in-out ${
            isTransitioning ? 'opacity-0 transform translate-y-4' : 'opacity-100 transform translate-y-0'
          }`}
        >
          {renderCurrentStep()}
        </div>
      </div>
      
      <ToastContainer messages={messages} onClose={removeToast} />
    </div>
  );
}
