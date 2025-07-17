export interface StorySection {
  id: string;
  content: string;
  backgroundImage?: string;
  textStyle: TextStyle;
}

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  color: string;
  position: TextPosition;
  alignment: 'left' | 'center' | 'right';
}

export interface TextPosition {
  x: number;
  y: number;
}

export interface AuthorInfo {
  name: string;
  title: string;
}

export interface UnsplashImage {
  id: string;
  urls: {
    small: string;
    regular: string;
    full: string;
  };
  alt_description: string;
  user: {
    name: string;
  };
}

export interface StoryState {
  authorInfo: AuthorInfo;
  content: string;
  sections: StorySection[];
  currentStep: number;
}

export interface CanvasSettings {
  width: number;
  height: number;
  format: 'square' | 'portrait';
}

export interface ExportSettings {
  format: 'jpg' | 'png';
  quality: number;
}
