import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  VAProposal, 
  ConfidentialityLevel, 
  ChangeType, 
  RequestContent,
  DistributionTarget,
  ApprovalRouteType 
} from '@/types/workflow';
import { FileUpload, UploadedFile } from '@/components/workflow/FileUpload';
import { PartImageUpload, PartImage } from '@/components/workflow/PartImageUpload';
import { ApproverSelector } from '@/components/workflow/ApproverSelector';
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Send, 
  Check,
  FileText,
  Package,
  Calculator,
  ListChecks,
  Route,
  ClipboardCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const STEPS = [
  { key: 'basic', icon: FileText, labelEn: 'Basic Info', labelTh: 'ข้อมูลพื้นฐาน' },
  { key: 'part', icon: Package, labelEn: 'Part Info', labelTh: 'ข้อมูลชิ้นส่วน' },
  { key: 'cost', icon: Calculator, labelEn: 'Cost & Effect', labelTh: 'ต้นทุนและผล' },
  { key: 'request', icon: ListChecks, labelEn: 'Request Contents', labelTh: 'รายการคำขอ' },
  { key: 'route', icon: Route, labelEn: 'Approval Route', labelTh: 'เส้นทางอนุมัติ' },
  { key: 'review', icon: ClipboardCheck, labelEn: 'Review', labelTh: 'ตรวจสอบ' },
];

const CHANGE_TYPES: { value: ChangeType; labelEn: string; labelTh: string }[] = [
  { value: 'material_change', labelEn: 'Material Change', labelTh: 'เปลี่ยนวัสดุ' },
  { value: 'design_change', labelEn: 'Design Change', labelTh: 'เปลี่ยนแบบ' },
  { value: 'supplier_change', labelEn: 'Supplier Change', labelTh: 'เปลี่ยนซัพพลายเออร์' },
  { value: 'process_change', labelEn: 'Process Change', labelTh: 'เปลี่ยนกระบวนการ' },
  { value: 'cost_reduction', labelEn: 'Cost Reduction', labelTh: 'ลดต้นทุน' },
];

const REQUEST_CONTENTS: { value: RequestContent; labelEn: string; labelTh: string }[] = [
  { value: 'material_approval', labelEn: 'Material Approval', labelTh: 'อนุมัติวัสดุ' },
  { value: 'revise_daikin_standard', labelEn: 'Revise Daikin Standard', labelTh: 'แก้ไขมาตรฐานไดกิ้น' },
  { value: 'manufacturer_approval', labelEn: 'Manufacturer Approval', labelTh: 'อนุมัติผู้ผลิต' },
  { value: 'drawing_approval', labelEn: 'Drawing Approval', labelTh: 'อนุมัติแบบ' },
  { value: 'components_approval', labelEn: 'Components Approval', labelTh: 'อนุมัติชิ้นส่วน' },
];

const DISTRIBUTION_TARGETS: { value: DistributionTarget; labelEn: string; labelTh: string }[] = [
  { value: 'b_shiga', labelEn: 'B/Shiga', labelTh: 'B/ชิกะ' },
  { value: 'k_kanaoka', labelEn: 'K/Kanaoka', labelTh: 'K/คะนะโอกะ' },
  { value: 'refrigeration_div_pic', labelEn: 'Refrigeration Div. PIC', labelTh: 'PIC แผนกเครื่องทำความเย็น' },
  { value: 'quality_assurance', labelEn: 'Quality Assurance', labelTh: 'ประกันคุณภาพ' },
  { value: 'production_control', labelEn: 'Production Control', labelTh: 'ควบคุมการผลิต' },
  { value: 'procurement', labelEn: 'Procurement', labelTh: 'จัดซื้อ' },
];

export default function ProposalWizardPage() {
  const { t, currentUser, language, setProposals, users, generateProposalNo, proposals } = useApp();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const { id: editId } = useParams();
  const isEditMode = !!editId;
  const existingProposal = isEditMode ? proposals.find(p => p.id === editId) : null;
  const [currentStep, setCurrentStep] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    confidentiality: 'internal' as ConfidentialityLevel,
    partName: '',
    partModel: '',
    relatedDrawingNo: '',
    supplierManufacturer: '',
    changeType: [] as ChangeType[],
    initialProductionDate: '',
    beforeCost: 0,
    afterCost: 0,
    volumePerYear: 0,
    currency: 'JPY',
    requestContents: [] as RequestContent[],
    distributionList: [] as DistributionTarget[],
    distributionNotes: '',
    notes: '',
    approvalRouteType: 'sequential' as ApprovalRouteType,
    selectedApprovers: [] as string[],
  });

  // File & image state
  const [partFiles, setPartFiles] = useState<UploadedFile[]>([]);
  const [currentPartImage, setCurrentPartImage] = useState<PartImage | null>(null);
  const [improvedPartImage, setImprovedPartImage] = useState<PartImage | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load existing proposal data for edit mode
  useEffect(() => {
    if (existingProposal && !isLoaded) {
      setFormData({
        confidentiality: existingProposal.confidentiality,
        partName: existingProposal.partName,
        partModel: existingProposal.partModel || '',
        relatedDrawingNo: existingProposal.relatedDrawingNo || '',
        supplierManufacturer: existingProposal.supplierManufacturer || '',
        changeType: existingProposal.changeType,
        initialProductionDate: existingProposal.initialProductionDate
          ? format(existingProposal.initialProductionDate, 'yyyy-MM-dd') : '',
        beforeCost: existingProposal.cost.beforeCost,
        afterCost: existingProposal.cost.afterCost,
        volumePerYear: existingProposal.cost.volumePerYear,
        currency: existingProposal.cost.currency,
        requestContents: existingProposal.requestContents,
        distributionList: existingProposal.distributionList,
        distributionNotes: existingProposal.distributionNotes || '',
        notes: existingProposal.notes || '',
        approvalRouteType: existingProposal.approvalRoute.type,
        selectedApprovers: existingProposal.approvalRoute.steps.map(s => s.approverId),
      });
      // Load attachments and images
      if (existingProposal.attachments.length > 0) {
        setPartFiles(existingProposal.attachments.map(a => ({
          id: a.id, name: a.name, type: a.type, size: a.size, url: a.url,
        })));
      }
      setIsLoaded(true);
    }
  }, [existingProposal, isLoaded]);

  // Auto-calculated fields
  const costDifference = formData.afterCost - formData.beforeCost;
  const annualContribution = (formData.volumePerYear * costDifference) / 1000;

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: typeof formData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = <K extends keyof typeof formData>(
    field: K,
    value: any
  ) => {
    setFormData(prev => {
      const arr = prev[field] as any[];
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value];
      return { ...prev, [field]: newArr };
    });
  };

  const canProceed = useMemo(() => {
    switch (currentStep) {
      case 0: return true;
      case 1: return formData.partName.trim() !== '';
      case 2: return formData.beforeCost > 0 || formData.afterCost > 0;
      case 3: return formData.requestContents.length > 0;
      case 4: return formData.selectedApprovers.length > 0;
      case 5: return true;
      default: return true;
    }
  }, [currentStep, formData]);

  // Find VA Team members from the users list
  const vaTeamMembers = users.filter(u => 
    u.department === 'VA TEAM' || 
    u.department === 'PROCUREMENT STRATEGY SUB-GROUP' ||
    u.department === 'va_team'
  );

  const buildProposal = (status: 'draft' | 'pending'): VAProposal => {
    const proposalNo = status === 'pending' ? generateProposalNo() : '';
    
    // Build approval steps: VA Team first (mandatory), then user-selected approvers
    const vaTeamStep = vaTeamMembers.length > 0 ? [{
      id: `step-va-${Date.now()}`,
      order: 1,
      approverId: vaTeamMembers[0].id,
      approverName: vaTeamMembers[0].name,
      status: 'pending' as const,
    }] : [];

    const userSteps = formData.selectedApprovers
      .filter(id => !vaTeamMembers.some(v => v.id === id)) // avoid duplicating VA Team
      .map((approverId, idx) => {
        const approver = users.find(u => u.id === approverId);
        return {
          id: `step-${Date.now()}-${idx}`,
          order: vaTeamStep.length + idx + 1,
          approverId,
          approverName: approver?.name || '',
          status: 'pending' as const,
        };
      });

    const allSteps = [...vaTeamStep, ...userSteps];

    return {
      id: `prop-${Date.now()}`,
      proposalNo,
      confidentiality: formData.confidentiality,
      createdAt: new Date(),
      updatedAt: new Date(),
      requesterId: currentUser!.id,
      requesterName: currentUser!.name,
      department: currentUser!.department,
      departmentTh: currentUser!.departmentTh,
      plant: currentUser!.plant || '',
      partName: formData.partName,
      partModel: formData.partModel,
      relatedDrawingNo: formData.relatedDrawingNo,
      supplierManufacturer: formData.supplierManufacturer,
      changeType: formData.changeType,
      initialProductionDate: formData.initialProductionDate ? new Date(formData.initialProductionDate) : undefined,
      cost: {
        beforeCost: formData.beforeCost,
        afterCost: formData.afterCost,
        costDifference,
        volumePerYear: formData.volumePerYear,
        annualContribution,
        currency: formData.currency,
      },
      requestContents: formData.requestContents,
      distributionList: formData.distributionList,
      distributionNotes: formData.distributionNotes,
      notes: formData.notes,
      attachments: partFiles.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        size: f.size,
        url: f.url,
        uploadedBy: currentUser!.id,
        uploadedAt: new Date(),
      })),
      partImages: {
        current: currentPartImage ? { name: currentPartImage.name, url: currentPartImage.url } : undefined,
        improved: improvedPartImage ? { name: improvedPartImage.name, url: improvedPartImage.url } : undefined,
      },
      status,
      approvalRoute: {
        id: `route-${Date.now()}`,
        type: formData.approvalRouteType,
        steps: allSteps,
      },
      currentStepIndex: 0,
      version: 1,
      auditLog: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date(),
          userId: currentUser!.id,
          userName: currentUser!.name,
          action: status === 'draft' ? 'Created draft' : 'Created proposal',
        },
        ...(status === 'pending' ? [{
          id: `audit-${Date.now()}-2`,
          timestamp: new Date(),
          userId: currentUser!.id,
          userName: currentUser!.name,
          action: 'Submitted for approval',
        }] : []),
      ],
    };
  };

  const handleSaveDraft = () => {
    if (isEditMode && existingProposal) {
      const updated = buildProposal('draft');
      setProposals(prev => prev.map(p =>
        p.id === existingProposal.id
          ? { ...updated, id: existingProposal.id, proposalNo: existingProposal.proposalNo, createdAt: existingProposal.createdAt, version: existingProposal.version + 1 }
          : p
      ));
    } else {
      setProposals(prev => [...prev, buildProposal('draft')]);
    }
    navigate('/dashboard');
  };

  const handleSubmit = () => {
    const proposal = buildProposal('pending');
    if (isEditMode && existingProposal) {
      setProposals(prev => prev.map(p =>
        p.id === existingProposal.id
          ? { ...proposal, id: existingProposal.id, proposalNo: existingProposal.proposalNo || proposal.proposalNo, createdAt: existingProposal.createdAt, version: existingProposal.version + 1 }
          : p
      ));
    } else {
      setProposals(prev => [...prev, proposal]);
    }

    // Notify approvers about pending approval
    const approverSteps = proposal.approvalRoute.steps;
    approverSteps.forEach((step) => {
      addNotification({
        type: 'approval_pending',
        title: 'New Approval Request',
        titleTh: 'คำขออนุมัติใหม่',
        message: `${proposal.proposalNo || 'Draft'} "${proposal.partName}" is waiting for your approval.`,
        messageTh: `${proposal.proposalNo || 'ร่าง'} "${proposal.partName}" รอการอนุมัติจากคุณ`,
        proposalId: proposal.id,
        proposalNo: proposal.proposalNo,
        fromUserId: currentUser?.id,
        fromUserName: currentUser?.name,
      });
    });

    navigate('/dashboard');
  };

  return (
    <MainLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isEditMode ? (language === 'th' ? 'แก้ไข VA Proposal' : 'Edit VA Proposal') : t('newProposal')}
            </h1>
            <p className="text-muted-foreground">
              {language === 'th' 
                ? 'กรอกข้อมูลทีละขั้นตอน • เลข VA จะถูกรันอัตโนมัติเมื่อส่ง' 
                : 'Fill in the form step by step • VA number auto-generated on submit'}
            </p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between px-4">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            
            return (
              <div key={step.key} className="flex items-center">
                <button
                  onClick={() => idx <= currentStep && setCurrentStep(idx)}
                  className={cn(
                    "wizard-step",
                    isActive && "wizard-step-active",
                    isCompleted && "wizard-step-completed",
                    !isActive && !isCompleted && "wizard-step-pending"
                  )}
                  disabled={idx > currentStep}
                >
                  <div className="wizard-step-number">
                    {isCompleted ? <Check size={16} /> : <Icon size={16} />}
                  </div>
                  <span className={cn(
                    "hidden sm:block text-sm",
                    isActive && "font-medium text-foreground",
                    !isActive && "text-muted-foreground"
                  )}>
                    {language === 'th' ? step.labelTh : step.labelEn}
                  </span>
                </button>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    "w-8 sm:w-16 h-0.5 mx-2",
                    idx < currentStep ? "bg-success" : "bg-border"
                  )} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        <Card className="card-elevated">
          <CardContent className="p-6">
            {currentStep === 0 && (
              <StepBasicInfo 
                formData={formData} 
                updateField={updateField} 
                language={language}
                currentUser={currentUser}
              />
            )}
            {currentStep === 1 && (
              <StepPartInfo 
                formData={formData} 
                updateField={updateField}
                toggleArrayField={toggleArrayField}
                language={language}
                partFiles={partFiles}
                setPartFiles={setPartFiles}
                currentPartImage={currentPartImage}
                setCurrentPartImage={setCurrentPartImage}
                improvedPartImage={improvedPartImage}
                setImprovedPartImage={setImprovedPartImage}
              />
            )}
            {currentStep === 2 && (
              <StepCostEffect 
                formData={formData} 
                updateField={updateField}
                costDifference={costDifference}
                annualContribution={annualContribution}
                language={language}
              />
            )}
            {currentStep === 3 && (
              <StepRequestContents 
                formData={formData}
                updateField={updateField}
                toggleArrayField={toggleArrayField}
                language={language}
              />
            )}
            {currentStep === 4 && (
              <StepApprovalRoute 
                formData={formData}
                updateField={updateField}
                toggleArrayField={toggleArrayField}
                language={language}
              />
            )}
            {currentStep === 5 && (
              <StepReview 
                formData={formData}
                costDifference={costDifference}
                annualContribution={annualContribution}
                language={language}
                partFiles={partFiles}
                currentPartImage={currentPartImage}
                improvedPartImage={improvedPartImage}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(s => s - 1)}
            disabled={currentStep === 0}
          >
            <ArrowLeft size={18} className="mr-2" />
            {language === 'th' ? 'ย้อนกลับ' : 'Previous'}
          </Button>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSaveDraft}>
              <Save size={18} className="mr-2" />
              {t('saveDraft')}
            </Button>

            {currentStep < STEPS.length - 1 ? (
              <Button 
                onClick={() => setCurrentStep(s => s + 1)}
                disabled={!canProceed}
              >
                {language === 'th' ? 'ถัดไป' : 'Next'}
                <ArrowRight size={18} className="ml-2" />
              </Button>
            ) : (
              <Button variant="hero" onClick={handleSubmit} disabled={!canProceed}>
                <Send size={18} className="mr-2" />
                {t('submit')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ────────────────────────────────────────────────
// Step Components
// ────────────────────────────────────────────────

function StepBasicInfo({ formData, updateField, language, currentUser }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {language === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === 'th' ? 'ระบุความลับและข้อมูลผู้ขอ' : 'Set confidentiality level and requester information'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="form-label">
            {language === 'th' ? 'ระดับความลับ' : 'Confidentiality Level'}
          </Label>
          <Select value={formData.confidentiality} onValueChange={(v) => updateField('confidentiality', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">{language === 'th' ? 'ภายในองค์กร' : 'Internal'}</SelectItem>
              <SelectItem value="confidential">{language === 'th' ? 'ลับ' : 'Confidential'}</SelectItem>
              <SelectItem value="secret">{language === 'th' ? 'ลับสุดยอด' : 'Secret'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="form-label">{language === 'th' ? 'วันที่' : 'Date'}</Label>
          <Input value={format(new Date(), 'yyyy-MM-dd')} disabled />
        </div>

        <div className="space-y-2">
          <Label className="form-label">{language === 'th' ? 'ผู้ขอ' : 'Requester'}</Label>
          <Input 
            value={language === 'th' && currentUser?.nameTh ? currentUser.nameTh : currentUser?.name} 
            disabled 
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">{language === 'th' ? 'แผนก' : 'Department'}</Label>
          <Input 
            value={language === 'th' && currentUser?.departmentTh ? currentUser.departmentTh : currentUser?.department} 
            disabled 
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">{language === 'th' ? 'โรงงาน/ฝ่าย' : 'Plant/Division'}</Label>
          <Input value={currentUser?.plant || ''} disabled />
        </div>

        <div className="space-y-2">
          <Label className="form-label">{language === 'th' ? 'เลขที่เอกสาร VA' : 'VA Document No.'}</Label>
          <Input 
            value={language === 'th' ? '(รันอัตโนมัติเมื่อส่ง)' : '(Auto-generated on submit)'} 
            disabled 
            className="text-muted-foreground italic"
          />
        </div>
      </div>
    </div>
  );
}

function StepPartInfo({ 
  formData, updateField, toggleArrayField, language,
  partFiles, setPartFiles,
  currentPartImage, setCurrentPartImage,
  improvedPartImage, setImprovedPartImage,
}: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {language === 'th' ? 'ข้อมูลชิ้นส่วน' : 'Part Information'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === 'th' 
            ? 'ระบุรายละเอียดชิ้นส่วน แนบไฟล์ และอัพโหลดรูป' 
            : 'Enter part details, attach files, and upload images'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2 md:col-span-2">
          <Label className="form-label form-label-required">
            {language === 'th' ? 'ชื่อชิ้นส่วน/รุ่น' : 'Part Name/Model'}
          </Label>
          <Input
            value={formData.partName}
            onChange={(e) => updateField('partName', e.target.value)}
            placeholder={language === 'th' ? 'เช่น Compressor Housing Unit' : 'e.g., Compressor Housing Unit'}
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">{language === 'th' ? 'รหัสรุ่น' : 'Model Number'}</Label>
          <Input
            value={formData.partModel}
            onChange={(e) => updateField('partModel', e.target.value)}
            placeholder="e.g., CHU-A200-R2"
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">
            {language === 'th' ? 'เลขแบบที่เกี่ยวข้อง' : 'Related Drawing No.'}
          </Label>
          <Input
            value={formData.relatedDrawingNo}
            onChange={(e) => updateField('relatedDrawingNo', e.target.value)}
            placeholder="e.g., DWG-2024-0156"
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">
            {language === 'th' ? 'ผู้ผลิต/ซัพพลายเออร์' : 'Supplier/Manufacturer'}
          </Label>
          <Input
            value={formData.supplierManufacturer}
            onChange={(e) => updateField('supplierManufacturer', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">
            {language === 'th' ? 'วันเริ่มผลิตหลังอนุมัติ' : 'Initial Production Start'}
          </Label>
          <Input
            type="date"
            value={formData.initialProductionDate}
            onChange={(e) => updateField('initialProductionDate', e.target.value)}
          />
        </div>
      </div>

      {/* Change Type */}
      <div className="space-y-3">
        <Label className="form-label">
          {language === 'th' ? 'ประเภทการเปลี่ยนแปลง' : 'Change Type'}
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CHANGE_TYPES.map((type) => (
            <label
              key={type.value}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                formData.changeType.includes(type.value)
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted"
              )}
            >
              <Checkbox
                checked={formData.changeType.includes(type.value)}
                onCheckedChange={() => toggleArrayField('changeType', type.value)}
              />
              <span className="text-sm">
                {language === 'th' ? type.labelTh : type.labelEn}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Part Images (Before/After) */}
      <PartImageUpload
        currentImage={currentPartImage}
        improvedImage={improvedPartImage}
        onCurrentChange={setCurrentPartImage}
        onImprovedChange={setImprovedPartImage}
        language={language}
      />

      {/* File Attachments */}
      <FileUpload
        files={partFiles}
        onFilesChange={setPartFiles}
        language={language}
        label={language === 'th' ? 'เอกสารแนบ (มัลติไฟล์ ไม่จำกัดนามสกุล)' : 'Attachments (multi-file, any format)'}
      />
    </div>
  );
}

function StepCostEffect({ formData, updateField, costDifference, annualContribution, language }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {language === 'th' ? 'ต้นทุนและผลกระทบ' : 'Cost & Effect'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === 'th' 
            ? 'ระบุต้นทุนก่อน-หลังและปริมาณการผลิต' 
            : 'Enter before/after costs and production volume'}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="form-label">{language === 'th' ? 'สกุลเงิน' : 'Currency'}</Label>
          <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="JPY">JPY (¥)</SelectItem>
              <SelectItem value="THB">THB (฿)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="form-label">
            {language === 'th' ? 'ปริมาณ (ชิ้น/ปี) - A' : 'Volume (pcs/year) - A'}
          </Label>
          <Input
            type="number"
            value={formData.volumePerYear || ''}
            onChange={(e) => updateField('volumePerYear', Number(e.target.value))}
            placeholder="e.g., 25000"
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">
            {language === 'th' ? 'ต้นทุนก่อน (C)' : 'Before Cost (C)'}
          </Label>
          <Input
            type="number"
            value={formData.beforeCost || ''}
            onChange={(e) => updateField('beforeCost', Number(e.target.value))}
            placeholder={`${formData.currency}/pc`}
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">
            {language === 'th' ? 'ต้นทุนหลัง (B)' : 'After Cost (B)'}
          </Label>
          <Input
            type="number"
            value={formData.afterCost || ''}
            onChange={(e) => updateField('afterCost', Number(e.target.value))}
            placeholder={`${formData.currency}/pc`}
          />
        </div>
      </div>

      {/* Calculated fields */}
      <div className="p-4 bg-muted rounded-lg space-y-4">
        <h3 className="font-medium text-foreground">
          {language === 'th' ? 'ผลการคำนวณอัตโนมัติ' : 'Auto-calculated Results'}
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">
              {language === 'th' ? 'ส่วนต่างต้นทุน (D = B - C)' : 'Cost Difference (D = B - C)'}
            </p>
            <p className={cn(
              "text-2xl font-bold",
              costDifference < 0 ? "text-success" : costDifference > 0 ? "text-destructive" : "text-foreground"
            )}>
              {costDifference < 0 ? '' : '+'}{costDifference.toLocaleString()} {formData.currency}/pc
            </p>
          </div>
          <div className="p-4 bg-card rounded-lg border">
            <p className="text-sm text-muted-foreground">
              {language === 'th' ? 'ผลประหยัดต่อปี (A×D/1000)' : 'Annual Contribution (A×D/1000)'}
            </p>
            <p className={cn(
              "text-2xl font-bold",
              annualContribution < 0 ? "text-success" : annualContribution > 0 ? "text-destructive" : "text-foreground"
            )}>
              {annualContribution < 0 ? '' : '+'}{annualContribution.toLocaleString()} K {formData.currency}/yr
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRequestContents({ formData, updateField, toggleArrayField, language }: any) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {language === 'th' ? 'รายการคำขอ' : 'Request Contents'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === 'th' ? 'เลือกรายการที่ต้องการขออนุมัติ' : 'Select items that require approval'}
        </p>
      </div>

      <div className="space-y-3">
        {REQUEST_CONTENTS.map((item) => (
          <label
            key={item.value}
            className={cn(
              "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
              formData.requestContents.includes(item.value) ? "border-primary bg-primary/5" : "hover:bg-muted"
            )}
          >
            <Checkbox
              checked={formData.requestContents.includes(item.value)}
              onCheckedChange={() => toggleArrayField('requestContents', item.value)}
            />
            <span className="font-medium text-foreground">
              {language === 'th' ? item.labelTh : item.labelEn}
            </span>
          </label>
        ))}
      </div>

      <div className="space-y-3">
        <Label className="form-label">
          {language === 'th' ? 'รายชื่อผู้รับเอกสาร' : 'Distribution List'}
        </Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {DISTRIBUTION_TARGETS.map((target) => (
            <label
              key={target.value}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                formData.distributionList.includes(target.value) ? "border-primary bg-primary/5" : "hover:bg-muted"
              )}
            >
              <Checkbox
                checked={formData.distributionList.includes(target.value)}
                onCheckedChange={() => toggleArrayField('distributionList', target.value)}
              />
              <span className="text-sm">{language === 'th' ? target.labelTh : target.labelEn}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="form-label">{language === 'th' ? 'หมายเหตุ' : 'Additional Notes'}</Label>
        <Textarea
          value={formData.notes}
          onChange={(e) => updateField('notes', e.target.value)}
          placeholder={language === 'th' ? 'รายละเอียดเพิ่มเติม...' : 'Additional details...'}
          rows={3}
        />
      </div>
    </div>
  );
}

function StepApprovalRoute({ formData, updateField, toggleArrayField, language }: any) {
  const { users } = useApp();

  // VA Team members (auto-prepended, not selectable)
  const vaTeamMembers = users.filter(u => 
    u.department === 'VA TEAM' || 
    u.department === 'PROCUREMENT STRATEGY SUB-GROUP' ||
    u.department === 'va_team'
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {language === 'th' ? 'เส้นทางการอนุมัติ' : 'Approval Route'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === 'th' 
            ? 'VA Team จะเป็นด่านแรกอัตโนมัติ จากนั้นเลือกผู้อนุมัติเพิ่มเติม' 
            : 'VA Team is auto-assigned as the first step, then select additional approvers'}
        </p>
      </div>

      {/* VA Team - Mandatory First Step */}
      <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Badge className="bg-primary text-primary-foreground">STD</Badge>
          <span className="font-semibold text-sm">
            {language === 'th' ? 'ด่านที่ 1: VA TEAM (คัดกรองเอกสาร)' : 'Step 1: VA TEAM (Document Screening)'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-2">
          {language === 'th' 
            ? 'VA Team จะตรวจสอบ Information Check Sheet ก่อนส่งต่อ — กำหนดอัตโนมัติทุกเอกสาร' 
            : 'VA Team verifies the Information Check Sheet before forwarding — auto-assigned for all proposals'}
        </p>
        {vaTeamMembers.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {vaTeamMembers.map(u => (
              <Badge key={u.id} variant="outline" className="text-xs">
                {u.name} ({u.position || 'Member'})
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-xs text-warning italic">
            {language === 'th' 
              ? '⚠ ยังไม่มีสมาชิก VA Team ในระบบ — กรุณาเพิ่มผ่านหน้า Admin' 
              : '⚠ No VA Team members found — please add via Admin page'}
          </p>
        )}
      </div>

      <div className="space-y-4">
        <Label className="form-label">
          {language === 'th' ? 'ประเภทการอนุมัติ' : 'Approval Type'}
        </Label>
        <RadioGroup
          value={formData.approvalRouteType}
          onValueChange={(v) => updateField('approvalRouteType', v)}
          className="grid md:grid-cols-2 gap-4"
        >
          <label className={cn(
            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
            formData.approvalRouteType === 'sequential' ? "border-primary bg-primary/5" : "hover:bg-muted"
          )}>
            <RadioGroupItem value="sequential" className="mt-1" />
            <div>
              <p className="font-medium text-foreground">
                {language === 'th' ? 'อนุมัติตามลำดับ' : 'Sequential Approval'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'th' ? 'ผู้อนุมัติแต่ละคนอนุมัติตามลำดับ' : 'Each approver reviews in order'}
              </p>
            </div>
          </label>
          <label className={cn(
            "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors",
            formData.approvalRouteType === 'parallel' ? "border-primary bg-primary/5" : "hover:bg-muted"
          )}>
            <RadioGroupItem value="parallel" className="mt-1" />
            <div>
              <p className="font-medium text-foreground">
                {language === 'th' ? 'อนุมัติพร้อมกัน' : 'Parallel Approval'}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === 'th' ? 'ผู้อนุมัติทุกคนอนุมัติพร้อมกัน' : 'All approvers review simultaneously'}
              </p>
            </div>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <Label className="form-label form-label-required">
          {language === 'th' ? 'เลือกผู้อนุมัติ (ด่านถัดไปหลัง VA Team)' : 'Select Approvers (after VA Team)'}
        </Label>
        <ApproverSelector
          users={users}
          selectedApprovers={formData.selectedApprovers}
          onToggleApprover={(id) => toggleArrayField('selectedApprovers', id)}
          language={language}
        />
      </div>
    </div>
  );
}

function StepReview({ formData, costDifference, annualContribution, language, partFiles, currentPartImage, improvedPartImage }: any) {
  const { users } = useApp();

  const getChangeTypeLabel = (value: ChangeType) => {
    const item = CHANGE_TYPES.find(t => t.value === value);
    return item ? (language === 'th' ? item.labelTh : item.labelEn) : value;
  };

  const getRequestContentLabel = (value: RequestContent) => {
    const item = REQUEST_CONTENTS.find(t => t.value === value);
    return item ? (language === 'th' ? item.labelTh : item.labelEn) : value;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-1">
          {language === 'th' ? 'ตรวจสอบและส่ง' : 'Review & Submit'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {language === 'th' ? 'ตรวจสอบข้อมูลก่อนส่งอนุมัติ' : 'Review all information before submitting'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Part Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{language === 'th' ? 'ข้อมูลชิ้นส่วน' : 'Part Information'}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Part Name:</span>
              <p className="font-medium">{formData.partName || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Model:</span>
              <p className="font-medium">{formData.partModel || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Drawing No:</span>
              <p className="font-medium">{formData.relatedDrawingNo || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Change Types:</span>
              <p className="font-medium">{formData.changeType.map(getChangeTypeLabel).join(', ') || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Part Images */}
        {(currentPartImage || improvedPartImage) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{language === 'th' ? 'รูปภาพชิ้นส่วน' : 'Part Images'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {currentPartImage && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{language === 'th' ? 'ปัจจุบัน (Before)' : 'Current (Before)'}</p>
                    <img src={currentPartImage.url} alt="Current" className="w-full h-32 object-contain rounded border bg-white" />
                  </div>
                )}
                {improvedPartImage && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">{language === 'th' ? 'ปรับปรุง (After)' : 'Improved (After)'}</p>
                    <img src={improvedPartImage.url} alt="Improved" className="w-full h-32 object-contain rounded border bg-white" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attachments */}
        {partFiles.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{language === 'th' ? 'เอกสารแนบ' : 'Attachments'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {partFiles.map((f: UploadedFile) => (
                  <Badge key={f.id} variant="secondary" className="text-[10px]">
                    <FileText className="h-3 w-3 mr-1" />
                    {f.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cost */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{language === 'th' ? 'ต้นทุนและผลกระทบ' : 'Cost & Effect'}</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Before Cost (C):</span>
              <p className="font-medium">{formData.beforeCost.toLocaleString()} {formData.currency}/pc</p>
            </div>
            <div>
              <span className="text-muted-foreground">After Cost (B):</span>
              <p className="font-medium">{formData.afterCost.toLocaleString()} {formData.currency}/pc</p>
            </div>
            <div>
              <span className="text-muted-foreground">Cost Difference (D):</span>
              <p className={cn("font-medium", costDifference < 0 ? "text-success" : "text-destructive")}>
                {costDifference < 0 ? '' : '+'}{costDifference.toLocaleString()} {formData.currency}/pc
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Annual Contribution:</span>
              <p className={cn("font-medium", annualContribution < 0 ? "text-success" : "text-destructive")}>
                {annualContribution < 0 ? '' : '+'}{annualContribution.toLocaleString()} K {formData.currency}/yr
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Request Contents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{language === 'th' ? 'รายการคำขอ' : 'Request Contents'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {formData.requestContents.map((item: RequestContent) => (
                <Badge key={item} variant="outline" className="text-xs">
                  <Check className="h-3 w-3 mr-1 text-success" />
                  {getRequestContentLabel(item)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Approval Route */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{language === 'th' ? 'เส้นทางการอนุมัติ' : 'Approval Route'}</CardTitle>
            <CardDescription>
              {formData.approvalRouteType === 'sequential' 
                ? (language === 'th' ? 'อนุมัติตามลำดับ' : 'Sequential') 
                : (language === 'th' ? 'อนุมัติพร้อมกัน' : 'Parallel')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {formData.selectedApprovers.map((id: string, idx: number) => {
                const user = users.find((u: any) => u.id === id);
                return (
                  <div key={id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    {formData.approvalRouteType === 'sequential' && (
                      <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                    )}
                    <div>
                      <p className="font-medium text-foreground">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.department}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
