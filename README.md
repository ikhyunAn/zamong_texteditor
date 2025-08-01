# Zamong Text Editor

## Project Description
Zamong Text Editor is a cutting-edge tool designed for transforming stories into engaging storycards. It offers a seamless experience for authors to create, customize, and export their narrative work with ease.

## Features
- **Author Information Form**: A dedicated section for authors to input their personal and professional details.
- **Paginated Text Editor**: A feature-rich editor with rich text formatting capabilities, allowing for paginated content creation.
- **Batch Image Generation**: Create a series of images with custom backgrounds to enhance the storytelling experience.
- **Font Customization Support**: Easily customize fonts to match the style and tone of the story.
- **Export Functionality**: Export finished storycards in various formats for sharing and distribution.

## Tech Stack
- **Next.js 15**: A React-based framework for building web applications.
- **React 18**: A JavaScript library for building user interfaces.
- **TypeScript**: A strongly typed programming language that builds on JavaScript.
- **Tailwind CSS**: A utility-first CSS framework for fast styling.
- **Tiptap**: A headless, framework-agnostic text editor built on ProseMirror.
- **Fabric.js**: A powerful and simple JavaScript HTML5 canvas library.

## Getting Started
To get started with Zamong Text Editor, follow these steps:
1. Clone the repository from GitHub.
2. Navigate to the project directory.
3. Install the dependencies using `npm install`.
4. Start the development server with `npm run dev`.

## Project Structure
- **/src**: Contains the main source code.
- **/public**: Static files and assets.
- **/components**: React components used throughout the application.
- **/styles**: Styling files and custom CSS.

## Customization
To add custom fonts and backgrounds:
1. Place your font files in the `/public/fonts` directory.
2. Update the `tailwind.config.js` to include your custom fonts.
3. Add custom backgrounds to the `/public/images` directory.

## Usage Guide
1. Begin by filling out the author information form.
2. Use the paginated text editor to write and format your story.
3. Generate images with your preferred custom backgrounds.
4. Customize fonts as needed to enhance the visual appeal.
5. Export the final storycards for sharing.

## Code Examples

### Custom Font Integration
```javascript
// Add custom fonts to your project
// 1. Place font files in /public/fonts/
// 2. Update tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        'custom': ['CustomFont', 'sans-serif'],
        'story': ['StoryFont', 'serif']
      }
    }
  }
}
```

### Text Editor Customization
```typescript
// Customize the Tiptap editor configuration
const editor = useEditor({
  extensions: [
    StarterKit,
    TextStyle,
    FontFamily.configure({
      types: ['textStyle'],
    }),
  ],
  content: '<p>Start writing your story...</p>',
  editorProps: {
    attributes: {
      class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
    },
  },
})
```

### Background Image Configuration
```javascript
// Configure custom backgrounds for image generation
const backgroundConfig = {
  defaultBackground: '/images/backgrounds/default.jpg',
  customBackgrounds: [
    '/images/backgrounds/vintage.jpg',
    '/images/backgrounds/modern.jpg',
    '/images/backgrounds/nature.jpg'
  ],
  imageSettings: {
    width: 1200,
    height: 800,
    quality: 0.9
  }
}
```

### Story Export Configuration
```typescript
// Export settings for different formats
interface ExportConfig {
  format: 'pdf' | 'image' | 'html';
  options: {
    pageSize?: 'A4' | 'Letter';
    orientation?: 'portrait' | 'landscape';
    includeImages?: boolean;
    fontEmbedding?: boolean;
  };
}

const exportStory = async (config: ExportConfig) => {
  // Export implementation
};
```

By following these steps, you will be able to take full advantage of Zamong Text Editor's powerful features to transform your stories into captivating storycards.

## Documentation

For detailed technical documentation and implementation guides, refer to the following resources:

### Technical Implementation Guides
- **[Font Loading Implementation](docs/FONT_LOADING_IMPLEMENTATION.md)** - Comprehensive guide on font loading mechanisms and implementation details
- **[Line Height Implementation](docs/lineHeight-implementation.md)** - Technical documentation for line height calculations and rendering
- **[Settings Management](docs/settings-management.md)** - Guide for managing application settings and configurations

### Testing and Quality Assurance
- **[Text Editor Fixes Summary](docs/TEXT_EDITOR_FIXES_SUMMARY.md)** - Summary of text editor improvements and bug fixes
- **[Text Rendering Test Summary](docs/TEXT_RENDERING_TEST_SUMMARY.md)** - Test results and validation for text rendering functionality
- **[Content Integrity Snapshot Report](docs/CONTENT_INTEGRITY_SNAPSHOT_REPORT.md)** - Report on content integrity and data validation
- **[First Page Newline Test Summary](docs/FIRST_PAGE_NEWLINE_TEST_SUMMARY.md)** - Testing results for newline handling on first page
- **[Newline Synchronization Fix](docs/NEWLINE_SYNCHRONIZATION_FIX.md)** - Documentation of newline synchronization improvements

### Asset Guidelines
- **[Fonts Directory](public/fonts/README.md)** - Guidelines for font file organization and usage
- **[Backgrounds Directory](public/backgrounds/README.md)** - Guidelines for background image organization and specifications
