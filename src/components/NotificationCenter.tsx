import React from 'react';
import { Bell, X, ExternalLink, Trash2, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationCenter: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'border-green-500/30 bg-green-500/10';
      case 'warning':
        return 'border-yellow-500/30 bg-yellow-500/10';
      case 'error':
        return 'border-red-500/30 bg-red-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.action?.onClick) {
      notification.action.onClick();
    } else if (notification.action?.url) {
      window.open(notification.action.url, '_blank');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative hover:bg-muted/50"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Card className="border-0 shadow-2xl bg-gradient-to-br from-blue-500/5 via-blue-500/10 to-cyan-500/5 backdrop-blur-sm">
          <CardHeader className="pb-3 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 border-b border-blue-500/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-semibold">
                Notifications
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs hover:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                {notifications.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAll}
                    className="text-xs text-red-600 hover:text-red-700 hover:bg-red-500/20 dark:text-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <Separator className="bg-blue-500/20" />
          <CardContent className="p-0">
            <ScrollArea className="h-96">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="p-4 bg-blue-500/20 rounded-full mb-4">
                    <Bell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">No notifications yet</p>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    You'll see updates and announcements here
                  </p>
                </div>
              ) : (
                <div className="space-y-2 p-3">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`
                        relative p-4 rounded-lg border cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5
                        ${!notification.read 
                          ? 'bg-gradient-to-r from-blue-500/10 to-cyan-500/5 border-blue-500/30 shadow-md' 
                          : 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/30 dark:border-slate-700/30'
                        }
                        ${getNotificationColor(notification.type)}
                      `}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1 p-2 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                          <span className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-semibold text-sm leading-tight text-slate-900 dark:text-slate-100">
                              {notification.title}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeNotification(notification.id);
                                }}
                                className="h-6 w-6 p-0 hover:bg-red-500/20 text-slate-500 hover:text-red-600"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-slate-500 dark:text-slate-500">
                              {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                            </span>
                            {notification.action && (
                              <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                <span>{notification.action.label}</span>
                                <ExternalLink className="h-3 w-3" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;