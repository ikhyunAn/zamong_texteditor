/**
 * Test file to verify image generation functionality
 */

import { 
  createCanvas,
  addTextToCanvas,
  exportCanvasAsImage,
  addBackgroundImage,
  disposeCanvas,
  CanvasTextConfig
} from '../canvas-utils';
import { DEFAULT_TEXT_STYLE, DEFAULT_BACKGROUNDS } from '../constants';

describe('Image Generation Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Canvas Creation and Text Rendering', () => {
    it('should create canvas and add text successfully', () => {
      const canvas = createCanvas(900, 1600);
      
      const config: CanvasTextConfig = {
        text: 'Test content for image generation',
        textStyle: DEFAULT_TEXT_STYLE,
        editorSettings: {
          fontFamily: 'CustomFontTTF',
          fontSize: 36,
          lineHeight: 1.5,
          textAlignment: 'center',
          globalTextAlignment: 'center',
          verticalAlignment: 'middle'
        },
        canvasWidth: 900,
        canvasHeight: 1600
      };

      expect(() => addTextToCanvas(canvas, config)).not.toThrow();
      expect(() => disposeCanvas(canvas)).not.toThrow();
    });

    it('should handle Korean text correctly', () => {
      const canvas = createCanvas(900, 1600);
      
      const config: CanvasTextConfig = {
        text: '안녕하세요! 이것은 한글 텍스트 테스트입니다.',
        textStyle: DEFAULT_TEXT_STYLE,
        editorSettings: {
          fontFamily: 'HakgyoansimBareonbatangR',
          fontSize: 32,
          lineHeight: 1.6,
          textAlignment: 'left',
          globalTextAlignment: 'left',
          verticalAlignment: 'top'
        },
        canvasWidth: 900,
        canvasHeight: 1600
      };

      expect(() => addTextToCanvas(canvas, config)).not.toThrow();
      disposeCanvas(canvas);
    });
  });

  describe('Background Image Handling', () => {
    it('should add background image without errors', async () => {
      const canvas = createCanvas(900, 1600);
      
      // This should not throw an error, even with mocked fabric.js
      await expect(addBackgroundImage(canvas, '/backgrounds/stage_1.png')).resolves.not.toThrow();
      
      disposeCanvas(canvas);
    });

    it('should handle all default background images', async () => {
      for (const background of DEFAULT_BACKGROUNDS) {
        const canvas = createCanvas(900, 1600);
        
        await expect(addBackgroundImage(canvas, background.path)).resolves.not.toThrow();
        
        disposeCanvas(canvas);
      }
    });
  });

  describe('Image Export', () => {
    it('should export canvas as image blob', async () => {
      const canvas = createCanvas(900, 1600);
      
      // Add some content first
      const config: CanvasTextConfig = {
        text: 'Export test content',
        textStyle: DEFAULT_TEXT_STYLE,
        editorSettings: {
          fontFamily: 'CustomFontTTF',
          fontSize: 24,
          lineHeight: 1.5,
          textAlignment: 'center',
          globalTextAlignment: 'center',
          verticalAlignment: 'middle'
        },
        canvasWidth: 900,
        canvasHeight: 1600
      };
      
      addTextToCanvas(canvas, config);
      
      // Export should work
      const blob = await exportCanvasAsImage(canvas, 'png');
      expect(blob).toBeInstanceOf(Blob);
      
      disposeCanvas(canvas);
    });

    it('should support different export formats', async () => {
      const canvas = createCanvas(900, 1600);
      
      const config: CanvasTextConfig = {
        text: 'Format test',
        textStyle: DEFAULT_TEXT_STYLE,
        editorSettings: {
          fontFamily: 'CustomFontTTF',
          fontSize: 36,
          lineHeight: 1.5,
          textAlignment: 'left',
          globalTextAlignment: 'left',
          verticalAlignment: 'top'
        },
        canvasWidth: 900,
        canvasHeight: 1600
      };
      
      addTextToCanvas(canvas, config);
      
      // Test different formats
      const pngBlob = await exportCanvasAsImage(canvas, 'png');
      const jpegBlob = await exportCanvasAsImage(canvas, 'jpeg', 0.9);
      
      expect(pngBlob).toBeInstanceOf(Blob);
      expect(jpegBlob).toBeInstanceOf(Blob);
      
      disposeCanvas(canvas);
    });
  });

  describe('Complete Image Generation Workflow', () => {
    it('should complete full workflow: create → background → text → export', async () => {
      const canvas = createCanvas(900, 1600);
      
      // Step 1: Add background
      await addBackgroundImage(canvas, '/backgrounds/stage_1.png');
      
      // Step 2: Add text
      const config: CanvasTextConfig = {
        text: '완전한 이미지 생성 테스트\nComplete image generation test',
        textStyle: DEFAULT_TEXT_STYLE,
        editorSettings: {
          fontFamily: 'CustomFontTTF',
          fontSize: 28,
          lineHeight: 1.6,
          textAlignment: 'center',
          globalTextAlignment: 'center',
          verticalAlignment: 'middle'
        },
        canvasWidth: 900,
        canvasHeight: 1600
      };
      
      addTextToCanvas(canvas, config);
      
      // Step 3: Export
      const blob = await exportCanvasAsImage(canvas, 'jpeg', 0.8);
      expect(blob).toBeInstanceOf(Blob);
      
      // Step 4: Cleanup
      disposeCanvas(canvas);
    });

    it('should handle multiple text configurations', () => {
      const testConfigs = [
        {
          text: 'Left aligned text',
          alignment: 'left' as const,
          verticalAlignment: 'top' as const
        },
        {
          text: 'Center aligned text',
          alignment: 'center' as const,
          verticalAlignment: 'middle' as const
        },
        {
          text: 'Right aligned text',
          alignment: 'right' as const,
          verticalAlignment: 'bottom' as const
        }
      ];

      testConfigs.forEach((testConfig, index) => {
        const canvas = createCanvas(900, 1600);
        
        const config: CanvasTextConfig = {
          text: testConfig.text,
          textStyle: DEFAULT_TEXT_STYLE,
          editorSettings: {
            fontFamily: 'CustomFontTTF',
            fontSize: 32,
            lineHeight: 1.5,
            textAlignment: testConfig.alignment,
            globalTextAlignment: testConfig.alignment,
            verticalAlignment: testConfig.verticalAlignment
          },
          canvasWidth: 900,
          canvasHeight: 1600
        };

        expect(() => addTextToCanvas(canvas, config)).not.toThrow();
        disposeCanvas(canvas);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid canvas gracefully', async () => {
      const nullCanvas = null;
      
      expect(() => disposeCanvas(nullCanvas)).not.toThrow();
    });

    it('should handle empty text content', () => {
      const canvas = createCanvas(900, 1600);
      
      const config: CanvasTextConfig = {
        text: '',
        textStyle: DEFAULT_TEXT_STYLE,
        editorSettings: {
          fontFamily: 'CustomFontTTF',
          fontSize: 36,
          lineHeight: 1.5,
          textAlignment: 'center',
          globalTextAlignment: 'center',
          verticalAlignment: 'middle'
        },
        canvasWidth: 900,
        canvasHeight: 1600
      };

      expect(() => addTextToCanvas(canvas, config)).not.toThrow();
      disposeCanvas(canvas);
    });

    it('should handle invalid background image paths', async () => {
      const canvas = createCanvas(900, 1600);
      
      // Should not throw, but may warn - this depends on the implementation
      await expect(addBackgroundImage(canvas, '/invalid/path.png')).resolves.not.toThrow();
      
      disposeCanvas(canvas);
    });
  });
});
