# Custom Fonts Directory

Place your custom font files (.otf or .ttf) in this directory to use them in the text editor.

## Supported Formats:

- `.otf` (OpenType Font)
- `.ttf` (TrueType Font)

## How to Add Custom Fonts:

1. Place your font files in this directory (`public/fonts/`)
2. Update the `AVAILABLE_FONTS` array in `/src/lib/constants.ts` to include your fonts:

```typescript
{
  name: 'Your Font Name',
  family: 'YourFontFamily',
  path: '/fonts/your-font-file.otf',
  type: 'custom' as const
}
```

3. The font will appear in the font selection dropdown in the editor

## Note:

The application includes several system fonts by default. Custom fonts are only needed if you want to use specific branded or unique typefaces.
