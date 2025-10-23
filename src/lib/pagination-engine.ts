/**
 * Universal Pagination Engine (height-based)
 *
 * Re-distributes the entire document across exactly 4 pages using
 * height-based capacity, preserving author-intended line breaks.
 * - Page 1 capacity is reduced when title exists (via calculateAvailableHeight)
 * - Last page capacity can be reduced by a reserved bottom area (configurable)
 * - Hard cap at 4 pages (no 5th page)
 */

import { PAGE_DIMENSIONS, calculateAvailableHeight, estimateTextHeight, findOptimalBreakPoint } from './content-measurement';
import type { EditorSettings, AuthorInfo } from '@/types';

export interface PaginationConfig {
  pageCount?: number; // default 4
  paddingPx?: number; // default PAGE_DIMENSIONS.padding
  lastPageReservePx?: number; // extra bottom reserve for last page (default 100)
  titleEstimatedHeightPx?: number; // default 90 (used by calculateAvailableHeight)
}

export interface PaginationInput {
  content: string; // full plain text content (with preserved \n)
  editorSettings: Pick<EditorSettings, 'fontSize' | 'lineHeight' | 'fontFamily'>;
  authorInfo: Pick<AuthorInfo, 'title'>;
  config?: PaginationConfig;
}

export interface PaginationResult {
  pages: string[]; // exactly config.pageCount strings (may contain empty strings)
  overflowed: boolean; // true if content didn't fit in the last page
}

// Binary-search the longest substring length that fits into height
function findMaxFittingLength(
  text: string,
  maxHeightPx: number,
  widthPx: number,
  fontSize: number,
  lineHeight: number,
  fontFamily: string
): number {
  if (!text || text.length === 0) return 0;

  let lo = 0;
  let hi = text.length;
  let best = 0;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const candidate = text.substring(0, mid);

    const h = estimateTextHeight(candidate, fontSize, lineHeight, widthPx, fontFamily);

    if (h <= maxHeightPx) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best;
}

export function paginateDocument({ content, editorSettings, authorInfo, config }: PaginationInput): PaginationResult {
  const pageCount = config?.pageCount ?? 4;
  const padding = config?.paddingPx ?? PAGE_DIMENSIONS.padding;
  const lastReserve = config?.lastPageReservePx ?? 100; // align with editor's bottom warning overlay height

  const fontSize = editorSettings.fontSize;
  const lineHeight = editorSettings.lineHeight;
  const fontFamily = editorSettings.fontFamily || 'KoPubWorldBatangLight';

  // Effective width available for text inside page (content area width)
  const contentWidth = PAGE_DIMENSIONS.width - (padding * 2);

  // Normalize content just in case (ensure \n only)
  const normalized = (content || '').replace(/\r\n?/g, '\n');

  const pages: string[] = new Array(pageCount).fill('');
  let remaining = normalized;

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
    const hasTitle = pageIndex === 0 && !!authorInfo.title;
    let availableHeight = calculateAvailableHeight(pageIndex, hasTitle);

    // Apply last-page reserve area to respect export-safe region, if any
    if (pageIndex === pageCount - 1) {
      availableHeight = Math.max(0, availableHeight - lastReserve);
    }

    if (!remaining || remaining.length === 0 || availableHeight <= 0) {
      pages[pageIndex] = '';
      continue;
    }

    // Step 1: binary search for longest substring by char length that fits
    let maxLen = findMaxFittingLength(remaining, availableHeight, contentWidth, fontSize, lineHeight, fontFamily);

    if (maxLen <= 0) {
      // Nothing fits visually; leave empty page content (prevents infinite loops)
      pages[pageIndex] = '';
      continue;
    }

    // Step 2: prefer natural boundaries near maxLen
    let breakIndex = findOptimalBreakPoint(remaining, maxLen);
    if (breakIndex <= 0) breakIndex = maxLen;

    // Verify the chosen break fits; if not, back off conservatively
    let candidate = remaining.substring(0, breakIndex);
    let measured = estimateTextHeight(candidate, fontSize, lineHeight, contentWidth, fontFamily);

    if (measured > availableHeight) {
      // Back off iteratively to previous natural points
      // Try single newline, then word boundary, then simply shrink by small chunks
      const tryReduceAt = (pattern: RegExp) => {
        const idx = candidate.substring(0, Math.max(0, candidate.length - 1)).search(pattern);
        // search() returns first match; we want last match => manual scan
        let lastIdx = -1;
        if (idx !== -1) {
          const all = candidate.match(pattern);
          if (all && all.length > 0) {
            // not precise with match, fallback to lastIndexOf of a representative char
            // We'll simply look for the last newline as a common strong boundary
            lastIdx = candidate.lastIndexOf('\n');
          }
        }
        return lastIdx;
      };

      // First try the last newline before maxLen
      let newIdx = candidate.lastIndexOf('\n');
      while (newIdx > 0) {
        const cand2 = candidate.substring(0, newIdx);
        measured = estimateTextHeight(cand2, fontSize, lineHeight, contentWidth, fontFamily);
        if (measured <= availableHeight) {
          candidate = cand2;
          break;
        }
        newIdx = candidate.lastIndexOf('\n', newIdx - 1);
      }

      // If still too large, reduce by coarse steps
      if (measured > availableHeight) {
        let len = Math.max(0, candidate.length - 1);
        while (len > 0) {
          const cand3 = candidate.substring(0, len);
          measured = estimateTextHeight(cand3, fontSize, lineHeight, contentWidth, fontFamily);
          if (measured <= availableHeight) {
            candidate = cand3;
            break;
          }
          len = Math.floor(len * 0.9); // back off by 10%
        }
      }

      // Guard: if still nothing fits, set empty and continue
      if (candidate.length === 0) {
        pages[pageIndex] = '';
        continue;
      }
    }

    pages[pageIndex] = candidate;
    remaining = remaining.substring(candidate.length).replace(/^\n+/, ''); // trim leading newlines on next page
  }

  const overflowed = !!remaining && remaining.trim().length > 0;
  return { pages, overflowed };
}
