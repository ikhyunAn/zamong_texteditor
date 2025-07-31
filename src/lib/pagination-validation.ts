/**
 * Runtime validation utilities for the pagination system
 * Provides debugging hooks and validation functions
 */

interface Page {
  id: string;
  content: string;
}

interface PageValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface NavigationLog {
  timestamp: number;
  action: string;
  fromPage: number;
  toPage: number;
  success: boolean;
  error?: string;
}

class PaginationValidator {
  private static instance: PaginationValidator;
  private navigationHistory: NavigationLog[] = [];
  private readonly maxHistorySize = 100;
  private debugMode: boolean = process.env.NODE_ENV === 'development';

  static getInstance(): PaginationValidator {
    if (!PaginationValidator.instance) {
      PaginationValidator.instance = new PaginationValidator();
    }
    return PaginationValidator.instance;
  }

  /**
   * Validates page data integrity
   */
  validatePages(pages: Page[]): PageValidationResult {
    const result: PageValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (!Array.isArray(pages)) {
      result.isValid = false;
      result.errors.push('Pages must be an array');
      return result;
    }

    pages.forEach((page, index) => {
      if (!page) {
        result.isValid = false;
        result.errors.push(`Page at index ${index} is null or undefined`);
        return;
      }

      if (!page.id) {
        result.isValid = false;
        result.errors.push(`Page at index ${index} is missing an ID`);
      }

      if (typeof page.content !== 'string') {
        result.warnings.push(`Page ${page.id} has non-string content`);
      }

      // Check for duplicate IDs
      const duplicateIndex = pages.findIndex((p, i) => i !== index && p?.id === page.id);
      if (duplicateIndex !== -1) {
        result.isValid = false;
        result.errors.push(`Duplicate page ID '${page.id}' found at indices ${index} and ${duplicateIndex}`);
      }
    });

    if (this.debugMode) {
      this.logValidationResult('Page Validation', result);
    }

    return result;
  }

  /**
   * Validates navigation parameters
   */
  validateNavigation(currentIndex: number, targetIndex: number, totalPages: number): PageValidationResult {
    const result: PageValidationResult = {
      isValid: true,
      errors: [],
      warnings: []
    };

    if (targetIndex < 0) {
      result.isValid = false;
      result.errors.push(`Target page index ${targetIndex} is negative`);
    }

    if (targetIndex >= totalPages) {
      result.isValid = false;
      result.errors.push(`Target page index ${targetIndex} exceeds total pages (${totalPages})`);
    }

    if (currentIndex < 0 || currentIndex >= totalPages) {
      result.warnings.push(`Current page index ${currentIndex} is out of bounds`);
    }

    if (Math.abs(targetIndex - currentIndex) > 10) {
      result.warnings.push(`Large navigation jump from page ${currentIndex + 1} to ${targetIndex + 1}`);
    }

    return result;
  }

  /**
   * Logs navigation events for debugging
   */
  logNavigation(action: string, fromPage: number, toPage: number, success: boolean, error?: string): void {
    const logEntry: NavigationLog = {
      timestamp: Date.now(),
      action,
      fromPage,
      toPage,
      success,
      error
    };

    this.navigationHistory.push(logEntry);

    // Maintain history size limit
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory.shift();
    }

    if (this.debugMode) {
      const status = success ? '✅' : '❌';
      const errorMsg = error ? ` (Error: ${error})` : '';
      console.log(`${status} Navigation [${action}]: Page ${fromPage + 1} → Page ${toPage + 1}${errorMsg}`);
    }
  }

  /**
   * Logs page state changes for debugging
   */
  logPageState(label: string, state: {
    currentPageIndex: number;
    totalPages: number;
    pages: Page[];
    currentPageContent?: string;
  }): void {
    if (!this.debugMode) return;

    console.group(`📄 Page State: ${label}`);
    console.log(`Current Page: ${state.currentPageIndex + 1} of ${state.totalPages}`);
    console.log(`Total Pages: ${state.totalPages}`);
    console.log(`Pages Structure:`, state.pages.map((p, i) => ({
      index: i,
      id: p?.id || 'NULL',
      contentLength: p?.content?.length || 0,
      isCurrent: i === state.currentPageIndex
    })));
    
    if (state.currentPageContent !== undefined) {
      console.log(`Current Page Content: "${state.currentPageContent.substring(0, 50)}${state.currentPageContent.length > 50 ? '...' : ''}"`);
    }
    console.groupEnd();
  }

  /**
   * Detects potential pagination issues
   */
  detectAnomalies(pages: Page[]): string[] {
    const anomalies: string[] = [];

    // Check for empty pages in the middle
    const emptyMiddlePages = pages
      .slice(0, -1) // Exclude last page (can be empty)
      .map((page, index) => ({ page, index }))
      .filter(({ page }) => !page?.content?.trim())
      .map(({ index }) => index + 1);

    if (emptyMiddlePages.length > 0) {
      anomalies.push(`Empty pages detected in middle positions: ${emptyMiddlePages.join(', ')}`);
    }

    // Check for extremely large content on single pages
    const largePagesThreshold = 10000; // characters
    const largePages = pages
      .map((page, index) => ({ contentLength: page?.content?.length || 0, index }))
      .filter(({ contentLength }) => contentLength > largePagesThreshold)
      .map(({ index }) => index + 1);

    if (largePages.length > 0) {
      anomalies.push(`Unusually large pages detected: ${largePages.join(', ')}`);
    }

    // Check for rapid page creation (potential infinite loop)
    if (pages.length > 50) {
      anomalies.push(`High page count detected: ${pages.length} pages`);
    }

    return anomalies;
  }

  /**
   * Gets recent navigation history for debugging
   */
  getNavigationHistory(limit: number = 10): NavigationLog[] {
    return this.navigationHistory.slice(-limit);
  }

  /**
   * Clears navigation history
   */
  clearHistory(): void {
    this.navigationHistory = [];
  }

  /**
   * Enables or disables debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  private logValidationResult(context: string, result: PageValidationResult): void {
    if (result.errors.length > 0 || result.warnings.length > 0) {
      console.group(`🔍 ${context} - ${result.isValid ? 'Valid with warnings' : 'Invalid'}`);
      
      if (result.errors.length > 0) {
        console.error('Errors:', result.errors);
      }
      
      if (result.warnings.length > 0) {
        console.warn('Warnings:', result.warnings);
      }
      
      console.groupEnd();
    }
  }
}

// Export singleton instance
export const paginationValidator = PaginationValidator.getInstance();

// Export utility functions
export const validatePages = (pages: Page[]) => paginationValidator.validatePages(pages);
export const validateNavigation = (current: number, target: number, total: number) => 
  paginationValidator.validateNavigation(current, target, total);
export const logNavigation = (action: string, from: number, to: number, success: boolean, error?: string) =>
  paginationValidator.logNavigation(action, from, to, success, error);
export const logPageState = (label: string, state: {
  currentPageIndex: number;
  totalPages: number;
  pages: Page[];
  currentPageContent?: string;
}) => paginationValidator.logPageState(label, state);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const detectAnomalies = (pages: Page[], _currentIndex: number) => 
  paginationValidator.detectAnomalies(pages);
