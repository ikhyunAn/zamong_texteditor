# LineHeight Implementation for Text Positioning

## Overview

This document outlines the implementation of proper `lineHeight` calculation for text positioning throughout the text rendering system. The changes ensure that the actual line spacing is calculated using `fontSize * lineHeight` and properly applied to y-coordinate calculations for consecutive lines.

## Changes Made

### 1. Web Worker (`src/workers/export.worker.ts`)

**Updates:**
- Added `lineHeight: number` to the `ExportTask` interface
- Updated text style configuration to prioritize `editorSettings.lineHeight` over `textStyle.lineHeight`
- Modified y-coordinate calculation to use `actualLineSpacing = fontSize * lineHeight`
- Implemented proper line spacing between consecutive lines

**Key Changes:**
```typescript
// Before
const lineHeight = task.textStyle.lineHeight || 1.6;
y += fontSize * lineHeight;

// After  
const lineHeight = task.editorSettings?.lineHeight || task.textStyle.lineHeight || 1.5;
const actualLineSpacing = fontSize * lineHeight;
y += actualLineSpacing;
```

### 2. Export Utils (`src/lib/export-utils.ts`)

**Updates:**
- Added `editorSettings` parameter to `generateImageWithBackground` function
- Updated title text creation to use `editorSettings.lineHeight` with fallback
- Modified content text creation to respect `editorSettings.lineHeight`
- Updated function signatures throughout the export pipeline

**Key Changes:**
```typescript
// Title text
const titleLineHeight = editorSettings?.lineHeight || 1.8;
lineHeight: titleLineHeight,

// Content text  
lineHeight: editorSettings?.lineHeight || 1.8,
```

### 3. Canvas Utils (`src/lib/canvas-utils.ts`)

**Updates:**
- Updated `calculateOptimalFontSize` to accept custom `lineHeight` parameter
- Modified height calculation to use `actualLineSpacing = fontSize * lineHeight`
- Ensured consistent line spacing calculation throughout the function

**Key Changes:**
```typescript
export function calculateOptimalFontSize(
  text: string,
  maxWidth: number,
  maxHeight: number,
  minFontSize: number = 16,
  maxFontSize: number = 72,
  lineHeight: number = 1.8  // New parameter
): number {
  // Calculate actual line spacing using fontSize * lineHeight
  const actualLineSpacing = fontSize * lineHeight;
  const totalHeight = lines.length * actualLineSpacing;
}
```

### 4. Image Generator (`src/components/canvas/ImageGenerator.tsx`)

**Updates:**
- Fixed fallback text rendering to properly calculate line spacing
- Updated both error fallback scenarios to use `fontSize * lineHeight`
- Ensured consistent spacing between error message lines   

**Key Changes:**
```typescript
// Calculate line spacing using fontSize * lineHeight
const lineSpacing = editorSettings.fontSize * editorSettings.lineHeight;
const halfLineSpacing = lineSpacing / 2;

ctx.fillText('Preview unavailable', width / 2, height / 2 - halfLineSpacing);
ctx.fillText('Canvas failed to load', width / 2, height / 2 + halfLineSpacing);
```

## Implementation Details

### Line Spacing Calculation

The core formula used throughout the system:
```typescript
const actualLineSpacing = fontSize * lineHeight;
```

This ensures:
- **Consistent spacing**: All text rendering uses the same calculation method
- **Proper positioning**: Each line is positioned with correct vertical spacing
- **Scalable text**: Spacing scales proportionally with font size

### Fallback Values

Default lineHeight values used when not specified:
- **Fabric.js Textbox**: Uses `editorSettings.lineHeight` (from store)
- **Manual canvas rendering**: Falls back to `1.8` if not available
- **Export worker**: Uses `1.8` as ultimate fallback
- **Title text**: Uses `1.8` for consistent spacing

### Priority Order

The system respects the following priority for lineHeight values:
1. `editorSettings.lineHeight` (from global editor settings)
2. `textStyle.lineHeight` (from individual text style)
3. Default fallback values (1.8 for both content and titles)

## Testing

Added comprehensive tests in `src/lib/__tests__/lineHeight-implementation.test.ts`:
- ✅ Custom lineHeight calculation
- ✅ Default lineHeight fallback behavior  
- ✅ Different lineHeight values comparison
- ✅ Line spacing formula consistency
- ✅ Edge case handling
- ✅ Text wrapping integration

## Verification

To verify the implementation works correctly:

1. **Visual Check**: Text spacing should be consistent across all rendering contexts
2. **Line Spacing**: Consecutive lines should have proper vertical spacing
3. **Settings Integration**: Changing `lineHeight` in editor settings should affect all text
4. **Export Consistency**: Exported images should match preview spacing

## Benefits

1. **Consistent Text Rendering**: All text uses the same line spacing calculation
2. **Proper Y-Coordinate Positioning**: Each line is positioned with correct spacing
3. **Settings Respect**: The global `lineHeight` setting is honored throughout
4. **Scalable Spacing**: Line spacing scales properly with font size changes
5. **Error Resilience**: Fallback values ensure text renders even if settings are missing

## Files Modified

- `src/workers/export.worker.ts`
- `src/lib/export-utils.ts` 
- `src/lib/canvas-utils.ts`
- `src/components/canvas/ImageGenerator.tsx`
- `src/lib/__tests__/lineHeight-implementation.test.ts` (new)
- `docs/lineHeight-implementation.md` (new)
