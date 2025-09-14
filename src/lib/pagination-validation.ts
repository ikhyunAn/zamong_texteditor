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
