'use client';

import React, { 
  forwardRef, 
  useCallback, 
  useEffect, 
  useRef, 
  useState,
  useImperativeHandle
} from 'react';
import './enhanced-textarea.css';

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  autosize?: boolean;
  minHeight?: number;
  maxHeight?: number;
  preserveCursor?: boolean;
  smoothTyping?: boolean;
}

interface EnhancedTextareaRef {
  focus: () => void;
  blur: () => void;
  setCursorPosition: (position: number) => void;
  getCursorPosition: () => number;
  getSelectionRange: () => { start: number; end: number };
  setSelectionRange: (start: number, end: number) => void;
}

const EnhancedTextarea = forwardRef<EnhancedTextareaRef, EnhancedTextareaProps>(
  ({ 
    value, 
    onChange, 
    autosize = true, 
    minHeight = 60, 
    maxHeight, 
    preserveCursor = true, 
    smoothTyping = true,
    className = '',
    style = {},
    onFocus,
    onBlur,
    onKeyDown,
    ...props 
  }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [cursorPosition, setCursorPosition] = useState<number>(0);
    const [selectionStart, setSelectionStart] = useState<number>(0);
    const [selectionEnd, setSelectionEnd] = useState<number>(0);
    const lastValueRef = useRef<string>(value);
    const isComposingRef = useRef<boolean>(false);

    // Expose methods through ref
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      setCursorPosition: (position: number) => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(position, position);
          setCursorPosition(position);
        }
      },
      getCursorPosition: () => cursorPosition,
      getSelectionRange: () => ({ start: selectionStart, end: selectionEnd }),
      setSelectionRange: (start: number, end: number) => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(start, end);
          setSelectionStart(start);
          setSelectionEnd(end);
        }
      }
    }));

    // Auto-resize functionality
    const adjustHeight = useCallback(() => {
      const textarea = textareaRef.current;
      if (!textarea || !autosize) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      let newHeight = Math.max(textarea.scrollHeight, minHeight);
      
      if (maxHeight) {
        newHeight = Math.min(newHeight, maxHeight);
      }
      
      textarea.style.height = `${newHeight}px`;
    }, [autosize, minHeight, maxHeight]);

    // Preserve cursor position during value updates
    const preserveCursorPosition = useCallback(() => {
      if (!preserveCursor || !textareaRef.current) return;

      const textarea = textareaRef.current;
      const currentStart = textarea.selectionStart;
      const currentEnd = textarea.selectionEnd;

      // Use setTimeout to ensure the DOM has updated
      setTimeout(() => {
        if (textarea && document.activeElement === textarea) {
          textarea.setSelectionRange(currentStart, currentEnd);
        }
      }, 0);
    }, [preserveCursor]);

    // Handle composition events (for IME support)
    const handleCompositionStart = useCallback(() => {
      isComposingRef.current = true;
    }, []);

    const handleCompositionEnd = useCallback(() => {
      isComposingRef.current = false;
    }, []);

    // Enhanced onChange handler
    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      
      // Store cursor position before change
      const currentStart = textarea.selectionStart;
      const currentEnd = textarea.selectionEnd;
      
      // Update cursor position state
      setCursorPosition(currentStart);
      setSelectionStart(currentStart);
      setSelectionEnd(currentEnd);
      
      // Call the provided onChange handler
      onChange(e);
    }, [onChange]);

    // Enhanced focus handler
    const handleFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      const textarea = e.target;
      setCursorPosition(textarea.selectionStart);
      setSelectionStart(textarea.selectionStart);
      setSelectionEnd(textarea.selectionEnd);
      
      onFocus?.(e);
    }, [onFocus]);

    // Enhanced blur handler
    const handleBlur = useCallback((e: React.FocusEvent<HTMLTextAreaElement>) => {
      onBlur?.(e);
    }, [onBlur]);

    // Enhanced keydown handler
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Update cursor position on arrow keys, home, end, etc.
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown'].includes(e.key)) {
        setTimeout(() => {
          const textarea = textareaRef.current;
          if (textarea) {
            setCursorPosition(textarea.selectionStart);
            setSelectionStart(textarea.selectionStart);
            setSelectionEnd(textarea.selectionEnd);
          }
        }, 0);
      }
      
      onKeyDown?.(e);
    }, [onKeyDown]);

    // Handle selection changes
    const handleSelect = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        setCursorPosition(textarea.selectionStart);
        setSelectionStart(textarea.selectionStart);
        setSelectionEnd(textarea.selectionEnd);
      }
    }, []);

    // Auto-resize when value changes
    useEffect(() => {
      adjustHeight();
    }, [value, adjustHeight]);

    // Preserve cursor position when value changes
    useEffect(() => {
      if (value !== lastValueRef.current) {
        lastValueRef.current = value;
        if (!isComposingRef.current) {
          preserveCursorPosition();
        }
      }
    }, [value, preserveCursorPosition]);

    // Initial height adjustment
    useEffect(() => {
      adjustHeight();
    }, [adjustHeight]);

    return (
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onSelect={handleSelect}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className={`enhanced-textarea ${className}`}
        style={{
          minHeight: `${minHeight}px`,
          maxHeight: maxHeight ? `${maxHeight}px` : undefined,
          resize: autosize ? 'none' : 'vertical',
          overflow: maxHeight ? 'auto' : 'hidden',
          transition: smoothTyping ? 'height 0.1s ease-out' : undefined,
          ...style
        }}
        {...props}
      />
    );
  }
);

EnhancedTextarea.displayName = 'EnhancedTextarea';

export default EnhancedTextarea;
export type { EnhancedTextareaRef, EnhancedTextareaProps };
