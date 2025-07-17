'use client';

import { Button } from '@/components/ui/button';
import { Scissors, X } from 'lucide-react';

interface SectionDividerProps {
  onAddSection: () => void;
  onRemoveSection: () => void;
}

export function SectionDivider({ onAddSection, onRemoveSection }: SectionDividerProps) {
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t-2 border-dashed border-blue-400"></div>
      </div>
      <div className="relative flex justify-center">
        <div className="bg-white px-4 flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddSection}
            className="text-xs px-2 py-1 h-6"
            title="Add section break here"
          >
            <Scissors className="w-3 h-3 mr-1" />
            Split Here
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRemoveSection}
            className="text-xs px-2 py-1 h-6 text-red-600 hover:text-red-700"
            title="Remove this section break"
          >
            <X className="w-3 h-3 mr-1" />
            Remove
          </Button>
        </div>
      </div>
    </div>
  );
}
