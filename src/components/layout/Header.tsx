import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { useApiHealth } from '@/hooks/useApiHealth';
import { Button } from '@/components/ui/button';
import { Globe, Menu, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function Header() {
  const { language, setLanguage, sidebarOpen, setSidebarOpen } = useApp();
  const isMobile = useIsMobile();
  const { status } = useApiHealth();

  return (
    <header
      className="fixed top-0 right-0 z-30 h-14 glass border-b flex items-center justify-between px-3 sm:px-5 transition-all duration-300"
      style={{ left: isMobile ? 0 : (sidebarOpen ? '14rem' : '3.5rem') }}
    >
      <div className="flex items-center gap-2 flex-1">
        {/* Hamburger menu for mobile */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setSidebarOpen(true)}
            className="h-8 w-8"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <Input
          placeholder={language === 'th' ? 'ค้นหาเอกสาร...' : 'Search proposals...'}
          className="h-8 text-xs bg-muted/40 border-0 focus-visible:ring-1 max-w-sm"
        />
      </div>

      <div className="flex items-center gap-1">
        {/* API Health Indicator */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className={
                status === 'connected'
                  ? 'text-green-500'
                  : status === 'disconnected'
                  ? 'text-destructive'
                  : 'text-muted-foreground'
              }
              onClick={() => window.location.reload()}
            >
              {status === 'checking' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : status === 'connected' ? (
                <Wifi className="h-4 w-4" />
              ) : (
                <WifiOff className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {status === 'connected'
              ? 'API Connected'
              : status === 'disconnected'
              ? 'API Disconnected — click to retry'
              : 'Checking connection...'}
          </TooltipContent>
        </Tooltip>

        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setLanguage('en')}>
              <span className="mr-2">🇺🇸</span> English
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setLanguage('th')}>
              <span className="mr-2">🇹🇭</span> ภาษาไทย
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <NotificationBell />
      </div>
    </header>
  );
}
