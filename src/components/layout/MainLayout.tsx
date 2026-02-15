import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { useApp } from '@/context/AppContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { sidebarOpen } = useApp();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main
        className={cn(
          'pt-14 min-h-screen transition-all duration-300',
          isMobile ? 'pl-0 pb-16' : (sidebarOpen ? 'pl-56' : 'pl-14')
        )}
      >
        <div className="p-3 sm:p-4 md:p-6">
          {children}
        </div>
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
}
