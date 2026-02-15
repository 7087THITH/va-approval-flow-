import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { useNotifications } from '@/context/NotificationContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApproverSelector } from '@/components/workflow/ApproverSelector';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  VAProposal,
  ConfidentialityLevel,
  ChangeType,
  RequestContent,
  ApprovalRouteType,
} from '@/types/workflow';
import {
  Plus,
  Trash2,
  Copy,
  Send,
  Save,
  ArrowLeft,
  FileText,
  CheckCircle2,
  Route,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BatchItem {
  id: string;
  partName: string;
  partModel: string;
  supplierManufacturer: string;
  changeType: ChangeType[];
  beforeCost: number;
  afterCost: number;
  volumePerYear: number;
  currency: string;
  requestContents: RequestContent[];
  notes: string;
  confidentiality: ConfidentialityLevel;
}

const CHANGE_TYPES: { value: ChangeType; label: string }[] = [
  { value: 'material_change', label: 'Material Change' },
  { value: 'design_change', label: 'Design Change' },
  { value: 'supplier_change', label: 'Supplier Change' },
  { value: 'process_change', label: 'Process Change' },
  { value: 'cost_reduction', label: 'Cost Reduction' },
];

const emptyItem = (): BatchItem => ({
  id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  partName: '',
  partModel: '',
  supplierManufacturer: '',
  changeType: [],
  beforeCost: 0,
  afterCost: 0,
  volumePerYear: 0,
  currency: 'JPY',
  requestContents: [],
  notes: '',
  confidentiality: 'internal',
});

export default function BatchCreatePage() {
  const { currentUser, language, setProposals, users, generateProposalNo, proposals } = useApp();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  const [items, setItems] = useState<BatchItem[]>([emptyItem()]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [approvalRouteType, setApprovalRouteType] = useState<ApprovalRouteType>('sequential');
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copySourceId, setCopySourceId] = useState<string>('');
  const [copyFields, setCopyFields] = useState({
    partInfo: true,
    cost: true,
    requestContents: true,
    notes: true,
  });

  // Select all toggle
  const allSelected = items.length > 0 && selectedItems.size === items.length;
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addItem = () => {
    setItems(prev => [...prev, emptyItem()]);
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateItem = (id: string, field: keyof BatchItem, value: any) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const toggleItemArrayField = (id: string, field: 'changeType' | 'requestContents', value: any) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const arr = i[field] as any[];
      const updated = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
      return { ...i, [field]: updated };
    }));
  };

  // Copy from existing proposal
  const openCopyDialog = (targetId: string) => {
    setCopySourceId('');
    setCopyFields({ partInfo: true, cost: true, requestContents: true, notes: true });
    setShowCopyDialog(true);
  };

  const applyCopy = () => {
    const source = proposals.find(p => p.id === copySourceId);
    if (!source) {
      toast.error(language === 'th' ? 'ไม่พบเอกสารต้นฉบับ' : 'Source proposal not found');
      return;
    }

    // Apply to all selected items (or the last added)
    const targets = selectedItems.size > 0 ? Array.from(selectedItems) : [items[items.length - 1]?.id];

    setItems(prev => prev.map(item => {
      if (!targets.includes(item.id)) return item;
      return {
        ...item,
        ...(copyFields.partInfo && {
          partName: source.partName,
          partModel: source.partModel || '',
          supplierManufacturer: source.supplierManufacturer || '',
          changeType: [...source.changeType],
        }),
        ...(copyFields.cost && {
          beforeCost: source.cost.beforeCost,
          afterCost: source.cost.afterCost,
          volumePerYear: source.cost.volumePerYear,
          currency: source.cost.currency,
        }),
        ...(copyFields.requestContents && {
          requestContents: [...source.requestContents],
        }),
        ...(copyFields.notes && {
          notes: source.notes || '',
        }),
        confidentiality: source.confidentiality,
      };
    }));

    setShowCopyDialog(false);
    toast.success(language === 'th' ? 'คัดลอกข้อมูลสำเร็จ' : 'Data copied successfully');
  };

  // Batch submit
  const handleBatchSubmit = (asDraft: boolean) => {
    const targetItems = selectedItems.size > 0 ? items.filter(i => selectedItems.has(i.id)) : items;
    
    if (targetItems.length === 0) {
      toast.error(language === 'th' ? 'ไม่มีรายการที่เลือก' : 'No items selected');
      return;
    }

    if (!asDraft && selectedApprovers.length === 0) {
      toast.error(language === 'th' ? 'กรุณาเลือกผู้อนุมัติ' : 'Please select approvers');
      return;
    }

    const newProposals: VAProposal[] = targetItems.map(item => {
      const proposalNo = asDraft ? '' : generateProposalNo();
      const costDiff = item.afterCost - item.beforeCost;
      return {
        id: `prop-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        proposalNo,
        confidentiality: item.confidentiality,
        createdAt: new Date(),
        updatedAt: new Date(),
        requesterId: currentUser!.id,
        requesterName: currentUser!.name,
        department: currentUser!.department,
        departmentTh: currentUser!.departmentTh,
        plant: currentUser!.plant || '',
        partName: item.partName,
        partModel: item.partModel,
        supplierManufacturer: item.supplierManufacturer,
        changeType: item.changeType,
        cost: {
          beforeCost: item.beforeCost,
          afterCost: item.afterCost,
          costDifference: costDiff,
          volumePerYear: item.volumePerYear,
          annualContribution: (item.volumePerYear * costDiff) / 1000,
          currency: item.currency,
        },
        requestContents: item.requestContents,
        distributionList: [],
        notes: item.notes,
        attachments: [],
        status: asDraft ? 'draft' : 'pending',
        approvalRoute: {
          id: `route-${Date.now()}`,
          type: approvalRouteType,
          steps: selectedApprovers.map((approverId, idx) => {
            const approver = users.find(u => u.id === approverId);
            return {
              id: `step-${Date.now()}-${idx}`,
              order: idx + 1,
              approverId,
              approverName: approver?.name || '',
              status: 'pending' as const,
            };
          }),
        },
        currentStepIndex: 0,
        version: 1,
        auditLog: [{
          id: `audit-${Date.now()}`,
          timestamp: new Date(),
          userId: currentUser!.id,
          userName: currentUser!.name,
          action: asDraft ? 'Created draft (batch)' : 'Submitted for approval (batch)',
        }],
      };
    });

    setProposals(prev => [...prev, ...newProposals]);

    // Notify approvers
    if (!asDraft) {
      selectedApprovers.forEach(approverId => {
        addNotification({
          type: 'approval_pending',
          title: 'Batch Approval Request',
          titleTh: 'คำขออนุมัติ (แบบกลุ่ม)',
          message: `${newProposals.length} proposals submitted for your approval.`,
          messageTh: `มี ${newProposals.length} เอกสารรอการอนุมัติจากคุณ`,
          proposalId: newProposals[0].id,
          proposalNo: newProposals[0].proposalNo,
          fromUserId: currentUser?.id,
          fromUserName: currentUser?.name,
        });
      });
    }

    toast.success(
      language === 'th'
        ? `สร้าง ${newProposals.length} เอกสาร${asDraft ? ' (ร่าง)' : ' และส่งอนุมัติ'}สำเร็จ`
        : `${newProposals.length} proposals ${asDraft ? 'saved as drafts' : 'submitted'} successfully`
    );
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
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-foreground">
              {language === 'th' ? 'สร้างเอกสารหลายฉบับ' : 'Batch Create Proposals'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {language === 'th' ? 'สร้างหลายฉบับพร้อมกัน ใช้เส้นทางอนุมัติเดียวกัน' : 'Create multiple proposals with the same approval route'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => openCopyDialog('')}>
              <Copy className="h-3.5 w-3.5 mr-1" />
              {language === 'th' ? 'คัดลอกจากเอกสารเดิม' : 'Copy from Previous'}
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={addItem}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {language === 'th' ? 'เพิ่มรายการ' : 'Add Item'}
            </Button>
          </div>
        </div>

        {/* Select all */}
        <div className="flex items-center gap-3 px-1">
          <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
          <span className="text-xs text-muted-foreground">
            {language === 'th'
              ? `เลือกทั้งหมด (${selectedItems.size}/${items.length})`
              : `Select all (${selectedItems.size}/${items.length})`}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-3">
          {items.map((item, idx) => (
            <Card key={item.id} className={cn(
              'transition-all',
              selectedItems.has(item.id) && 'ring-1 ring-primary'
            )}>
              <CardHeader className="pb-2 flex flex-row items-center gap-3">
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={() => toggleSelect(item.id)}
                />
                <div className="flex-1">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5" />
                    {language === 'th' ? `รายการที่ ${idx + 1}` : `Item #${idx + 1}`}
                    {item.partName && (
                      <Badge variant="secondary" className="text-[9px]">{item.partName}</Badge>
                    )}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-destructive"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1 col-span-2">
                    <Label className="text-[10px]">{language === 'th' ? 'ชื่อชิ้นส่วน *' : 'Part Name *'}</Label>
                    <Input
                      className="h-7 text-xs"
                      value={item.partName}
                      onChange={e => updateItem(item.id, 'partName', e.target.value)}
                      placeholder="e.g., Compressor Housing"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{language === 'th' ? 'รุ่น' : 'Model'}</Label>
                    <Input
                      className="h-7 text-xs"
                      value={item.partModel}
                      onChange={e => updateItem(item.id, 'partModel', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{language === 'th' ? 'ซัพพลายเออร์' : 'Supplier'}</Label>
                    <Input
                      className="h-7 text-xs"
                      value={item.supplierManufacturer}
                      onChange={e => updateItem(item.id, 'supplierManufacturer', e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-[10px]">{language === 'th' ? 'ต้นทุนก่อน (C)' : 'Before Cost'}</Label>
                    <Input
                      className="h-7 text-xs"
                      type="number"
                      value={item.beforeCost || ''}
                      onChange={e => updateItem(item.id, 'beforeCost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{language === 'th' ? 'ต้นทุนหลัง (B)' : 'After Cost'}</Label>
                    <Input
                      className="h-7 text-xs"
                      type="number"
                      value={item.afterCost || ''}
                      onChange={e => updateItem(item.id, 'afterCost', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{language === 'th' ? 'ปริมาณ/ปี' : 'Vol/Year'}</Label>
                    <Input
                      className="h-7 text-xs"
                      type="number"
                      value={item.volumePerYear || ''}
                      onChange={e => updateItem(item.id, 'volumePerYear', Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px]">{language === 'th' ? 'ผลประหยัด' : 'Savings'}</Label>
                    <div className={cn(
                      'h-7 flex items-center px-2 rounded-md border bg-muted text-xs font-medium',
                      (item.afterCost - item.beforeCost) < 0 ? 'text-green-600' : 'text-red-500'
                    )}>
                      {((item.volumePerYear * (item.afterCost - item.beforeCost)) / 1000).toLocaleString()} K
                    </div>
                  </div>
                </div>
                {/* Change types inline */}
                <div className="flex flex-wrap gap-1.5">
                  {CHANGE_TYPES.map(ct => (
                    <label
                      key={ct.value}
                      className={cn(
                        'flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer text-[10px] transition-colors',
                        item.changeType.includes(ct.value) ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      )}
                    >
                      <Checkbox
                        checked={item.changeType.includes(ct.value)}
                        onCheckedChange={() => toggleItemArrayField(item.id, 'changeType', ct.value)}
                        className="h-3 w-3"
                      />
                      {ct.label}
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Shared approval route */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Route className="h-4 w-4" />
              {language === 'th' ? 'เส้นทางอนุมัติ (ใช้ร่วมทุกฉบับ)' : 'Approval Route (shared)'}
            </CardTitle>
            <CardDescription className="text-xs">
              {language === 'th' ? 'เลือกเส้นทางอนุมัติที่จะใช้สำหรับเอกสารทุกฉบับ' : 'Select the approval route for all proposals'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={approvalRouteType} onValueChange={v => setApprovalRouteType(v as ApprovalRouteType)}>
              <SelectTrigger className="h-8 text-xs w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">{language === 'th' ? 'ตามลำดับ' : 'Sequential'}</SelectItem>
                <SelectItem value="parallel">{language === 'th' ? 'พร้อมกัน' : 'Parallel'}</SelectItem>
              </SelectContent>
            </Select>
            <ApproverSelector
              users={users}
              selectedApprovers={selectedApprovers}
              onToggleApprover={id => {
                setSelectedApprovers(prev =>
                  prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
                );
              }}
              language={language}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {language === 'th'
              ? `${selectedItems.size > 0 ? selectedItems.size : items.length} เอกสารจะถูกสร้าง`
              : `${selectedItems.size > 0 ? selectedItems.size : items.length} proposals will be created`}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => handleBatchSubmit(true)}>
              <Save size={16} className="mr-1.5" />
              {language === 'th' ? 'บันทึกร่างทั้งหมด' : 'Save All as Draft'}
            </Button>
            <Button variant="hero" onClick={() => handleBatchSubmit(false)}>
              <Send size={16} className="mr-1.5" />
              {language === 'th' ? 'ส่งอนุมัติทั้งหมด' : 'Submit All'}
            </Button>
          </div>
        </div>
      </div>

      {/* Copy from previous dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              {language === 'th' ? 'คัดลอกข้อมูลจากเอกสารก่อนหน้า' : 'Copy from Previous Proposal'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{language === 'th' ? 'เลือกเอกสารต้นฉบับ' : 'Select Source Proposal'}</Label>
              <Select value={copySourceId} onValueChange={setCopySourceId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder={language === 'th' ? 'เลือกเอกสาร...' : 'Select proposal...'} />
                </SelectTrigger>
                <SelectContent>
                  {proposals.map(p => (
                    <SelectItem key={p.id} value={p.id} className="text-xs">
                      {p.proposalNo || 'Draft'} — {p.partName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">{language === 'th' ? 'เลือกข้อมูลที่ต้องการคัดลอก' : 'Select fields to copy'}</Label>
              {[
                { key: 'partInfo', label: language === 'th' ? 'ข้อมูลชิ้นส่วน' : 'Part Info' },
                { key: 'cost', label: language === 'th' ? 'ต้นทุน' : 'Cost Data' },
                { key: 'requestContents', label: language === 'th' ? 'รายการคำขอ' : 'Request Contents' },
                { key: 'notes', label: language === 'th' ? 'หมายเหตุ' : 'Notes' },
              ].map(f => (
                <label key={f.key} className="flex items-center gap-2 text-xs">
                  <Checkbox
                    checked={copyFields[f.key as keyof typeof copyFields]}
                    onCheckedChange={v => setCopyFields(prev => ({ ...prev, [f.key]: !!v }))}
                  />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowCopyDialog(false)}>
              {language === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button size="sm" className="text-xs" onClick={applyCopy} disabled={!copySourceId}>
              <Copy className="h-3 w-3 mr-1" />
              {language === 'th' ? 'คัดลอก' : 'Apply Copy'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
