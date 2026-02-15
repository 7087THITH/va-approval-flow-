/**
 * VA Calculate Data Types & API Integration
 * Production mode: data is fetched from the backend API
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

// Production: Empty data — fetched from API
export const creditNoteItems: CreditNoteItem[] = [];
export const vaCalculationItems: VACalculationItem[] = [];

// Empty fiscal year placeholder
const emptyFY = (fy: string, goal: number): FiscalYearSummary => ({
  fiscalYear: fy,
  cdGoal: goal,
  currency: 'THB',
  monthlyData: [],
  costdownAccumulate: 0,
  costdownChallenge: 0,
});

export const fiscalYearOB2024: FiscalYearSummary = emptyFY('OB2024', 0);
export const fiscalYearRB2023: FiscalYearSummary = emptyFY('RB2023', 0);

// Summary stats for dashboard
export function getVASummaryStats(data: FiscalYearSummary) {
  if (!data.monthlyData.length) {
    return {
      cdGoal: data.cdGoal,
      actualAccumulate: 0,
      estimateAccumulate: 0,
      achievementRate: 0,
      estimateAchievementRate: 0,
      gap: data.cdGoal,
    };
  }
  const lastMonth = data.monthlyData[data.monthlyData.length - 1];
  const achievementRate = data.cdGoal > 0 ? (lastMonth.totalCDAccumulate / data.cdGoal) * 100 : 0;
  const totalEstimate = lastMonth.estimateAccumCDResult;
  const estimateAchievement = data.cdGoal > 0 ? (totalEstimate / data.cdGoal) * 100 : 0;
  
  return {
    cdGoal: data.cdGoal,
    actualAccumulate: lastMonth.totalCDAccumulate,
    estimateAccumulate: totalEstimate,
    achievementRate: Math.round(achievementRate * 10) / 10,
    estimateAchievementRate: Math.round(estimateAchievement * 10) / 10,
    gap: data.cdGoal - lastMonth.totalCDAccumulate,
  };
}
