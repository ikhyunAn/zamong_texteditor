declare module 'fabric' {
  export const fabric: any;
}

// Extend HTMLCanvasElement to include fabric property
declare global {
  interface HTMLCanvasElement {
    __fabric?: any;
  }
}
