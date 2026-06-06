import { useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

export const useInitialNotifications = () => {
  const { addNotification, notifications } = useNotifications();

  useEffect(() => {
    // Only add initial notifications if there are none
    if (notifications.length === 0) {

      // Add welcome notification
      addNotification({
        title: '👋 Welcome to ABSpider',
        message: 'Your reconnaissance dashboard is ready. Start by creating your first scan or explore the features.',
        type: 'success',
        action: {
          label: 'New Scan',
          url: '/new-scan'
        }
      });

      // Add system status notification
      addNotification({
        title: '⚡ System Status',
        message: 'All systems operational. API integrations are active and ready for scanning.',
        type: 'info'
      });
    }
  }, [addNotification, notifications.length]);
};