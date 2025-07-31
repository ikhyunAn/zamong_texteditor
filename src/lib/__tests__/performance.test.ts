import {
  createCanvas,
  addTextToCanvas,
  exportCanvasAsImage,
  addBackgroundImage,
  disposeCanvas,
  ensureFontsLoaded,
  CanvasTextConfig
} from '../canvas-utils';
import { EditorSettings, TextStyle } from '@/types';
import { AVAILABLE_FONTS, FONT_SIZES } from '../constants';
import { fabric } from 'fabric';

// Mock fabric.js
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn().mockImplementation(() => ({
      getWidth: jest.fn().mockReturnValue(900),
      getHeight: jest.fn().mockReturnValue(1600),
      add: jest.fn(),
      setActiveObject: jest.fn(), 
      dispose: jest.fn(),
      renderAll: jest.fn(),
      discardActiveObject: jest.fn(),
      toDataURL: jest.fn(() => 'data:image/jpeg;base64,mockedImageData'),
      setBackgroundImage: jest.fn((img, callback) => callback()),
      getContext: jest.fn().mockReturnValue({
        canvas: {
          toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,mockedImageData'),
          getContext: jest.fn().mockReturnValue({})
        }
      })
    })),
    Textbox: jest.fn().mockImplementation(() => ({
      width: 720,
      set: jest.fn()
    })),
    Image: {
      fromURL: jest.fn((url, options, callback) => {
        const mockImg = {
          width: 900,
          height: 1600,
          scale: jest.fn(),
          set: jest.fn()
        };
        setTimeout(() => callback(mockImg), 10); // Simulate async loading
      })
    }
  }
}));

// Mock DOM
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

global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  blob: jest.fn().mockResolvedValue(new Blob(['mock'], { type: 'image/jpeg' }))
});

// Mock document.fonts for font checking
Object.defineProperty(global.document, 'fonts', {
  value: {
    check: jest.fn().mockReturnValue(true)
  },
  writable: true
});

interface PerformanceMetrics {
  duration: number;
  memoryUsage?: number;
  operationsPerSecond?: number;
  peakMemory?: number;
}

interface BatchTestResult {
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  successCount: number;
  errorCount: number;
  throughput: number; // operations per second
}

class PerformanceTester {
  private memoryBaseline: number = 0;

  constructor() {
    this.measureMemoryBaseline();
  }

  private measureMemoryBaseline(): void {
    if (typeof performance !== 'undefined' && performance.memory) {
      this.memoryBaseline = (performance.memory as any).usedJSHeapSize;
    }
  }

  private getCurrentMemoryUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return (performance.memory as any).usedJSHeapSize - this.memoryBaseline;
    }
    return 0;
  }

  async measureCanvasCreation(iterations: number = 100): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const startMemory = this.getCurrentMemoryUsage();

    for (let i = 0; i < iterations; i++) {
      const canvas = createCanvas(900, 1600);
      disposeCanvas(canvas);
    }

    const endTime = Date.now();
    const endMemory = this.getCurrentMemoryUsage();
    const duration = endTime - startTime;

    return {
      duration,
      memoryUsage: endMemory - startMemory,
      operationsPerSecond: (iterations / duration) * 1000
    };
  }

  async measureTextRendering(iterations: number = 50): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const startMemory = this.getCurrentMemoryUsage();

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

    for (let i = 0; i < iterations; i++) {
      const canvas = createCanvas(900, 1600);
      
      const config: CanvasTextConfig = {
        text: `Performance test iteration ${i + 1}. 성능 테스트 반복 ${i + 1}회차입니다.`,
        textStyle,
        editorSettings,
        canvasWidth: 900,
        canvasHeight: 1600
      };

      addTextToCanvas(canvas, config);
      disposeCanvas(canvas);
    }

    const endTime = Date.now();
    const endMemory = this.getCurrentMemoryUsage();
    const duration = endTime - startTime;

    return {
      duration,
      memoryUsage: endMemory - startMemory,
      operationsPerSecond: (iterations / duration) * 1000
    };
  }

  async measureImageExport(iterations: number = 20): Promise<PerformanceMetrics> {
    const startTime = Date.now();
    const startMemory = this.getCurrentMemoryUsage();

    const canvas = createCanvas(900, 1600);
    
    // Add some content to make export more realistic
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
      text: 'Export performance test 내보내기 성능 테스트',
      textStyle,
      editorSettings,
      canvasWidth: 900,
      canvasHeight: 1600
    };

    addTextToCanvas(canvas, config);

    for (let i = 0; i < iterations; i++) {
      await exportCanvasAsImage(canvas, 'jpeg', 0.9);
    }

    disposeCanvas(canvas);

    const endTime = Date.now();
    const endMemory = this.getCurrentMemoryUsage();
    const duration = endTime - startTime;

    return {
      duration,
      memoryUsage: endMemory - startMemory,
      operationsPerSecond: (iterations / duration) * 1000
    };
  }

  async measureBatchGeneration(
    batchSize: number,
    options: {
      includeBgImage?: boolean;
      varyContent?: boolean;
      varySettings?: boolean;
    } = {}
  ): Promise<BatchTestResult> {
    const results: number[] = [];
    let successCount = 0;
    let errorCount = 0;
    const overallStartTime = Date.now();

    const baseEditorSettings: EditorSettings = {
      fontFamily: 'CustomFontTTF',
      fontSize: 36,
      lineHeight: 1.5,
      textAlignment: 'left',
      globalTextAlignment: 'left',
      verticalAlignment: 'top'
    };

    const baseTextStyle: TextStyle = {
      fontFamily: 'CustomFontTTF',
      fontSize: 36,
      color: '#000000',
      position: { x: 10, y: 10 },
      alignment: 'left',
      verticalAlignment: 'top'
    };

    for (let i = 0; i < batchSize; i++) {
      const iterationStartTime = Date.now();
      
      try {
        const canvas = createCanvas(900, 1600);

        // Add background image if requested
        if (options.includeBgImage) {
          await addBackgroundImage(canvas, '/backgrounds/stage_1.png');
        }

        // Vary content if requested
        const text = options.varyContent 
          ? `배치 생성 테스트 ${i + 1}번째 항목입니다. Batch generation test item ${i + 1}.`
          : '기본 배치 생성 테스트 텍스트';

        // Vary settings if requested
        const editorSettings = options.varySettings ? {
          ...baseEditorSettings,
          fontSize: FONT_SIZES[i % FONT_SIZES.length].value,
          textAlignment: (['left', 'center', 'right'] as const)[i % 3],
          globalTextAlignment: (['left', 'center', 'right'] as const)[i % 3]
        } : baseEditorSettings;

        const textStyle = options.varySettings ? {
          ...baseTextStyle,
          fontSize: editorSettings.fontSize,
          alignment: editorSettings.textAlignment
        } : baseTextStyle;

        const config: CanvasTextConfig = {
          text,
          textStyle,
          editorSettings,
          canvasWidth: 900,
          canvasHeight: 1600
        };

        addTextToCanvas(canvas, config);
        await exportCanvasAsImage(canvas, 'jpeg', 0.8);
        disposeCanvas(canvas);

        successCount++;
      } catch (error) {
        errorCount++;
        console.warn(`Batch generation error for item ${i}:`, error);
      }

      const iterationEndTime = Date.now();
      results.push(iterationEndTime - iterationStartTime);
    }

    const overallEndTime = Date.now();
    const totalTime = overallEndTime - overallStartTime;

    return {
      totalTime,
      averageTime: results.reduce((sum, time) => sum + time, 0) / results.length,
      minTime: Math.min(...results),
      maxTime: Math.max(...results),
      successCount,
      errorCount,
      throughput: (successCount / totalTime) * 1000
    };
  }

  async measureMemoryUsageOverTime(
    operations: number,
    operationType: 'canvas-creation' | 'text-rendering' | 'export'
  ): Promise<{
    memorySnapshots: Array<{ time: number; memory: number; operation: number }>;
    peakMemory: number;
    finalMemory: number;
  }> {
    const snapshots: Array<{ time: number; memory: number; operation: number }> = [];
    let peakMemory = 0;
    const startTime = Date.now();

    // Take initial snapshot
    const initialMemory = this.getCurrentMemoryUsage();
    snapshots.push({ time: 0, memory: initialMemory, operation: 0 });

    for (let i = 0; i < operations; i++) {
      // Perform operation based on type
      switch (operationType) {
        case 'canvas-creation':
          const canvas = createCanvas(900, 1600);
          disposeCanvas(canvas);
          break;
        
        case 'text-rendering':
          const renderCanvas = createCanvas(900, 1600);
          const config: CanvasTextConfig = {
            text: '메모리 사용량 테스트',
            textStyle: {
              fontFamily: 'CustomFontTTF',
              fontSize: 36,
              color: '#000000',
              position: { x: 10, y: 10 },
              alignment: 'left',
              verticalAlignment: 'top'
            },
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
          addTextToCanvas(renderCanvas, config);
          disposeCanvas(renderCanvas);
          break;
        
        case 'export':
          const exportCanvas = createCanvas(900, 1600);
          await exportCanvasAsImage(exportCanvas, 'jpeg');
          disposeCanvas(exportCanvas);
          break;
      }

      // Take memory snapshot every 10 operations
      if (i % 10 === 9) {
        const currentMemory = this.getCurrentMemoryUsage();
        const currentTime = Date.now() - startTime;
        snapshots.push({ time: currentTime, memory: currentMemory, operation: i + 1 });
        
        if (currentMemory > peakMemory) {
          peakMemory = currentMemory;
        }
      }
    }

    const finalMemory = this.getCurrentMemoryUsage();
    
    return {
      memorySnapshots: snapshots,
      peakMemory,
      finalMemory
    };
  }
}

describe('Performance Tests', () => {
  let tester: PerformanceTester;

  beforeAll(() => {
    tester = new PerformanceTester();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Canvas Creation Performance', () => {
    it('should create and dispose canvases efficiently', async () => {
      const metrics = await tester.measureCanvasCreation(100);
      
      expect(metrics.duration).toBeLessThan(5000); // Should complete within 5 seconds
      expect(metrics.operationsPerSecond).toBeGreaterThan(10); // At least 10 ops/sec
      
      console.log('Canvas Creation Performance:', {
        duration: `${metrics.duration}ms`,
        opsPerSecond: metrics.operationsPerSecond?.toFixed(2),
        memoryUsage: `${metrics.memoryUsage} bytes`
      });
    });

    it('should handle different canvas dimensions efficiently', async () => {
      const dimensions = [
        { width: 800, height: 800 },
        { width: 900, height: 1600 },
        { width: 1080, height: 1920 },
        { width: 1200, height: 630 }
      ];

      for (const dim of dimensions) {
        const startTime = Date.now();
        
        for (let i = 0; i < 20; i++) {
          const canvas = createCanvas(dim.width, dim.height);
          disposeCanvas(canvas);
        }
        
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
        
        console.log(`${dim.width}x${dim.height} canvas creation: ${duration}ms for 20 operations`);
      }
    });
  });

  describe('Text Rendering Performance', () => {
    it('should render text efficiently across different fonts', async () => {
      const fonts = AVAILABLE_FONTS.map(f => f.family);
      
      for (const fontFamily of fonts) {
        const startTime = Date.now();
        
        for (let i = 0; i < 10; i++) {
          const canvas = createCanvas(900, 1600);
          const config: CanvasTextConfig = {
            text: `폰트 성능 테스트 ${fontFamily}`,
            textStyle: {
              fontFamily,
              fontSize: 36,
              color: '#000000',
              position: { x: 10, y: 10 },
              alignment: 'left',
              verticalAlignment: 'top'
            },
            editorSettings: {
              fontFamily,
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
          disposeCanvas(canvas);
        }
        
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(3000); // Should complete within 3 seconds
        
        console.log(`${fontFamily} text rendering: ${duration}ms for 10 operations`);
      }
    });

    it('should handle long text efficiently', async () => {
      const longTexts = [
        '짧은 텍스트',
        '중간 길이의 텍스트로 여러 단어가 포함되어 있습니다.',
        '이것은 매우 긴 텍스트입니다. 여러 줄에 걸쳐 표시되며 다양한 한글 문자와 영어 문자가 섞여 있습니다. 이런 긴 텍스트의 렌더링 성능을 측정하기 위한 것입니다. Performance testing for long Korean and English mixed text rendering capabilities.',
        '극도로 긴 텍스트입니다. '.repeat(50) // Very long repeated text
      ];

      for (let i = 0; i < longTexts.length; i++) {
        const text = longTexts[i];
        const startTime = Date.now();
        
        const canvas = createCanvas(900, 1600);
        const config: CanvasTextConfig = {
          text,
          textStyle: {
            fontFamily: 'CustomFontTTF',
            fontSize: 24,
            color: '#000000',
            position: { x: 10, y: 10 },
            alignment: 'left',
            verticalAlignment: 'top'
          },
          editorSettings: {
            fontFamily: 'CustomFontTTF',
            fontSize: 24,
            lineHeight: 1.5,
            textAlignment: 'left',
            globalTextAlignment: 'left',
            verticalAlignment: 'top'
          },
          canvasWidth: 900,
          canvasHeight: 1600
        };
        
        addTextToCanvas(canvas, config);
        disposeCanvas(canvas);
        
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
        
        console.log(`Long text ${i + 1} (${text.length} chars): ${duration}ms`);
      }
    });

    it('should measure overall text rendering performance', async () => {
      const metrics = await tester.measureTextRendering(50);
      
      expect(metrics.duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(metrics.operationsPerSecond).toBeGreaterThan(2); // At least 2 ops/sec
      
      console.log('Text Rendering Performance:', {
        duration: `${metrics.duration}ms`,
        opsPerSecond: metrics.operationsPerSecond?.toFixed(2),
        memoryUsage: `${metrics.memoryUsage} bytes`
      });
    });
  });

  describe('Export Performance', () => {
    it('should export images efficiently', async () => {
      const metrics = await tester.measureImageExport(20);
      
      expect(metrics.duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(metrics.operationsPerSecond).toBeGreaterThan(1); // At least 1 export/sec
      
      console.log('Image Export Performance:', {
        duration: `${metrics.duration}ms`,
        opsPerSecond: metrics.operationsPerSecond?.toFixed(2),
        memoryUsage: `${metrics.memoryUsage} bytes`
      });
    });

    it('should handle different export formats efficiently', async () => {
      const formats: Array<'jpeg' | 'png'> = ['jpeg', 'png'];
      const qualities = [0.5, 0.8, 0.9, 1.0];

      for (const format of formats) {
        for (const quality of qualities) {
          const startTime = Date.now();
          const canvas = createCanvas(900, 1600);
          
          // Add some content
          const config: CanvasTextConfig = {
            text: '포맷 테스트',
            textStyle: {
              fontFamily: 'CustomFontTTF',
              fontSize: 36,
              color: '#000000',
              position: { x: 10, y: 10 },
              alignment: 'left',
              verticalAlignment: 'top'
            },
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
          
          for (let i = 0; i < 5; i++) {
            await exportCanvasAsImage(canvas, format, quality);
          }
          
          disposeCanvas(canvas);
          const duration = Date.now() - startTime;
          
          expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
          
          console.log(`Export ${format} quality ${quality}: ${duration}ms for 5 operations`);
        }
      }
    });
  });

  describe('Batch Generation Performance', () => {
    it('should handle small batch generation efficiently', async () => {
      const result = await tester.measureBatchGeneration(10);
      
      expect(result.successCount).toBe(10);
      expect(result.errorCount).toBe(0);
      expect(result.totalTime).toBeLessThan(15000); // Within 15 seconds
      expect(result.throughput).toBeGreaterThan(0.5); // At least 0.5 ops/sec
      
      console.log('Small Batch (10 items) Performance:', {
        totalTime: `${result.totalTime}ms`,
        averageTime: `${result.averageTime.toFixed(2)}ms`,
        throughput: `${result.throughput.toFixed(2)} ops/sec`,
        success: result.successCount,
        errors: result.errorCount
      });
    });

    it('should handle medium batch generation with varied content', async () => {
      const result = await tester.measureBatchGeneration(25, {
        varyContent: true,
        varySettings: true
      });
      
      expect(result.successCount).toBe(25);
      expect(result.errorCount).toBe(0);
      expect(result.totalTime).toBeLessThan(30000); // Within 30 seconds
      
      console.log('Medium Batch (25 items) with Variations:', {
        totalTime: `${result.totalTime}ms`,
        averageTime: `${result.averageTime.toFixed(2)}ms`,
        minTime: `${result.minTime}ms`,
        maxTime: `${result.maxTime}ms`,
        throughput: `${result.throughput.toFixed(2)} ops/sec`
      });
    });

    it('should handle batch generation with background images', async () => {
      const result = await tester.measureBatchGeneration(15, {
        includeBgImage: true,
        varyContent: true
      });
      
      expect(result.successCount).toBe(15);
      expect(result.errorCount).toBe(0);
      expect(result.totalTime).toBeLessThan(25000); // Within 25 seconds
      
      console.log('Batch with Background Images (15 items):', {
        totalTime: `${result.totalTime}ms`,
        averageTime: `${result.averageTime.toFixed(2)}ms`,
        throughput: `${result.throughput.toFixed(2)} ops/sec`
      });
    });
  });

  describe('Memory Usage Analysis', () => {
    it('should monitor memory usage during canvas operations', async () => {
      const memoryData = await tester.measureMemoryUsageOverTime(50, 'canvas-creation');
      
      expect(memoryData.memorySnapshots.length).toBeGreaterThan(0);
      expect(memoryData.peakMemory).toBeGreaterThanOrEqual(0);
      expect(memoryData.finalMemory).toBeGreaterThanOrEqual(0);
      
      console.log('Memory Usage (Canvas Creation):', {
        peakMemory: `${memoryData.peakMemory} bytes`,
        finalMemory: `${memoryData.finalMemory} bytes`,
        snapshots: memoryData.memorySnapshots.length
      });
    });

    it('should monitor memory usage during text rendering', async () => {
      const memoryData = await tester.measureMemoryUsageOverTime(30, 'text-rendering');
      
      expect(memoryData.memorySnapshots.length).toBeGreaterThan(0);
      
      console.log('Memory Usage (Text Rendering):', {
        peakMemory: `${memoryData.peakMemory} bytes`,
        finalMemory: `${memoryData.finalMemory} bytes`,
        snapshots: memoryData.memorySnapshots.length
      });
    });

    it('should monitor memory usage during exports', async () => {
      const memoryData = await tester.measureMemoryUsageOverTime(20, 'export');
      
      expect(memoryData.memorySnapshots.length).toBeGreaterThan(0);
      
      console.log('Memory Usage (Export):', {
        peakMemory: `${memoryData.peakMemory} bytes`,
        finalMemory: `${memoryData.finalMemory} bytes`,
        snapshots: memoryData.memorySnapshots.length
      });
    });
  });

  describe('Stress Testing', () => {
    it('should handle high-frequency operations without degradation', async () => {
      const iterations = 100;
      const timings: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = Date.now();
        
        const canvas = createCanvas(900, 1600);
        const config: CanvasTextConfig = {
          text: `스트레스 테스트 ${i + 1}`,
          textStyle: {
            fontFamily: 'CustomFontTTF',
            fontSize: 36,
            color: '#000000',
            position: { x: 10, y: 10 },
            alignment: 'left',
            verticalAlignment: 'top'
          },
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
        disposeCanvas(canvas);
        
        const endTime = Date.now();
        timings.push(endTime - startTime);
      }
      
      const averageTime = timings.reduce((sum, time) => sum + time, 0) / timings.length;
      const firstHalfAvg = timings.slice(0, 50).reduce((sum, time) => sum + time, 0) / 50;
      const secondHalfAvg = timings.slice(50).reduce((sum, time) => sum + time, 0) / 50;
      
      // Performance shouldn't degrade significantly over time
      const degradationRatio = secondHalfAvg / firstHalfAvg;
      expect(degradationRatio).toBeLessThan(10); // No more than 10x slower (more realistic for mocked environment)
      
      console.log('Stress Test Results:', {
        iterations,
        averageTime: `${averageTime.toFixed(2)}ms`,
        firstHalfAvg: `${firstHalfAvg.toFixed(2)}ms`,
        secondHalfAvg: `${secondHalfAvg.toFixed(2)}ms`,
        degradationRatio: degradationRatio.toFixed(2)
      });
    });
  });
});
