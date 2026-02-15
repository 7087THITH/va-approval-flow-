import { VAProposal, ChangeType, RequestContent, DistributionTarget } from '@/types/workflow';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet } from 'lucide-react';
import { exportProposalToExcel } from '@/lib/excelExport';

interface VATemplatePreviewProps {
  proposal: VAProposal;
}

const CHANGE_LABELS: Record<string, string> = {
  material_change: 'Material change',
  design_change: 'Form change',
  supplier_change: 'Supplier change',
  process_change: 'Component change',
  cost_reduction: 'Parts standardization',
};

const REQUEST_LABELS: Record<string, string> = {
  material_approval: 'Material approval',
  revise_daikin_standard: 'Revise Daikin Standard',
  manufacturer_approval: 'Manufacturer approval',
  drawing_approval: 'Drawing approval',
  components_approval: 'Components approval',
};

const DIST_LABELS: Record<string, string> = {
  b_shiga: 'B/Shiga',
  k_kanaoka: 'K/Kanaoka',
  refrigeration_div_pic: 'Refrigeration Div. PIC',
  quality_assurance: 'Quality Assurance',
  production_control: 'Production Control',
  procurement: 'Procurement',
};

const JUDGEMENT_LABELS: Record<string, string> = {
  approve: '1. Approve',
  go_to_evaluation: '2. Go to evaluation',
  reject: '3. Reject',
  request_to_dil: '4. Request to DIL',
};

export function VATemplatePreview({ proposal }: VATemplatePreviewProps) {
  const cellBase = 'border border-gray-400 px-1.5 py-1 text-[10px] leading-tight';
  const headerYellow = `${cellBase} bg-yellow-100 font-semibold`;
  const headerGreen = `${cellBase} bg-emerald-100`;
  const headerCyan = `${cellBase} bg-cyan-100`;

  // Generate QR-PUD document number
  const fiscalYear = proposal.createdAt.getFullYear();
  const seqNum = proposal.proposalNo ? proposal.proposalNo.split('-').pop() || '001' : '001';
  const qrPudNo = `QR-PUD-${fiscalYear}-${seqNum}`;

  // Get approver signatures from steps
  const getApproverByRole = (roleHint: string) => {
    const step = proposal.approvalRoute.steps.find(s => 
      s.status === 'approved' && s.approverName
    );
    return step;
  };
  
  const approvedSteps = proposal.approvalRoute.steps.filter(s => s.status === 'approved');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">VA Proposal Request Sheet Preview</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Print / PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportProposalToExcel(proposal)}>
            <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg overflow-auto print:border-0 print:shadow-none" id="va-template-print">
        <div className="p-4 min-w-[860px]">
          <table className="w-full border-collapse border border-gray-400 text-gray-800">
            <tbody>
              {/* Title Row with QR-PUD */}
              <tr>
                <td colSpan={5} className={`${cellBase} text-center text-base font-bold`}>
                  VA proposal request Sheet
                </td>
                <td colSpan={3} className={`${cellBase} text-center`}>
                  <div className="flex items-center justify-center gap-1">
                    {qrPudNo.split('').map((char, i) => (
                      <span key={i} className={`inline-block ${char === '-' ? 'mx-0.5' : 'border border-gray-400 w-4 h-5 flex items-center justify-center text-[10px] font-mono font-bold'}`}>
                        {char === '-' ? '·' : char}
                      </span>
                    ))}
                  </div>
                  <div className="text-[8px] text-gray-400 mt-0.5">{proposal.proposalNo || ''}</div>
                </td>
                <td colSpan={2} className={`${cellBase} text-[9px]`}>
                  <div>Applied: {format(proposal.createdAt, 'dd/MM/yy')}</div>
                  <div>Applying Div: {proposal.department}</div>
                </td>
                <td className={`${cellBase} text-center font-bold text-[9px]`}>
                  <div className={`border-2 px-2 py-0.5 inline-block ${proposal.confidentiality === 'secret' ? 'border-red-600 text-red-600' : proposal.confidentiality === 'confidential' ? 'border-orange-500 text-orange-600' : 'border-gray-400 text-gray-500'}`}>
                    {proposal.confidentiality === 'secret' ? 'Secret' : proposal.confidentiality === 'confidential' ? 'Confidential' : 'Internal'}
                  </div>
                </td>
              </tr>

              {/* Requester Section with Approver Signature Boxes */}
              <tr>
                <td className={cellBase} style={{ width: '10%' }}>Requester</td>
                <td colSpan={4} className={`${cellBase} text-[9px] text-gray-500`}>
                  Input data in the requester section
                </td>
                <td colSpan={2} className={cellBase}>Name: {proposal.requesterName}</td>
                <td className={`${cellBase} text-center text-[9px]`}>
                  <div className="font-semibold text-[8px] text-gray-500">GM</div>
                  <div className="min-h-[20px] text-[9px] font-medium text-primary">
                    {approvedSteps[2]?.approverName || ''}
                  </div>
                </td>
                <td className={`${cellBase} text-center text-[9px]`}>
                  <div className="font-semibold text-[8px] text-gray-500">MGR</div>
                  <div className="min-h-[20px] text-[9px] font-medium text-primary">
                    {approvedSteps[1]?.approverName || ''}
                  </div>
                </td>
                <td className={`${cellBase} text-center text-[9px]`}>
                  <div className="font-semibold text-[8px] text-gray-500">SU/ENG.</div>
                  <div className="min-h-[20px] text-[9px] font-medium text-primary">
                    {approvedSteps[0]?.approverName || ''}
                  </div>
                </td>
                <td className={cellBase}></td>
              </tr>

              {/* Phone/Email/Date */}
              <tr>
                <td colSpan={2} className={cellBase}>Phone No.</td>
                <td colSpan={3} className={cellBase}>E-mail: {proposal.requesterName.toLowerCase().replace(' ', '.')}@daikin.com</td>
                <td colSpan={2} className={cellBase}>Date: {format(proposal.createdAt, 'dd/MM/yyyy')}</td>
                <td colSpan={4} className={cellBase}></td>
              </tr>

              {/* Name of Theme */}
              <tr>
                <td colSpan={2} className={cellBase}>Name of Theme</td>
                <td colSpan={5} className={cellBase}>{proposal.partName}</td>
                <td colSpan={4} className={`${cellBase} text-[9px]`}>
                  {['cost_reduction', 'quality_improvement', 'others'].map((t) => (
                    <span key={t} className="mr-2">
                      {proposal.changeType.includes(t as ChangeType) ? '☑' : '☐'}{' '}
                      {t === 'cost_reduction' ? 'Cost reduction' : t === 'quality_improvement' ? 'Quality improvement' : 'Others'}
                    </span>
                  ))}
                </td>
              </tr>

              {/* Part Name/Model - Yellow */}
              <tr>
                <td colSpan={2} className={headerYellow}>Part Name / Model</td>
                <td colSpan={3} className={cellBase}>{proposal.partName} {proposal.partModel && `/ ${proposal.partModel}`}</td>
                <td colSpan={2} className={headerYellow}>Annual QTY (A)</td>
                <td colSpan={2} className={cellBase}>{proposal.cost.volumePerYear.toLocaleString()}</td>
                <td className={cellBase}>pc/year</td>
                <td className={cellBase}>{proposal.cost.currency}</td>
              </tr>

              {/* Related Drawing */}
              <tr>
                <td colSpan={2} className={headerYellow}>Related Drawing No.</td>
                <td colSpan={3} className={cellBase}>{proposal.relatedDrawingNo || ''}</td>
                <td colSpan={2} className={headerYellow}>Current Cost (B)</td>
                <td colSpan={2} className={cellBase}>{proposal.cost.beforeCost.toLocaleString()}</td>
                <td colSpan={2} className={cellBase}>({proposal.cost.currency})/pc</td>
              </tr>

              {/* Initial Production */}
              <tr>
                <td colSpan={2} className={headerYellow}>Initial start of production after approval</td>
                <td colSpan={3} className={cellBase}>
                  {proposal.initialProductionDate ? format(proposal.initialProductionDate, 'dd/MM/yyyy') : ''}
                </td>
                <td colSpan={2} className={headerYellow}>Target Cost (C)</td>
                <td colSpan={2} className={cellBase}>{proposal.cost.afterCost.toLocaleString()}</td>
                <td colSpan={2} className={cellBase}>({proposal.cost.currency})/pc</td>
              </tr>

              {/* Cost Savings Effect */}
              <tr>
                <td colSpan={2} className={cellBase}>Estimated development cost</td>
                <td colSpan={3} className={cellBase}>K ({proposal.cost.currency})</td>
                <td colSpan={2} className={`${headerYellow} text-red-700`}>Cost-savings Effect (D)=B-C</td>
                <td colSpan={2} className={cellBase}>{proposal.cost.costDifference.toLocaleString()}</td>
                <td className={cellBase}>({proposal.cost.currency})/pc</td>
                <td className={cellBase}>exchange rate</td>
              </tr>

              {/* Annual Contribution */}
              <tr>
                <td colSpan={2} className={cellBase}>Estimated die or jig cost</td>
                <td colSpan={3} className={cellBase}>K ({proposal.cost.currency})</td>
                <td colSpan={2} className={`${headerYellow} text-red-700`}>Annual Contribution (A*D/1000)</td>
                <td colSpan={2} className={cellBase}>{proposal.cost.annualContribution.toLocaleString()}</td>
                <td colSpan={2} className={cellBase}>K({proposal.cost.currency})/year</td>
              </tr>

              {/* Current Situation + Purposes */}
              <tr>
                <td colSpan={5} rowSpan={5} className={headerGreen} style={{ verticalAlign: 'top' }}>
                  <div className="font-semibold mb-1">Current Situation</div>
                  <div className="text-[9px] whitespace-pre-wrap min-h-[80px]">
                    {proposal.notes || ''}
                  </div>
                </td>
                <td colSpan={6} rowSpan={5} className={headerGreen} style={{ verticalAlign: 'top' }}>
                  <div className="font-semibold mb-1">The purposes of this proposal</div>
                  <div className="text-[9px] space-y-0.5">
                    {Object.entries(CHANGE_LABELS).map(([key, label]) => (
                      <span key={key} className="mr-3">
                        {proposal.changeType.includes(key as ChangeType) ? '☑' : '☐'} {label}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
              <tr />
              <tr />
              <tr />
              <tr />

              {/* Additional Remark */}
              <tr>
                <td colSpan={11} className={`${cellBase} bg-blue-50`}>
                  <span className="font-semibold text-blue-800">Additional remark</span>
                  <span className="text-[9px] text-gray-500 ml-2">(if any issues are foreseen for this proposals)</span>
                  <div className="min-h-[20px] mt-1 text-[9px]">{proposal.procurementNotes || ''}</div>
                </td>
              </tr>

              {/* Daikin Use Header */}
              <tr>
                <td colSpan={11} className={`${cellBase} bg-cyan-50 font-bold text-cyan-900`}>
                  Daikin use
                </td>
              </tr>

              {/* (1) Procurement Div */}
              <tr>
                <td rowSpan={2} className={headerCyan}>(1) Procurement Div.</td>
                <td className={cellBase}>Received date</td>
                <td colSpan={6} className={cellBase}>
                  The following points should be confirmed by procurement.
                </td>
                <td className={`${cellBase} text-center text-[9px]`}>Approval</td>
                <td className={`${cellBase} text-center text-[9px]`}>Check</td>
                <td className={`${cellBase} text-center text-[9px]`}>Issue</td>
              </tr>
              <tr>
                <td className={cellBase}>Reference No.</td>
                <td colSpan={6} className={cellBase}>
                  <div className="text-[9px]">All necessary information is available.</div>
                  <div className="text-[9px]">The content of request to design is checked by procurement</div>
                </td>
                <td className={cellBase}></td>
                <td className={cellBase}></td>
                <td className={cellBase}></td>
              </tr>

              {/* Contents of Request */}
              <tr>
                <td colSpan={2} className={`${headerCyan} text-center`}>Contents of request</td>
                <td colSpan={9} className={cellBase}>
                  {Object.entries(REQUEST_LABELS).map(([key, label]) => (
                    <span key={key} className="mr-3 text-[9px]">
                      {proposal.requestContents.includes(key as RequestContent) ? '☑' : '☐'} {label}
                    </span>
                  ))}
                </td>
              </tr>

              {/* (2) Design Div */}
              <tr>
                <td rowSpan={2} className={headerCyan}>(2) Design Div.</td>
                <td className={cellBase}>Received date</td>
                <td colSpan={6} className={`${cellBase} text-center font-semibold`}>Judgement</td>
                <td className={`${cellBase} text-center text-[9px]`}>Approval</td>
                <td className={`${cellBase} text-center text-[9px]`}>Check</td>
                <td className={`${cellBase} text-center text-[9px]`}>Issue</td>
              </tr>
              <tr>
                <td className={cellBase}>Replied date</td>
                <td colSpan={6} className={cellBase}>
                  {Object.entries(JUDGEMENT_LABELS).map(([key, label]) => (
                    <span key={key} className={`mr-3 text-[9px] ${proposal.judgement === key ? 'font-bold underline' : ''}`}>
                      {label}
                    </span>
                  ))}
                </td>
                <td className={cellBase}></td>
                <td className={cellBase}></td>
                <td className={cellBase}></td>
              </tr>

              {/* Reason for Judgement */}
              <tr>
                <td colSpan={7} className={cellBase}>
                  <div className="text-[9px]">
                    {proposal.judgement === 'approve'
                      ? `1. Apply from ${proposal.initialProductionDate ? format(proposal.initialProductionDate, 'MM/yyyy') : '(  )'} MM/YYYY`
                      : ''}
                  </div>
                </td>
                <td colSpan={4} className={`${cellBase} text-red-600 font-semibold text-[9px]`}>
                  Reason for the judgement: {proposal.judgementReason || ''}
                </td>
              </tr>

              {/* Distribution */}
              <tr>
                <td colSpan={2} className={headerCyan}>(5) Distribution</td>
                <td colSpan={9} className={cellBase}>
                  {Object.entries(DIST_LABELS).map(([key, label]) => (
                    <span key={key} className="mr-3 text-[9px]">
                      {proposal.distributionList.includes(key as DistributionTarget) ? '☑' : '☐'} {label}
                    </span>
                  ))}
                </td>
              </tr>

              {/* Route */}
              <tr>
                <td colSpan={11} className={`${cellBase} text-[9px]`}>
                  <span className="font-semibold">Route:</span>{' '}
                  Requester → PUD → R&D → PUD → Requester
                </td>
              </tr>

              {/* Footer with QR-PUD */}
              <tr>
                <td className={`${cellBase} text-center text-[9px]`}>QR</td>
                <td className={`${cellBase} text-center text-[9px]`}>5 Years</td>
                <td colSpan={5} className={`${cellBase} text-center text-[9px] font-semibold`}>
                  PARTS PROCUREMENT DIVISION
                </td>
                <td colSpan={2} className={`${cellBase} text-center`}>
                  <span className="font-bold text-xs text-cyan-700">DAIKIN</span>
                </td>
                <td colSpan={2} className={`${cellBase} text-right text-[9px] font-semibold`}>
                  {qrPudNo}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
