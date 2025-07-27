# Page Management User Guide

## Overview

The Zamong Text Editor provides powerful page management features that allow you to organize your story across multiple pages with precise control over content flow, formatting, and navigation.

## Key Features

### 📄 **Automatic Pagination**
- Your content automatically splits into pages when reaching the line limit (25-40 lines per page depending on settings)
- Line count is displayed in real-time as you type
- Visual warnings appear when approaching page limits

### ✂️ **Manual Page Breaks**
- Insert page breaks at any cursor position
- Preserves all line breaks and paragraph formatting
- Content is intelligently split between pages

### 🧭 **Page Navigation**
- Navigate between pages using buttons or keyboard shortcuts
- Visual page indicators show current position
- Smooth scrolling and focus management

### ⌨️ **Keyboard Shortcuts**
- **`Ctrl+←` (or `Cmd+←` on Mac)**: Navigate to previous page
- **`Ctrl+→` (or `Cmd+→` on Mac)**: Navigate to next page
- **`Ctrl+Enter` (or `Cmd+Enter` on Mac)**: Insert page break at cursor
- **`Ctrl+Shift+N` (or `Cmd+Shift+N` on Mac)**: Add new empty page

### 📊 **Visual Indicators**
- Real-time line count display
- Page limit warnings
- Content overflow indicators
- Page navigation status

## How to Use

### Creating Your First Page

1. **Start Writing**: Begin typing your story in the editor
2. **Monitor Line Count**: Watch the line counter in the bottom-right of the page
3. **Automatic Pagination**: When you reach the line limit, content will automatically flow to the next page

### Using Manual Page Breaks

1. **Position Your Cursor**: Click where you want to insert a page break
2. **Insert Break**: 
   - Click the "Insert Page Break" button, or
   - Press `Ctrl+Enter` (or `Cmd+Enter` on Mac)
3. **Review Result**: Content after the cursor moves to a new page
4. **Success Confirmation**: A green message confirms the page break was inserted

#### Example: Inserting a Page Break

```
Before (cursor at |):
"The sun was setting over the mountains.|The stars began to appear in the twilight sky."

After page break:
Page 1: "The sun was setting over the mountains."
Page 2: "The stars began to appear in the twilight sky."
```

### Navigating Between Pages

#### Using Navigation Buttons
- **Previous Page**: Click the "Previous Page" button (disabled on first page)
- **Next Page**: Click the "Next Page" button (disabled on last page)
- **Page Numbers**: Click any page number to jump directly to that page

#### Using Keyboard Shortcuts
- **Previous**: `Ctrl+←` (Windows/Linux) or `Cmd+←` (Mac)
- **Next**: `Ctrl+→` (Windows/Linux) or `Cmd+→` (Mac)

### Adding New Pages

#### Method 1: Automatic
- Keep typing and pages are created automatically when needed

#### Method 2: Manual
- Click "Add New Page" button
- Press `Ctrl+Shift+N` (or `Cmd+Shift+N` on Mac)
- Navigate to the new empty page

### Understanding Visual Indicators

#### Line Count Display
- **Green**: Plenty of space remaining
- **Orange**: Approaching page limit (5 lines or fewer remaining)
- **Red**: Page limit exceeded

#### Page Statistics
- **Total Pages**: Shows current page count
- **Current Lines**: Lines used on current page
- **Lines Left**: Remaining lines available
- **Character Count**: Total characters on current page

#### Content Warnings

**Line Limit Warning** (Yellow):
```
⚠️ Page line limit reached
Current: 28 lines (max: 25)
Press Enter to continue on the next page.
```

**Page Break Messages**:
- ✅ **Success**: "Page break inserted successfully!"
- ❌ **Error**: "Cannot insert page break on empty page. Add some content first."
- ⚠️ **Limit**: "Cannot insert page break. Maximum of 6 pages allowed."

## Advanced Features

### Line Break Preservation

The editor preserves all your formatting during page operations:

- **Single line breaks** (`Enter` once): Preserved within paragraphs
- **Paragraph breaks** (`Enter` twice): Maintained as separate paragraphs
- **Mixed formatting**: Complex line break patterns are preserved
- **Content integrity**: No text is lost during page operations

### Content Validation

Every page break operation includes validation to ensure:
- No content is lost or duplicated
- Line breaks are preserved correctly
- Page boundaries are maintained
- Content integrity is verified

### Page Limits

- **Maximum pages**: 6 pages per story
- **Lines per page**: 25-40 lines (configurable)
- **Character limits**: Approximately 2000-3000 characters per page
- **Content warnings**: Automatic alerts when approaching limits

## Troubleshooting

### Common Issues

**"Cannot insert page break on empty page"**
- **Cause**: Trying to insert a page break on a page with no content
- **Solution**: Add some text content first, then insert the page break

**"Page break operation failed"**
- **Cause**: Content integrity could not be preserved during splitting
- **Solution**: Try placing the cursor at a different position (avoid mid-word breaks)

**"Maximum of 6 pages allowed"**
- **Cause**: Attempting to create more than 6 pages
- **Solution**: Condense your content or split into multiple stories

**Page navigation not working**
- **Cause**: Editor is not focused or keyboard shortcuts are disabled
- **Solution**: Click in the editor area first, then use keyboard shortcuts

### Performance Tips

1. **Large Content**: For very long stories, consider breaking them into multiple documents
2. **Frequent Saves**: Content is automatically saved as you type
3. **Navigation**: Use keyboard shortcuts for faster navigation
4. **Preview**: Use the page preview to review content before exporting

## Best Practices

### Content Organization
- **Plan ahead**: Consider where natural page breaks should occur
- **Paragraph structure**: Use paragraph breaks to organize content logically
- **Chapter divisions**: Use manual page breaks to separate chapters or sections

### Formatting Guidelines
- **Consistent spacing**: Use double-enters for paragraph breaks
- **Line break intent**: Be intentional about single vs. double line breaks
- **Content flow**: Ensure content reads naturally across page boundaries

### Navigation Efficiency
- **Keyboard shortcuts**: Learn the shortcuts for faster editing
- **Page indicators**: Use page numbers for quick navigation to specific pages
- **Content overview**: Review page statistics to understand document structure

## Technical Details

### Line Counting Algorithm
- Accounts for text wrapping based on font size and page width
- Considers paragraph breaks and spacing
- Updates in real-time as you type

### Content Splitting Logic
- Preserves line breaks at split boundaries
- Handles consecutive newlines intelligently  
- Maintains paragraph structure integrity
- Validates content preservation

### Performance Optimizations
- Debounced line counting for smooth typing
- Cached font metrics for accurate measurements
- Optimized rendering for large documents
- Smooth page transitions and animations

---

💡 **Pro Tip**: Use the combination of automatic pagination and strategic manual page breaks to create perfectly formatted stories that flow naturally across pages while maintaining your intended structure and formatting.
