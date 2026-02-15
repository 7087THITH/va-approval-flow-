import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, ConfidentialityBadge } from '@/components/workflow/StatusBadge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  FileText,
  User,
  Building,
  Calendar,
  Package,
  Calculator,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  Download,
  FileSpreadsheet,
  History,
  Check,
  X,
  RotateCcw,
  Send,
  AlertTriangle,
  Pencil,
  Trash2,
  Undo2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JudgementType, ChangeType, RequestContent, DistributionTarget } from '@/types/workflow';
import { VATemplatePreview } from '@/components/workflow/VATemplatePreview';
import { exportProposalToExcel } from '@/lib/excelExport';
import { RDCenterDispatch } from '@/components/workflow/RDCenterDispatch';
import { VACheckSheetComponent } from '@/components/workflow/VACheckSheet';
import { organizationStructure, flattenOrgNodes } from '@/data/organizationStructure';

const CHANGE_TYPES: Record<ChangeType, { en: string; th: string }> = {
  material_change: { en: 'Material Change', th: 'เปลี่ยนวัสดุ' },
  design_change: { en: 'Design Change', th: 'เปลี่ยนแบบ' },
  supplier_change: { en: 'Supplier Change', th: 'เปลี่ยนซัพพลายเออร์' },
  process_change: { en: 'Process Change', th: 'เปลี่ยนกระบวนการ' },
  cost_reduction: { en: 'Cost Reduction', th: 'ลดต้นทุน' },
};

const REQUEST_CONTENTS: Record<RequestContent, { en: string; th: string }> = {
  material_approval: { en: 'Material Approval', th: 'อนุมัติวัสดุ' },
  revise_daikin_standard: { en: 'Revise Daikin Standard', th: 'แก้ไขมาตรฐานไดกิ้น' },
  manufacturer_approval: { en: 'Manufacturer Approval', th: 'อนุมัติผู้ผลิต' },
  drawing_approval: { en: 'Drawing Approval', th: 'อนุมัติแบบ' },
  components_approval: { en: 'Components Approval', th: 'อนุมัติชิ้นส่วน' },
};

const DISTRIBUTION_TARGETS: Record<DistributionTarget, { en: string; th: string }> = {
  b_shiga: { en: 'B/Shiga', th: 'B/ชิกะ' },
  k_kanaoka: { en: 'K/Kanaoka', th: 'K/คะนะโอกะ' },
  refrigeration_div_pic: { en: 'Refrigeration Div. PIC', th: 'PIC แผนกเครื่องทำความเย็น' },
  quality_assurance: { en: 'Quality Assurance', th: 'ประกันคุณภาพ' },
  production_control: { en: 'Production Control', th: 'ควบคุมการผลิต' },
  procurement: { en: 'Procurement', th: 'จัดซื้อ' },
};

export default function ProposalDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { proposals, setProposals, currentUser, language, t, users } = useApp();
  const { addNotification } = useNotifications();
  
  const [comment, setComment] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [showEvalDialog, setShowEvalDialog] = useState(false);
  const [selectedEvalTeam, setSelectedEvalTeam] = useState('');
  const [evalComment, setEvalComment] = useState('');

  // R&D Center detection
  const rrdFunction = organizationStructure.find(n => n.id === 'rrd');
  const rddDivision = rrdFunction?.children?.find(n => n.id === 'rdd');
  const rdGroups = rddDivision?.children || [];
  const centerGroup = rdGroups.find(g => g.id === 'dcg');
  const isCenterUser = currentUser && centerGroup && (
    currentUser.department === centerGroup.name || 
    currentUser.department === centerGroup.id ||
    currentUser.department === 'DEVELOPMENT CENTER GROUP'
  );

  const proposal = proposals.find(p => p.id === id);

  // VA Team detection
  const isVATeamUser = currentUser && (
    currentUser.department === 'VA TEAM' || 
    currentUser.department === 'PROCUREMENT STRATEGY SUB-GROUP' ||
    currentUser.department === 'va_team'
  );

  // Check if current step is VA Team step (step order 1, first step)
  const isVATeamStep = proposal?.approvalRoute?.steps?.[0]?.approverId === currentUser?.id && 
    proposal?.currentStepIndex === 0 && proposal?.status === 'pending';

  const handleVACheckSheetComplete = (checkSheet: any) => {
    if (!proposal) return;
    const newAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      userId: currentUser!.id,
      userName: currentUser!.name,
      action: 'VA Team check sheet completed — approved & forwarded',
      details: `All ${checkSheet.items.length} items verified${checkSheet.comment ? ` | Comment: ${checkSheet.comment}` : ''}`,
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposal.id) {
        const updatedSteps = p.approvalRoute.steps.map((step, idx) => {
          if (idx === 0 && step.approverId === currentUser?.id) {
            return { ...step, status: 'approved' as const, judgement: 'approve' as const, comment: 'VA check sheet completed', actionAt: new Date() };
          }
          return step;
        });

        return {
          ...p,
          vaCheckSheet: { ...checkSheet, checkedById: currentUser!.id, checkedByName: currentUser!.name, checkedAt: new Date() },
          approvalRoute: { ...p.approvalRoute, steps: updatedSteps },
          currentStepIndex: 1,
          auditLog: [...p.auditLog, newAuditEntry],
          updatedAt: new Date(),
        };
      }
      return p;
    }));

    addNotification({
      type: 'approval_pending',
      title: 'VA Team Screening Passed',
      titleTh: 'ผ่านการคัดกรอง VA Team',
      message: `${proposal.proposalNo || 'Draft'} "${proposal.partName}" — forwarded by VA Team`,
      messageTh: `${proposal.proposalNo || 'ร่าง'} "${proposal.partName}" — ส่งต่อโดย VA Team`,
      proposalId: proposal.id,
      proposalNo: proposal.proposalNo,
      fromUserId: currentUser?.id,
      fromUserName: currentUser?.name,
    });

    navigate('/dashboard');
  };

  if (!proposal) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <FileText className="text-muted-foreground" size={48} />
          <h2 className="mt-4 text-xl font-semibold">Proposal Not Found</h2>
          <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
            <ArrowLeft size={18} className="mr-2" />
            Go Back
          </Button>
        </div>
      </MainLayout>
    );
  }

  const isApprover = proposal.approvalRoute.steps.some(
    s => s.approverId === currentUser?.id && s.status === 'pending'
  );

  const currentApproverStep = proposal.approvalRoute.steps.find(
    s => s.approverId === currentUser?.id && s.status === 'pending'
  );

  const handleAction = (judgement: JudgementType) => {
    // For go_to_evaluation, show team selection dialog instead
    if (judgement === 'go_to_evaluation') {
      setShowEvalDialog(true);
      return;
    }

    if (judgement !== 'approve' && !comment.trim()) {
      alert(language === 'th' ? 'กรุณาระบุเหตุผล' : 'Please provide a reason');
      return;
    }

    let newStatus: typeof proposal.status;
    if (judgement === 'approve') {
      newStatus = proposal.currentStepIndex >= proposal.approvalRoute.steps.length - 1 ? 'approved' : 'pending';
    } else if (judgement === 'reject') {
      newStatus = 'rejected';
    } else if (judgement === 'return') {
      newStatus = 'returned';
    } else if (judgement === 'return_update') {
      newStatus = 'returned';
    } else {
      newStatus = 'revision';
    }

    const updatedSteps = proposal.approvalRoute.steps.map((step) => {
      if (step.approverId === currentUser?.id && step.status === 'pending') {
        return {
          ...step,
          status: judgement === 'approve' ? 'approved' as const : 
                  judgement === 'reject' ? 'rejected' as const : 'pending' as const,
          judgement,
          comment: comment || undefined,
          actionAt: new Date(),
        };
      }
      // Reset all steps to pending on return
      if (judgement === 'return' || judgement === 'return_update') {
        return { ...step, status: 'pending' as const, judgement: undefined, comment: undefined, actionAt: undefined };
      }
      return step;
    });

    const actionLabel = judgement === 'approve' ? 'Approved' : 
      judgement === 'reject' ? 'Rejected' : 
      judgement === 'request_to_dil' ? 'Requested to DIL' :
      judgement === 'return' ? 'Returned to requester' :
      judgement === 'return_update' ? 'Returned for update' : 'Action taken';

    const newAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      userId: currentUser!.id,
      userName: currentUser!.name,
      action: actionLabel,
      details: comment || undefined,
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposal.id) {
        return {
          ...p,
          status: newStatus,
          judgement: newStatus === 'approved' || newStatus === 'rejected' ? judgement : p.judgement,
          judgementReason: comment || p.judgementReason,
          approvalRoute: {
            ...p.approvalRoute,
            steps: updatedSteps,
          },
          currentStepIndex: judgement === 'approve' ? p.currentStepIndex + 1 : 
                           (judgement === 'return' || judgement === 'return_update') ? 0 : p.currentStepIndex,
          auditLog: [...p.auditLog, newAuditEntry],
          updatedAt: new Date(),
        };
      }
      return p;
    }));

    // Create notification for the proposal owner
    const notifType = judgement === 'approve' ? 'approved' as const
      : judgement === 'reject' ? 'rejected' as const
      : (judgement === 'return' || judgement === 'return_update') ? 'returned' as const
      : 'info' as const;

    const notifTitleEn = judgement === 'approve' ? 'Proposal Approved'
      : judgement === 'reject' ? 'Proposal Rejected'
      : judgement === 'return' ? 'Proposal Returned'
      : judgement === 'return_update' ? 'Proposal Returned for Update'
      : 'Proposal Update';

    const notifTitleTh = judgement === 'approve' ? 'เอกสารได้รับการอนุมัติ'
      : judgement === 'reject' ? 'เอกสารถูกปฏิเสธ'
      : judgement === 'return' ? 'เอกสารถูกส่งคืน'
      : judgement === 'return_update' ? 'เอกสารถูกส่งคืนเพื่ออัพเดท'
      : 'อัพเดทเอกสาร';

    addNotification({
      type: notifType,
      title: notifTitleEn,
      titleTh: notifTitleTh,
      message: `${proposal.proposalNo || 'Draft'} "${proposal.partName}" — ${actionLabel} by ${currentUser?.name}`,
      messageTh: `${proposal.proposalNo || 'ร่าง'} "${proposal.partName}" — ${actionLabel} โดย ${currentUser?.nameTh || currentUser?.name}`,
      proposalId: proposal.id,
      proposalNo: proposal.proposalNo,
      fromUserId: currentUser?.id,
      fromUserName: currentUser?.name,
    });

    navigate('/dashboard');
  };

  const handleDeleteProposal = () => {
    if (confirm(language === 'th' ? 'ยืนยันลบเอกสารนี้?' : 'Confirm delete this proposal?')) {
      setProposals(prev => prev.filter(p => p.id !== proposal.id));
      navigate('/dashboard');
    }
  };

  const handleRDDispatch = (assignedTeams: string[], assignedMembers: string[], notes: string) => {
    const newAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      userId: currentUser!.id,
      userName: currentUser!.name,
      action: 'R&D Center dispatched',
      details: `Teams: ${assignedTeams.join(', ')}${assignedMembers.length > 0 ? ` | Members: ${assignedMembers.join(', ')}` : ''}${notes ? ` | Notes: ${notes}` : ''}`,
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposal.id) {
        return {
          ...p,
          auditLog: [...p.auditLog, newAuditEntry],
          updatedAt: new Date(),
        };
      }
      return p;
    }));

    // Notify requester
    addNotification({
      type: 'info',
      title: 'R&D Team Assigned',
      titleTh: 'มอบหมายทีม R&D แล้ว',
      message: `${proposal.proposalNo || 'Draft'} "${proposal.partName}" — assigned by ${currentUser?.name}`,
      messageTh: `${proposal.proposalNo || 'ร่าง'} "${proposal.partName}" — มอบหมายโดย ${currentUser?.nameTh || currentUser?.name}`,
      proposalId: proposal.id,
      proposalNo: proposal.proposalNo,
      fromUserId: currentUser?.id,
      fromUserName: currentUser?.name,
    });
  };

  // R&D teams for evaluation selection
  const rdTeams = rdGroups.filter(g => g.id !== 'dcg'); // exclude center group itself

  const handleSendToEvaluation = () => {
    if (!selectedEvalTeam) {
      alert(language === 'th' ? 'กรุณาเลือกทีม R&D' : 'Please select an R&D team');
      return;
    }

    const team = rdTeams.find(t => t.id === selectedEvalTeam);
    const teamName = team?.name || selectedEvalTeam;

    const newAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      userId: currentUser!.id,
      userName: currentUser!.name,
      action: 'Sent to evaluation',
      details: `Team: ${teamName}${evalComment ? ` | Comment: ${evalComment}` : ''}`,
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposal.id) {
        return {
          ...p,
          status: 'evaluation' as const,
          evaluation: {
            assignedTeamId: selectedEvalTeam,
            assignedTeamName: teamName,
            assignedById: currentUser!.id,
            assignedByName: currentUser!.name,
            assignedAt: new Date(),
            returnToStepIndex: p.currentStepIndex,
          },
          approvalRoute: {
            ...p.approvalRoute,
            steps: p.approvalRoute.steps.map(step => {
              if (step.approverId === currentUser?.id && step.status === 'pending') {
                return { ...step, judgement: 'go_to_evaluation' as const, comment: evalComment || 'Sent to evaluation', actionAt: new Date() };
              }
              return step;
            }),
          },
          auditLog: [...p.auditLog, newAuditEntry],
          updatedAt: new Date(),
        };
      }
      return p;
    }));

    addNotification({
      type: 'info',
      title: 'Sent to Evaluation',
      titleTh: 'ส่งประเมินแล้ว',
      message: `${proposal.proposalNo || 'Draft'} "${proposal.partName}" — sent to ${teamName}`,
      messageTh: `${proposal.proposalNo || 'ร่าง'} "${proposal.partName}" — ส่งไปยัง ${teamName}`,
      proposalId: proposal.id,
      proposalNo: proposal.proposalNo,
      fromUserId: currentUser?.id,
      fromUserName: currentUser?.name,
    });

    setShowEvalDialog(false);
    setSelectedEvalTeam('');
    setEvalComment('');
    navigate('/dashboard');
  };

  const handleCompleteEvaluation = () => {
    if (!evalComment.trim()) {
      alert(language === 'th' ? 'กรุณาระบุผลการประเมิน' : 'Please provide evaluation result');
      return;
    }

    const newAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date(),
      userId: currentUser!.id,
      userName: currentUser!.name,
      action: 'Evaluation completed',
      details: evalComment,
    };

    setProposals(prev => prev.map(p => {
      if (p.id === proposal.id) {
        const returnIdx = p.evaluation?.returnToStepIndex ?? p.currentStepIndex;
        return {
          ...p,
          status: 'pending' as const,
          evaluation: {
            ...p.evaluation,
            evaluatorComment: evalComment,
            evaluationCompleted: true,
            completedAt: new Date(),
            completedById: currentUser!.id,
            completedByName: currentUser!.name,
          },
          approvalRoute: {
            ...p.approvalRoute,
            steps: p.approvalRoute.steps.map((step, idx) => {
              // Reset the step that sent to evaluation back to pending
              if (step.judgement === 'go_to_evaluation') {
                return { ...step, status: 'pending' as const, judgement: undefined, comment: undefined, actionAt: undefined };
              }
              return step;
            }),
          },
          currentStepIndex: returnIdx,
          auditLog: [...p.auditLog, newAuditEntry],
          updatedAt: new Date(),
        };
      }
      return p;
    }));

    addNotification({
      type: 'info',
      title: 'Evaluation Completed',
      titleTh: 'ประเมินเสร็จสิ้น',
      message: `${proposal.proposalNo || 'Draft'} "${proposal.partName}" — evaluation completed by ${currentUser?.name}`,
      messageTh: `${proposal.proposalNo || 'ร่าง'} "${proposal.partName}" — ประเมินเสร็จสิ้นโดย ${currentUser?.nameTh || currentUser?.name}`,
      proposalId: proposal.id,
      proposalNo: proposal.proposalNo,
      fromUserId: currentUser?.id,
      fromUserName: currentUser?.name,
    });

    setEvalComment('');
    navigate('/dashboard');
  };


  const isOwnerDraft = proposal.requesterId === currentUser?.id && 
    (proposal.status === 'draft' || proposal.status === 'returned');

  const getLabel = (type: ChangeType) => CHANGE_TYPES[type]?.[language] || type;
  const getRequestLabel = (type: RequestContent) => REQUEST_CONTENTS[type]?.[language] || type;
  const getDistLabel = (type: DistributionTarget) => DISTRIBUTION_TARGETS[type]?.[language] || type;

  return (
    <MainLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft size={20} />
            </Button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-foreground">
                  {proposal.partName}
                </h1>
                <StatusBadge status={proposal.status} />
                <ConfidentialityBadge level={proposal.confidentiality} />
              </div>
              <p className="text-muted-foreground">
                {proposal.proposalNo || 'Draft'} • {format(proposal.createdAt, 'MMMM d, yyyy')}
              </p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isOwnerDraft && (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate(`/proposal/edit/${proposal.id}`)}>
                  <Pencil size={16} className="mr-1.5" />
                  {language === 'th' ? 'แก้ไข' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" className="text-destructive" onClick={handleDeleteProposal}>
                  <Trash2 size={16} className="mr-1.5" />
                  {language === 'th' ? 'ลบ' : 'Delete'}
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Download size={16} className="mr-1.5" />
              {t('exportPdf')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportProposalToExcel(proposal)}>
              <FileSpreadsheet size={16} className="mr-1.5" />
              {t('exportExcel')}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details" className="gap-1.5 text-xs">
                  {language === 'th' ? 'รายละเอียด' : 'Details'}
                </TabsTrigger>
                <TabsTrigger value="template" className="gap-1.5 text-xs">
                  {language === 'th' ? 'ตัวอย่างเอกสาร' : 'Template Preview'}
                </TabsTrigger>
                <TabsTrigger value="audit" className="gap-1.5 text-xs">
                  {language === 'th' ? 'ประวัติ' : 'Audit Log'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4 mt-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User size={18} />
                      {language === 'th' ? 'ข้อมูลผู้ขอ' : 'Requester Information'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('requester')}:</span>
                      <p className="font-medium">{proposal.requesterName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('department')}:</span>
                      <p className="font-medium">
                        {language === 'th' && proposal.departmentTh ? proposal.departmentTh : proposal.department}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('plant')}:</span>
                      <p className="font-medium">{proposal.plant}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('date')}:</span>
                      <p className="font-medium">{format(proposal.createdAt, 'yyyy-MM-dd')}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Part Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Package size={18} />
                      {t('partInfo')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">{t('partName')}:</span>
                      <p className="font-medium text-lg">{proposal.partName}</p>
                    </div>
                    {proposal.partModel && (
                      <div>
                        <span className="text-muted-foreground">Model:</span>
                        <p className="font-medium">{proposal.partModel}</p>
                      </div>
                    )}
                    {proposal.relatedDrawingNo && (
                      <div>
                        <span className="text-muted-foreground">{t('relatedDrawingNo')}:</span>
                        <p className="font-medium">{proposal.relatedDrawingNo}</p>
                      </div>
                    )}
                    {proposal.supplierManufacturer && (
                      <div>
                        <span className="text-muted-foreground">{t('supplierManufacturer')}:</span>
                        <p className="font-medium">{proposal.supplierManufacturer}</p>
                      </div>
                    )}
                    {proposal.initialProductionDate && (
                      <div>
                        <span className="text-muted-foreground">{t('initialProductionDate')}:</span>
                        <p className="font-medium">{format(proposal.initialProductionDate, 'yyyy-MM-dd')}</p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <span className="text-muted-foreground">{t('changeType')}:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {proposal.changeType.map(type => (
                          <Badge key={type} variant="secondary">{getLabel(type)}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Cost Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calculator size={18} />
                      {t('costEffect')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{t('beforeCost')}</p>
                        <p className="text-xl font-bold">{proposal.cost.beforeCost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{proposal.cost.currency}/pc</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">{t('afterCost')}</p>
                        <p className="text-xl font-bold">{proposal.cost.afterCost.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{proposal.cost.currency}/pc</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-lg text-center",
                        proposal.cost.costDifference < 0 ? "bg-success-light" : "bg-destructive-light"
                      )}>
                        <p className="text-sm text-muted-foreground">{t('costDifference')}</p>
                        <p className={cn(
                          "text-xl font-bold",
                          proposal.cost.costDifference < 0 ? "text-success" : "text-destructive"
                        )}>
                          {proposal.cost.costDifference < 0 ? '' : '+'}{proposal.cost.costDifference.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">{proposal.cost.currency}/pc</p>
                      </div>
                      <div className={cn(
                        "p-4 rounded-lg text-center",
                        proposal.cost.annualContribution < 0 ? "bg-success-light" : "bg-destructive-light"
                      )}>
                        <p className="text-sm text-muted-foreground">{t('annualContribution')}</p>
                        <p className={cn(
                          "text-xl font-bold",
                          proposal.cost.annualContribution < 0 ? "text-success" : "text-destructive"
                        )}>
                          {proposal.cost.annualContribution < 0 ? '' : '+'}{proposal.cost.annualContribution.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">K {proposal.cost.currency}/yr</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3 text-center">
                      Volume: {proposal.cost.volumePerYear.toLocaleString()} pcs/year
                    </p>
                  </CardContent>
                </Card>

                {/* Request Contents */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('requestContents')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {proposal.requestContents.map(item => (
                        <Badge key={item} variant="outline" className="px-3 py-1">
                          <Check size={14} className="mr-1 text-success" />
                          {getRequestLabel(item)}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Distribution List */}
                {proposal.distributionList.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('distributionList')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {proposal.distributionList.map(item => (
                          <Badge key={item} variant="secondary">
                            {getDistLabel(item)}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Notes */}
                {proposal.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare size={18} />
                        {language === 'th' ? 'หมายเหตุ' : 'Notes'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{proposal.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="audit" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <History size={18} />
                      {language === 'th' ? 'ประวัติการดำเนินการ' : 'Activity History'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {proposal.auditLog.map((entry, idx) => (
                        <div key={entry.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                              <Clock size={14} className="text-primary-foreground" />
                            </div>
                            {idx < proposal.auditLog.length - 1 && (
                              <div className="w-0.5 flex-1 bg-border mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{entry.action}</span>
                              <span className="text-xs text-muted-foreground">
                                {format(entry.timestamp, 'MMM d, yyyy HH:mm')}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              by {entry.userName}
                            </p>
                            {entry.details && (
                              <p className="text-sm mt-1 p-2 bg-muted rounded">
                                {entry.details}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="template" className="mt-4">
                <VATemplatePreview proposal={proposal} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Approval Section */}
          <div className="space-y-6">
            {/* Approval Timeline */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">{t('approvalRoute')}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {proposal.approvalRoute.type === 'sequential' 
                    ? (language === 'th' ? 'ตามลำดับ' : 'Sequential')
                    : (language === 'th' ? 'พร้อมกัน' : 'Parallel')}
                </Badge>
              </div>

              <div className="relative">
                {proposal.approvalRoute.steps.map((step, idx) => {
                  const isActive = step.status === 'pending' && idx === proposal.currentStepIndex;
                  const isCompleted = step.status === 'approved';
                  const isRejected = step.status === 'rejected';
                  const isReturned = step.judgement === 'return' || step.judgement === 'return_update';
                  const isExpanded = expandedStep === step.id;
                  const isLast = idx === proposal.approvalRoute.steps.length - 1;
                  const approverUser = users.find(u => u.id === step.approverId);
                  const positionLabel = approverUser?.position || '';

                  return (
                    <div key={step.id} className="relative flex items-start gap-4">
                      {/* Connector column */}
                      <div className="flex flex-col items-center">
                        {/* Node circle */}
                        <div className={cn(
                          "relative z-10 w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 border-2",
                          isCompleted && "bg-success text-success-foreground border-success shadow-md",
                          isRejected && "bg-destructive text-destructive-foreground border-destructive shadow-md",
                          isReturned && "bg-amber-500 text-white border-amber-500 shadow-md",
                          isActive && "bg-primary text-primary-foreground border-primary shadow-lg animate-pulse",
                          !isCompleted && !isRejected && !isActive && !isReturned && "bg-muted text-muted-foreground border-border",
                        )}>
                          {isCompleted ? <Check size={14} strokeWidth={3} /> :
                           isRejected ? <X size={14} strokeWidth={3} /> :
                           isReturned ? <Undo2 size={14} strokeWidth={3} /> :
                           isActive ? <Clock size={14} /> :
                           <span className="text-[10px] font-bold">{idx + 1}</span>}
                        </div>
                        {/* Vertical connector line */}
                        {!isLast && (
                          <div className={cn(
                            "w-0.5 h-full min-h-[40px] transition-colors duration-500",
                            isCompleted ? "bg-success" : "bg-border",
                          )} />
                        )}
                      </div>

                      {/* Content */}
                      <div 
                        className={cn(
                          "flex-1 min-w-0 pb-4 -mt-0.5 cursor-pointer",
                        )}
                        onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                      >
                        <div className={cn(
                          "p-3 rounded-xl transition-all duration-300",
                          isCompleted && "bg-success/5 border border-success/15",
                          isRejected && "bg-destructive/5 border border-destructive/15",
                          isReturned && "bg-amber-500/5 border border-amber-500/15",
                          isActive && "bg-primary/5 ring-1 ring-primary/20",
                          !isCompleted && !isRejected && !isActive && !isReturned && "bg-muted/30 border border-border/50",
                        )}>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn(
                              "font-semibold text-sm",
                              isActive && "text-primary",
                              isCompleted && "text-success",
                              isRejected && "text-destructive",
                              isReturned && "text-amber-600",
                            )}>
                              {step.approverName}
                            </p>
                            {positionLabel && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-semibold">
                                {positionLabel}
                              </Badge>
                            )}
                            {isActive && (
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                              </span>
                            )}
                            {step.judgement && (
                              <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                                {step.judgement === 'approve' ? (language === 'th' ? 'อนุมัติ' : 'Approved') :
                                 step.judgement === 'reject' ? (language === 'th' ? 'ปฏิเสธ' : 'Rejected') :
                                 step.judgement === 'return' ? (language === 'th' ? 'ส่งคืน' : 'Returned') :
                                 step.judgement === 'return_update' ? (language === 'th' ? 'ส่งคืนอัพเดท' : 'Return & Update') :
                                 step.judgement === 'go_to_evaluation' ? (language === 'th' ? 'ส่งประเมิน' : 'Evaluation') :
                                 step.judgement === 'request_to_dil' ? 'DIL' : step.judgement}
                              </Badge>
                            )}
                          </div>
                          {step.actionAt && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {format(step.actionAt, 'MMM d, yyyy HH:mm')}
                            </p>
                          )}
                          {isActive && !step.actionAt && (
                            <p className="text-[11px] text-primary/70 mt-0.5">
                              {language === 'th' ? 'รอการอนุมัติ...' : 'Awaiting approval...'}
                            </p>
                          )}
                          
                          {/* Expandable detail section */}
                          <div className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out",
                            isExpanded ? "max-h-48 opacity-100 mt-2" : "max-h-0 opacity-0"
                          )}>
                            <div className="p-2 bg-card/80 backdrop-blur rounded-lg border border-border/50 space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{language === 'th' ? 'ลำดับ' : 'Order'}:</span>
                                <span className="font-medium">{step.order}</span>
                              </div>
                              {positionLabel && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{language === 'th' ? 'ตำแหน่ง' : 'Position'}:</span>
                                  <span className="font-medium">{positionLabel}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">{language === 'th' ? 'สถานะ' : 'Status'}:</span>
                                <span className="font-medium capitalize">{step.status}</span>
                              </div>
                              {step.actionAt && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">{language === 'th' ? 'วันที่ดำเนินการ' : 'Action Date'}:</span>
                                  <span className="font-medium">{format(step.actionAt, 'dd/MM/yyyy HH:mm')}</span>
                                </div>
                              )}
                              {step.comment && (
                                <div className="pt-1 border-t border-border/50">
                                  <span className="text-muted-foreground">{language === 'th' ? 'ความเห็น' : 'Comment'}:</span>
                                  <p className="italic mt-0.5">"{step.comment}"</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            {/* R&D Center Dispatch */}
            {isCenterUser && proposal.status === 'pending' && (
              <RDCenterDispatch
                proposal={proposal}
                users={users}
                currentUser={currentUser!}
                language={language}
                onDispatch={handleRDDispatch}
              />
            )}

              {proposal.approvalRoute.steps.length === 0 && (
                <p className="text-sm text-muted-foreground italic pl-1">
                  {language === 'th' ? 'ยังไม่มีเส้นทางอนุมัติ' : 'No approval route set'}
                </p>
              )}
            </div>

            {/* Rejection Reason */}
            {proposal.status === 'rejected' && proposal.judgementReason && (
              <Card className="border-destructive">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle size={18} />
                    {language === 'th' ? 'เหตุผลที่ปฏิเสธ' : 'Rejection Reason'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{proposal.judgementReason}</p>
                </CardContent>
              </Card>
            )}

            {/* VA Team Check Sheet — shown for VA Team when it's their step, or read-only for others */}
            {isVATeamStep && (
              <VACheckSheetComponent
                checkSheet={proposal.vaCheckSheet}
                partName={proposal.partName}
                supplier={proposal.supplierManufacturer}
                language={language}
                editable={true}
                onComplete={handleVACheckSheetComplete}
              />
            )}

            {/* Read-only check sheet view for non-VA Team users */}
            {!isVATeamStep && proposal.vaCheckSheet && (
              <VACheckSheetComponent
                checkSheet={proposal.vaCheckSheet}
                partName={proposal.partName}
                supplier={proposal.supplierManufacturer}
                language={language}
                editable={false}
              />
            )}

            {/* Approver Actions */}
            {isApprover && proposal.status === 'pending' && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare size={18} />
                    {language === 'th' ? 'ดำเนินการ' : 'Take Action'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === 'th' ? 'ความเห็น' : 'Comment'}</Label>
                    <Textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={language === 'th' ? 'ระบุความเห็น (จำเป็นสำหรับการปฏิเสธ)' : 'Enter your comment (required for rejection)'}
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="success"
                      className="w-full"
                      onClick={() => handleAction('approve')}
                    >
                      <CheckCircle size={16} className="mr-2" />
                      {t('approve')}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleAction('reject')}
                    >
                      <XCircle size={16} className="mr-2" />
                      {t('reject')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('go_to_evaluation')}
                    >
                      <Send size={14} className="mr-1" />
                      {t('goToEvaluation')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('request_to_dil')}
                    >
                      <RotateCcw size={14} className="mr-1" />
                      {t('requestToDil')}
                    </Button>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950"
                      onClick={() => handleAction('return')}
                    >
                      <Undo2 size={14} className="mr-1" />
                      {language === 'th' ? 'รีเทิร์น' : 'Return'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950"
                      onClick={() => handleAction('return_update')}
                    >
                      <RefreshCw size={14} className="mr-1" />
                      {language === 'th' ? 'รีเทิร์นอัพเดท' : 'Return & Update'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Evaluation Status Card */}
            {proposal.status === 'evaluation' && proposal.evaluation && (
              <Card className="border-blue-400 dark:border-blue-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Send size={18} />
                    {language === 'th' ? 'อยู่ระหว่างการประเมิน' : 'Under Evaluation'}
                  </CardTitle>
                  <CardDescription>
                    {language === 'th' 
                      ? `ส่งไปยัง: ${proposal.evaluation.assignedTeamName}` 
                      : `Assigned to: ${proposal.evaluation.assignedTeamName}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{language === 'th' ? 'ส่งโดย' : 'Sent by'}:</span>
                      <span className="font-medium">{proposal.evaluation.assignedByName}</span>
                    </div>
                    {proposal.evaluation.assignedAt && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{language === 'th' ? 'วันที่ส่ง' : 'Sent date'}:</span>
                        <span className="font-medium">{format(proposal.evaluation.assignedAt, 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                    )}
                  </div>

                  {/* R&D team member can complete evaluation */}
                  {currentUser && (
                    <div className="space-y-2 pt-2 border-t border-border">
                      <Label>{language === 'th' ? 'ผลการประเมิน' : 'Evaluation Result'}</Label>
                      <Textarea
                        value={evalComment}
                        onChange={(e) => setEvalComment(e.target.value)}
                        placeholder={language === 'th' ? 'ระบุผลการประเมิน...' : 'Enter evaluation result...'}
                        rows={3}
                      />
                      <Button
                        className="w-full"
                        onClick={handleCompleteEvaluation}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        {language === 'th' ? 'เสร็จสิ้นการประเมิน (กลับ Approval Route)' : 'Complete Evaluation (Return to Approval)'}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Go to Evaluation Dialog */}
      <Dialog open={showEvalDialog} onOpenChange={setShowEvalDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send size={18} />
              {language === 'th' ? 'ส่งประเมิน — เลือกทีม R&D' : 'Go to Evaluation — Select R&D Team'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{language === 'th' ? 'ทีม R&D' : 'R&D Team'}</Label>
              <Select value={selectedEvalTeam} onValueChange={setSelectedEvalTeam}>
                <SelectTrigger>
                  <SelectValue placeholder={language === 'th' ? 'เลือกทีม...' : 'Select team...'} />
                </SelectTrigger>
                <SelectContent>
                  {rdTeams.map(team => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'th' ? 'หมายเหตุ (ถ้ามี)' : 'Notes (optional)'}</Label>
              <Textarea
                value={evalComment}
                onChange={(e) => setEvalComment(e.target.value)}
                placeholder={language === 'th' ? 'ระบุหมายเหตุสำหรับทีมประเมิน...' : 'Add notes for the evaluation team...'}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEvalDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleSendToEvaluation} disabled={!selectedEvalTeam}>
              <Send size={14} className="mr-2" />
              {language === 'th' ? 'ส่งประเมิน' : 'Send to Evaluation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
