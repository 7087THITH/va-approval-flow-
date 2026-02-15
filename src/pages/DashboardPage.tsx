import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProposalCard } from '@/components/workflow/ProposalCard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { 
  FilePlus, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  TrendingDown,
  RefreshCw,
  Building2,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TabKey = 'pending' | 'drafts' | 'completed' | 'rejected' | 'on_process';

export default function DashboardPage() {
  const { t, currentUser, proposals, setProposals, language } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const deptId = searchParams.get('dept');
  const deptName = searchParams.get('deptName') ? decodeURIComponent(searchParams.get('deptName')!) : deptId;

  const clearDeptFilter = () => {
    searchParams.delete('dept');
    searchParams.delete('deptName');
    setSearchParams(searchParams);
  };
  // Determine initial tab from URL path
  const getInitialTab = (): TabKey => {
    const path = location.pathname;
    if (path === '/drafts') return 'drafts';
    if (path === '/pending') return 'pending';
    if (path === '/completed') return 'completed';
    if (path === '/rejected') return 'rejected';
    return 'pending';
  };

  const [activeTab, setActiveTab] = useState<TabKey>(getInitialTab);

  // Filter proposals based on current user
  const myDrafts = proposals.filter(
    p => (p.status === 'draft' || p.status === 'returned') && p.requesterId === currentUser?.id
  );

  const handleEditDraft = (id: string) => {
    navigate(`/proposal/edit/${id}`);
  };

  const handleDeleteDraft = (id: string) => {
    if (confirm(language === 'th' ? 'ยืนยันลบเอกสารนี้?' : 'Confirm delete this proposal?')) {
      setProposals((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const pendingApprovals = proposals.filter(p => {
    if (p.status !== 'pending') return false;
    if (currentUser?.role === 'approver' || currentUser?.role === 'procurement') {
      return p.approvalRoute.steps.some(
        s => s.approverId === currentUser?.id && s.status === 'pending'
      );
    }
    return p.requesterId === currentUser?.id;
  });

  const completedProposals = proposals.filter(
    p => p.status === 'approved' && p.requesterId === currentUser?.id
  );

  const rejectedProposals = proposals.filter(
    p => p.status === 'rejected' && p.requesterId === currentUser?.id
  );

  const onProcessProposals = proposals.filter(p => {
    if (p.status !== 'pending') return false;
    return p.approvalRoute.steps.some(s => s.status === 'approved') && 
           p.approvalRoute.steps.some(s => s.status === 'pending');
  });

  // Calculate stats
  const totalSavings = proposals
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + Math.abs(p.cost.annualContribution), 0);

  const stats: { label: string; value: string | number; icon: React.ElementType; color: string; tab?: TabKey }[] = [
    { 
      label: language === 'th' ? 'ร่างของฉัน' : 'My Drafts', 
      value: myDrafts.length, 
      icon: FileText, 
      color: 'text-info',
      tab: 'drafts',
    },
    { 
      label: language === 'th' ? 'รอการอนุมัติ' : 'Pending', 
      value: pendingApprovals.length, 
      icon: Clock, 
      color: 'text-warning',
      tab: 'pending',
    },
    { 
      label: language === 'th' ? 'กำลังดำเนินการ' : 'On Process', 
      value: onProcessProposals.length, 
      icon: RefreshCw, 
      color: 'text-primary',
      tab: 'on_process',
    },
    { 
      label: language === 'th' ? 'อนุมัติแล้ว' : 'Approved', 
      value: completedProposals.length, 
      icon: CheckCircle, 
      color: 'text-success',
      tab: 'completed',
    },
    { 
      label: language === 'th' ? 'ถูกปฏิเสธ' : 'Rejected', 
      value: rejectedProposals.length, 
      icon: XCircle, 
      color: 'text-destructive',
      tab: 'rejected',
    },
  ];

  const handleStatClick = (tab?: TabKey) => {
    if (tab) {
      setActiveTab(tab);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Department Filter Badge */}
        {deptName && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-info-light border border-info-border text-sm">
            <Building2 size={16} className="text-info shrink-0" />
            <span className="text-foreground font-medium">{deptName}</span>
            <button
              onClick={clearDeptFilter}
              className="ml-auto p-0.5 rounded-md hover:bg-info/10 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear filter"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('dashboard')}</h1>
            <p className="text-muted-foreground">
              {language === 'th' 
                ? `ยินดีต้อนรับ, ${currentUser?.nameTh || currentUser?.name}` 
                : `Welcome back, ${currentUser?.name}`}
            </p>
          </div>
          <Button 
            variant="hero" 
            size="lg"
            onClick={() => navigate('/proposal/new')}
            className="gap-2 w-full sm:w-auto"
          >
            <FilePlus size={20} />
            <span className="hidden sm:inline">{t('newProposal')}</span>
            <span className="sm:hidden">{language === 'th' ? 'สร้างใหม่' : 'New'}</span>
          </Button>
        </div>

        {/* Stats Cards - Clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            const isClickable = !!stat.tab;
            const isActive = stat.tab === activeTab;
            return (
              <Card 
                key={idx} 
                className={cn(
                  "card-elevated transition-all duration-200",
                  isClickable && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
                  isActive && stat.tab === 'drafts' && "bg-info/10 border-info/30",
                  isActive && stat.tab === 'pending' && "bg-warning/10 border-warning/30",
                  isActive && stat.tab === 'completed' && "bg-success/10 border-success/30",
                  isActive && stat.tab === 'rejected' && "bg-destructive/10 border-destructive/30",
                  isActive && stat.tab === 'on_process' && "bg-primary/10 border-primary/30"
                )}
                onClick={() => handleStatClick(stat.tab)}
              >
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm text-muted-foreground">{stat.label}</p>
                      <p className={cn("text-lg sm:text-xl font-bold", stat.color)}>
                        {stat.value}
                      </p>
                    </div>
                    <div className={cn("p-2 sm:p-3 rounded-lg bg-muted hidden sm:block", stat.color)}>
                      <Icon size={24} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Tabs for different proposal views */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)} className="space-y-4">
          <TabsList className="bg-muted/50 p-1 w-full overflow-x-auto flex justify-start">
            <TabsTrigger value="pending" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <Clock size={14} />
              <span className="hidden sm:inline">{t('pendingApprovals')}</span>
              <span className="sm:hidden">{language === 'th' ? 'รอ' : 'Pending'}</span>
              {pendingApprovals.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-warning text-warning-foreground">
                  {pendingApprovals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="drafts" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <FileText size={14} />
              <span className="hidden sm:inline">{t('myDrafts')}</span>
              <span className="sm:hidden">{language === 'th' ? 'ร่าง' : 'Drafts'}</span>
              {myDrafts.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-info text-info-foreground">
                  {myDrafts.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <CheckCircle size={14} />
              <span className="hidden sm:inline">{t('completed')}</span>
              <span className="sm:hidden">{language === 'th' ? 'สำเร็จ' : 'Done'}</span>
            </TabsTrigger>
            <TabsTrigger value="on_process" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <RefreshCw size={14} />
              <span className="hidden sm:inline">{language === 'th' ? 'กำลังดำเนินการ' : 'On Process'}</span>
              <span className="sm:hidden">{language === 'th' ? 'ดำเนินการ' : 'Process'}</span>
              {onProcessProposals.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-primary text-primary-foreground">
                  {onProcessProposals.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="rejected" className="gap-1 sm:gap-2 text-xs sm:text-sm whitespace-nowrap">
              <XCircle size={14} />
              <span className="hidden sm:inline">{t('rejected')}</span>
              <span className="sm:hidden">{language === 'th' ? 'ปฏิเสธ' : 'Reject'}</span>
              {rejectedProposals.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-destructive text-destructive-foreground">
                  {rejectedProposals.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingApprovals.length === 0 ? (
              <EmptyState 
                icon={Clock}
                title={language === 'th' ? 'ไม่มีรายการรอดำเนินการ' : 'No pending approvals'}
                description={language === 'th' 
                  ? 'คุณยังไม่มีเอกสารที่รอการอนุมัติ' 
                  : 'You have no proposals waiting for action'}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {pendingApprovals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drafts" className="space-y-4">
            {myDrafts.length === 0 ? (
              <EmptyState 
                icon={FileText}
                title={language === 'th' ? 'ไม่มีร่างเอกสาร' : 'No drafts'}
                description={language === 'th' 
                  ? 'เริ่มสร้าง VA Proposal ใหม่' 
                  : 'Start by creating a new VA Proposal'}
                action={
                  <Button variant="outline" onClick={() => navigate('/proposal/new')} className="mt-4">
                    <FilePlus size={18} className="mr-2" />
                    {t('newProposal')}
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {myDrafts.map(proposal => (
                  <ProposalCard 
                    key={proposal.id} 
                    proposal={proposal}
                    onEdit={handleEditDraft}
                    onDelete={handleDeleteDraft}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedProposals.length === 0 ? (
              <EmptyState 
                icon={CheckCircle}
                title={language === 'th' ? 'ยังไม่มีเอกสารที่อนุมัติ' : 'No approved proposals'}
                description={language === 'th' 
                  ? 'เอกสารที่อนุมัติแล้วจะแสดงที่นี่' 
                  : 'Approved proposals will appear here'}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {completedProposals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="on_process" className="space-y-4">
            {onProcessProposals.length === 0 ? (
              <EmptyState 
                icon={RefreshCw}
                title={language === 'th' ? 'ไม่มีเอกสารกำลังดำเนินการ' : 'No proposals on process'}
                description={language === 'th' 
                  ? 'เอกสารที่กำลังดำเนินการจะแสดงที่นี่' 
                  : 'Proposals being processed will appear here'}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {onProcessProposals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedProposals.length === 0 ? (
              <EmptyState 
                icon={XCircle}
                title={language === 'th' ? 'ไม่มีเอกสารถูกปฏิเสธ' : 'No rejected proposals'}
                description={language === 'th' 
                  ? 'เอกสารที่ถูกปฏิเสธจะแสดงที่นี่' 
                  : 'Rejected proposals will appear here'}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rejectedProposals.map(proposal => (
                  <ProposalCard key={proposal.id} proposal={proposal} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  action 
}: { 
  icon: React.ElementType; 
  title: string; 
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Icon size={32} className="text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground">{title}</h3>
        <p className="text-muted-foreground max-w-sm mt-1">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}
