# Trailing Whitespace Line Break Bug Fix

**Date**: December 21, 2025  
**File**: `src/components/canvas/BatchImageGenerator.tsx`  
**Function**: `wrapTextUsingDOM()`

## Bug Description

When generating images from editor content, extra blank lines were appearing in the rendered canvas output when text lines contained trailing whitespace (e.g., "못 피어나듯이 " with a trailing space).

### Symptoms
- Generated images had more lines than the editor displayed
- Extra line breaks appeared after words with trailing spaces
- The bug was particularly noticeable with Korean text where spaces between sentences could cause unexpected wrapping

### Example
**Input text in editor:**
```
계십니다. 위에 이네들은 가득 까닭입니다. 못 피어나듯이 아름다운...
```

**Expected rendering:** Text wraps naturally based on container width  
**Actual rendering:** Extra blank line appeared after "못 피어나듯이 "

## Root Cause Analysis

The image generation pipeline works as follows:

1. **DOM Measurement** (`wrapTextUsingDOM`): Creates an offscreen DOM container that mirrors the editor's CSS properties, then measures where visual line breaks occur
2. **Line Assembly**: Joins measured lines with sentinel characters (`\u2028`) to mark soft wraps
3. **Sentinel Conversion**: Converts sentinels to actual newlines (`\n`)
4. **Fabric.js Rendering**: Passes the wrapped text to Fabric.js `Textbox` for canvas rendering

### The Problem

When a line ended with trailing whitespace (e.g., "못 피어나듯이 "):

1. DOM measurement correctly detected the line break position
2. The trailing space was preserved: `"못 피어나듯이 \n아름다운..."`
3. Fabric.js Textbox, with `splitByGrapheme: true` and a fixed `width`, has its own internal wrapping logic
4. Fabric.js would render the trailing space, and the explicit `\n` would create an additional line break
5. This resulted in a "double break" effect - one from the space pushing content, one from the newline

## Solution

Strip trailing whitespace from each line **after** DOM measurement but **before** passing to Fabric.js.

### Code Change

In `wrapTextUsingDOM()`, after converting sentinels to newlines:

```javascript
// Convert remaining sentinel soft wraps to real newlines
let rewrapped = joined.split(SOFT).join('\n');

// FIX: Strip trailing whitespace from each line before passing to Fabric.js
// This prevents trailing spaces from interfering with Fabric.js's own text rendering
// The DOM measurement already determined correct line breaks, trailing spaces are not needed
rewrapped = rewrapped.split('\n').map(line => line.trimEnd()).join('\n');

cache.set(cacheKey, rewrapped);
return rewrapped;
```

### Why This Works

| Step | Before Fix | After Fix |
|------|------------|-----------|
| DOM Measurement | `["못 피어나듯이 ", "아름다운..."]` | Same |
| Sentinel Join | `"못 피어나듯이 \u2028아름다운..."` | Same |
| Newline Conversion | `"못 피어나듯이 \n아름다운..."` | `"못 피어나듯이\n아름다운..."` |
| Fabric.js Render | Extra line break | Correct line break |

## Design Considerations

### Why Not Modify Editor Content?

Users can switch between the editor and the image generator. Modifying the stored content (removing trailing spaces) would:
- Create inconsistencies between what users type and what's stored
- Potentially lose intentional spacing
- Break the "what you see is what you get" principle

### Why Strip in Output Only?

The fix applies only to the **canvas rendering output**, not the source content:
- ✅ Editor content remains exactly as typed
- ✅ DOM measurement uses original content for accurate line break detection
- ✅ Only the final canvas output has trailing spaces removed
- ✅ Trailing spaces are visually insignificant at line ends anyway

## Testing

To verify the fix:

1. Enter Korean text with trailing spaces (e.g., "단어 " with space after)
2. Ensure the text is long enough to cause line wrapping
3. Generate image preview
4. Confirm that no extra blank lines appear
5. Verify that line breaks match the editor display

## Related Files

- `src/components/canvas/BatchImageGenerator.tsx` - Main fix location
- `src/components/editor/PaginatedEditor.tsx` - Editor component (unchanged)
