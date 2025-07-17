import '@testing-library/jest-dom';

// Mock fabric.js
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

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock canvas.toBlob
HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
  callback(new Blob());
});

// Mock canvas.getContext
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  fillRect: jest.fn(),
  fillText: jest.fn(),
  font: '',
  textAlign: '',
  textBaseline: '',
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock clsx
jest.mock('clsx', () => ({
  clsx: jest.fn((...args) => args.filter(Boolean).join(' ')),
}));

// Mock tailwind-merge
jest.mock('tailwind-merge', () => ({
  twMerge: jest.fn((str) => str),
}));

// Mock the cn utility function from constants
jest.mock('@/lib/constants', () => ({
  ...jest.requireActual('@/lib/constants'),
  cn: jest.fn((...args) => args.filter(Boolean).join(' ')),
}));
