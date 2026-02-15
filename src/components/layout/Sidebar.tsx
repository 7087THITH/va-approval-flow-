import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { LayoutDashboard, FilePlus, FileText, Clock, CheckCircle, XCircle, History, Settings, LogOut, ChevronLeft, ChevronRight, Calculator, FolderKanban, Layers, ChevronDown, FileStack, BarChart3, ShieldCheck, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface NavItem {
  key: string;
  icon: React.ElementType;
  path: string;
  label: string;
  count?: number;
}

interface NavGroup {
  key: string;
  icon: React.ElementType;
  label: string;
  items: NavItem[];
}

export function Sidebar() {
  const {
    t,
    currentUser,
    logout,
    sidebarOpen,
    setSidebarOpen,
    proposals,
    language
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const pendingApprovals = proposals.filter((p) => p.status === 'pending' && p.approvalRoute.steps.some((s) => s.approverId === currentUser?.id && s.status === 'pending'));
  const myDrafts = proposals.filter((p) => (p.status === 'draft' || p.status === 'returned') && p.requesterId === currentUser?.id);
  const completedCount = proposals.filter((p) => p.status === 'approved' && p.requesterId === currentUser?.id).length;
  const rejectedCount = proposals.filter((p) => p.status === 'rejected' && p.requesterId === currentUser?.id).length;

  const navGroups: NavGroup[] = [
    {
      key: 'documents',
      icon: FileStack,
      label: language === 'th' ? 'เอกสาร' : 'Documents',
      items: [
        { key: 'dashboard', icon: LayoutDashboard, path: '/dashboard', label: t('dashboard') },
        { key: 'newProposal', icon: FilePlus, path: '/proposal/new', label: t('newProposal') },
        { key: 'batchCreate', icon: Layers, path: '/proposal/batch', label: language === 'th' ? 'สร้างหลายฉบับ' : 'Batch Create' },
        { key: 'myDrafts', icon: FileText, path: '/drafts', label: t('myDrafts'), count: myDrafts.length },
        { key: 'pendingApprovals', icon: Clock, path: '/pending', label: t('pendingApprovals'), count: pendingApprovals.length },
        { key: 'completed', icon: CheckCircle, path: '/completed', label: t('completed'), count: completedCount },
        { key: 'rejected', icon: XCircle, path: '/rejected', label: t('rejected'), count: rejectedCount },
        { key: 'history', icon: History, path: '/history', label: t('history') },
      ],
    },
    {
      key: 'reports',
      icon: BarChart3,
      label: language === 'th' ? 'รายงาน' : 'Reports',
      items: [
        { key: 'vaCalculate', icon: Calculator, path: '/va-calculate', label: 'VA Calculate' },
        { key: 'projects', icon: FolderKanban, path: '/projects', label: language === 'th' ? 'จัดการโปรเจค' : 'Projects' },
      ],
    },
  ];

  if (currentUser?.role === 'admin' || currentUser?.role === 'va_team') {
    navGroups.push({
      key: 'admin',
      icon: ShieldCheck,
      label: language === 'th' ? 'จัดการระบบ' : 'Admin',
      items: [
        ...(currentUser?.role === 'admin' ? [{ key: 'admin', icon: Settings, path: '/admin', label: language === 'th' ? 'จัดการระบบ' : 'Administration' }] : []),
      ],
    });
  }

  const getDefaultOpen = () => {
    const openSet = new Set<string>();
    navGroups.forEach((group) => {
      if (group.items.some((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))) {
        openSet.add(group.key);
      }
    });
    if (openSet.size === 0) openSet.add('documents');
    return openSet;
  };

  const [openGroups, setOpenGroups] = useState<Set<string>>(getDefaultOpen);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };

  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').toUpperCase();

  // On mobile: overlay drawer
  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        {/* Drawer */}
        <aside className={cn(
          'fixed left-0 top-0 z-50 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 ease-in-out',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-3 h-14 border-b border-sidebar-border">
            <div className="gap-2 flex items-end justify-center">
              <span className="font-bold text-muted-foreground text-2xl font-sans">VA</span>
              <span className="text-sm text-left font-sans font-bold text-muted-foreground">Workflow</span>
            </div>
            <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(false)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
            {navGroups.map((group) => {
              const GroupIcon = group.icon;
              const isOpen = openGroups.has(group.key);
              const hasActiveChild = group.items.some((item) => location.pathname === item.path);

              return (
                <div key={group.key}>
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150 text-[12px] font-semibold uppercase tracking-wider',
                      hasActiveChild && 'text-sidebar-foreground'
                    )}
                  >
                    <GroupIcon className="h-4 w-4 flex-shrink-0" />
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
                  </button>

                  <div className={cn(
                    'overflow-hidden transition-all duration-200 ease-in-out',
                    isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                  )}>
                    <div className="ml-2 pl-2.5 border-l border-sidebar-border space-y-0.5 py-1">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;
                        return (
                          <button
                            key={item.key}
                            onClick={() => handleNavigate(item.path)}
                            className={cn('nav-item w-full text-[13px]', isActive && 'nav-item-active')}
                          >
                            <Icon className="h-4 w-4 flex-shrink-0" />
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {item.count !== undefined && item.count > 0 && (
                              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground font-medium">
                                {item.count}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-2 border-t border-sidebar-border">
            {currentUser && (
              <div className="flex items-center gap-2">
                <button onClick={() => handleNavigate('/profile')} className="cursor-pointer">
                  <Avatar className="h-7 w-7">
                    {currentUser.avatar ? <AvatarImage src={currentUser.avatar} alt={currentUser.name} /> : null}
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-[10px]">
                      {getInitials(currentUser.name)}
                    </AvatarFallback>
                  </Avatar>
                </button>
                <button onClick={() => handleNavigate('/profile')} className="flex-1 min-w-0 text-left cursor-pointer hover:opacity-80">
                  <p className="text-xs font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate capitalize">{currentUser.role}</p>
                </button>
                <Button variant="ghost" size="icon-sm" onClick={handleLogout} className="text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7">
                  <LogOut className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className={cn('fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col', sidebarOpen ? 'w-56' : 'w-14')}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 h-14 border-b border-sidebar-border">
        {sidebarOpen && (
          <div className="gap-2 flex items-end justify-center">
            <span className="font-bold text-muted-foreground text-2xl font-sans">VA</span>
            <span className="text-sm text-left font-sans font-bold text-muted-foreground">Proposal workflow</span>
          </div>
        )}
        <Button variant="ghost" size="icon-sm" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7">
          {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
        {navGroups.map((group) => {
          const GroupIcon = group.icon;
          const isOpen = openGroups.has(group.key);
          const hasActiveChild = group.items.some((item) => location.pathname === item.path);

          return (
            <div key={group.key}>
              <button
                onClick={() => sidebarOpen ? toggleGroup(group.key) : navigate(group.items[0].path)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors duration-150 text-[12px] font-semibold uppercase tracking-wider',
                  hasActiveChild && 'text-sidebar-foreground'
                )}
              >
                <GroupIcon className="h-4 w-4 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="flex-1 text-left">{group.label}</span>
                    <ChevronDown className={cn('h-3.5 w-3.5 transition-transform duration-200', isOpen && 'rotate-180')} />
                  </>
                )}
              </button>

              {sidebarOpen && (
                <div className={cn(
                  'overflow-hidden transition-all duration-200 ease-in-out',
                  isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                )}>
                  <div className="ml-2 pl-2.5 border-l border-sidebar-border space-y-0.5 py-1">
                    {group.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.key}
                          onClick={() => navigate(item.path)}
                          className={cn('nav-item w-full text-[13px]', isActive && 'nav-item-active')}
                        >
                          <Icon className="h-4 w-4 flex-shrink-0" />
                          <span className="flex-1 text-left truncate">{item.label}</span>
                          {item.count !== undefined && item.count > 0 && (
                            <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground font-medium">
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {!sidebarOpen && (
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.key}
                        onClick={() => navigate(item.path)}
                        title={item.label}
                        className={cn('nav-item w-full justify-center', isActive && 'nav-item-active')}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-2 border-t border-sidebar-border">
        {currentUser && (
          <div className={cn('flex items-center gap-2', !sidebarOpen && 'justify-center')}>
            <button onClick={() => navigate('/profile')} className="cursor-pointer">
              <Avatar className="h-7 w-7">
                {currentUser.avatar ? <AvatarImage src={currentUser.avatar} alt={currentUser.name} /> : null}
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-[10px]">
                  {getInitials(currentUser.name)}
                </AvatarFallback>
              </Avatar>
            </button>
            {sidebarOpen && (
              <button onClick={() => navigate('/profile')} className="flex-1 min-w-0 text-left cursor-pointer hover:opacity-80">
                <p className="text-xs font-medium text-sidebar-foreground truncate">{currentUser.name}</p>
                <p className="text-[10px] text-sidebar-foreground/50 truncate capitalize">{currentUser.role}</p>
              </button>
            )}
            {sidebarOpen && (
              <Button variant="ghost" size="icon-sm" onClick={handleLogout} className="text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent h-7 w-7">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
