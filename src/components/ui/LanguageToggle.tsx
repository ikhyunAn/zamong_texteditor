'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './button';
import { cn } from '@/lib/constants';
import { useLanguageStore } from '@/store/useLanguageStore';

interface LanguageToggleProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
  showText?: boolean;
}

// Globe icon component
const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

export function LanguageToggle({
  className,
  variant = 'outline',
  size = 'default',
  showIcon = true,
  showText = true,
  ...props
}: LanguageToggleProps) {
  const { t, i18n } = useTranslation();
  const { language, setLanguage } = useLanguageStore();
  const [isChanging, setIsChanging] = React.useState(false);

  // Use Zustand store as source of truth for language state
  const currentLanguage = language;
  const isKorean = currentLanguage === 'ko';

  // Sync i18next with Zustand store on mount and language changes
  React.useEffect(() => {
    if (i18n.language !== language) {
      i18n.changeLanguage(language).catch((error) => {
        console.warn('Failed to sync i18next with store language:', error);
      });
    }
  }, [language, i18n]);

  const handleLanguageChange = async () => {
    if (isChanging) return;
    
    setIsChanging(true);
    const newLanguage = isKorean ? 'en' : 'ko';
    
    try {
      // Update Zustand store (which will also update i18next)
      setLanguage(newLanguage);
    } catch (error) {
      console.error('Failed to change language:', error);
    } finally {
      // Add a small delay for smooth transition
      setTimeout(() => {
        setIsChanging(false);
      }, 200);
    }
  };

  const getCurrentLabel = () => {
    if (isKorean) return 'KO';
    return 'EN';
  };

  const getNextLabel = () => {
    return t('language.switchTo');
  };

  return (
    <div className={cn('relative', className)} {...props}>
      <Button
        variant={variant}
        size={size}
        onClick={handleLanguageChange}
        disabled={isChanging}
        className={cn(
          'transition-all duration-200 ease-in-out',
          'hover:scale-105 active:scale-95',
          'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          isChanging && 'animate-pulse'
        )}
        title={t('language.toggle')}
        aria-label={t('language.toggle')}
      >
        <div className="flex items-center gap-2">
          {showIcon && (
            <GlobeIcon 
              className={cn(
                'transition-transform duration-200',
                size === 'sm' ? 'w-3 h-3' : 
                size === 'lg' ? 'w-5 h-5' : 'w-4 h-4',
                isChanging && 'rotate-180'
              )} 
            />
          )}
          {showText && (
            <div className="flex items-center gap-1">
              <span 
                className={cn(
                  'transition-all duration-200 font-medium',
                  'text-xs sm:text-sm',
                  isChanging ? 'opacity-50' : 'opacity-100'
                )}
              >
                {getCurrentLabel()}
              </span>
              <span className="opacity-50 text-xs">→</span>
              <span 
                className={cn(
                  'transition-all duration-200 text-xs',
                  'opacity-70 hover:opacity-100',
                  isChanging ? 'opacity-30' : 'opacity-70'
                )}
              >
                {getNextLabel()}
              </span>
            </div>
          )}
        </div>
      </Button>

      {/* Optional loading indicator */}
      {isChanging && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-md">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin opacity-50" />
        </div>
      )}
    </div>
  );
}

// Additional variant for icon-only toggle
export function LanguageToggleIcon({
  className,
  variant = 'ghost',
  size = 'default',
  ...props
}: Omit<LanguageToggleProps, 'showIcon' | 'showText'>) {
  return (
    <LanguageToggle
      className={className}
      variant={variant}
      size={size}
      showIcon={true}
      showText={false}
      {...props}
    />
  );
}

// Additional variant for text-only toggle
export function LanguageToggleText({
  className,
  variant = 'outline',
  size = 'default',
  ...props
}: Omit<LanguageToggleProps, 'showIcon' | 'showText'>) {
  return (
    <LanguageToggle
      className={className}
      variant={variant}
      size={size}
      showIcon={false}
      showText={true}
      {...props}
    />
  );
}
