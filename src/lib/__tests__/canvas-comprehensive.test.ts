import {
  createCanvas,
  addTextToCanvas,
  exportCanvasAsImage,
  mergeTextConfigs,
  disposeCanvas,
  ensureFontsLoaded,
  CanvasTextConfig,
  UnifiedTextConfig
} from '../canvas-utils';
import { EditorSettings, TextStyle } from '@/types';
import { AVAILABLE_FONTS, FONT_SIZES, LINE_HEIGHT_OPTIONS } from '../constants';
import { fabric } from 'fabric';

// Mock fabric.js
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn().mockImplementation(() => {
      const mockCanvas = {
        getWidth: jest.fn().mockReturnValue(900),
        getHeight: jest.fn().mockReturnValue(1600),
        add: jest.fn(),
        setActiveObject: jest.fn(),
        dispose: jest.fn(),
        renderAll: jest.fn(),
        discardActiveObject: jest.fn(),
        toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mockdata'),
        getContext: jest.fn().mockReturnValue({})
      };
      
      // Make sure the mock canvas has access to itself for export functionality
      mockCanvas.toDataURL = jest.fn().mockReturnValue('data:image/jpeg;base64,mockdata');
      
      return mockCanvas;
    }),
    Textbox: jest.fn().mockImplementation(() => ({
      width: 720,
      set: jest.fn()
    }))
  }
}));

// Mock DOM methods
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  blob: jest.fn().mockResolvedValue(new Blob(['mock'], { type: 'image/jpeg' }))
});

global.document.createElement = jest.fn().mockImplementation((tagName) => {
  if (tagName === 'canvas') {
    return {
      width: 900,
      height: 1600,
      getContext: jest.fn().mockReturnValue({})
    };
  }
  return {};
});

// Mock document.fonts
Object.defineProperty(global.document, 'fonts', {
  value: {
    check: jest.fn().mockReturnValue(true), // Always return true for font availability
    add: jest.fn(),
    ready: Promise.resolve()
  },
  writable: true
});

describe('Canvas Comprehensive Tests', () => {
  const testDimensions = [
    { width: 900, height: 1600, name: 'Standard' },
    { width: 1080, height: 1920, name: 'Instagram Story' },
    { width: 1200, height: 630, name: 'Facebook Cover' },
    { width: 800, height: 800, name: 'Square' }
  ];

  const testFontFamilies = AVAILABLE_FONTS.map(font => font.family);
  const testFontSizes = FONT_SIZES.map(size => size.value);
  const testLineHeights = LINE_HEIGHT_OPTIONS.map(option => option.value);
  
  const horizontalAlignments: Array<'left' | 'center' | 'right'> = ['left', 'center', 'right'];
  const verticalAlignments: Array<'top' | 'middle' | 'bottom'> = ['top', 'middle', 'bottom'];

  const testTexts = [
    '짧은 텍스트',
    '이것은 중간 길이의 텍스트로 여러 줄에 걸쳐 표시될 수 있습니다.',
    '이것은 매우 긴 텍스트입니다. 여러 줄에 걸쳐 표시되며 다양한 폰트 크기와 줄 간격에서 어떻게 렌더링되는지 테스트하기 위한 것입니다. 한글과 영어가 섞여 있을 때도 제대로 처리되는지 확인해야 합니다.',
    'Mixed 한글과 English text with numbers 123 and symbols !@#$%'
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Font Family and Size Combinations', () => {
    testFontFamilies.forEach(fontFamily => {
      testFontSizes.forEach(fontSize => {
        it(`should render with font ${fontFamily} at size ${fontSize}`, async () => {
          const canvas = createCanvas(900, 1600);
          
          const editorSettings: EditorSettings = {
            fontFamily,
            fontSize,
            lineHeight: 1.5,
            textAlignment: 'left',
            globalTextAlignment: 'left',
            verticalAlignment: 'top'
          };

          const textStyle: TextStyle = {
            fontFamily,
            fontSize,
            color: '#000000',
            position: { x: 10, y: 10 },
            alignment: 'left',
            verticalAlignment: 'top'
          };

          const config: CanvasTextConfig = {
            text: '테스트 텍스트 Test Text',
            textStyle,
            editorSettings,
            canvasWidth: 900,
            canvasHeight: 1600
          };

          expect(() => addTextToCanvas(canvas, config)).not.toThrow();
          
          // Verify textbox was created with correct properties
          expect(fabric.Textbox).toHaveBeenCalledWith(
            '테스트 텍스트 Test Text',
            expect.objectContaining({
              fontSize: fontSize,
              fontFamily: expect.any(String),
              lineHeight: 1.5
            })
          );

          disposeCanvas(canvas);
        });
      });
    });
  });

  describe('2. Alignment Combinations', () => {
    horizontalAlignments.forEach(horizontalAlign => {
      verticalAlignments.forEach(verticalAlign => {
        it(`should handle ${horizontalAlign}-${verticalAlign} alignment`, async () => {
          const canvas = createCanvas(900, 1600);
          
          const editorSettings: EditorSettings = {
            fontFamily: 'CustomFontTTF',
            fontSize: 36,
            lineHeight: 1.5,
            textAlignment: horizontalAlign,
            globalTextAlignment: horizontalAlign,
            verticalAlignment: verticalAlign
          };

          const textStyle: TextStyle = {
            fontFamily: 'CustomFontTTF',
            fontSize: 36,
            color: '#000000',
            position: { x: 50, y: 50 },
            alignment: horizontalAlign,
            verticalAlignment: verticalAlign
          };

          const config: CanvasTextConfig = {
            text: '정렬 테스트 Alignment Test',
            textStyle,
            editorSettings,
            canvasWidth: 900,
            canvasHeight: 1600
          };

          expect(() => addTextToCanvas(canvas, config)).not.toThrow();
          
          // Verify alignment was applied
          expect(fabric.Textbox).toHaveBeenCalledWith(
            '정렬 테스트 Alignment Test',
            expect.objectContaining({
              textAlign: horizontalAlign
            })
          );

          disposeCanvas(canvas);
        });
      });
    });
  });

  describe('3. Line Height with Multi-line Text', () => {
    testLineHeights.forEach(lineHeight => {
      testTexts.forEach((text, index) => {
        it(`should handle line height ${lineHeight} with text length ${index + 1}`, async () => {
          const canvas = createCanvas(900, 1600);
          
          const editorSettings: EditorSettings = {
            fontFamily: 'CustomFontTTF',
            fontSize: 24,
            lineHeight,
            textAlignment: 'left',
            globalTextAlignment: 'left',
            verticalAlignment: 'top'
          };

          const textStyle: TextStyle = {
            fontFamily: 'CustomFontTTF',
            fontSize: 24,
            color: '#000000',
            position: { x: 10, y: 10 },
            alignment: 'left',
            verticalAlignment: 'top'
          };

          const config: CanvasTextConfig = {
            text,
            textStyle,
            editorSettings,
            canvasWidth: 900,
            canvasHeight: 1600
          };

          expect(() => addTextToCanvas(canvas, config)).not.toThrow();
          
          // Verify line height was applied
          expect(fabric.Textbox).toHaveBeenCalledWith(
            text,
            expect.objectContaining({
              lineHeight
            })
          );

          disposeCanvas(canvas);
        });
      });
    });
  });

  describe('4. Various Canvas Dimensions', () => {
    testDimensions.forEach(dimension => {
      it(`should render on ${dimension.name} canvas (${dimension.width}x${dimension.height})`, async () => {
        const canvas = createCanvas(dimension.width, dimension.height);
        
        const editorSettings: EditorSettings = {
          fontFamily: 'CustomFontTTF',
          fontSize: 36,
          lineHeight: 1.5,
          textAlignment: 'center',
          globalTextAlignment: 'center',
          verticalAlignment: 'middle'
        };

        const textStyle: TextStyle = {
          fontFamily: 'CustomFontTTF',
          fontSize: 36,
          color: '#000000',
          position: { x: 50, y: 50 },
          alignment: 'center',
          verticalAlignment: 'middle'
        };

        const config: CanvasTextConfig = {
          text: '다양한 캔버스 크기 테스트',
          textStyle,
          editorSettings,
          canvasWidth: dimension.width,
          canvasHeight: dimension.height
        };

        expect(() => addTextToCanvas(canvas, config)).not.toThrow();
        
        // Verify canvas dimensions
        expect(fabric.Canvas).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({
            width: dimension.width,
            height: dimension.height
          })
        );

        disposeCanvas(canvas);
      });
    });
  });

  describe('5. Configuration Merging', () => {
    it('should correctly merge text style and editor settings', () => {
      const textStyle: TextStyle = {
        fontFamily: 'Arial',
        fontSize: 20,
        color: '#FF0000',
        position: { x: 25, y: 75 },
        alignment: 'right',
        verticalAlignment: 'bottom'
      };

      const editorSettings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 36,
        lineHeight: 1.8,
        textAlignment: 'center',
        globalTextAlignment: 'left',
        verticalAlignment: 'middle'
      };

      const merged = mergeTextConfigs(textStyle, editorSettings);

      expect(merged).toEqual({
        fontFamily: 'Arial', // From textStyle
        fontSize: 20, // From textStyle
        lineHeight: 1.8, // From editorSettings
        color: '#FF0000', // From textStyle
        alignment: 'right', // From textStyle
        verticalAlignment: 'bottom', // From textStyle
        position: { x: 25, y: 75 } // From textStyle
      });
    });

    it('should use editor settings as fallback when text style values are missing', () => {
      const textStyle: TextStyle = {
        fontFamily: '',
        fontSize: 0,
        color: '#FF0000',
        position: { x: 25, y: 75 },
        alignment: undefined as any,
        verticalAlignment: undefined as any
      };

      const editorSettings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 36,
        lineHeight: 1.8,
        textAlignment: 'center',
        globalTextAlignment: 'left',
        verticalAlignment: 'middle'
      };

      const merged = mergeTextConfigs(textStyle, editorSettings);

      expect(merged).toEqual({
        fontFamily: 'CustomFontTTF', // Fallback to editorSettings
        fontSize: 36, // Fallback to editorSettings
        lineHeight: 1.8,
        color: '#FF0000',
        alignment: 'center', // Fallback to editorSettings
        verticalAlignment: 'middle', // Fallback to editorSettings
        position: { x: 25, y: 75 }
      });
    });
  });

  describe('6. Error Handling', () => {
    it('should handle invalid canvas dimensions gracefully', () => {
      expect(() => createCanvas(0, 0)).not.toThrow();
      expect(() => createCanvas(-100, -100)).not.toThrow();
      expect(() => createCanvas(NaN, NaN)).not.toThrow();
    });

    it('should handle empty text gracefully', async () => {
      const canvas = createCanvas(900, 1600);
      
      const editorSettings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 36,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const textStyle: TextStyle = {
        fontFamily: 'CustomFontTTF',
        fontSize: 36,
        color: '#000000',
        position: { x: 10, y: 10 },
        alignment: 'left',
        verticalAlignment: 'top'
      };

      const config: CanvasTextConfig = {
        text: '',
        textStyle,
        editorSettings,
        canvasWidth: 900,
        canvasHeight: 1600
      };

      expect(() => addTextToCanvas(canvas, config)).not.toThrow();
      disposeCanvas(canvas);
    });

    it('should handle invalid font families gracefully', async () => {
      const canvas = createCanvas(900, 1600);
      
      const editorSettings: EditorSettings = {
        fontFamily: 'NonExistentFont',
        fontSize: 36,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const textStyle: TextStyle = {
        fontFamily: 'AnotherNonExistentFont',
        fontSize: 36,
        color: '#000000',
        position: { x: 10, y: 10 },
        alignment: 'left',
        verticalAlignment: 'top'
      };

      const config: CanvasTextConfig = {
        text: '폰트 오류 테스트',
        textStyle,
        editorSettings,
        canvasWidth: 900,
        canvasHeight: 1600
      };

      expect(() => addTextToCanvas(canvas, config)).not.toThrow();
      disposeCanvas(canvas);
    });
  });

  describe('7. Export Functionality', () => {
    it('should export canvas as JPEG with different quality settings', async () => {
      const canvas = createCanvas(900, 1600);
      
      const qualityLevels = [0.1, 0.5, 0.8, 0.9, 1.0];
      
      for (const quality of qualityLevels) {
        const blob = await exportCanvasAsImage(canvas, 'jpeg', quality);
        expect(blob).toBeInstanceOf(Blob);
      }
      
      disposeCanvas(canvas);
    });

    it('should export canvas as PNG', async () => {
      const canvas = createCanvas(900, 1600);
      
      const blob = await exportCanvasAsImage(canvas, 'png');
      expect(blob).toBeInstanceOf(Blob);
      
      disposeCanvas(canvas);
    });
  });
});
