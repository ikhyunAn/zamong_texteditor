'use client';

import { useEffect, useState } from 'react';
import { enableFontDebugging, logFontDebugInfo } from '@/lib/font-debug';
import { initializeFonts, checkFontAvailability } from '@/lib/server-font-utils';
import { quickFontCheck, logFontSystemInfo } from '@/lib/font-debug-enhanced';

interface FontPreloaderProps {
  children: React.ReactNode;
}

export function FontPreloader({ children }: FontPreloaderProps) {
  const [fontsPreloaded, setFontsPreloaded] = useState(false);

  useEffect(() => {
    const preloadFonts = async () => {
      try {
        console.log('🚀 Starting enhanced font preloading for cloud deployment...');
        
        // Method 1: Try enhanced cross-environment font loading
        try {
          await initializeFonts();
          console.log('✅ Enhanced font loading successful');
        } catch (enhancedError) {
          console.warn('Enhanced font loading failed, trying CSS method:', enhancedError);
          
          // Method 2: Fallback to CSS font loading
          await document.fonts.ready;
          
          const fontsToCheck = [
            'HakgyoansimBareonbatangB', // Bold for titles
            'HakgyoansimBareonbatangR', // Regular for body text
            'CustomFont',               // 나눔손글씨 for author names
            'CustomFontTTF'             // Legacy alias
          ];

          const checkPromises = fontsToCheck.map(fontFamily => 
            document.fonts.load(`16px "${fontFamily}"`).catch(err => {
              console.warn(`Failed to load font ${fontFamily}:`, err);
              return null; // Continue with other fonts
            })
          );

          await Promise.allSettled(checkPromises);
          console.log('CSS fonts preloaded successfully');
        }
        
        // Check and log font availability status
        const fontStatus = checkFontAvailability();
        const quickStatus = quickFontCheck();
        
        console.log('📊 Font availability after preload:', fontStatus);
        console.log('⚡ Quick font check results:', quickStatus);
        
        // Enable enhanced debugging in development or when debug flag is set
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_FONT_DEBUG) {
          enableFontDebugging();
          // Run comprehensive font analysis
          setTimeout(() => {
            logFontDebugInfo(true);
            logFontSystemInfo();
          }, 500);
        }
        
        setFontsPreloaded(true);
      } catch (error) {
        console.error('❌ All font preloading methods failed:', error);
        setFontsPreloaded(true); // Don't block the UI
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
        
        {/* Force load HakgyoansimBareonbatangR (Regular for body) */}
        <div style={{ fontFamily: 'HakgyoansimBareonbatangR' }}>
          안녕하세요 Hello 학교안심 Regular HakgyoansimBareonbatangR
        </div>
        
        {/* Force load HakgyoansimBareonbatangB (Bold for titles) */}
        <div style={{ fontFamily: 'HakgyoansimBareonbatangB' }}>
          안녕하세요 Hello 학교안심 Bold HakgyoansimBareonbatangB
        </div>
      </div>
      
      {children}
    </>
  );
}
