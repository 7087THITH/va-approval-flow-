import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useNotifications, Notification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
  Info,
  Send,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { th, enUS } from 'date-fns/locale';

const typeConfig: Record<Notification['type'], { icon: typeof Bell; color: string }> = {
  approval_pending: { icon: Clock, color: 'text-warning' },
  approved: { icon: CheckCircle, color: 'text-success' },
  rejected: { icon: XCircle, color: 'text-destructive' },
  returned: { icon: RotateCcw, color: 'text-info' },
  return_update: { icon: RotateCcw, color: 'text-info' },
  submitted: { icon: Send, color: 'text-primary' },
  info: { icon: Info, color: 'text-muted-foreground' },
};

export function NotificationBell() {
  const { language } = useApp();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (notif: Notification) => {
    markAsRead(notif.id);
    if (notif.proposalId) {
      navigate(`/proposal/${notif.proposalId}`);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[380px] p-0" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="text-sm font-semibold">
            {language === 'th' ? 'การแจ้งเตือน' : 'Notifications'}
          </h3>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={markAllAsRead}
              >
                <CheckCheck className="h-3 w-3" />
                {language === 'th' ? 'อ่านทั้งหมด' : 'Read all'}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                onClick={clearAll}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Notification List */}
        <ScrollArea className="max-h-[400px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Bell className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {language === 'th' ? 'ไม่มีการแจ้งเตือน' : 'No notifications'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notif) => {
                const config = typeConfig[notif.type];
                const Icon = config.icon;

                return (
                  <button
                    key={notif.id}
                    onClick={() => handleClick(notif)}
                    className={cn(
                      'w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors',
                      !notif.read && 'bg-primary/5'
                    )}
                  >
                    <div className={cn('mt-0.5 p-1.5 rounded-full bg-muted', config.color)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn('text-xs font-medium truncate', !notif.read && 'text-foreground')}>
                          {language === 'th' ? notif.titleTh : notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {language === 'th' ? notif.messageTh : notif.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        {formatDistanceToNow(notif.createdAt, {
                          addSuffix: true,
                          locale: language === 'th' ? th : enUS,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
