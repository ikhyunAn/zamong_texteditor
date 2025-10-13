/**
 * ResponsiveEditorWrapper Component
 * 
 * Provides responsive scaling for the editor to work on both mobile and desktop devices.
 * Maintains the 900x1600 aspect ratio while scaling to fit the viewport.
 */

'use client';

import { useEffect, useState, useRef, ReactNode } from 'react';

interface ResponsiveEditorWrapperProps {
  children: ReactNode;
  pageWidth?: number;
  pageHeight?: number;
}

export function ResponsiveEditorWrapper({ 
  children,
  pageWidth = 900,
  pageHeight = 1600
}: ResponsiveEditorWrapperProps) {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const calculateScale = () => {
      if (typeof window === 'undefined') return;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Mobile breakpoint
      const isMobile = viewportWidth < 768;
      
      if (isMobile) {
        // Mobile: Scale to fit width with padding
        const mobilePadding = 32; // 16px on each side
        const availableWidth = viewportWidth - mobilePadding;
        const scaleToFit = Math.min(availableWidth / pageWidth, 1);
        setScale(scaleToFit);
      } else {
        // Desktop: Scale to fit within viewport while maintaining aspect ratio
        const desktopPadding = 64; // Comfortable padding on desktop
        const availableWidth = viewportWidth - desktopPadding;
        const availableHeight = viewportHeight - 200; // Account for header/controls
        
        // Calculate scale to fit both dimensions
        const scaleByWidth = availableWidth / pageWidth;
        const scaleByHeight = availableHeight / pageHeight;
        const scaleToFit = Math.min(scaleByWidth, scaleByHeight, 1);
        
        setScale(scaleToFit);
      }
    };
    
    // Calculate initial scale
    calculateScale();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateScale);
    window.addEventListener('orientationchange', calculateScale);
    
    return () => {
      window.removeEventListener('resize', calculateScale);
      window.removeEventListener('orientationchange', calculateScale);
    };
  }, [pageWidth, pageHeight]);
  
  return (
    <div 
      ref={containerRef}
      className="responsive-editor-container"
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        minHeight: '100vh',
      }}
    >
      <div
        className="scaled-content"
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.3s ease-out',
          width: `${pageWidth}px`,
          margin: '0 auto',
        }}
      >
        {children}
      </div>
      
      <style jsx>{`
        @media (max-width: 768px) {
          .responsive-editor-container {
            padding: 8px;
          }
          
          /* Touch-friendly adjustments */
          :global(button) {
            min-height: 44px;
            min-width: 44px;
          }
        }
        
        @media (orientation: landscape) and (max-width: 768px) {
          .responsive-editor-container {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
}
