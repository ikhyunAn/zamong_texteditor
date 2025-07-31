/**
 * @jest-environment jsdom
 */
import { addTextToCanvas, CanvasTextConfig, calculateVerticalPosition } from '@/lib/canvas-utils';
import { fabric } from 'fabric';

// Mock fabric.js
jest.mock('fabric', () => ({
  fabric: {
    Textbox: jest.fn(),
    Canvas: jest.fn(() => ({
      add: jest.fn(),
      setActiveObject: jest.fn(),
      dispose: jest.fn(),
    })),
  },
}));

describe('Text Rendering Tests', () => {
  let canvas: any;

  beforeEach(() => {
    canvas = new fabric.Canvas(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addTextToCanvas', () => {
    it('should add a textbox to the canvas', () => {
      const config: CanvasTextConfig = {
        text: 'Hello, world!',
        textStyle: {
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          alignment: 'left',
          verticalAlignment: 'middle',
          position: { x: 50, y: 50 },
        },
        canvasWidth: 800,
        canvasHeight: 600,
      };

      addTextToCanvas(canvas, config);

      expect(fabric.Textbox).toHaveBeenCalled();
      expect(canvas.add).toHaveBeenCalled();
      expect(canvas.setActiveObject).toHaveBeenCalled();
    });

    describe('fontSize settings', () => {
      it('should use fontSize from editorSettings when provided', () => {
        const config: CanvasTextConfig = {
          text: 'Test text',
          textStyle: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          editorSettings: {
            fontSize: 48,
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        expect(fabric.Textbox).toHaveBeenCalledWith(
          'Test text',
          expect.objectContaining({
            fontSize: 48,
          })
        );
      });

      it('should use fontSize from textStyle when editorSettings is not provided', () => {
        const config: CanvasTextConfig = {
          text: 'Test text',
          textStyle: {
            fontSize: 32,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        expect(fabric.Textbox).toHaveBeenCalledWith(
          'Test text',
          expect.objectContaining({
            fontSize: 32,
          })
        );
      });

      it('should handle different fontSize values correctly', () => {
        const testCases = [16, 24, 36, 72];

        testCases.forEach((fontSize) => {
          jest.clearAllMocks();
          
          const config: CanvasTextConfig = {
            text: `Font size ${fontSize}`,
            textStyle: {
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
              alignment: 'left',
              verticalAlignment: 'middle',
              position: { x: 50, y: 50 },
            },
            editorSettings: {
              fontSize,
            },
            canvasWidth: 800,
            canvasHeight: 600,
          };

          addTextToCanvas(canvas, config);

          expect(fabric.Textbox).toHaveBeenCalledWith(
            `Font size ${fontSize}`,
            expect.objectContaining({
              fontSize,
            })
          );
        });
      });
    });

    describe('lineHeight settings', () => {
      it('should use lineHeight from editorSettings when provided', () => {
        const config: CanvasTextConfig = {
          text: 'Multi-line\ntext example',
          textStyle: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          editorSettings: {
            lineHeight: 2.0,
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        expect(fabric.Textbox).toHaveBeenCalledWith(
          'Multi-line\ntext example',
          expect.objectContaining({
            lineHeight: 2.0,
          })
        );
      });

      it('should use default lineHeight when not provided', () => {
        const config: CanvasTextConfig = {
          text: 'Default line height',
          textStyle: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        expect(fabric.Textbox).toHaveBeenCalledWith(
          'Default line height',
          expect.objectContaining({
            lineHeight: 1.5, // default value
          })
        );
      });

      it('should handle various lineHeight values', () => {
        const testCases = [1.0, 1.5, 2.0, 2.5];

        testCases.forEach((lineHeight) => {
          jest.clearAllMocks();
          
          const config: CanvasTextConfig = {
            text: `Line height ${lineHeight}`,
            textStyle: {
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
              alignment: 'left',
              verticalAlignment: 'middle',
              position: { x: 50, y: 50 },
            },
            editorSettings: {
              lineHeight,
            },
            canvasWidth: 800,
            canvasHeight: 600,
          };

          addTextToCanvas(canvas, config);

          expect(fabric.Textbox).toHaveBeenCalledWith(
            `Line height ${lineHeight}`,
            expect.objectContaining({
              lineHeight,
            })
          );
        });
      });
    });

    describe('verticalAlignment settings', () => {
      it('should handle top alignment', () => {
        const config: CanvasTextConfig = {
          text: 'Top aligned text',
          textStyle: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          editorSettings: {
            verticalAlignment: 'top',
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        // Verify that the textbox was created (position calculation is tested separately)
        expect(fabric.Textbox).toHaveBeenCalledWith(
          'Top aligned text',
          expect.objectContaining({
            fontSize: 24,
          })
        );
      });

      it('should handle center alignment', () => {
        const config: CanvasTextConfig = {
          text: 'Center aligned text',
          textStyle: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          editorSettings: {
            verticalAlignment: 'middle',
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        expect(fabric.Textbox).toHaveBeenCalledWith(
          'Center aligned text',
          expect.objectContaining({
            fontSize: 24,
          })
        );
      });

      it('should handle bottom alignment', () => {
        const config: CanvasTextConfig = {
          text: 'Bottom aligned text',
          textStyle: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          editorSettings: {
            verticalAlignment: 'bottom',
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        expect(fabric.Textbox).toHaveBeenCalledWith(
          'Bottom aligned text',
          expect.objectContaining({
            fontSize: 24,
          })
        );
      });
    });

    describe('canvas bounds validation', () => {
      it('should create textbox with width that fits within canvas bounds', () => {
        const config: CanvasTextConfig = {
          text: 'This is a very long text that should be constrained within the canvas bounds',
          textStyle: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            verticalAlignment: 'middle',
            position: { x: 50, y: 50 },
          },
          canvasWidth: 800,
          canvasHeight: 600,
        };

        addTextToCanvas(canvas, config);

        expect(fabric.Textbox).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            width: 640, // 80% of 800px canvas width
          })
        );
      });

      it('should adjust textbox positioning for different canvas sizes', () => {
        const canvasSizes = [
          { width: 400, height: 400 },
          { width: 800, height: 600 },
          { width: 1200, height: 800 },
        ];

        canvasSizes.forEach(({ width, height }) => {
          jest.clearAllMocks();
          
          const config: CanvasTextConfig = {
            text: 'Canvas bounds test',
            textStyle: {
              fontSize: 24,
              fontFamily: 'Arial',
              color: '#000000',
              alignment: 'center',
              verticalAlignment: 'middle',
              position: { x: 50, y: 50 },
            },
            canvasWidth: width,
            canvasHeight: height,
          };

          addTextToCanvas(canvas, config);

          expect(fabric.Textbox).toHaveBeenCalledWith(
            'Canvas bounds test',
            expect.objectContaining({
              width: width * 0.8, // 80% of canvas width
            })
          );
        });
      });
    });
  });

  describe('calculateVerticalPosition', () => {
    it('should calculate top position correctly', () => {
      const result = calculateVerticalPosition('top', 600, 100, 20);
      expect(result).toBe(20); // padding
    });

    it('should calculate middle position correctly', () => {
      const result = calculateVerticalPosition('middle', 600, 100, 20);
      expect(result).toBe(250); // (600 - 100) / 2
    });

    it('should calculate bottom position correctly', () => {
      const result = calculateVerticalPosition('bottom', 600, 100, 20);
      expect(result).toBe(480); // 600 - 100 - 20
    });
  });
});

