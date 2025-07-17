'use client';

import { useStoryStore } from '@/store/useStoryStore';
import { CheckCircle, Circle } from 'lucide-react';

const steps = [
  { id: 0, title: 'Author Info', description: 'Enter your name and story title' },
  { id: 1, title: 'Write Story', description: 'Write your story with formatting' },
  { id: 2, title: 'Preview & Export', description: 'Select backgrounds and generate images' },
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
                <div className="relative">
                  {currentStep > step.id ? (
                    <CheckCircle className="w-8 h-8 text-green-500 transition-all duration-300 transform scale-100" />
                  ) : currentStep === step.id ? (
                    <>
                      <Circle className="w-8 h-8 text-blue-500 fill-current animate-pulse" />
                      <div className="absolute inset-0 rounded-full bg-blue-500 opacity-20 animate-ping" />
                    </>
                  ) : (
                    <Circle className="w-8 h-8 text-gray-300 transition-all duration-300" />
                  )}
                </div>
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
              <div className="relative w-full h-0.5 mx-4 bg-gray-300">
                <div 
                  className={`absolute inset-y-0 left-0 bg-green-500 transition-all duration-500 ease-out`}
                  style={{ 
                    width: currentStep > step.id ? '100%' : '0%' 
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
