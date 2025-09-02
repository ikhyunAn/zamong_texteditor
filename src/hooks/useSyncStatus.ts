import { useState, useEffect, useCallback, useRef } from 'react';
import { useStoryStore } from '../store/useStoryStore';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'retrying';

interface SyncStatus {
  state: SyncState;
  lastSyncTime: number | null;
  pendingChanges: boolean;
  errorMessage?: string;
  retryAttempts: number;
  isHealthy: boolean;
}


const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds
const SYNC_HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export const useSyncStatus = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    state: 'idle',
    lastSyncTime: null,
    pendingChanges: false,
    retryAttempts: 0,
    isHealthy: true
  });

  const syncQueueRef = useRef<Array<() => Promise<boolean>>>([]);
  const isProcessingQueueRef = useRef(false);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastEditorContentRef = useRef<string>('');

  const { 
    getCurrentPageContent, 
    updatePage,
    pages,
    currentPageIndex
  } = useStoryStore();

  // Perform sync health check
  const performHealthCheck = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSync = syncStatus.lastSyncTime ? now - syncStatus.lastSyncTime : Infinity;
    const hasRecentActivity = timeSinceLastSync < 60000; // 1 minute
    const isHealthy = !syncStatus.pendingChanges || hasRecentActivity;

    setSyncStatus(prev => ({ ...prev, isHealthy }));

    if (!isHealthy && syncStatus.pendingChanges) {
      console.warn('[Sync Health] Detected stale pending changes');
      // Note: Health check doesn't auto-sync as it doesn't know what content to sync
      // This prevents the duplication issue
    }
  }, [syncStatus.lastSyncTime, syncStatus.pendingChanges]);

  // Initialize sync status monitoring
  useEffect(() => {
    setSyncStatus(prev => ({ ...prev, state: 'idle', isHealthy: true }));
    
    // Start health check interval
    healthCheckIntervalRef.current = setInterval(() => {
      performHealthCheck();
    }, SYNC_HEALTH_CHECK_INTERVAL);

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [performHealthCheck]);

  // Monitor store state changes to detect pending changes
  useEffect(() => {
    const currentContent = getCurrentPageContent();
    const hasChanges = currentContent !== lastEditorContentRef.current;
    
    if (hasChanges && syncStatus.state === 'synced') {
      setSyncStatus(prev => ({ ...prev, pendingChanges: true, state: 'idle' }));
    }
  }, [getCurrentPageContent, syncStatus.state]);

  // Enhanced sync function with validation and retry
  const performSync = useCallback(async (
    content: string, 
    context?: string,
    skipQueue = false
  ): Promise<boolean> => {
    if (!skipQueue && isProcessingQueueRef.current) {
      // Add to queue if already processing
      return new Promise((resolve) => {
        syncQueueRef.current.push(() => performSync(content, context, true));
        resolve(true);
      });
    }

    try {
      setSyncStatus(prev => ({ ...prev, state: 'syncing', errorMessage: undefined }));

      // Validate current state
      if (pages.length === 0 || currentPageIndex < 0 || currentPageIndex >= pages.length) {
        throw new Error('Invalid page state for sync');
      }

      const currentPage = pages[currentPageIndex];
      if (!currentPage) {
        throw new Error('Current page not found');
      }

      // Perform the actual sync
      updatePage(currentPage.id, content);

      // Validate sync success
      const updatedContent = getCurrentPageContent();
      if (updatedContent !== content) {
        throw new Error('Sync validation failed: content mismatch');
      }

      // Update sync status
      lastEditorContentRef.current = content;
      setSyncStatus(prev => ({
        ...prev,
        state: 'synced',
        lastSyncTime: Date.now(),
        pendingChanges: false,
        retryAttempts: 0,
        isHealthy: true,
        errorMessage: undefined
      }));

      console.log(`[Sync] Successfully synced ${content.length} characters`, context ? `(${context})` : '');
      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      console.error('[Sync] Error:', errorMessage, context ? `(${context})` : '');

      setSyncStatus(prev => ({
        ...prev,
        state: 'error',
        errorMessage,
        isHealthy: false
      }));

      return false;
    }
  }, [pages, currentPageIndex, updatePage, getCurrentPageContent]);

  // Process sync queue
  const processQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || syncQueueRef.current.length === 0) {
      return;
    }

    isProcessingQueueRef.current = true;

    try {
      while (syncQueueRef.current.length > 0) {
        const syncOperation = syncQueueRef.current.shift();
        if (syncOperation) {
          await syncOperation();
        }
      }
    } finally {
      isProcessingQueueRef.current = false;
    }
  }, []);

  // Force sync with exponential backoff retry
  const forceSyncWithRetry = useCallback(async (
    content?: string, 
    context?: string
  ): Promise<boolean> => {
    // CRITICAL: Only use provided content, never fall back to getCurrentPageContent
    // as this can cause syncing wrong content to wrong pages during navigation
    if (!content) {
      console.warn('[Sync] No content provided to forceSyncWithRetry, skipping sync');
      return false;
    }
    
    const syncContent = content;
    let attempts = 0;

    const attemptSync = async (): Promise<boolean> => {
      attempts++;
      setSyncStatus(prev => ({ 
        ...prev, 
        state: attempts > 1 ? 'retrying' : 'syncing',
        retryAttempts: attempts 
      }));

      const success = await performSync(syncContent, context);

      if (!success && attempts < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempts - 1);
        console.log(`[Sync] Retry attempt ${attempts}/${MAX_RETRY_ATTEMPTS} in ${delay}ms`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return attemptSync();
      }

      return success;
    };

    return attemptSync();
  }, [performSync]);

  // Immediate sync (for critical operations)
  const syncNow = useCallback(async (content?: string, context?: string): Promise<boolean> => {
    // CRITICAL: Only use provided content, never fall back to getCurrentPageContent  
    if (!content) {
      console.warn('[Sync] No content provided to syncNow, skipping sync');
      return false;
    }
    
    return forceSyncWithRetry(content, context);
  }, [forceSyncWithRetry]);

  // Queue sync operation (for non-critical operations)
  const queueSync = useCallback((content?: string, context?: string) => {
    // CRITICAL: Only use provided content, never fall back to getCurrentPageContent
    if (!content) {
      console.warn('[Sync] No content provided to queueSync, skipping sync');
      return;
    }
    
    syncQueueRef.current.push(() => performSync(content, context, true));
    processQueue();
  }, [performSync, processQueue]);

  // Get current sync metrics for monitoring
  const getSyncMetrics = useCallback(() => {
    return {
      ...syncStatus,
      queueLength: syncQueueRef.current.length,
      isProcessingQueue: isProcessingQueueRef.current,
      healthCheckInterval: SYNC_HEALTH_CHECK_INTERVAL,
      maxRetryAttempts: MAX_RETRY_ATTEMPTS
    };
  }, [syncStatus]);

  // Validate current sync state
  const validateSyncState = useCallback(() => {
    const currentContent = getCurrentPageContent();
    const isContentSynced = currentContent === lastEditorContentRef.current;
    
    return {
      isValid: isContentSynced && !syncStatus.pendingChanges,
      contentLength: currentContent.length,
      lastSyncedLength: lastEditorContentRef.current.length,
      pendingChanges: syncStatus.pendingChanges,
      syncState: syncStatus.state
    };
  }, [getCurrentPageContent, syncStatus.pendingChanges, syncStatus.state]);

  return {
    // Status information
    syncStatus,
    getSyncMetrics,
    validateSyncState,

    // Sync operations
    syncNow,
    queueSync,
    forceSyncWithRetry,

    // Status helpers
    isSyncing: syncStatus.state === 'syncing' || syncStatus.state === 'retrying',
    hasError: syncStatus.state === 'error',
    isPending: syncStatus.pendingChanges,
    isHealthy: syncStatus.isHealthy,
    lastSyncTime: syncStatus.lastSyncTime
  };
};
