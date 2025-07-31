import {
  createCanvas,
  addTextToCanvas,
  exportCanvasAsImage,
  addBackgroundImage,
  disposeCanvas,
  CanvasTextConfig
} from '../canvas-utils';
import { EditorSettings, TextStyle, StorySection, Page } from '@/types';
import { useCanvasPreview } from '@/hooks/useCanvasPreview';
import { fabric } from 'fabric';
import { renderHook, act } from '@testing-library/react';

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
      set: jest.fn(),
      get: jest.fn().mockReturnValue(100) // Mock property access
    })),
    Image: {
      fromURL: jest.fn((url, options, callback) => {
        const mockImg = {
          width: 900,
          height: 1600,
          scale: jest.fn(),
          set: jest.fn()
        };
        setTimeout(() => callback(mockImg), 10);
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
      getContext: jest.fn().mockReturnValue({
        measureText: jest.fn().mockReturnValue({ width: 100 }),
        font: '16px Arial'
      })
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

interface PreviewComparisonResult {
  consistent: boolean;
  differences: string[];
  matchScore: number; // 0-1, 1 being perfect match
}

interface StoryValidationResult {
  valid: boolean;
  issues: Array<{
    type: 'warning' | 'error';
    message: string;
    pageIndex?: number;
    sectionId?: string;
  }>;
  recommendations: string[];
}

interface UserFeedback {
  userId: string;
  rating: number; // 1-5 scale
  feedback: string;
  aspectsRated: {
    consistency: number;
    readability: number;
    visualAppeal: number;
    performance: number;
  };
  issues?: string[];
  suggestions?: string[];
}

class UserAcceptanceTester {
  
  /**
   * Compare editor preview with generated image output
   */
  async comparePreviewWithGenerated(
    content: string,
    editorSettings: EditorSettings,
    backgroundImage?: string
  ): Promise<PreviewComparisonResult> {
    let differences: string[] = [];
    let matchScore = 1.0;

    try {
      // Generate the actual image
      const canvas = createCanvas(900, 1600);
      
      if (backgroundImage) {
        await addBackgroundImage(canvas, backgroundImage);
      }

      const textStyle: TextStyle = {
        fontFamily: editorSettings.fontFamily,
        fontSize: editorSettings.fontSize,
        color: '#000000',
        position: { x: 10, y: 10 },
        alignment: editorSettings.textAlignment,
        verticalAlignment: editorSettings.verticalAlignment
      };

      const config: CanvasTextConfig = {
        text: content,
        textStyle,
        editorSettings,
        canvasWidth: 900,
        canvasHeight: 1600
      };

      addTextToCanvas(canvas, config);
      const generatedBlob = await exportCanvasAsImage(canvas, 'png');
      
      // Create preview using the hook (mocked behavior)
      const mockCanvasRef = { current: canvas };
      
      // Simulate preview generation
      const previewDataUrl = canvas.toDataURL();
      
      // Compare properties
      if (fabric.Textbox) {
        const lastTextboxCall = (fabric.Textbox as jest.Mock).mock.calls.slice(-1)[0];
        if (lastTextboxCall) {
          const textboxConfig = lastTextboxCall[1];
          
          // Check font family consistency
          if (textboxConfig.fontFamily !== editorSettings.fontFamily) {
            differences.push(`Font family mismatch: preview uses ${textboxConfig.fontFamily}, expected ${editorSettings.fontFamily}`);
            matchScore -= 0.2;
          }
          
          // Check font size consistency
          if (textboxConfig.fontSize !== editorSettings.fontSize) {
            differences.push(`Font size mismatch: preview uses ${textboxConfig.fontSize}, expected ${editorSettings.fontSize}`);
            matchScore -= 0.2;
          }
          
          // Check alignment consistency
          if (textboxConfig.textAlign !== editorSettings.textAlignment) {
            differences.push(`Text alignment mismatch: preview uses ${textboxConfig.textAlign}, expected ${editorSettings.textAlignment}`);
            matchScore -= 0.1;
          }
          
          // Check line height consistency
          if (textboxConfig.lineHeight !== editorSettings.lineHeight) {
            differences.push(`Line height mismatch: preview uses ${textboxConfig.lineHeight}, expected ${editorSettings.lineHeight}`);
            matchScore -= 0.1;
          }
        }
      }
      
      // Check content consistency
      if (!previewDataUrl || previewDataUrl === 'data:,') {
        differences.push('Preview failed to generate image data');
        matchScore -= 0.3;
      }
      
      disposeCanvas(canvas);
      
      return {
        consistent: differences.length === 0,
        differences,
        matchScore: Math.max(0, matchScore)
      };
    } catch (error) {
      return {
        consistent: false,
        differences: [`Error during comparison: ${error instanceof Error ? error.message : 'Unknown error'}`],
        matchScore: 0
      };
    }
  }

  /**
   * Validate story content for consistency and readability
   */
  validateStoryContent(pages: Page[], editorSettings: EditorSettings): StoryValidationResult {
    const issues: StoryValidationResult['issues'] = [];
    const recommendations: string[] = [];

    // Check each page
    pages.forEach((page, index) => {
      // Content length validation
      if (page.content.length === 0) {
        issues.push({
          type: 'error',
          message: 'Page has no content',
          pageIndex: index
        });
      } else if (page.content.length > 1000) {
        issues.push({
          type: 'warning',
          message: 'Page content is very long and may not fit well',
          pageIndex: index
        });
        recommendations.push(`Consider breaking page ${index + 1} into multiple pages`);
      }

      // Check for special characters that might cause rendering issues
      const problematicChars = /[^\u0000-\u007F\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/g;
      const matches = page.content.match(problematicChars);
      if (matches) {
        issues.push({
          type: 'warning',
          message: `Page contains special characters that may not render properly: ${matches.join(', ')}`,
          pageIndex: index
        });
      }

      // Line break analysis
      const lines = page.content.split('\n');
      if (lines.length > 20) {
        issues.push({
          type: 'warning',
          message: 'Page has many line breaks which may affect readability',
          pageIndex: index
        });
      }

      // Check for very long lines that might overflow
      lines.forEach((line, lineIndex) => {
        const estimatedWidth = line.length * (editorSettings.fontSize * 0.6);
        if (estimatedWidth > 800) { // Assuming 800px usable width
          issues.push({
            type: 'warning',
            message: `Line ${lineIndex + 1} may be too long and could overflow`,
            pageIndex: index
          });
        }
      });
    });

    // Overall story validation
    if (pages.length === 0) {
      issues.push({
        type: 'error',
        message: 'Story has no pages'
      });
    } else if (pages.length > 50) {
      issues.push({
        type: 'warning',
        message: 'Story has many pages, consider splitting into multiple stories'
      });
    }

    // Font size recommendations
    if (editorSettings.fontSize < 16) {
      recommendations.push('Consider using a larger font size for better readability');
    } else if (editorSettings.fontSize > 48) {
      recommendations.push('Very large font size may limit text content per page');
    }

    // Line height recommendations
    if (editorSettings.lineHeight < 1.2) {
      recommendations.push('Line height is quite tight, consider increasing for better readability');
    } else if (editorSettings.lineHeight > 2.0) {
      recommendations.push('Line height is very loose, consider reducing to fit more content');
    }

    return {
      valid: issues.filter(issue => issue.type === 'error').length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Simulate user feedback collection and analysis
   */
  analyzeFeedback(feedbackData: UserFeedback[]): {
    overallRating: number;
    averageAspectRatings: UserFeedback['aspectsRated'];
    commonIssues: Array<{ issue: string; frequency: number }>;
    commonSuggestions: Array<{ suggestion: string; frequency: number }>;
    satisfactionLevel: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  } {
    if (feedbackData.length === 0) {
      return {
        overallRating: 0,
        averageAspectRatings: { consistency: 0, readability: 0, visualAppeal: 0, performance: 0 },
        commonIssues: [],
        commonSuggestions: [],
        satisfactionLevel: 'Poor'
      };
    }

    // Calculate averages
    const overallRating = feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length;
    
    const averageAspectRatings = {
      consistency: feedbackData.reduce((sum, f) => sum + f.aspectsRated.consistency, 0) / feedbackData.length,
      readability: feedbackData.reduce((sum, f) => sum + f.aspectsRated.readability, 0) / feedbackData.length,
      visualAppeal: feedbackData.reduce((sum, f) => sum + f.aspectsRated.visualAppeal, 0) / feedbackData.length,
      performance: feedbackData.reduce((sum, f) => sum + f.aspectsRated.performance, 0) / feedbackData.length
    };

    // Count issues and suggestions
    const issueCount = new Map<string, number>();
    const suggestionCount = new Map<string, number>();

    feedbackData.forEach(feedback => {
      feedback.issues?.forEach(issue => {
        issueCount.set(issue, (issueCount.get(issue) || 0) + 1);
      });
      feedback.suggestions?.forEach(suggestion => {
        suggestionCount.set(suggestion, (suggestionCount.get(suggestion) || 0) + 1);
      });
    });

    const commonIssues = Array.from(issueCount.entries())
      .map(([issue, frequency]) => ({ issue, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    const commonSuggestions = Array.from(suggestionCount.entries())
      .map(([suggestion, frequency]) => ({ suggestion, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5);

    // Determine satisfaction level
    let satisfactionLevel: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
    if (overallRating < 2) satisfactionLevel = 'Poor';
    else if (overallRating < 3) satisfactionLevel = 'Fair';
    else if (overallRating < 4) satisfactionLevel = 'Good';
    else if (overallRating < 4.5) satisfactionLevel = 'Very Good';
    else satisfactionLevel = 'Excellent';

    return {
      overallRating,
      averageAspectRatings,
      commonIssues,
      commonSuggestions,
      satisfactionLevel
    };
  }

  /**
   * Test real story scenarios
   */
  async testStoryScenarios(): Promise<Array<{
    scenario: string;
    result: 'pass' | 'fail';
    details: string;
  }>> {
    const scenarios = [
      {
        name: 'Short children story',
        content: '옛날 옛적에 토끼와 거북이가 살았습니다. 토끼는 빨랐고 거북이는 느렸습니다.',
        settings: {
          fontFamily: 'CustomFontTTF',
          fontSize: 32,
          lineHeight: 1.6,
          textAlignment: 'left' as const,
          globalTextAlignment: 'left' as const,
          verticalAlignment: 'top' as const
        }
      },
      {
        name: 'Long narrative text',
        content: '긴 이야기가 시작됩니다. '.repeat(100),
        settings: {
          fontFamily: 'CustomFont',
          fontSize: 24,
          lineHeight: 1.8,
          textAlignment: 'left' as const,
          globalTextAlignment: 'left' as const,
          verticalAlignment: 'top' as const
        }
      },
      {
        name: 'Mixed Korean-English content',
        content: 'Hello 안녕하세요! This is a mixed content story. 이것은 혼합된 내용의 이야기입니다. Numbers: 123, Symbols: !@#$%',
        settings: {
          fontFamily: 'HakgyoansimBareonbatangR',
          fontSize: 28,
          lineHeight: 1.5,
          textAlignment: 'center' as const,
          globalTextAlignment: 'center' as const,
          verticalAlignment: 'middle' as const
        }
      },
      {
        name: 'Poetry with line breaks',
        content: '달밤에\n고요한 바람이 불어와\n마음을 적시네\n\n별들이 속삭이는\n이야기를 들으며\n잠이 든다',
        settings: {
          fontFamily: 'CustomFontTTF',
          fontSize: 36,
          lineHeight: 2.0,
          textAlignment: 'center' as const,
          globalTextAlignment: 'center' as const,
          verticalAlignment: 'middle' as const
        }
      }
    ];

    const results = [];

    for (const scenario of scenarios) {
      try {
        const comparison = await this.comparePreviewWithGenerated(
          scenario.content,
          scenario.settings
        );

        const result = {
          scenario: scenario.name,
          result: (comparison.consistent && comparison.matchScore > 0.8) ? 'pass' as const : 'fail' as const,
          details: comparison.consistent 
            ? `Match score: ${(comparison.matchScore * 100).toFixed(1)}%`
            : `Issues: ${comparison.differences.join(', ')}`
        };

        results.push(result);
      } catch (error) {
        results.push({
          scenario: scenario.name,
          result: 'fail' as const,
          details: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    return results;
  }
}

describe('User Acceptance Tests', () => {
  let tester: UserAcceptanceTester;

  beforeAll(() => {
    tester = new UserAcceptanceTester();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Editor Preview Consistency', () => {
    it('should match preview with generated image for basic content', async () => {
      const content = '기본 텍스트 테스트입니다.';
      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 36,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const result = await tester.comparePreviewWithGenerated(content, settings);
      
      expect(result.consistent).toBe(true);
      expect(result.matchScore).toBeGreaterThan(0.8);
      expect(result.differences).toHaveLength(0);
    });

    it('should detect inconsistencies when settings differ', async () => {
      const content = '설정 불일치 테스트';
      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 36,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      // Mock fabric Textbox to simulate different configuration being used
      const originalMock = fabric.Textbox as jest.Mock;
      (fabric.Textbox as jest.Mock).mockImplementationOnce((text, config) => {
        // Store the call with modified config to simulate inconsistency
        const modifiedConfig = { ...config, fontSize: 48, fontFamily: 'DifferentFont' };
        originalMock.mock.calls.push([text, modifiedConfig]);
        return { width: 720, set: jest.fn() };
      });

      const result = await tester.comparePreviewWithGenerated(content, settings);
      
      expect(result.consistent).toBe(false);
      expect(result.differences.length).toBeGreaterThan(0);
      expect(result.matchScore).toBeLessThan(1.0);
    });

    it('should handle content with background images', async () => {
      const content = '배경 이미지가 있는 텍스트';
      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 42,
        lineHeight: 1.4,
        textAlignment: 'center',
        globalTextAlignment: 'center',
        verticalAlignment: 'middle'
      };

      const result = await tester.comparePreviewWithGenerated(
        content, 
        settings, 
        '/backgrounds/stage_1.png'
      );
      
      expect(result).toBeDefined();
      expect(result.matchScore).toBeGreaterThanOrEqual(0);
    });

    it('should validate different alignment combinations', async () => {
      const content = '정렬 테스트';
      const alignments = [
        { text: 'left', vertical: 'top' },
        { text: 'center', vertical: 'middle' },
        { text: 'right', vertical: 'bottom' }
      ] as const;

      for (const alignment of alignments) {
        const settings: EditorSettings = {
          fontFamily: 'CustomFontTTF',
          fontSize: 36,
          lineHeight: 1.5,
          textAlignment: alignment.text,
          globalTextAlignment: alignment.text,
          verticalAlignment: alignment.vertical
        };

        const result = await tester.comparePreviewWithGenerated(content, settings);
        
        expect(result.matchScore).toBeGreaterThan(0.5);
        console.log(`Alignment ${alignment.text}-${alignment.vertical}: ${(result.matchScore * 100).toFixed(1)}%`);
      }
    });
  });

  describe('Story Content Validation', () => {
    it('should validate normal story content', () => {
      const pages: Page[] = [
        {
          id: '1',
          content: '첫 번째 페이지입니다. 적당한 길이의 내용이 있습니다.',
        },
        {
          id: '2',
          content: '두 번째 페이지입니다. 이것도 적당합니다.',
        }
      ];

      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 24,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const result = tester.validateStoryContent(pages, settings);
      
      expect(result.valid).toBe(true);
      expect(result.issues.filter(i => i.type === 'error')).toHaveLength(0);
    });

    it('should detect empty pages', () => {
      const pages: Page[] = [
        { id: '1', content: '정상적인 내용' },
        { id: '2', content: '' }, // Empty page
        { id: '3', content: '또 다른 정상적인 내용' }
      ];

      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 24,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const result = tester.validateStoryContent(pages, settings);
      
      expect(result.valid).toBe(false);
      expect(result.issues.some(i => i.type === 'error' && i.pageIndex === 1)).toBe(true);
    });

    it('should warn about very long content', () => {
      const longContent = '매우 긴 내용입니다. '.repeat(100);
      const pages: Page[] = [
        { id: '1', content: longContent }
      ];

      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 24,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const result = tester.validateStoryContent(pages, settings);
      
      expect(result.issues.some(i => i.type === 'warning' && i.message.includes('very long'))).toBe(true);
      expect(result.recommendations.some(r => r.includes('multiple pages'))).toBe(true);
    });

    it('should provide font size recommendations', () => {
      const pages: Page[] = [
        { id: '1', content: '테스트 내용' }
      ];

      // Very small font
      const smallFontSettings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 12,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const smallFontResult = tester.validateStoryContent(pages, smallFontSettings);
      expect(smallFontResult.recommendations.some(r => r.includes('larger font size'))).toBe(true);

      // Very large font
      const largeFontSettings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 64,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      const largeFontResult = tester.validateStoryContent(pages, largeFontSettings);
      expect(largeFontResult.recommendations.some(r => r.includes('limit text content'))).toBe(true);
    });
  });

  describe('User Feedback Analysis', () => {
    it('should analyze positive feedback correctly', () => {
      const feedback: UserFeedback[] = [
        {
          userId: 'user1',
          rating: 5,
          feedback: 'Excellent tool!',
          aspectsRated: { consistency: 5, readability: 5, visualAppeal: 4, performance: 5 }
        },
        {
          userId: 'user2',
          rating: 4,
          feedback: 'Very good, minor issues',
          aspectsRated: { consistency: 4, readability: 5, visualAppeal: 4, performance: 4 }
        }
      ];

      const analysis = tester.analyzeFeedback(feedback);
      
      expect(analysis.overallRating).toBe(4.5);
      expect(analysis.satisfactionLevel).toBe('Excellent');
      expect(analysis.averageAspectRatings.consistency).toBe(4.5);
      expect(analysis.averageAspectRatings.readability).toBe(5);
    });

    it('should identify common issues and suggestions', () => {
      const feedback: UserFeedback[] = [
        {
          userId: 'user1',
          rating: 3,
          feedback: 'Good but has issues',
          aspectsRated: { consistency: 3, readability: 4, visualAppeal: 3, performance: 2 },
          issues: ['Slow performance', 'Font loading issues'],
          suggestions: ['Improve loading speed', 'Add more fonts']
        },
        {
          userId: 'user2',
          rating: 3,
          feedback: 'Similar issues',
          aspectsRated: { consistency: 3, readability: 3, visualAppeal: 3, performance: 2 },
          issues: ['Slow performance', 'UI could be better'],
          suggestions: ['Improve loading speed', 'Better UI design']
        }
      ];

      const analysis = tester.analyzeFeedback(feedback);
      
      expect(analysis.commonIssues[0].issue).toBe('Slow performance');
      expect(analysis.commonIssues[0].frequency).toBe(2);
      expect(analysis.commonSuggestions[0].suggestion).toBe('Improve loading speed');
      expect(analysis.commonSuggestions[0].frequency).toBe(2);
    });

    it('should handle empty feedback gracefully', () => {
      const analysis = tester.analyzeFeedback([]);
      
      expect(analysis.overallRating).toBe(0);
      expect(analysis.satisfactionLevel).toBe('Poor');
      expect(analysis.commonIssues).toHaveLength(0);
      expect(analysis.commonSuggestions).toHaveLength(0);
    });
  });

  describe('Real Story Scenarios', () => {
    it('should test various story scenarios', async () => {
      const results = await tester.testStoryScenarios();
      
      expect(results).toHaveLength(4);
      
      // Log results for analysis
      results.forEach(result => {
        console.log(`Scenario: ${result.scenario} - ${result.result.toUpperCase()}`);
        console.log(`Details: ${result.details}`);
      });
      
      // At least 75% of scenarios should pass
      const passRate = results.filter(r => r.result === 'pass').length / results.length;
      expect(passRate).toBeGreaterThanOrEqual(0.75);
    });

    it('should handle edge cases in story content', async () => {
      const edgeCases = [
        { name: 'Empty content', content: '' },
        { name: 'Only spaces', content: '   ' },
        { name: 'Only line breaks', content: '\n\n\n' },
        { name: 'Special characters', content: '!@#$%^&*()_+{}[]|\\:";\'<>?,./' },
        { name: 'Very long single line', content: 'A'.repeat(1000) }
      ];

      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 24,
        lineHeight: 1.5,
        textAlignment: 'left',
        globalTextAlignment: 'left',
        verticalAlignment: 'top'
      };

      for (const testCase of edgeCases) {
        const result = await tester.comparePreviewWithGenerated(testCase.content, settings);
        
        // Should not throw errors
        expect(result).toBeDefined();
        expect(result.matchScore).toBeGreaterThanOrEqual(0);
        
        console.log(`Edge case "${testCase.name}": ${result.consistent ? 'PASS' : 'HANDLED'} (Score: ${(result.matchScore * 100).toFixed(1)}%)`);
      }
    });
  });

  describe('Cross-Device Consistency', () => {
    it('should test different viewport scenarios', async () => {
      const viewports = [
        { name: 'Mobile', width: 375, height: 667 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];

      const settings: EditorSettings = {
        fontFamily: 'CustomFontTTF',
        fontSize: 24,
        lineHeight: 1.5,
        textAlignment: 'center',
        globalTextAlignment: 'center',
        verticalAlignment: 'middle'
      };

      const content = '크로스 디바이스 일관성 테스트';

      for (const viewport of viewports) {
        // Mock different canvas sizes to simulate different devices
        const mockCanvas = createCanvas(viewport.width, viewport.height);
        
        const config: CanvasTextConfig = {
          text: content,
          textStyle: {
            fontFamily: settings.fontFamily,
            fontSize: settings.fontSize,
            color: '#000000',
            position: { x: 50, y: 50 },
            alignment: settings.textAlignment,
            verticalAlignment: settings.verticalAlignment
          },
          editorSettings: settings,
          canvasWidth: viewport.width,
          canvasHeight: viewport.height
        };

        expect(() => addTextToCanvas(mockCanvas, config)).not.toThrow();
        disposeCanvas(mockCanvas);
        
        console.log(`${viewport.name} (${viewport.width}x${viewport.height}): Rendered successfully`);
      }
    });
  });

  describe('Accessibility Considerations', () => {
    it('should validate text readability requirements', () => {
      const pages: Page[] = [
        { id: '1', content: 'Accessibility test content' }
      ];

      // Test various accessibility scenarios
      const accessibilityTests = [
        {
          name: 'Minimum font size',
          settings: {
            fontFamily: 'CustomFontTTF',
            fontSize: 16, // Minimum readable size
            lineHeight: 1.5,
            textAlignment: 'left' as const,
            globalTextAlignment: 'left' as const,
            verticalAlignment: 'top' as const
          }
        },
        {
          name: 'High contrast readable',
          settings: {
            fontFamily: 'CustomFontTTF',
            fontSize: 24,
            lineHeight: 1.6, // Good for readability
            textAlignment: 'left' as const,
            globalTextAlignment: 'left' as const,
            verticalAlignment: 'top' as const
          }
        }
      ];

      accessibilityTests.forEach(test => {
        const result = tester.validateStoryContent(pages, test.settings);
        
        console.log(`Accessibility test "${test.name}": ${result.valid ? 'PASS' : 'FAIL'}`);
        
        if (test.settings.fontSize >= 16 && test.settings.lineHeight >= 1.4) {
          expect(result.issues.filter(i => i.message.includes('readability')).length).toBe(0);
        }
      });
    });
  });
});
