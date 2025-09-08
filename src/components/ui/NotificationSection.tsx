'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { InfoIcon } from 'lucide-react';

interface NotificationItem {
  id: string;
  text: string;
}

interface NotificationSectionProps {
  className?: string;
}

export function NotificationSection({ className = '' }: NotificationSectionProps) {
  const { t } = useTranslation('common');

  // Get notifications from i18n
  const notifications: NotificationItem[] = React.useMemo(() => {
    const items: NotificationItem[] = [];
    let index = 0;
    
    // Dynamic loading of notification items from i18n
    while (true) {
      const key = `notifications.howToUse.items.${index}`;
      const text = t(key);
      
      // If translation returns the key itself, it means no more items exist
      if (text === key) {
        break;
      }
      
      items.push({
        id: `notification-${index}`,
        text
      });
      index++;
    }
    
    return items;
  }, [t]);

  // Don't render if no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className={`w-full max-w-4xl mx-auto mb-8 ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
        <div className="px-6 py-4">
          {/* Title */}
          <div className="flex items-center mb-4">
            <InfoIcon className="w-5 h-5 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-blue-900">
              {t('notifications.howToUse.title')}
            </h3>
          </div>
          
          {/* Notification Items */}
          <div className="space-y-3">
            {notifications.map((notification, index) => (
              <div key={notification.id} className="flex items-start">
                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 border border-blue-300 rounded-full flex items-center justify-center mr-3 mt-0.5">
                  <span className="text-blue-700 text-sm font-sans">
                    {index + 1}
                  </span>
                </div>
                <p className="text-blue-800 text-sm leading-relaxed font-sans">
                  {notification.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
