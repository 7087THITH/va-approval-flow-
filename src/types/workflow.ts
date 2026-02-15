// VA Proposal Workflow Types

export type UserRole = 'requester' | 'approver' | 'admin' | 'procurement' | 'va_team';

export type ProposalStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'revision' | 'returned' | 'evaluation';

export type ConfidentialityLevel = 'secret' | 'confidential' | 'internal';

export type JudgementType = 'approve' | 'go_to_evaluation' | 'reject' | 'request_to_dil' | 'return' | 'return_update';

export type ApprovalRouteType = 'sequential' | 'parallel';

export type ChangeType = 
  | 'material_change'
  | 'design_change'
  | 'supplier_change'
  | 'process_change'
  | 'cost_reduction';

export type RequestContent = 
  | 'material_approval'
  | 'revise_daikin_standard'
  | 'manufacturer_approval'
  | 'drawing_approval'
  | 'components_approval';

export type DistributionTarget =
  | 'b_shiga'
  | 'k_kanaoka'
  | 'refrigeration_div_pic'
  | 'quality_assurance'
  | 'production_control'
  | 'procurement';

export interface User {
  id: string;
  email: string;
  name: string;
  nameTh?: string;
  role: UserRole;
  department: string;
  departmentTh?: string;
  plant?: string;
  position?: string; // e.g., GM, MGR, SU/ENG., Engineer
  avatar?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface ApprovalStep {
  id: string;
  order: number;
  approverId: string;
  approverName: string;
  status: 'pending' | 'approved' | 'rejected' | 'skipped';
  judgement?: JudgementType;
  comment?: string;
  actionAt?: Date;
}

export interface ApprovalRoute {
  id: string;
  type: ApprovalRouteType;
  steps: ApprovalStep[];
}

export interface CostSection {
  beforeCost: number; // C
  afterCost: number; // B
  costDifference: number; // D = B - C (auto-calculated)
  volumePerYear: number; // A (pcs/year)
  annualContribution: number; // A * D / 1000 (auto-calculated)
  currency: string;
}

export interface VAProposal {
  id: string;
  proposalNo: string;
  
  // Header
  confidentiality: ConfidentialityLevel;
  createdAt: Date;
  updatedAt: Date;
  requesterId: string;
  requesterName: string;
  department: string;
  departmentTh?: string;
  plant: string;
  division?: string;
  
  // Part Info
  partName: string;
  partModel?: string;
  relatedDrawingNo?: string;
  supplierManufacturer?: string;
  changeType: ChangeType[];
  
  // Schedule
  initialProductionDate?: Date;
  
  // Cost
  cost: CostSection;
  
  // Request Contents
  requestContents: RequestContent[];
  
  // Judgement (filled by approvers)
  judgement?: JudgementType;
  judgementReason?: string;
  
  // Distribution
  distributionList: DistributionTarget[];
  distributionNotes?: string;
  
  // Procurement
  procurementNotes?: string;
  procurementConfirmed?: boolean;
  procurementConfirmedBy?: string;
  procurementConfirmedAt?: Date;
  
  // Notes & Attachments
  notes?: string;
  attachments: Attachment[];
  partImages?: {
    current?: { name: string; url: string };
    improved?: { name: string; url: string };
  };
  
  // Workflow
  status: ProposalStatus;
  approvalRoute: ApprovalRoute;
  currentStepIndex: number;
  
  // Evaluation (Go to Evaluation flow)
  evaluation?: {
    assignedTeamId?: string;
    assignedTeamName?: string;
    assignedById?: string;
    assignedByName?: string;
    assignedAt?: Date;
    evaluatorComment?: string;
    evaluationCompleted?: boolean;
    completedAt?: Date;
    completedById?: string;
    completedByName?: string;
    returnToStepIndex?: number; // which approval step to return to after evaluation
  };
  
  // VA Team Check Sheet
  vaCheckSheet?: VACheckSheet;
  
  // Versioning
  version: number;
  previousVersionId?: string;
  
  // Audit
  auditLog: AuditEntry[];
}

// VA Team Information Check Sheet
export interface VACheckSheetItem {
  id: string;
  no: number;
  description: string;
  descriptionTh: string;
  format: string;
  checked: boolean;
  remark?: string;
}

export const VA_CHECK_SHEET_ITEMS: Omit<VACheckSheetItem, 'id' | 'checked' | 'remark'>[] = [
  { no: 1, description: 'Drawing list', descriptionTh: 'รายการแบบ', format: 'Supplier format' },
  { no: 2, description: 'Benefit calculation sheet', descriptionTh: 'ใบคำนวณผลประโยชน์', format: 'DIT format' },
  { no: 3, description: 'Spec comparison sheet', descriptionTh: 'ใบเปรียบเทียบสเปค', format: 'Supplier format' },
  { no: 4, description: 'Test report (following AS spec)', descriptionTh: 'รายงานทดสอบ (ตาม AS spec)', format: 'Supplier format' },
  { no: 5, description: 'RoSH2 certificate', descriptionTh: 'ใบรับรอง RoHS2', format: 'Supplier format' },
  { no: 6, description: 'Other information', descriptionTh: 'ข้อมูลอื่นๆ', format: 'Supplier format' },
  { no: 7, description: 'Risk of price fluctuations (Diff price change during development)', descriptionTh: 'ความเสี่ยงด้านราคา (ส่วนต่างราคาระหว่างพัฒนา)', format: 'Free format' },
  { no: 8, description: 'Inspection request sheet result (OK)', descriptionTh: 'ผลใบขอตรวจสอบ (OK)', format: 'DIT format' },
];

export interface VACheckSheet {
  items: VACheckSheetItem[];
  vaTheme?: string;
  supplier?: string;
  buyer?: string;
  date?: string;
  comment?: string;
  checkedById?: string;
  checkedByName?: string;
  checkedAt?: Date;
  isComplete: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  details?: string;
  previousValue?: string;
  newValue?: string;
}

// Labels for i18n
export const labels = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    newProposal: 'New VA Proposal',
    myDrafts: 'My Drafts',
    pendingApprovals: 'Pending Approvals',
    completed: 'Completed',
    rejected: 'Rejected',
    history: 'History',
    settings: 'Settings',
    logout: 'Logout',
    
    // Status
    draft: 'Draft',
    pending: 'Pending',
    approved: 'Approved',
    revision: 'Revision Requested',
    returned: 'Returned',
    evaluation: 'Under Evaluation',
    
    // Confidentiality
    secret: 'Secret',
    confidential: 'Confidential',
    internal: 'Internal',
    
    // Actions
    approve: 'Approve',
    reject: 'Reject',
    requestRevision: 'Request Revision',
    goToEvaluation: 'Go to Evaluation',
    requestToDil: 'Request to DIL',
    submit: 'Submit',
    saveDraft: 'Save Draft',
    cancel: 'Cancel',
    exportPdf: 'Export PDF',
    exportExcel: 'Export Excel',
    
    // Form sections
    basicInfo: 'Basic Information',
    partInfo: 'Part Information',
    costEffect: 'Cost & Effect',
    requestContents: 'Request Contents',
    approvalRoute: 'Approval Route',
    attachments: 'Attachments',
    review: 'Review & Submit',
    
    // Fields
    proposalNo: 'Proposal No.',
    date: 'Date',
    requester: 'Requester',
    department: 'Department',
    plant: 'Plant/Division',
    partName: 'Part Name/Model',
    relatedDrawingNo: 'Related Drawing No.',
    supplierManufacturer: 'Supplier/Manufacturer',
    changeType: 'Change Type',
    initialProductionDate: 'Initial Production Start',
    beforeCost: 'Before Cost (C)',
    afterCost: 'After Cost (B)',
    costDifference: 'Cost Difference (D = B - C)',
    volumePerYear: 'Volume (pcs/year)',
    annualContribution: 'Annual Contribution (K)',
    judgement: 'Judgement',
    reason: 'Reason',
    distributionList: 'Distribution List',
    procurementNotes: 'Procurement Notes',
  },
  th: {
    // Navigation
    dashboard: 'แดชบอร์ด',
    newProposal: 'สร้าง VA Proposal ใหม่',
    myDrafts: 'ร่างของฉัน',
    pendingApprovals: 'รอการอนุมัติ',
    completed: 'เสร็จสิ้น',
    rejected: 'ถูกปฏิเสธ',
    history: 'ประวัติเอกสาร',
    settings: 'ตั้งค่า',
    logout: 'ออกจากระบบ',
    
    // Status
    draft: 'ร่าง',
    pending: 'รอดำเนินการ',
    approved: 'อนุมัติแล้ว',
    revision: 'ขอแก้ไข',
    returned: 'ส่งคืน',
    evaluation: 'อยู่ระหว่างประเมิน',
    
    // Confidentiality
    secret: 'ลับสุดยอด',
    confidential: 'ลับ',
    internal: 'ภายในองค์กร',
    
    // Actions
    approve: 'อนุมัติ',
    reject: 'ปฏิเสธ',
    requestRevision: 'ขอแก้ไข',
    goToEvaluation: 'ส่งประเมิน',
    requestToDil: 'ส่งต่อ DIL',
    submit: 'ส่ง',
    saveDraft: 'บันทึกร่าง',
    cancel: 'ยกเลิก',
    exportPdf: 'ส่งออก PDF',
    exportExcel: 'ส่งออก Excel',
    
    // Form sections
    basicInfo: 'ข้อมูลพื้นฐาน',
    partInfo: 'ข้อมูลชิ้นส่วน',
    costEffect: 'ต้นทุนและผลกระทบ',
    requestContents: 'รายการคำขอ',
    approvalRoute: 'เส้นทางการอนุมัติ',
    attachments: 'เอกสารแนบ',
    review: 'ตรวจสอบและส่ง',
    
    // Fields
    proposalNo: 'เลขที่เอกสาร',
    date: 'วันที่',
    requester: 'ผู้ขอ',
    department: 'แผนก',
    plant: 'โรงงาน/ฝ่าย',
    partName: 'ชื่อชิ้นส่วน/รุ่น',
    relatedDrawingNo: 'เลขแบบที่เกี่ยวข้อง',
    supplierManufacturer: 'ผู้ผลิต/ซัพพลายเออร์',
    changeType: 'ประเภทการเปลี่ยนแปลง',
    initialProductionDate: 'วันเริ่มผลิต',
    beforeCost: 'ต้นทุนก่อน (C)',
    afterCost: 'ต้นทุนหลัง (B)',
    costDifference: 'ส่วนต่างต้นทุน (D = B - C)',
    volumePerYear: 'ปริมาณ (ชิ้น/ปี)',
    annualContribution: 'ผลประหยัดต่อปี (K)',
    judgement: 'การตัดสินใจ',
    reason: 'เหตุผล',
    distributionList: 'รายชื่อผู้รับเอกสาร',
    procurementNotes: 'หมายเหตุฝ่ายจัดซื้อ',
  }
};

export type Language = 'en' | 'th';
export type LabelKey = keyof typeof labels.en;
