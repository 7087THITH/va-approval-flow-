/**
 * VA Calculate Demo Data
 * Based on PDF templates: Summary result of VA, Credit Note (CN), VA Calculation result
 */

// Monthly fiscal year data (Apr - Mar)
export interface MonthlyVAData {
  month: string;
  monthShort: string;
  estimateCDTarget: number;
  totalCDByMonth: number;
  totalCDAccumulate: number;
  targetCD: number;
  estimateAccumCDResult: number;
  includedNewIdea: number;
}

export interface FiscalYearSummary {
  fiscalYear: string;
  cdGoal: number;
  currency: string;
  monthlyData: MonthlyVAData[];
  costdownAccumulate: number;
  costdownChallenge: number;
}

// Credit Note tracking
export interface CreditNoteItem {
  id: string;
  vaNo: string;
  vaTheme: string;
  rank: 'A' | 'B' | 'C';
  applyMonthTarget: string;
  applyMonthActual: string;
  costdownTarget: number;
  costdownActual: number;
  costdownActualCDS: number;
  costdownActualBuyer: number;
  dcsNo: string;
  dcsClass: string;
  buyerName: string;
  vaType: string;
  createIdeaBy: string;
  cnStatus: 'issued' | 'pending' | 'cancelled';
}

// VA Calculation Detail
export interface VACalculationItem {
  id: string;
  vaNo: string;
  partCategory: string;
  supplierName: string;
  drawingPart: string;
  buyerName: string;
  partName: string;
  vaTheme: string;
  exchangeRate: number;
  beforeCost: number;
  afterCost: number;
  costdownPerUnit: number;
  volumePerYear: number;
  costdownPerYear: number;
  applyMonth: string;
  rank: 'A' | 'B' | 'C';
  group: string;
}

// === Demo Data ===

export const fiscalYearOB2024: FiscalYearSummary = {
  fiscalYear: 'OB2024',
  cdGoal: 162000000,
  currency: 'THB',
  monthlyData: [
    { month: 'Apr-24', monthShort: 'Apr', estimateCDTarget: 63535824, totalCDByMonth: 24695948, totalCDAccumulate: 24695948, targetCD: 162000000, estimateAccumCDResult: 63535824, includedNewIdea: 5200000 },
    { month: 'May-24', monthShort: 'May', estimateCDTarget: 31663782, totalCDByMonth: 14322306, totalCDAccumulate: 39018254, targetCD: 162000000, estimateAccumCDResult: 95199606, includedNewIdea: 3800000 },
    { month: 'Jun-24', monthShort: 'Jun', estimateCDTarget: 37407768, totalCDByMonth: 33844789, totalCDAccumulate: 72863043, targetCD: 162000000, estimateAccumCDResult: 132607374, includedNewIdea: 2100000 },
    { month: 'Jul-24', monthShort: 'Jul', estimateCDTarget: 25378676, totalCDByMonth: 12300719, totalCDAccumulate: 85163762, targetCD: 162000000, estimateAccumCDResult: 157986050, includedNewIdea: 4500000 },
    { month: 'Aug-24', monthShort: 'Aug', estimateCDTarget: 11916768, totalCDByMonth: 11040105, totalCDAccumulate: 96203867, targetCD: 162000000, estimateAccumCDResult: 169902818, includedNewIdea: 1200000 },
    { month: 'Sep-24', monthShort: 'Sep', estimateCDTarget: 12671040, totalCDByMonth: 12291653, totalCDAccumulate: 108495520, targetCD: 162000000, estimateAccumCDResult: 182573858, includedNewIdea: 900000 },
    { month: 'Oct-24', monthShort: 'Oct', estimateCDTarget: 9408727, totalCDByMonth: 9408727, totalCDAccumulate: 117904247, targetCD: 162000000, estimateAccumCDResult: 191982585, includedNewIdea: 500000 },
    { month: 'Nov-24', monthShort: 'Nov', estimateCDTarget: 1755374, totalCDByMonth: 1755374, totalCDAccumulate: 119659621, targetCD: 162000000, estimateAccumCDResult: 193737959, includedNewIdea: 0 },
    { month: 'Dec-24', monthShort: 'Dec', estimateCDTarget: 2733640, totalCDByMonth: 2733640, totalCDAccumulate: 122393261, targetCD: 162000000, estimateAccumCDResult: 196471599, includedNewIdea: 0 },
    { month: 'Jan-25', monthShort: 'Jan', estimateCDTarget: 35411723, totalCDByMonth: 35051140, totalCDAccumulate: 157444401, targetCD: 162000000, estimateAccumCDResult: 231883322, includedNewIdea: 8000000 },
    { month: 'Feb-25', monthShort: 'Feb', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 157444401, targetCD: 162000000, estimateAccumCDResult: 231883322, includedNewIdea: 0 },
    { month: 'Mar-25', monthShort: 'Mar', estimateCDTarget: 325169, totalCDByMonth: 325169, totalCDAccumulate: 157769570, targetCD: 162000000, estimateAccumCDResult: 232208491, includedNewIdea: 0 },
  ],
  costdownAccumulate: 157769570,
  costdownChallenge: 232208491,
};

export const fiscalYearRB2023: FiscalYearSummary = {
  fiscalYear: 'RB2023',
  cdGoal: 220000000,
  currency: 'THB',
  monthlyData: [
    { month: 'Apr-23', monthShort: 'Apr', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 0, targetCD: 220000000, estimateAccumCDResult: 0, includedNewIdea: 0 },
    { month: 'May-23', monthShort: 'May', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 0, targetCD: 220000000, estimateAccumCDResult: 0, includedNewIdea: 0 },
    { month: 'Jun-23', monthShort: 'Jun', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 0, targetCD: 220000000, estimateAccumCDResult: 0, includedNewIdea: 0 },
    { month: 'Jul-23', monthShort: 'Jul', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 0, targetCD: 220000000, estimateAccumCDResult: 0, includedNewIdea: 0 },
    { month: 'Aug-23', monthShort: 'Aug', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 0, targetCD: 220000000, estimateAccumCDResult: 0, includedNewIdea: 0 },
    { month: 'Sep-23', monthShort: 'Sep', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 0, targetCD: 220000000, estimateAccumCDResult: 0, includedNewIdea: 0 },
    { month: 'Oct-23', monthShort: 'Oct', estimateCDTarget: 0, totalCDByMonth: 15570000, totalCDAccumulate: 15570000, targetCD: 220000000, estimateAccumCDResult: 85000000, includedNewIdea: 3500000 },
    { month: 'Nov-23', monthShort: 'Nov', estimateCDTarget: 0, totalCDByMonth: 55430000, totalCDAccumulate: 71000000, targetCD: 220000000, estimateAccumCDResult: 110000000, includedNewIdea: 12000000 },
    { month: 'Dec-23', monthShort: 'Dec', estimateCDTarget: 0, totalCDByMonth: 5000000, totalCDAccumulate: 76000000, targetCD: 220000000, estimateAccumCDResult: 103000000, includedNewIdea: 0 },
    { month: 'Jan-24', monthShort: 'Jan', estimateCDTarget: 0, totalCDByMonth: 3000000, totalCDAccumulate: 79000000, targetCD: 220000000, estimateAccumCDResult: 103000000, includedNewIdea: 0 },
    { month: 'Feb-24', monthShort: 'Feb', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 79000000, targetCD: 220000000, estimateAccumCDResult: 103000000, includedNewIdea: 0 },
    { month: 'Mar-24', monthShort: 'Mar', estimateCDTarget: 0, totalCDByMonth: 0, totalCDAccumulate: 79000000, targetCD: 220000000, estimateAccumCDResult: 103000000, includedNewIdea: 0 },
  ],
  costdownAccumulate: 79000000,
  costdownChallenge: 103000000,
};

export const creditNoteItems: CreditNoteItem[] = [
  {
    id: 'cn-1', vaNo: 'VA210001-1', vaTheme: 'Change supplier of 1Ø AC fan motor from PANASONIC to WOLONG',
    rank: 'A', applyMonthTarget: 'Apr-24', applyMonthActual: 'Apr-24',
    costdownTarget: 189679, costdownActual: 189679, costdownActualCDS: 0, costdownActualBuyer: 0,
    dcsNo: 'BR23N288', dcsClass: 'Jan-24', buyerName: 'HAYAKAWA', vaType: 'Alternative maker',
    createIdeaBy: 'DIT', cnStatus: 'issued',
  },
  {
    id: 'cn-2', vaNo: 'VA210001-2', vaTheme: 'Change supplier of 1Ø AC fan motor from PANASONIC to WOLONG',
    rank: 'A', applyMonthTarget: 'Apr-24', applyMonthActual: 'Apr-24',
    costdownTarget: 1063117, costdownActual: 1063117, costdownActualCDS: 0, costdownActualBuyer: 0,
    dcsNo: 'BR23N147', dcsClass: 'Jan-24', buyerName: 'HAYAKAWA', vaType: 'Alternative maker',
    createIdeaBy: 'DIT', cnStatus: 'issued',
  },
  {
    id: 'cn-3', vaNo: 'VA210001-3', vaTheme: 'Change supplier of 1Ø AC fan motor from PANASONIC to WOLONG',
    rank: 'A', applyMonthTarget: 'Apr-24', applyMonthActual: 'Apr-24',
    costdownTarget: 890148, costdownActual: 890148, costdownActualCDS: 0, costdownActualBuyer: 0,
    dcsNo: 'BR23N288', dcsClass: 'Jan-24', buyerName: 'HAYAKAWA', vaType: 'Alternative maker',
    createIdeaBy: 'DIT', cnStatus: 'issued',
  },
  {
    id: 'cn-4', vaNo: 'VA220023-6', vaTheme: 'Add alternative SUPERDYMA for risk management and stable supply of ZAM',
    rank: 'A', applyMonthTarget: 'Apr-24', applyMonthActual: 'Apr-24',
    costdownTarget: 22553004, costdownActual: 22553004, costdownActualCDS: 0, costdownActualBuyer: 0,
    dcsNo: 'BR22N416', dcsClass: 'Dec-23', buyerName: 'PRAPAPAN', vaType: 'Alternative material',
    createIdeaBy: 'DIT', cnStatus: 'issued',
  },
  {
    id: 'cn-5', vaNo: 'VA230047', vaTheme: 'Reduce sheet metal scrap by re-produce part',
    rank: 'A', applyMonthTarget: 'Jan-24', applyMonthActual: 'Jan-24',
    costdownTarget: 0, costdownActual: 0, costdownActualCDS: 0, costdownActualBuyer: 0,
    dcsNo: '', dcsClass: 'Nov-23', buyerName: 'PRAPAPAN', vaType: '3R(Reduce,Recycle)',
    createIdeaBy: 'DIT', cnStatus: 'pending',
  },
];

export const vaCalculationItems: VACalculationItem[] = [
  {
    id: 'vc-1', vaNo: 'VA210001-1', partCategory: 'Motor', supplierName: 'SUPHAPHON',
    drawingPart: '3P154721-1', buyerName: 'HAYAKAWA', partName: '1Ø AC Fan Motor',
    vaTheme: 'Change from PANASONIC to WOLONG', exchangeRate: 35.50,
    beforeCost: 850, afterCost: 780, costdownPerUnit: 70, volumePerYear: 2710,
    costdownPerYear: 189679, applyMonth: 'Apr-24', rank: 'A', group: 'General model',
  },
  {
    id: 'vc-2', vaNo: 'VA210001-2', partCategory: 'Motor', supplierName: 'SUPHAPHON',
    drawingPart: '3P120382-1', buyerName: 'HAYAKAWA', partName: '1Ø AC Fan Motor',
    vaTheme: 'Change from PANASONIC to WOLONG', exchangeRate: 35.50,
    beforeCost: 920, afterCost: 830, costdownPerUnit: 90, volumePerYear: 11813,
    costdownPerYear: 1063117, applyMonth: 'Apr-24', rank: 'A', group: 'General model',
  },
  {
    id: 'vc-3', vaNo: 'VA210001-3', partCategory: 'Motor', supplierName: 'SUPHAPHON',
    drawingPart: '3P138586-1', buyerName: 'HAYAKAWA', partName: '1Ø AC Fan Motor',
    vaTheme: 'Change from PANASONIC to WOLONG', exchangeRate: 35.50,
    beforeCost: 780, afterCost: 710, costdownPerUnit: 70, volumePerYear: 12716,
    costdownPerYear: 890148, applyMonth: 'Apr-24', rank: 'A', group: 'General model',
  },
  {
    id: 'vc-4', vaNo: 'VA220023-6', partCategory: 'Casing', supplierName: 'NST COIL CENTER',
    drawingPart: '3P353054-1', buyerName: 'PRAPAPAN', partName: 'Sheet Metal (ZAM/SUPERDYMA)',
    vaTheme: 'Add alternative SUPERDYMA for risk management', exchangeRate: 35.50,
    beforeCost: 1250, afterCost: 1020, costdownPerUnit: 230, volumePerYear: 98057,
    costdownPerYear: 22553004, applyMonth: 'Apr-24', rank: 'A', group: 'General model',
  },
  {
    id: 'vc-5', vaNo: 'VA210034-6', partCategory: 'Casing', supplierName: 'NST COIL CENTER',
    drawingPart: '3P353054-1', buyerName: 'PISSAMAI', partName: 'GA/GI Sheet Metal',
    vaTheme: 'Reduce thickness from 0.7mm to 0.6mm', exchangeRate: 35.50,
    beforeCost: 320, afterCost: 275, costdownPerUnit: 45, volumePerYear: 85000,
    costdownPerYear: 3825000, applyMonth: 'Jun-24', rank: 'B', group: 'General model',
  },
  {
    id: 'vc-6', vaNo: 'VA210042-2', partCategory: 'Casing', supplierName: 'NST COIL CENTER',
    drawingPart: '2P269624-1', buyerName: 'PISSAMAI', partName: 'Top Plate',
    vaTheme: 'Reduce thickness from 0.7mm to 0.6mm', exchangeRate: 35.50,
    beforeCost: 280, afterCost: 245, costdownPerUnit: 35, volumePerYear: 42000,
    costdownPerYear: 1470000, applyMonth: 'Jul-24', rank: 'B', group: 'General model',
  },
  {
    id: 'vc-7', vaNo: 'VA210048', partCategory: 'Motor', supplierName: 'PANASONIC INDUSTRIAL',
    drawingPart: '3SB40654-3', buyerName: 'SUPHAPHON', partName: 'BMS Motor',
    vaTheme: 'Localization from China to Thailand', exchangeRate: 35.50,
    beforeCost: 1580, afterCost: 1420, costdownPerUnit: 160, volumePerYear: 18500,
    costdownPerYear: 2960000, applyMonth: 'May-24', rank: 'A', group: 'General model',
  },
  {
    id: 'vc-8', vaNo: 'VA210053', partCategory: 'Pipe', supplierName: 'DUNAN METALS',
    drawingPart: '4P433727-1', buyerName: 'NAOWARAT', partName: 'Copper Tube CU→CUNI',
    vaTheme: 'Change spec of copper tube from CU to CUNI', exchangeRate: 35.50,
    beforeCost: 420, afterCost: 380, costdownPerUnit: 40, volumePerYear: 125000,
    costdownPerYear: 5000000, applyMonth: 'Sep-24', rank: 'A', group: 'General model',
  },
];

// Summary stats for dashboard
export function getVASummaryStats(data: FiscalYearSummary) {
  const lastMonth = data.monthlyData[data.monthlyData.length - 1];
  const achievementRate = (lastMonth.totalCDAccumulate / data.cdGoal) * 100;
  const totalEstimate = lastMonth.estimateAccumCDResult;
  const estimateAchievement = (totalEstimate / data.cdGoal) * 100;
  
  return {
    cdGoal: data.cdGoal,
    actualAccumulate: lastMonth.totalCDAccumulate,
    estimateAccumulate: totalEstimate,
    achievementRate: Math.round(achievementRate * 10) / 10,
    estimateAchievementRate: Math.round(estimateAchievement * 10) / 10,
    gap: data.cdGoal - lastMonth.totalCDAccumulate,
  };
}
