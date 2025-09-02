'use client';

import { useEffect, useState } from 'react';
import { emergencyFontLoad } from '@/lib/embedded-fonts';
import { loadAllCloudFonts } from '@/lib/cloud-font-loader';

interface CloudFontLoaderProps {
  children: React.ReactNode;
}

interface FontLoadStatus {
  stage: 'initializing' | 'cloud-loader' | 'emergency-load' | 'css-fallback' | 'complete' | 'failed';
  loaded: number;
  total: number;
  currentMethod: string;
  errors: string[];
}

export function CloudFontLoader({ children }: CloudFontLoaderProps) {
  const [status, setStatus] = useState<FontLoadStatus>({
    stage: 'initializing',
    loaded: 0,
    total: 4, // Total number of fonts we're trying to load
    currentMethod: 'Starting...',
    errors: []
  });
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    const loadFontsWithMultipleStrategies = async () => {
      console.log('🚀 [Cloud Font Loader] Starting multi-strategy font loading for cloud deployment...');
      
      const fontConfigs = [
        { name: 'CustomFont', purpose: 'author' as const, filename: '작가폰트_나눔손글씨 딸에게 엄마가.ttf' },
        { name: 'HakgyoansimBareonbatangB', purpose: 'title' as const, filename: 'HakgyoansimBareonbatangB.ttf' },
        { name: 'HakgyoansimBareonbatangR', purpose: 'body' as const, filename: 'HakgyoansimBareonbatangR.ttf' },
        { name: 'KoPubWorldBatangLight', purpose: 'body' as const, filename: 'KoPubWorld Batang Light.ttf' }
      ];
      
      let loadedCount = 0;
      const errors: string[] = [];

      try {
        // Strategy 1: Try the cloud font loader first
        setStatus({
          stage: 'cloud-loader',
          loaded: 0,
          total: fontConfigs.length,
          currentMethod: 'Cloud Font Loader (ArrayBuffer + CSS)',
          errors: []
        });

        try {
          const cloudResults = await loadAllCloudFonts(
            (progress) => {
              setStatus(prev => ({
                ...prev,
                loaded: progress.current,
                currentMethod: `Loading ${progress.currentFont}...`
              }));
            },
            (result) => {
              if (result.success) {
                loadedCount++;
              } else {
                errors.push(`Cloud loader failed for ${result.name}: ${result.error}`);
              }
            }
          );

          const successfulCloudLoads = cloudResults.filter(r => r.success).length;
          console.log(`[Cloud Font Loader] Strategy 1 - Cloud loader: ${successfulCloudLoads}/${fontConfigs.length} fonts loaded`);
          
          if (successfulCloudLoads >= fontConfigs.length) {
            // All fonts loaded successfully
            setStatus({
              stage: 'complete',
              loaded: successfulCloudLoads,
              total: fontConfigs.length,
              currentMethod: 'All fonts loaded via cloud loader',
              errors
            });
            setFontsReady(true);
            return;
          }
        } catch (cloudError) {
          const errorMsg = `Cloud font loader failed: ${cloudError instanceof Error ? cloudError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.warn(errorMsg);
        }

        // Strategy 2: Emergency font loading
        setStatus({
          stage: 'emergency-load',
          loaded: loadedCount,
          total: fontConfigs.length,
          currentMethod: 'Emergency Font Loading (CSS + Force Load)',
          errors
        });

        try {
          await emergencyFontLoad(fontConfigs);
          
          // Check which fonts are now available
          let emergencyLoadedCount = 0;
          for (const config of fontConfigs) {
            if (document.fonts.check(`16px \"${config.name}\"`)) {
              emergencyLoadedCount++;
            }
          }
          
          console.log(`[Cloud Font Loader] Strategy 2 - Emergency loader: ${emergencyLoadedCount}/${fontConfigs.length} fonts loaded`);
          
          if (emergencyLoadedCount > 0) {
            setStatus({
              stage: 'complete',
              loaded: emergencyLoadedCount,
              total: fontConfigs.length,
              currentMethod: `Emergency loading successful (${emergencyLoadedCount} fonts)`,
              errors
            });
            setFontsReady(true);
            return;
          }
        } catch (emergencyError) {
          const errorMsg = `Emergency font loading failed: ${emergencyError instanceof Error ? emergencyError.message : 'Unknown error'}`;
          errors.push(errorMsg);
          console.warn(errorMsg);
        }

        // Strategy 3: CSS fallback with system fonts
        setStatus({
          stage: 'css-fallback',
          loaded: loadedCount,
          total: fontConfigs.length,
          currentMethod: 'CSS Fallback (System Fonts)',
          errors
        });

        // Inject CSS with system font fallbacks for Korean text
        const fallbackCSS = `
@font-face {
  font-family: "CustomFont";
  src: local("Malgun Gothic"), local("Apple SD Gothic Neo"), local("NanumGothic");
  font-display: swap;
}

@font-face {
  font-family: "HakgyoansimBareonbatangB";
  src: local("Malgun Gothic"), local("Apple SD Gothic Neo"), local("NanumGothic");
  font-weight: bold;
  font-display: swap;
}

@font-face {
  font-family: "HakgyoansimBareonbatangR";
  src: local("Malgun Gothic"), local("Apple SD Gothic Neo"), local("NanumGothic");
  font-display: swap;
}

@font-face {
  font-family: "KoPubWorldBatangLight";
  src: local("Malgun Gothic"), local("Apple SD Gothic Neo"), local("NanumGothic");
  font-display: swap;
}`;

        const fallbackStyleId = 'korean-font-fallbacks';
        const existingFallbackStyle = document.getElementById(fallbackStyleId);
        if (existingFallbackStyle) {
          existingFallbackStyle.remove();
        }

        const fallbackStyle = document.createElement('style');
        fallbackStyle.id = fallbackStyleId;
        fallbackStyle.textContent = fallbackCSS;
        document.head.appendChild(fallbackStyle);

        console.log('[Cloud Font Loader] Strategy 3 - Injected Korean system font fallbacks');

        // Wait for system fonts to be ready
        await document.fonts.ready;

        setStatus({
          stage: 'complete',
          loaded: 0, // No custom fonts loaded, but fallbacks available
          total: fontConfigs.length,
          currentMethod: 'Using system font fallbacks',
          errors
        });

        console.warn('[Cloud Font Loader] All custom font loading strategies failed, using system fonts');
        setFontsReady(true);

      } catch (finalError) {
        const errorMsg = `All font loading strategies failed: ${finalError instanceof Error ? finalError.message : 'Unknown error'}`;
        errors.push(errorMsg);
        
        setStatus({
          stage: 'failed',
          loaded: loadedCount,
          total: fontConfigs.length,
          currentMethod: 'All strategies failed',
          errors
        });

        console.error('[Cloud Font Loader] Critical font loading failure:', finalError);
        
        // Still proceed with the app
        setFontsReady(true);
      }
    };

    loadFontsWithMultipleStrategies();
  }, []);

  // Show loading indicator in development or debug mode
  const shouldShowProgress = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_FONT_DEBUG;

  if (!fontsReady && shouldShowProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Fonts</h2>
              <p className="text-gray-600 text-sm">Preparing Korean fonts for your stories...</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{status.currentMethod}</span>
                <span className="text-gray-500">{status.loaded}/{status.total}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${status.total > 0 ? (status.loaded / status.total) * 100 : 0}%` 
                  }}
                />
              </div>
              
              <div className="text-xs text-gray-500">
                Stage: {status.stage.replace('-', ' ').toUpperCase()}
              </div>
              
              {status.errors.length > 0 && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-yellow-600">
                    {status.errors.length} warning(s)
                  </summary>
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                    {status.errors.map((error, index) => (
                      <div key={index} className="mb-1">{error}</div>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Don't show loading screen in production unless fonts are critically needed
  return (
    <>
      {children}
      
      {/* Hidden elements to maintain font references */}
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
        <div style={{ fontFamily: 'CustomFont' }}>작가 이름 CustomFont</div>
        <div style={{ fontFamily: 'HakgyoansimBareonbatangB' }}>제목 Bold HakgyoansimBareonbatangB</div>
        <div style={{ fontFamily: 'HakgyoansimBareonbatangR' }}>본문 Regular HakgyoansimBareonbatangR</div>
        <div style={{ fontFamily: 'KoPubWorldBatangLight' }}>본문 KoPubWorldBatangLight</div>
      </div>
    </>
  );
}
