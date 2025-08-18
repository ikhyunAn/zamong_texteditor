'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStoryStore } from '@/store/useStoryStore';
import { AuthorInfoForm } from '@/components/layout/AuthorInfoForm';
import PaginatedEditorWithNavigation from '@/components/editor/PaginatedEditor';
import { BatchImageGenerator } from '@/components/canvas/BatchImageGenerator';
// import { ProgressStepper } from '@/components/layout/ProgressStepper';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/toast';
import { LanguageToggle } from '@/components/ui/LanguageToggle';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showTranslatedContent, setShowTranslatedContent] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    // Small delay to ensure i18n is fully initialized
    const timer = setTimeout(() => {
      setShowTranslatedContent(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  if (!isClient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!showTranslatedContent) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <HomeContent />;
}

function HomeContent() {
  const { t } = useTranslation('common');
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
        return <PaginatedEditorWithNavigation />;
      case 2:
        return <BatchImageGenerator />;
      default:
        return <AuthorInfoForm />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header with title, subtitle, and language toggle */}
        <div className="relative mb-8">
          {/* Language Toggle in top-right corner */}
          <div className="absolute top-0 right-0">
            <LanguageToggle size="sm" />
          </div>
          
          {/* Main title and subtitle */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {t('app.title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('app.subtitle')}
            </p>
          </div>
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
              <span className={currentStep >= 0 ? 'text-blue-600 font-medium' : 'text-gray-500'}>{t('steps.authorInfo')}</span>
              <span className={currentStep >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>{t('steps.writeStory')}</span>
              <span className={currentStep >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>{t('steps.generateImages')}</span>
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
