# Dynamic Text Overflow Detection — Implementation Plan (Planned)

## Overview

This document outlines the implementation plan for dynamic text overflow detection in the Zamong Text Editor. The goal is to provide real-time feedback to users when their text content exceeds the visible area that will appear in the generated preview images.

## Current Problem

The text editor currently allows users to type beyond the visual constraints that will be rendered in the preview images. This creates a disconnect between what users see in the editor and what appears in the final exported images, particularly on the title page where space is more limited due to the title area.

## Solution Approach

### 1. Dynamic Height Calculation

**Current Implementation:**
- The editor dynamically calculates available text height based on page type (title page vs. regular page)
- Uses fixed constraints from image generation constants (`CANVAS_HEIGHT = 1600px`, `MARGIN = 80px`)
- Applies `overflow: hidden` to clip content beyond the calculated height

**Enhancement Plan:**
Implement real-time measurement of actual text content height against the calculated available space.

### 2. Text Content Measurement

#### 2.1 Measuring Rendered Text Height

```typescript
interface TextMeasurement {
  contentHeight: number;
  availableHeight: number;
  isOverflowing: boolean;
  overflowAmount: number;
}

const measureTextContent = (
  editorElement: HTMLElement,
  availableHeight: number
): TextMeasurement => {
  // Get the actual scrollHeight of the content
  const contentHeight = editorElement.scrollHeight;
  
  return {
    contentHeight,
    availableHeight,
    isOverflowing: contentHeight > availableHeight,
    overflowAmount: Math.max(0, contentHeight - availableHeight)
  };
};
```

#### 2.2 Integration with PaginatedEditor

Add measurement logic to the `PaginatedEditor` component:

```typescript
const [overflowState, setOverflowState] = useState<TextMeasurement>({
  contentHeight: 0,
  availableHeight: 0,
  isOverflowing: false,
  overflowAmount: 0
});

// Use ResizeObserver to detect content changes
useEffect(() => {
  const editorElement = editorRef.current?.querySelector('.ProseMirror');
  if (!editorElement) return;

  const resizeObserver = new ResizeObserver(() => {
    const measurement = measureTextContent(editorElement, availableTextHeight);
    setOverflowState(measurement);
  });

  resizeObserver.observe(editorElement);
  
  return () => resizeObserver.disconnect();
}, [availableTextHeight, currentPage]);
```

### 3. User Feedback Mechanisms

#### 3.1 Visual Indicators

**Gradient Overlay Enhancement:**
- Make the gradient overlay more prominent when text is overflowing
- Add a subtle red tint to indicate overflow state
- Animate the gradient to draw attention

```typescript
const gradientOpacity = overflowState.isOverflowing ? 0.8 : 0.3;
const gradientColor = overflowState.isOverflowing 
  ? 'from-transparent via-transparent to-red-100/60' 
  : 'from-transparent via-transparent to-gray-100/30';
```

**Warning Badge Enhancement:**
- Show specific overflow information
- Display amount of overflow text (e.g., "50px of text hidden")
- Add animation when overflow state changes

```typescript
<div className={cn(
  "absolute bottom-2 right-2 px-2 py-1 text-xs rounded-md transition-all",
  overflowState.isOverflowing 
    ? "bg-red-100 text-red-800 border border-red-200" 
    : "bg-gray-100 text-gray-600"
)}>
  {overflowState.isOverflowing 
    ? `${Math.round(overflowState.overflowAmount)}px hidden`
    : "Text fits in image"
  }
</div>
```

#### 3.2 Interactive Features

**Overflow Navigation:**
- Add button to automatically scroll to the overflow point
- Highlight the specific text that won't appear in images

**Smart Truncation Suggestion:**
- Analyze text and suggest natural breaking points
- Offer to automatically trim to fit within image bounds

### 4. Advanced Features

#### 4.1 Line-Level Precision

Enhance measurement to determine exactly which lines are cut off:

```typescript
const getOverflowingLines = (
  editorElement: HTMLElement,
  availableHeight: number
): { totalLines: number; visibleLines: number; hiddenLines: number } => {
  const lineHeight = parseFloat(getComputedStyle(editorElement).lineHeight);
  const totalLines = Math.ceil(editorElement.scrollHeight / lineHeight);
  const visibleLines = Math.floor(availableHeight / lineHeight);
  
  return {
    totalLines,
    visibleLines,
    hiddenLines: Math.max(0, totalLines - visibleLines)
  };
};
```

#### 4.2 Real-time Preview Sync

Implement preview image generation that reflects the exact overflow state:

```typescript
const generatePreviewWithOverflow = async (
  content: string,
  overflowState: TextMeasurement
) => {
  // Generate preview image showing exactly what will be visible
  // Optionally show a "continuation" indicator for overflow content
};
```

#### 4.3 Multi-page Context

For multi-page documents, provide overflow context across pages:

```typescript
interface MultiPageOverflow {
  pageOverflows: Map<number, TextMeasurement>;
  totalOverflowAmount: number;
  affectedPages: number[];
}
```

### 5. Performance Considerations

#### 5.1 Debounced Measurements

Implement debouncing to avoid excessive calculations:

```typescript
const debouncedMeasurement = useMemo(
  () => debounce((element: HTMLElement) => {
    const measurement = measureTextContent(element, availableTextHeight);
    setOverflowState(measurement);
  }, 150),
  [availableTextHeight]
);
```

#### 5.2 Efficient DOM Queries

Cache DOM references and measurements where possible:

```typescript
const measurementCache = useRef(new Map<string, TextMeasurement>());
```

### 6. Testing Strategy

#### 6.1 Unit Tests

- Test text measurement accuracy across different font sizes and line heights
- Verify overflow detection for various content types
- Test performance with large text content

#### 6.2 Integration Tests

- Test editor-to-image consistency
- Verify multi-page overflow handling
- Test responsive behavior with different screen sizes

#### 6.3 User Testing

- Conduct usability testing to ensure warnings are helpful and not intrusive
- Test with different writing workflows
- Gather feedback on visual indicator effectiveness

### 7. Implementation Phases

#### Phase 1: Basic Overflow Detection
- Implement core measurement logic
- Add basic visual indicators
- Test accuracy against image generation

#### Phase 2: Enhanced User Experience
- Add interactive features
- Implement line-level precision
- Add smart suggestions

#### Phase 3: Advanced Features
- Multi-page overflow context
- Real-time preview sync
- Performance optimizations

### 8. Configuration Options

Allow users to customize overflow behavior:

```typescript
interface OverflowSettings {
  showWarnings: boolean;
  warningThreshold: number; // Show warning when X% of available space is used
  autoTruncate: boolean;
  highlightOverflow: boolean;
}
```

## Benefits

1. **User Awareness**: Users immediately know when content exceeds image bounds
2. **Content Quality**: Encourages users to write concise, well-fitted content
3. **Consistency**: Ensures editor and generated images are perfectly aligned
4. **Professional Output**: Reduces likelihood of cut-off text in final images

## Next Steps

1. Implement Phase 1 features
2. Test measurement accuracy across different scenarios
3. Gather user feedback and iterate
4. Expand to advanced features based on usage patterns

This implementation will create a seamless writing experience where users can confidently create content knowing exactly how it will appear in their final exported images.
