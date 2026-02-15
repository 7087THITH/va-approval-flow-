import ExcelJS from 'exceljs';
import { VAProposal, RequestContent, DistributionTarget, ChangeType } from '@/types/workflow';
import { format } from 'date-fns';

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

const CHANGE_LABELS: Record<string, string> = {
  material_change: 'Material change',
  design_change: 'Form change',
  supplier_change: 'Supplier change',
  process_change: 'Component change',
  cost_reduction: 'Parts standardization',
};

const thinBorder: Partial<ExcelJS.Borders> = {
  top: { style: 'thin' },
  left: { style: 'thin' },
  bottom: { style: 'thin' },
  right: { style: 'thin' },
};

const yellowFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFFFF2CC' },
};

const greenFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD5F5E3' },
};

const cyanFill: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFD1ECF1' },
};

export async function exportProposalToExcel(proposal: VAProposal): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet('VA Proposal', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
  });

  // Set column widths (11 columns)
  ws.columns = [
    { width: 14 }, { width: 12 }, { width: 12 }, { width: 12 }, { width: 12 },
    { width: 14 }, { width: 14 }, { width: 10 }, { width: 10 }, { width: 10 }, { width: 10 },
  ];

  let row = 1;

  // Title
  ws.mergeCells(row, 1, row, 5);
  const titleCell = ws.getCell(row, 1);
  titleCell.value = 'VA proposal request Sheet';
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border = thinBorder;

  ws.mergeCells(row, 6, row, 8);
  ws.getCell(row, 6).value = proposal.proposalNo || 'QR-PUD-____';
  ws.getCell(row, 6).border = thinBorder;
  ws.getCell(row, 6).alignment = { horizontal: 'center' };

  ws.mergeCells(row, 9, row, 10);
  ws.getCell(row, 9).value = `Applied: ${format(proposal.createdAt, 'dd/MM/yy')}`;
  ws.getCell(row, 9).border = thinBorder;
  ws.getCell(row, 9).font = { size: 8 };

  ws.getCell(row, 11).value = proposal.confidentiality === 'secret' ? 'Secret' : proposal.confidentiality === 'confidential' ? 'Confidential' : 'Internal';
  ws.getCell(row, 11).font = { bold: true, color: { argb: 'FFFF0000' }, size: 9 };
  ws.getCell(row, 11).border = thinBorder;
  ws.getCell(row, 11).alignment = { horizontal: 'center' };
  row++;

  // Requester header
  ws.getCell(row, 1).value = 'Requester';
  ws.getCell(row, 1).border = thinBorder;
  ws.mergeCells(row, 2, row, 5);
  ws.getCell(row, 2).value = 'Input data in the requester section';
  ws.getCell(row, 2).border = thinBorder;
  ws.getCell(row, 2).font = { size: 8, color: { argb: 'FF888888' } };
  ws.mergeCells(row, 6, row, 7);
  ws.getCell(row, 6).value = `Name: ${proposal.requesterName}`;
  ws.getCell(row, 6).border = thinBorder;
  ['GM', 'MGR', 'SU/ENG.'].forEach((label, i) => {
    const c = ws.getCell(row, 8 + i);
    c.value = label;
    c.border = thinBorder;
    c.alignment = { horizontal: 'center' };
    c.font = { size: 8 };
  });
  ws.getCell(row, 11).border = thinBorder;
  row++;

  // Date row
  ws.mergeCells(row, 1, row, 2);
  ws.getCell(row, 1).value = 'Phone No.';
  ws.getCell(row, 1).border = thinBorder;
  ws.mergeCells(row, 3, row, 5);
  ws.getCell(row, 3).value = 'E-mail:';
  ws.getCell(row, 3).border = thinBorder;
  ws.mergeCells(row, 6, row, 7);
  ws.getCell(row, 6).value = `Date: ${format(proposal.createdAt, 'dd/MM/yyyy')}`;
  ws.getCell(row, 6).border = thinBorder;
  for (let c = 8; c <= 11; c++) ws.getCell(row, c).border = thinBorder;
  row++;

  // Theme
  ws.mergeCells(row, 1, row, 2);
  ws.getCell(row, 1).value = 'Name of Theme';
  ws.getCell(row, 1).border = thinBorder;
  ws.mergeCells(row, 3, row, 7);
  ws.getCell(row, 3).value = proposal.partName;
  ws.getCell(row, 3).border = thinBorder;
  ws.mergeCells(row, 8, row, 11);
  ws.getCell(row, 8).value = `${proposal.changeType.includes('cost_reduction' as ChangeType) ? '☑' : '☐'} Cost reduction  ${proposal.changeType.includes('design_change' as ChangeType) ? '☑' : '☐'} Quality improvement  ☐ Others`;
  ws.getCell(row, 8).border = thinBorder;
  ws.getCell(row, 8).font = { size: 8 };
  row++;

  // Part Name (yellow)
  const partRows = [
    {
      left: ['Part Name / Model', `${proposal.partName}${proposal.partModel ? ' / ' + proposal.partModel : ''}`],
      right: ['Annual QTY (A)', proposal.cost.volumePerYear.toLocaleString(), 'pc/year', proposal.cost.currency],
    },
    {
      left: ['Related Drawing No.', proposal.relatedDrawingNo || ''],
      right: ['Current Cost (B)', proposal.cost.beforeCost.toLocaleString(), `(${proposal.cost.currency})/pc`, ''],
    },
    {
      left: ['Initial start of production', proposal.initialProductionDate ? format(proposal.initialProductionDate, 'dd/MM/yyyy') : ''],
      right: ['Target Cost (C)', proposal.cost.afterCost.toLocaleString(), `(${proposal.cost.currency})/pc`, ''],
    },
    {
      left: ['Estimated development cost', `K (${proposal.cost.currency})`],
      right: ['Cost-savings Effect (D)=B-C', proposal.cost.costDifference.toLocaleString(), `(${proposal.cost.currency})/pc`, 'exchange rate'],
    },
    {
      left: ['Estimated die or jig cost', `K (${proposal.cost.currency})`],
      right: ['Annual Contribution (A*D/1000)', proposal.cost.annualContribution.toLocaleString(), `K(${proposal.cost.currency})/year`, ''],
    },
  ];

  partRows.forEach((pr) => {
    ws.mergeCells(row, 1, row, 2);
    const lLabel = ws.getCell(row, 1);
    lLabel.value = pr.left[0];
    lLabel.fill = yellowFill;
    lLabel.border = thinBorder;
    lLabel.font = { bold: true, size: 9 };

    ws.mergeCells(row, 3, row, 5);
    ws.getCell(row, 3).value = pr.left[1];
    ws.getCell(row, 3).border = thinBorder;

    ws.mergeCells(row, 6, row, 7);
    const rLabel = ws.getCell(row, 6);
    rLabel.value = pr.right[0];
    rLabel.fill = yellowFill;
    rLabel.border = thinBorder;
    rLabel.font = { bold: true, size: 9 };

    ws.mergeCells(row, 8, row, 9);
    ws.getCell(row, 8).value = pr.right[1];
    ws.getCell(row, 8).border = thinBorder;

    ws.getCell(row, 10).value = pr.right[2];
    ws.getCell(row, 10).border = thinBorder;
    ws.getCell(row, 10).font = { size: 8 };

    ws.getCell(row, 11).value = pr.right[3];
    ws.getCell(row, 11).border = thinBorder;
    ws.getCell(row, 11).font = { size: 8 };

    row++;
  });

  // Current Situation + Purposes (green, 5 rows)
  const sitStartRow = row;
  ws.mergeCells(row, 1, row + 4, 5);
  const sitCell = ws.getCell(row, 1);
  sitCell.value = `Current Situation\n\n${proposal.notes || ''}`;
  sitCell.fill = greenFill;
  sitCell.border = thinBorder;
  sitCell.alignment = { vertical: 'top', wrapText: true };
  sitCell.font = { size: 9 };

  const purposeText = Object.entries(CHANGE_LABELS)
    .map(([k, l]) => `${proposal.changeType.includes(k as ChangeType) ? '☑' : '☐'} ${l}`)
    .join('\n');

  ws.mergeCells(row, 6, row + 4, 11);
  const purCell = ws.getCell(row, 6);
  purCell.value = `The purposes of this proposal\n\n${purposeText}`;
  purCell.fill = greenFill;
  purCell.border = thinBorder;
  purCell.alignment = { vertical: 'top', wrapText: true };
  purCell.font = { size: 9 };
  row += 5;

  // Additional Remark
  ws.mergeCells(row, 1, row, 11);
  const remarkCell = ws.getCell(row, 1);
  remarkCell.value = 'Additional remark (if any issues are foreseen for this proposals)';
  remarkCell.border = thinBorder;
  remarkCell.font = { italic: true, size: 8 };
  row++;

  // Daikin use header
  ws.mergeCells(row, 1, row, 11);
  const daikinCell = ws.getCell(row, 1);
  daikinCell.value = 'Daikin use';
  daikinCell.fill = cyanFill;
  daikinCell.border = thinBorder;
  daikinCell.font = { bold: true, size: 10 };
  row++;

  // Contents of request
  ws.mergeCells(row, 1, row, 2);
  ws.getCell(row, 1).value = 'Contents of request';
  ws.getCell(row, 1).fill = cyanFill;
  ws.getCell(row, 1).border = thinBorder;
  ws.getCell(row, 1).font = { bold: true, size: 8 };
  ws.mergeCells(row, 3, row, 11);
  const reqText = Object.entries(REQUEST_LABELS)
    .map(([k, l]) => `${proposal.requestContents.includes(k as RequestContent) ? '☑' : '☐'} ${l}`)
    .join(', ');
  ws.getCell(row, 3).value = reqText;
  ws.getCell(row, 3).border = thinBorder;
  ws.getCell(row, 3).font = { size: 8 };
  row++;

  // Judgement
  ws.mergeCells(row, 1, row, 2);
  ws.getCell(row, 1).value = 'Judgement';
  ws.getCell(row, 1).fill = cyanFill;
  ws.getCell(row, 1).border = thinBorder;
  ws.getCell(row, 1).font = { bold: true, size: 8 };
  ws.mergeCells(row, 3, row, 11);
  const jText = ['approve', 'go_to_evaluation', 'reject', 'request_to_dil']
    .map((j, i) => `${proposal.judgement === j ? '●' : '○'} ${i + 1}. ${j === 'approve' ? 'Approve' : j === 'go_to_evaluation' ? 'Go to evaluation' : j === 'reject' ? 'Reject' : 'Request to DIL'}`)
    .join('   ');
  ws.getCell(row, 3).value = jText;
  ws.getCell(row, 3).border = thinBorder;
  ws.getCell(row, 3).font = { size: 8 };
  row++;

  // Reason
  if (proposal.judgementReason) {
    ws.mergeCells(row, 1, row, 2);
    ws.getCell(row, 1).value = 'Reason';
    ws.getCell(row, 1).border = thinBorder;
    ws.getCell(row, 1).font = { bold: true, size: 8, color: { argb: 'FFFF0000' } };
    ws.mergeCells(row, 3, row, 11);
    ws.getCell(row, 3).value = proposal.judgementReason;
    ws.getCell(row, 3).border = thinBorder;
    row++;
  }

  // Distribution
  ws.mergeCells(row, 1, row, 2);
  ws.getCell(row, 1).value = 'Distribution';
  ws.getCell(row, 1).fill = cyanFill;
  ws.getCell(row, 1).border = thinBorder;
  ws.getCell(row, 1).font = { bold: true, size: 8 };
  ws.mergeCells(row, 3, row, 11);
  const distText = Object.entries(DIST_LABELS)
    .map(([k, l]) => `${proposal.distributionList.includes(k as DistributionTarget) ? '☑' : '☐'} ${l}`)
    .join(', ');
  ws.getCell(row, 3).value = distText;
  ws.getCell(row, 3).border = thinBorder;
  ws.getCell(row, 3).font = { size: 8 };
  row++;

  // Route
  ws.mergeCells(row, 1, row, 11);
  ws.getCell(row, 1).value = 'Route: Requester → PUD → R&D → PUD → Requester';
  ws.getCell(row, 1).border = thinBorder;
  ws.getCell(row, 1).font = { size: 8 };
  row++;

  // Footer
  ws.mergeCells(row, 1, row, 2);
  ws.getCell(row, 1).value = 'QR  |  5 Years';
  ws.getCell(row, 1).border = thinBorder;
  ws.getCell(row, 1).font = { size: 8 };
  ws.mergeCells(row, 3, row, 7);
  ws.getCell(row, 3).value = 'PARTS PROCUREMENT DIVISION';
  ws.getCell(row, 3).border = thinBorder;
  ws.getCell(row, 3).font = { bold: true, size: 9 };
  ws.getCell(row, 3).alignment = { horizontal: 'center' };
  ws.mergeCells(row, 8, row, 9);
  ws.getCell(row, 8).value = 'DAIKIN';
  ws.getCell(row, 8).border = thinBorder;
  ws.getCell(row, 8).font = { bold: true, size: 10 };
  ws.getCell(row, 8).alignment = { horizontal: 'center' };
  ws.mergeCells(row, 10, row, 11);
  ws.getCell(row, 10).value = 'F-PUD-062';
  ws.getCell(row, 10).border = thinBorder;
  ws.getCell(row, 10).font = { bold: true, size: 9 };
  ws.getCell(row, 10).alignment = { horizontal: 'right' };

  // Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `VA_${proposal.proposalNo || 'draft'}_${format(new Date(), 'yyyyMMdd')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
