declare module 'fabric' {
  interface FabricObject {
    type?: string;
    [key: string]: unknown;
  }
  
  interface FabricCanvas {
    getObjects(): FabricObject[];
    add(object: FabricObject): void;
    clear(): void;
    dispose(): void;
    renderAll(): void;
    [key: string]: unknown;
  }
  
  export const fabric: {
    Canvas: new (element: HTMLCanvasElement | string, options?: unknown) => FabricCanvas;
    Image: {
      fromURL: (url: string, callback: (img: FabricObject) => void, options?: unknown) => void;
      fromURL: (url: string, options: unknown, callback: (img: FabricObject) => void) => void;
    };
    Textbox: new (text: string, options?: unknown) => FabricObject;
    [key: string]: unknown;
  };
}

// Extend HTMLCanvasElement to include fabric property
declare global {
  interface HTMLCanvasElement {
    __fabric?: {
      dispose?: () => void;
      [key: string]: unknown;
    };
  }
}
