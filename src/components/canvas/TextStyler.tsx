'use client';

import { TextStyle } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
  AVAILABLE_FONTS, 
  FONT_SIZES, 
  TEXT_COLORS 
} from '@/lib/constants';
import { Palette, Type, AlignLeft, AlignCenter, AlignRight, HelpCircle } from 'lucide-react';

interface TextStylerProps {
  textStyle: TextStyle;
  onStyleChange: (style: Partial<TextStyle>) => void;
  onPositionChange: (position: { x: number; y: number }) => void;
}

export function TextStyler({ textStyle, onStyleChange, onPositionChange }: TextStylerProps) {
  const handleFontChange = (fontFamily: string) => {
    onStyleChange({ fontFamily });
  };

  const handleFontSizeChange = (fontSize: number) => {
    onStyleChange({ fontSize });
  };

  const handleColorChange = (color: string) => {
    onStyleChange({ color });
  };

  const handleAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    onStyleChange({ alignment });
  };

  const handlePositionChange = (axis: 'x' | 'y', value: number) => {
    const newPosition = { ...textStyle.position, [axis]: value };
    onStyleChange({ position: newPosition });
    onPositionChange(newPosition);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Type className="w-5 h-5 mr-2" />
          Text Styling
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Font Family */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Family</Label>
          <div className="grid grid-cols-2 gap-2">
            {AVAILABLE_FONTS.map((font) => (
              <Button
                key={font.name}
                variant={textStyle.fontFamily === font.family ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontChange(font.family)}
                className="text-xs"
                style={{ fontFamily: font.family }}
              >
                {font.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Font Size</Label>
          <div className="grid grid-cols-3 gap-2">
            {FONT_SIZES.map((size) => (
              <Button
                key={size.value}
                variant={textStyle.fontSize === size.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleFontSizeChange(size.value)}
                className="text-xs"
              >
                {size.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Text Color */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            <Palette className="w-4 h-4 mr-1" />
            Text Color
          </Label>
          <div className="grid grid-cols-8 gap-2">
            {TEXT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded-md border-2 transition-all ${
                  textStyle.color === color 
                    ? 'border-blue-500 scale-110' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
          
          {/* Custom color input */}
          <div className="flex items-center space-x-2">
            <Label className="text-xs">Custom:</Label>
            <input
              type="color"
              value={textStyle.color}
              onChange={(e) => handleColorChange(e.target.value)}
              className="w-8 h-8 rounded border cursor-pointer"
            />
            <span className="text-xs text-gray-500">{textStyle.color}</span>
          </div>
        </div>

        {/* Text Alignment */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center">
            Text Alignment
            <span title="Alignment affects both editor and generated images">
              <HelpCircle className="ml-1 w-4 h-4 text-gray-400" />
            </span>
          </Label>
          <div className="flex space-x-2">
            <Button
              variant={textStyle.alignment === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAlignmentChange('left')}
              className="transition-all transform ease-in-out"
            >
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={textStyle.alignment === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAlignmentChange('center')}
              className="transition-all transform ease-in-out"
            >
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button
              variant={textStyle.alignment === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleAlignmentChange('right')}
              className="transition-all transform ease-in-out"
            >
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Text Position */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Text Position</Label>
          
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <Label className="text-xs w-16">Horizontal:</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={textStyle.position.x}
                onChange={(e) => handlePositionChange('x', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8">{textStyle.position.x}%</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <Label className="text-xs w-16">Vertical:</Label>
              <input
                type="range"
                min="0"
                max="100"
                value={textStyle.position.y}
                onChange={(e) => handlePositionChange('y', parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-xs w-8">{textStyle.position.y}%</span>
            </div>
          </div>

          {/* Position presets */}
          <div className="grid grid-cols-3 gap-1 text-xs">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPositionChange({ x: 50, y: 20 })}
              className="text-xs py-1"
            >
              Top
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPositionChange({ x: 50, y: 50 })}
              className="text-xs py-1"
            >
              Center
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPositionChange({ x: 50, y: 80 })}
              className="text-xs py-1"
            >
              Bottom
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Preview</Label>
          <div className="p-4 border rounded-md bg-gray-50">
            <p 
              style={{
                fontFamily: textStyle.fontFamily,
                fontSize: `${Math.min(textStyle.fontSize / 3, 16)}px`, // Scale down for preview
                color: textStyle.color,
                textAlign: textStyle.alignment
              }}
            >
              Sample text with your current styling
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
