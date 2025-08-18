'use client';

import { useEffect, useState } from 'react';
import { enableFontDebugging, logFontDebugInfo } from '@/lib/font-debug';

interface FontPreloaderProps {
  children: React.ReactNode;
}

export function FontPreloader({ children }: FontPreloaderProps) {
  const [fontsPreloaded, setFontsPreloaded] = useState(false);

  useEffect(() => {
    const preloadFonts = async () => {
      try {
        // Wait for CSS fonts to be loaded
        await document.fonts.ready;
        
        // Force load all our custom fonts by checking if they're available
        const fontsToCheck = [
          'CustomFontTTF',
          'CustomFont', 
          'HakgyoansimBareonbatangR'
        ];

        const checkPromises = fontsToCheck.map(fontFamily => 
          document.fonts.load(`16px "${fontFamily}"`)
        );

        // Wait for all fonts to be loaded
        await Promise.allSettled(checkPromises);

        console.log('CSS fonts preloaded successfully');
        
        // Enable font debugging in development
        if (process.env.NODE_ENV === 'development') {
          enableFontDebugging();
          // Log font status after a brief delay to ensure fonts are fully loaded
          setTimeout(() => logFontDebugInfo(true), 500);
        }
        
        setFontsPreloaded(true);
      } catch (error) {
        console.warn('Font preloading failed, continuing with fallbacks:', error);
        setFontsPreloaded(true);
      }
    };

    preloadFonts();

    // Timeout fallback - don't block UI indefinitely
    const timeout = setTimeout(() => {
      if (!fontsPreloaded) {
        console.warn('Font preloading timeout, proceeding with available fonts');
        setFontsPreloaded(true);
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [fontsPreloaded]);

  return (
    <>
      {/* Hidden elements to force font loading */}
      <div 
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          visibility: 'hidden',
          pointerEvents: 'none',
          height: '1px',
          width: '1px',
          overflow: 'hidden'
        }}
        aria-hidden="true"
      >
        {/* Force load CustomFontTTF */}
        <div style={{ fontFamily: 'CustomFontTTF' }}>
          안녕하세요 Hello 학교안심 CustomFontTTF
        </div>
        
        {/* Force load CustomFont */}
        <div style={{ fontFamily: 'CustomFont' }}>
          안녕하세요 Hello 나눔손글씨 CustomFont
        </div>
        
        {/* Force load HakgyoansimBareonbatangR */}
        <div style={{ fontFamily: 'HakgyoansimBareonbatangR' }}>
          안녕하세요 Hello 학교안심 HakgyoansimBareonbatangR
        </div>
      </div>
      
      {children}
    </>
  );
}
