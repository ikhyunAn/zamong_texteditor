/**
 * useUniversalPagination Hook
 *
 * Reflows the entire document across 4 pages on content/layout changes.
 * - Height-based across all pages
 * - Honors page 1 title capacity
 * - Hard-caps at 4 pages with last-page reserve
 * - Preserves existing line-break visualization (no changes to TipTap mapping)
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { useStoryStore } from '@/store/useStoryStore';
import { paginateDocument } from '@/lib/pagination-engine';

interface UseUniversalPaginationOptions {
  editor: Editor | null;
  enabled?: boolean;
  debounceMs?: number;
}

export function useUniversalPagination({ editor, enabled = true, debounceMs = 300 }: UseUniversalPaginationOptions) {
  const {
    pages,
    currentPageIndex,
    authorInfo,
    editorSettings,
    setPages,
  } = useStoryStore();

  const isProcessingRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Build latest full-text by combining latest editor content for current page + other pages from store
  const buildFullText = useCallback((): string => {
    // To avoid race conditions when switching pages (editor content may be mid-navigation),
    // rely exclusively on store content which is updated from the editor with a short debounce.
    return pages.map(p => p.content || '').join('');
  }, [pages]);

  const repaginate = useCallback(() => {
    if (!enabled || !editor || isProcessingRef.current) return;
    if (!pages || pages.length === 0) return;

    isProcessingRef.current = true;

    try {
      const fullText = buildFullText();

      const result = paginateDocument({
        content: fullText,
        editorSettings: {
          fontSize: editorSettings.fontSize,
          lineHeight: editorSettings.lineHeight,
          fontFamily: editorSettings.fontFamily,
        },
        authorInfo: { title: authorInfo.title },
        config: {
          pageCount: 4,
          lastPageReservePx: 100, // match the visual bottom warning guide
        },
      });

      // Rebuild pages preserving IDs/backgrounds
      const freshPages = useStoryStore.getState().pages; // fresh snapshot to avoid stale closure
      const newPages = freshPages.map((p, i) => ({
        ...p,
        content: result.pages[i] || '',
      }));

      // Only update if content actually changed to avoid loops
      const changed = newPages.some((np, i) => (np.content || '') !== (freshPages[i]?.content || ''));
      if (changed) {
        setPages(newPages);
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [editor, enabled, authorInfo.title, editorSettings.fontSize, editorSettings.lineHeight, editorSettings.fontFamily, setPages, buildFullText]);

  const debouncedRepaginate = useMemo(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        repaginate();
      }, debounceMs);
    };
  }, [repaginate, debounceMs]);

  // Removed ResizeObserver-driven repagination to prevent layout-induced reflows
  // when clicking between pages. Editor updates and setting changes already trigger repagination.
  useEffect(() => {
    return () => {
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  // Listen to editor updates directly
  useEffect(() => {
    if (!editor || !enabled) return;

    const onUpdate = () => debouncedRepaginate();
    editor.on('update', onUpdate);
    return () => {
      editor.off('update', onUpdate);
    };
  }, [editor, enabled, debouncedRepaginate]);

  // Reflow on layout-affecting settings
  useEffect(() => {
    debouncedRepaginate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorSettings.fontSize, editorSettings.lineHeight, authorInfo.title]);

  // Initial pass when editor becomes ready
  useEffect(() => {
    if (editor && enabled) {
      debouncedRepaginate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, enabled]);

  return {
    isProcessing: isProcessingRef.current,
    repaginate,
  };
}
