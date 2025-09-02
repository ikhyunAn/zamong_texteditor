'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Download,
  Eye,
  EyeOff
} from 'lucide-react';
import { 
  CLOUD_FONT_CONFIGS, 
  generateFontDebugReport,
  verifyFontsForCanvas,
  isFontPreloaded,
  encodeFontUrl 
} from '@/lib/cloud-font-loader';

interface FontStatus {
  name: string;
  displayName: string;
  purpose: string;
  loaded: boolean;
  accessible: boolean;
  encodedUrl: string;
  loadTime?: number;
  error?: string;
}

export function FontVerificationPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [fontStatuses, setFontStatuses] = useState<FontStatus[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastVerified, setLastVerified] = useState<Date | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [debugReport, setDebugReport] = useState<any>(null);

  // Only show in development or when debug flag is set
  const shouldShow = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_FONT_DEBUG;

  const verifyAllFonts = async () => {
    setIsVerifying(true);
    console.log('[Font Verification] Starting comprehensive font verification...');

    try {
      const statuses: FontStatus[] = [];
      
      for (const config of CLOUD_FONT_CONFIGS) {
        const startTime = Date.now();
        
        // Check if font is loaded in document.fonts
        const loaded = isFontPreloaded(config.name);
        
        // Check if font file is accessible via HTTP
        let accessible = false;
        let error: string | undefined;
        
        try {
          const encodedUrl = encodeFontUrl(config.filename);
          const response = await fetch(encodedUrl, { method: 'HEAD' });
          accessible = response.ok;
          
          if (!response.ok) {
            error = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (fetchError) {
          error = fetchError instanceof Error ? fetchError.message : 'Network error';
        }
        
        const loadTime = Date.now() - startTime;
        
        statuses.push({
          name: config.name,
          displayName: config.displayName,
          purpose: config.purpose,
          loaded,
          accessible,
          encodedUrl: encodeFontUrl(config.filename),
          loadTime,
          error: error || (loaded ? undefined : 'Font not loaded in document.fonts')
        });
      }
      
      setFontStatuses(statuses);
      
      // Generate comprehensive debug report
      const report = generateFontDebugReport();
      setDebugReport(report);
      
      // Also run canvas verification
      const canvasVerification = await verifyFontsForCanvas();
      console.log('[Font Verification] Canvas verification:', canvasVerification);
      
      setLastVerified(new Date());
      
    } catch (error) {
      console.error('[Font Verification] Error during verification:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Auto-verify on component mount
  useEffect(() => {
    if (shouldShow) {
      verifyAllFonts();
    }
  }, [shouldShow]);

  // Visual font testing
  const renderFontSample = (fontName: string, sample: string = 'Sample 샘플 123 ABC') => (
    <div className="border rounded p-2 bg-gray-50">
      <div 
        style={{ fontFamily: fontName, fontSize: '16px', lineHeight: '1.4' }}
        className="text-sm"
      >
        {sample}
      </div>
      <div className="text-xs text-gray-500 mt-1">
        Font: {fontName}
      </div>
    </div>
  );

  const downloadDebugReport = () => {
    if (!debugReport) return;
    
    const reportData = {
      ...debugReport,
      fontStatuses,
      verification: {
        lastVerified: lastVerified?.toISOString(),
        environment: {
          nodeEnv: process.env.NODE_ENV,
          debugEnabled: process.env.NEXT_PUBLIC_ENABLE_FONT_DEBUG,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown'
        }
      }
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `font-debug-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="shadow-lg"
          title="Show Font Verification Panel"
        >
          <Eye className="w-4 h-4 mr-2" />
          Fonts ({fontStatuses.filter(f => f.loaded).length}/{CLOUD_FONT_CONFIGS.length})
        </Button>
      ) : (
        <Card className="w-96 max-h-[80vh] overflow-auto shadow-xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center">
                <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                Font Verification
              </CardTitle>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              Production font loading status
              {lastVerified && (
                <div className="text-xs text-gray-500 mt-1">
                  Last checked: {lastVerified.toLocaleTimeString()}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={verifyAllFonts}
                disabled={isVerifying}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                {isVerifying ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verify
              </Button>
              <Button
                onClick={downloadDebugReport}
                disabled={!debugReport}
                variant="outline"
                size="sm"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>

            {/* Summary */}
            {fontStatuses.length > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {fontStatuses.filter(f => f.loaded && f.accessible).length}
                  </div>
                  <div className="text-xs text-gray-500">Ready</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-yellow-600">
                    {fontStatuses.filter(f => f.loaded && !f.accessible).length}
                  </div>
                  <div className="text-xs text-gray-500">Loaded</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-red-600">
                    {fontStatuses.filter(f => !f.loaded).length}
                  </div>
                  <div className="text-xs text-gray-500">Failed</div>
                </div>
              </div>
            )}

            {/* Font Status List */}
            <div className="space-y-2">
              {fontStatuses.map((font) => (
                <div key={font.name} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">{font.displayName}</div>
                      <div className="text-xs text-gray-500">
                        {font.name} • {font.purpose}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {font.loaded && font.accessible ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      ) : font.loaded ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Loaded
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Font Sample */}
                  {font.loaded && (
                    <div className="text-xs">
                      {renderFontSample(
                        font.name, 
                        font.purpose === 'author' ? '작가 이름' : 
                        font.purpose === 'title' ? '스토리 제목' : '본문 텍스트'
                      )}
                    </div>
                  )}

                  {/* Status Details */}
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>
                      File Access: {font.accessible ? '✅' : '❌'} 
                      {font.loadTime && ` (${font.loadTime}ms)`}
                    </div>
                    <div>
                      Browser Font: {font.loaded ? '✅' : '❌'}
                    </div>
                    {font.error && (
                      <div className="text-red-600">
                        Error: {font.error}
                      </div>
                    )}
                    <div className="text-gray-400 break-all">
                      {font.encodedUrl}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Browser Info */}
            {debugReport && (
              <div className="text-xs text-gray-500 border-t pt-2">
                <div>Browser: {debugReport.userAgent.split(' ')[0]}</div>
                <div>Timestamp: {debugReport.timestamp.split('T')[1].split('.')[0]}</div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
