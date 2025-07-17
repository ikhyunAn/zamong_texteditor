'use client';

import { useStoryStore } from '@/store/useStoryStore';
import { CheckCircle, Circle } from 'lucide-react';

const steps = [
  { id: 0, title: 'Author Info', description: 'Enter your name and story title' },
  { id: 1, title: 'Write Story', description: 'Write your story with formatting' },
  { id: 2, title: 'Split Sections', description: 'Divide your story into sections' },
  { id: 3, title: 'Choose Backgrounds', description: 'Select background images' },
  { id: 4, title: 'Generate Images', description: 'Create and download your images' },
];

export function ProgressStepper() {
  const { currentStep } = useStoryStore();

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center mb-2">
                {currentStep > step.id ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : currentStep === step.id ? (
                  <Circle className="w-8 h-8 text-blue-500 fill-current" />
                ) : (
                  <Circle className="w-8 h-8 text-gray-300" />
                )}
              </div>
              <div className="text-center">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.title}
                </div>
                <div className={`text-xs ${
                  currentStep >= step.id ? 'text-gray-600' : 'text-gray-400'
                }`}>
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-full h-0.5 mx-4 ${
                currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
