# Zamong Text Editor - Story to Instagram

A Next.js application that transforms your stories, poems, and essays into beautiful Instagram post images. Authors can write their content with rich text formatting, automatically split it into sections, choose background images, customize text styling, and export everything as Instagram-ready images.

## Features

- **Rich Text Editor**: Write with bold, italic, and paragraph formatting using Tiptap
- **Automatic Section Splitting**: Smart paragraph-based section detection with manual adjustment
- **Background Images**: Integration with Unsplash API plus custom image upload
- **Text Styling**: Comprehensive text customization (fonts, colors, sizes, positioning)
- **Instagram Optimization**: Generate images in perfect Instagram dimensions (1:1 and 4:5 ratios)
- **Batch Export**: Download all images as a ZIP file with proper naming conventions

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Rich Text**: Tiptap
- **Image Generation**: HTML5 Canvas + Fabric.js
- **State Management**: Zustand
- **File Processing**: JSZip
- **Image Source**: Unsplash API

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Unsplash API key (free at [unsplash.com/developers](https://unsplash.com/developers))

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd zamong_texteditor
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Unsplash API key:
   ```
   UNSPLASH_ACCESS_KEY=your_actual_unsplash_access_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Step 1: Author Information
- Enter your name and story title
- This information will be used for file naming

### Step 2: Write Your Story
- Use the rich text editor to write your content
- Apply formatting (bold, italic) as needed
- The editor supports paragraphs and line breaks
- **Page Management Features:**
  - **Automatic pagination**: Content automatically splits into pages when reaching line limits
  - **Manual page breaks**: Insert page breaks at any position using the "Insert Page Break" button or `Ctrl+Enter`
  - **Page navigation**: Use Previous/Next buttons or click page numbers to navigate
  - **Keyboard shortcuts**: 
    - `Ctrl+←`: Previous page
    - `Ctrl+→`: Next page  
    - `Ctrl+Enter`: Insert page break at cursor position
    - `Ctrl+Shift+N`: Add new empty page
  - **Visual indicators**: Real-time line count, page limits, and content warnings
  - **Line break preservation**: All line breaks and paragraph formatting are preserved during page operations

### Step 3: Manage Sections
- Review automatically suggested section breaks
- Add or remove section breaks manually
- Each section becomes one Instagram post

### Step 4: Choose Backgrounds
- Browse Unsplash photos or upload your own images
- Select a background for each section
- Search for specific themes (nature, abstract, etc.)

### Step 5: Generate Images
- Customize text styling for each section:
  - Font family and size
  - Text color and alignment
  - Position on the image
- Preview each image in real-time
- Choose between square (1:1) or portrait (4:5) formats
- Generate all images and download as ZIP

## File Naming Convention

- **Individual images**: `[Title]_[Page Number].jpg`
- **ZIP file**: `[Author Name]_[Title].zip`

Example:
- Author: "John Doe"
- Title: "My Amazing Story"
- ZIP: `John_Doe_My_Amazing_Story.zip`
- Images: `My_Amazing_Story_1.jpg`, `My_Amazing_Story_2.jpg`, etc.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/unsplash/      # Unsplash API integration
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main application
├── components/
│   ├── ui/                # Reusable UI components
│   ├── editor/            # Text editor components
│   ├── canvas/            # Image generation components
│   ├── background/        # Background selection
│   └── layout/            # Layout components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── store/                 # Zustand state management
└── types/                 # TypeScript type definitions
```

## Development

### Adding New Fonts

Edit `src/lib/constants.ts` and add to the `AVAILABLE_FONTS` array:

```typescript
export const AVAILABLE_FONTS = [
  'Arial',
  'Your New Font',
  // ... other fonts
] as const;
```

### Customizing Instagram Dimensions

Modify `src/lib/constants.ts`:

```typescript
export const INSTAGRAM_DIMENSIONS = {
  SQUARE: { width: 1080, height: 1080 },
  PORTRAIT: { width: 1080, height: 1350 },
  // Add new dimensions here
} as const;
```

### Environment Variables

- `UNSPLASH_ACCESS_KEY`: Your Unsplash API access key

## Building for Production

```bash
npm run build
npm run start
```

## Deployment

This application can be deployed to any platform that supports Next.js:

- **Vercel** (recommended): Automatic deployment with git integration
- **Netlify**: Static site generation support
- **Railway/Render**: Full-stack deployment options

Make sure to set the `UNSPLASH_ACCESS_KEY` environment variable in your deployment platform.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Unsplash](https://unsplash.com) for providing beautiful, free images
- [Tiptap](https://tiptap.dev) for the excellent rich text editor
- [Fabric.js](http://fabricjs.com) for powerful canvas manipulation
- [Shadcn/ui](https://ui.shadcn.com) for beautiful UI components
