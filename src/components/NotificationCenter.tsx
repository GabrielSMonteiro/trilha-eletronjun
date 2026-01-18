import React, { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Trophy, Zap, BookOpen, MessageSquare, Info, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNotifications, Notification } from '@/contexts/NotificationContext';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const getNotificationIcon = (type: Notification['type'], iconName?: string) => {
  if (iconName) {
    switch (iconName) {
      case 'trophy': return <Trophy className="h-4 w-4" />;
      case 'zap': return <Zap className="h-4 w-4" />;
      case 'book': return <BookOpen className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'star': return <Star className="h-4 w-4" />;
      default: break;
    }
  }
  
  switch (type) {
    case 'success': return <Check className="h-4 w-4" />;
    case 'achievement': return <Trophy className="h-4 w-4" />;
    case 'warning': return <Zap className="h-4 w-4" />;
    case 'system': return <MessageSquare className="h-4 w-4" />;
    default: return <Info className="h-4 w-4" />;
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'success': return 'bg-success/20 text-success';
    case 'achievement': return 'bg-warning/20 text-warning';
    case 'warning': return 'bg-warning/20 text-warning';
    case 'system': return 'bg-primary/20 text-primary';
    default: return 'bg-muted text-muted-foreground';
  }
};

interface NotificationCenterProps {
  className?: string;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ className }) => {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, clearAll } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action?.href) {
      navigate(notification.action.href);
      setOpen(false);
    } else if (notification.action?.onClick) {
      notification.action.onClick();
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "relative border-border hover:border-primary/20 h-8 w-8 sm:h-9 sm:w-9 p-0",
            className
          )}
        >
          <Bell className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-destructive text-destructive-foreground text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 sm:w-96 p-0" 
        align="end"
        sideOffset={8}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="h-7 px-2 text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar lidas
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="h-[300px] sm:h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-3 hover:bg-muted/50 cursor-pointer transition-colors relative group",
                    !notification.read && "bg-primary/5"
                  )}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    <div className={cn(
                      "shrink-0 h-8 w-8 rounded-full flex items-center justify-center",
                      getNotificationColor(notification.type)
                    )}>
                      {getNotificationIcon(notification.type, notification.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn(
                          "text-sm font-medium truncate",
                          !notification.read ? "text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="shrink-0 h-2 w-2 bg-primary rounded-full mt-1.5" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.description}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true, locale: ptBR })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearNotification(notification.id);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {notifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="w-full text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpar todas
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};
