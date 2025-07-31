'use client';

import { useEffect, useState } from 'react';
import { loadCustomFonts, loadAvailableFonts } from '@/lib/font-utils';

interface FontLoaderProps {
  children: React.ReactNode;
}

export function FontLoader({ children }: FontLoaderProps) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        console.log('Starting font loading...');
        
        // Load fonts in parallel
        await Promise.allSettled([
          loadAvailableFonts(),
          loadCustomFonts()
        ]);
        
        console.log('Font loading completed');
        setFontsLoaded(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown font loading error';
        console.warn('Font loading failed:', errorMessage);
        setLoadingError(errorMessage);
        // Still mark as loaded to continue with fallback fonts
        setFontsLoaded(true);
      }
    };

    loadFonts();
  }, []);

  // Don't block the UI if font loading takes too long
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!fontsLoaded) {
        console.warn('Font loading timeout, proceeding with fallback fonts');
        setFontsLoaded(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fonts...</p>
        </div>
      </div>
    );
  }

  if (loadingError) {
    console.warn('Font loading completed with errors:', loadingError);
  }

  return <>{children}</>;
}
