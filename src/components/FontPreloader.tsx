'use client';

import { useEffect, useState } from 'react';
import { enableFontDebugging, logFontDebugInfo } from '@/lib/font-debug';
import { quickFontCheck, logFontSystemInfo } from '@/lib/font-debug-enhanced';
import { loadAllCloudFonts, verifyFontsForCanvas, generateFontDebugReport } from '@/lib/cloud-font-loader';

interface FontPreloaderProps {
  children: React.ReactNode;
}

export function FontPreloader({ children }: FontPreloaderProps) {
  const [fontsPreloaded, setFontsPreloaded] = useState(false);

  useEffect(() => {
    const preloadFonts = async () => {
      try {
        console.log('🚀 Starting cloud-compatible font preloading...');

        // Load all fonts using cloud loader (handles encoding and fallbacks)
        await loadAllCloudFonts(
          (progress) => {
            // Optional: could update UI progress here
            if (process.env.NEXT_PUBLIC_ENABLE_FONT_DEBUG) {
              console.log(`[Font Progress] ${progress.current}/${progress.total} - ${progress.stage} - ${progress.currentFont}`);
            }
          },
          (result) => {
            if (!result.success) {
              console.warn(`[Font Loader] ${result.name} failed via ${result.method}: ${result.error}`);
            }
          }
        );

        // Verify fonts are ready for canvas operations
        const { ready, report } = await verifyFontsForCanvas();
        console.log('📊 Font verification report:', report);

        if (!ready) {
          console.warn('Some fonts are not ready for canvas. The app will continue with fallbacks.');
        }

        // Quick checks for additional context
        const quickStatus = quickFontCheck();
        console.log('⚡ Quick font check results:', quickStatus);

        // Enable enhanced debugging in development or when debug flag is set
        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_FONT_DEBUG) {
          enableFontDebugging();
          // Run comprehensive font analysis
          setTimeout(() => {
            logFontDebugInfo(true);
            logFontSystemInfo();
            const debugReport = generateFontDebugReport();
            console.log('🧪 Cloud Font Debug Report:', debugReport);
          }, 500);
        }

        setFontsPreloaded(true);
      } catch (error) {
        console.error('❌ Font preloading failed:', error);
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
