import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, FilePlus, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';

const navItems = [
  { key: 'dashboard', icon: LayoutDashboard, path: '/dashboard', labelEn: 'Dashboard', labelTh: 'แดชบอร์ด' },
  { key: 'new', icon: FilePlus, path: '/proposal/new', labelEn: 'New', labelTh: 'สร้างใหม่' },
  { key: 'history', icon: History, path: '/history', labelEn: 'History', labelTh: 'ประวัติ' },
  { key: 'profile', icon: User, path: '/profile', labelEn: 'Profile', labelTh: 'โปรไฟล์' },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language } = useApp();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-14">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          const label = language === 'th' ? item.labelTh : item.labelEn;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive && 'scale-110')} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
