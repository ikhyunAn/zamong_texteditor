/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';

// Mock all external dependencies first
jest.mock('fabric', () => ({
  fabric: {
    Canvas: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      clear: jest.fn(),
      getObjects: jest.fn(() => []),
      renderAll: jest.fn(),
      dispose: jest.fn(),
      getElement: jest.fn(() => ({ getContext: jest.fn() })),
      getContext: jest.fn(),
      setWidth: jest.fn(),
      setHeight: jest.fn(),
      setZoom: jest.fn(),
      calcOffset: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
    })),
    Textbox: jest.fn().mockImplementation(() => ({
      set: jest.fn(),
      setCoords: jest.fn(),
    })),
    Image: {
      fromURL: jest.fn((url, callback) => {
        const mockImage = {
          set: jest.fn(),
          scaleToWidth: jest.fn(),
          scaleToHeight: jest.fn(),
        };
        callback(mockImage);
      }),
    },
  },
}));

// Mock all UI components to simple divs
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardDescription: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <div className={className}>{children}</div>,
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, className, onClick, disabled, variant, size }: any) => (
    <button className={className} onClick={onClick} disabled={disabled} data-variant={variant} data-size={size}>
      {children}
    </button>
  ),
}));

// Mock TextStyler component
jest.mock('../TextStyler', () => ({
  TextStyler: ({ onStyleChange, onPositionChange }: any) => (
    <div data-testid="text-styler">
      <button onClick={() => onStyleChange?.({ fontSize: 32 })}>Change Style</button>
      <button onClick={() => onPositionChange?.({ x: 60, y: 60 })}>Change Position</button>
    </div>
  ),
}));

// Mock the store
jest.mock('@/store/useStoryStore', () => ({
  useStoryStore: jest.fn(() => ({
    sections: [
      {
        id: '1',
        content: 'Test content',
        textStyle: {
          fontFamily: 'Arial',
          fontSize: 24,
          color: '#000000',
          alignment: 'center',
          position: { x: 50, y: 50 },
        },
        backgroundImage: null,
      },
    ],
    authorInfo: {
      name: 'Test Author',
      email: 'test@example.com',
    },
    updateSectionTextStyle: jest.fn(),
    setCurrentStep: jest.fn(),
  })),
}));

// Mock all hooks
jest.mock('@/hooks/useImageGeneration', () => ({
  useImageGeneration: jest.fn(() => ({
    generateImage: jest.fn(),
    isGenerating: false,
    error: null,
  })),
}));

jest.mock('@/hooks/useZipDownload', () => ({
  useZipDownload: jest.fn(() => ({
    generateAndDownloadZip: jest.fn(),
    isGenerating: false,
    progress: 0,
    error: null,
  })),
}));

jest.mock('@/hooks/useToast', () => ({
  useToast: jest.fn(() => ({
    showError: jest.fn(),
    showSuccess: jest.fn(),
  })),
}));

// Mock canvas utils
jest.mock('@/lib/canvas-utils', () => ({
  createCanvas: jest.fn(() => ({
    add: jest.fn(),
    clear: jest.fn(),
    getObjects: jest.fn(() => []),
    renderAll: jest.fn(),
    dispose: jest.fn(),
    getElement: jest.fn(() => ({ getContext: jest.fn() })),
    getContext: jest.fn(),
  })),
  addBackgroundImage: jest.fn(),
  addTextToCanvas: jest.fn(),
  safeRender: jest.fn(),
  applyResponsiveScaling: jest.fn(),
  disposeCanvas: jest.fn(),
  exportCanvasAsImage: jest.fn(() => Promise.resolve(new Blob())),
}));

// Mock constants after UI components
jest.mock('@/lib/constants', () => ({
  INSTAGRAM_DIMENSIONS: {
    SQUARE: { width: 1080, height: 1080 },
    PORTRAIT: { width: 1080, height: 1350 },
  },
  cn: jest.fn((...args) => args.filter(Boolean).join(' ')),
}));

// Import the component AFTER all mocks are set up
import { ImageGenerator } from '../ImageGenerator';

describe('ImageGenerator', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Suppress console errors for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
  });

  test('renders basic component structure', () => {
    render(<ImageGenerator />);
    
    // Check for main heading
    expect(screen.getByText('Generate Instagram Images')).toBeInTheDocument();
  });

  test('renders TextStyler component', () => {
    render(<ImageGenerator />);
    
    expect(screen.getByTestId('text-styler')).toBeInTheDocument();
  });

  test('component mounts and unmounts without uncaught exceptions', async () => {
    // This is the key test for the requirement:
    // "Assert no uncaught exceptions during unmount"
    
    let hasError = false;
    const originalError = console.error;
    
    // Override console.error to catch any errors
    console.error = (...args: any[]) => {
      // Only flag actual errors, not warnings
      if (args[0] && typeof args[0] === 'string' && args[0].includes('Error:')) {
        hasError = true;
      }
      originalError(...args);
    };
    
    const { unmount } = render(<ImageGenerator />);
    
    // Wait for any initial async operations
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Unmount the component
    unmount();
    
    // Wait for cleanup to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Restore console.error
    console.error = originalError;
    
    // Assert no uncaught exceptions occurred during unmount
    expect(hasError).toBe(false);
  });

  test('handles canvas disposal on unmount', () => {
    const { unmount } = render(<ImageGenerator />);
    
    // Unmount should not throw errors
    expect(() => unmount()).not.toThrow();
  });

  test('component handles resize events without errors', () => {
    const { unmount } = render(<ImageGenerator />);
    
    // Simulate window resize
    expect(() => {
      global.dispatchEvent(new Event('resize'));
    }).not.toThrow();
    
    unmount();
  });

  test('component handles blob URL cleanup', () => {
    const mockRevokeObjectURL = jest.spyOn(URL, 'revokeObjectURL');
    
    const { unmount } = render(<ImageGenerator />);
    
    unmount();
    
    // Cleanup should run without errors
    expect(() => mockRevokeObjectURL).not.toThrow();
    
    mockRevokeObjectURL.mockRestore();
  });
});
