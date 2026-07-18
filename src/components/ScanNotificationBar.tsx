import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Bell, CheckCircle2, ChevronRight, CirclePause, CircleStop, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SCAN_STATUS_EVENT, ScanStatusEventDetail } from '@/services/scanStatusEvents';
import { cn } from '@/lib/utils';

const statusContent = {
  completed: {
    title: 'Scan completed',
    message: 'The scan finished successfully.',
    icon: CheckCircle2,
    iconClassName: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  failed: {
    title: 'Scan failed',
    message: 'The scan ended with an error.',
    icon: AlertTriangle,
    iconClassName: 'bg-destructive/15 text-destructive',
  },
  paused: {
    title: 'Scan paused',
    message: 'The scan is waiting to be resumed.',
    icon: CirclePause,
    iconClassName: 'bg-primary/15 text-primary',
  },
  stopped: {
    title: 'Scan stopped',
    message: 'The scan was stopped before completion.',
    icon: CircleStop,
    iconClassName: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
};

type ScanNotice = ScanStatusEventDetail & { receivedAt: Date };

const ScanNotificationContent = () => {
  const [notices, setNotices] = useState<ScanNotice[]>([]);
  const [activeNotice, setActiveNotice] = useState<ScanNotice | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);

  useEffect(() => {
    const handleStatus = (event: Event) => {
      const notice = {
        ...(event as CustomEvent<ScanStatusEventDetail>).detail,
        receivedAt: new Date(),
      };
      setNotices((current) => [notice, ...current].slice(0, 20));
      setActiveNotice(notice);
    };

    window.addEventListener(SCAN_STATUS_EVENT, handleStatus);
    return () => window.removeEventListener(SCAN_STATUS_EVENT, handleStatus);
  }, []);

  if (notices.length === 0) return null;

  const content = activeNotice ? statusContent[activeNotice.status] : null;
  const Icon = content?.icon ?? Bell;

  return (
    <>
      <div
        role={activeNotice ? 'status' : undefined}
        aria-live={activeNotice?.status === 'failed' ? 'assertive' : 'polite'}
        className="surface-header relative z-20 flex min-h-12 items-center gap-3 border-b border-primary/15 px-3 py-2 text-foreground shadow-sm sm:px-6"
      >
        <span className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          content?.iconClassName ?? 'bg-primary/10 text-primary',
        )}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <div className="min-w-0 flex-1 text-sm sm:flex sm:items-baseline sm:gap-2">
          <p className="font-semibold">{content?.title ?? 'Scan activity'}</p>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            {activeNotice
              ? `${activeNotice.target} · ${content?.message}`
              : `${notices.length} scan ${notices.length === 1 ? 'update' : 'updates'}`}
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => setActivityOpen(true)}
        >
          <Bell className="mr-2 h-4 w-4" />
          Activity
        </Button>
        {activeNotice && (
          <Button variant="ghost" size="sm" asChild className="hidden h-8 shrink-0 hover:bg-primary/10 sm:inline-flex">
            <Link to={`/scan/${activeNotice.id}`}>View scan</Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={() => activeNotice ? setActiveNotice(null) : setNotices([])}
          aria-label={activeNotice ? 'Dismiss scan notification' : 'Dismiss scan activity'}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={activityOpen} onOpenChange={setActivityOpen}>
        <DialogContent className="max-w-lg overflow-hidden border-border bg-card p-0 text-card-foreground">
          <DialogHeader className="border-b border-border px-6 py-5 text-left">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <DialogTitle>Scan activity</DialogTitle>
            <DialogDescription>
              Status updates received while you were away from Scan Results.
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
            {notices.map((notice) => {
              const noticeContent = statusContent[notice.status];
              const NoticeIcon = noticeContent.icon;
              return (
                <Link
                  key={`${notice.id}-${notice.status}-${notice.receivedAt.getTime()}`}
                  to={`/scan/${notice.id}`}
                  onClick={() => setActivityOpen(false)}
                  className="group flex items-center gap-3 border-b border-border px-6 py-4 transition-colors last:border-b-0 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', noticeContent.iconClassName)}>
                    <NoticeIcon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{noticeContent.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{notice.target}</span>
                    <time className="block text-xs text-muted-foreground" dateTime={notice.receivedAt.toISOString()}>
                      {notice.receivedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const ScanNotificationBar = () => {
  const location = useLocation();
  if (location.pathname.startsWith('/scan/')) return null;
  return <ScanNotificationContent />;
};

export default ScanNotificationBar;
