export interface StorySection {
  id: string;
  content: string;
  textStyle: TextStyle;
  backgroundImage?: string;
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

export interface Page {
  id: string;
  content: string;
  backgroundTemplate?: BackgroundTemplate;
}

export interface EditorSettings {
  maxLinesPerPage: number;
  fontFamily: string;
}

export interface BackgroundTemplate {
  id: string;
  name: string;
  imageUrl?: string;
  color?: string;
  gradient?: {
    colors: string[];
    direction: 'horizontal' | 'vertical' | 'diagonal';
  };
}

export interface StoryState {
  authorInfo: AuthorInfo;
  content: string;
  sections: StorySection[];
  pages: Page[];
  currentStep: number;
  currentPageIndex: number;
  editorSettings: EditorSettings;
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
