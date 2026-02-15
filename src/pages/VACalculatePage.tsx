import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SummaryChart } from '@/components/va-calculate/SummaryChart';
import { AccumulateChart } from '@/components/va-calculate/AccumulateChart';
import { CreditNoteTable } from '@/components/va-calculate/CreditNoteTable';
import { VADetailTable } from '@/components/va-calculate/VADetailTable';
import { PeriodFilter, PeriodView } from '@/components/va-calculate/PeriodFilter';
import { MonthlyDetailView } from '@/components/va-calculate/MonthlyDetailView';
import { WeeklyDetailView } from '@/components/va-calculate/WeeklyDetailView';
import { fiscalYearOB2024, fiscalYearRB2023, getVASummaryStats } from '@/data/vaCalculateData';
import { BarChart3, TrendingUp, Target, DollarSign, Activity, FileSpreadsheet, Receipt } from 'lucide-react';
import { cn } from '@/lib/utils';
const fiscalYears = [{
  value: 'OB2024',
  label: 'FY2024 (OB2024)',
  data: fiscalYearOB2024
}, {
  value: 'RB2023',
  label: 'FY2023 (RB2023)',
  data: fiscalYearRB2023
}];
export default function VACalculatePage() {
  const {
    language
  } = useApp();
  const [selectedFY, setSelectedFY] = useState('OB2024');
  const [periodView, setPeriodView] = useState<PeriodView>('yearly');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const currentFY = fiscalYears.find(f => f.value === selectedFY) || fiscalYears[0];
  const stats = getVASummaryStats(currentFY.data);

  // Available months from FY data
  const availableMonths = useMemo(() => currentFY.data.monthlyData.map(m => ({
    value: m.month,
    label: m.month
  })), [currentFY]);

  // Available weeks (4 weeks per month)
  const availableWeeks = useMemo(() => {
    const weeks: {
      value: string;
      label: string;
    }[] = [];
    currentFY.data.monthlyData.forEach(m => {
      for (let w = 1; w <= 4; w++) {
        weeks.push({
          value: `W${w}-${m.month}`,
          label: `${language === 'th' ? 'สัปดาห์' : 'Week'} ${w} — ${m.month}`
        });
      }
    });
    return weeks;
  }, [currentFY, language]);

  // Set default month/week when changing FY
  const handleFYChange = (fy: string) => {
    setSelectedFY(fy);
    const fyData = fiscalYears.find(f => f.value === fy);
    if (fyData) {
      setSelectedMonth(fyData.data.monthlyData[0].month);
      setSelectedWeek(`W1-${fyData.data.monthlyData[0].month}`);
    }
  };

  // Set defaults on first render if empty
  if (!selectedMonth && availableMonths.length > 0) {
    setSelectedMonth(availableMonths[0].value);
  }
  if (!selectedWeek && availableWeeks.length > 0) {
    setSelectedWeek(availableWeeks[0].value);
  }

  // Get monthly data for selected month
  const selectedMonthData = currentFY.data.monthlyData.find(m => m.month === selectedMonth);

  // Extract month from week key (e.g., "W1-Apr-24" → "Apr-24")
  const weekMonth = selectedWeek ? selectedWeek.replace(/^W\d-/, '') : '';
  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString();
  };
  const summaryCards = [{
    label: language === 'th' ? 'เป้า CD Goal' : 'CD Goal',
    value: formatCurrency(stats.cdGoal),
    icon: Target,
    color: 'text-primary',
    bgColor: 'bg-primary/10'
  }, {
    label: language === 'th' ? 'ยอดสะสมจริง' : 'Actual Accumulate',
    value: formatCurrency(stats.actualAccumulate),
    icon: DollarSign,
    color: 'text-success',
    bgColor: 'bg-success/10'
  }, {
    label: language === 'th' ? 'ประมาณการสะสม' : 'Estimate Accumulate',
    value: formatCurrency(stats.estimateAccumulate),
    icon: TrendingUp,
    color: 'text-info',
    bgColor: 'bg-info/10'
  }, {
    label: language === 'th' ? 'อัตราผลสำเร็จ' : 'Achievement Rate',
    value: `${stats.achievementRate}%`,
    icon: Activity,
    color: stats.achievementRate >= 100 ? 'text-success' : 'text-warning',
    bgColor: stats.achievementRate >= 100 ? 'bg-success/10' : 'bg-warning/10'
  }];
  return <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
              
              {language === 'th' ? 'VA Calculate — รายงาน Top Management' : 'VA Calculate — Top Management Report'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'th' ? 'สรุปผล VA Costdown เทียบกับเป้าหมายรายเดือน' : 'Summary of VA Costdown results vs monthly targets'}
            </p>
          </div>
          <Select value={selectedFY} onValueChange={handleFYChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fiscalYears.map(fy => <SelectItem key={fy.value} value={fy.value}>
                  {fy.label}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Period Filter */}
        <PeriodFilter language={language} periodView={periodView} onPeriodViewChange={setPeriodView} selectedMonth={selectedMonth} onSelectedMonthChange={setSelectedMonth} selectedWeek={selectedWeek} onSelectedWeekChange={setSelectedWeek} availableMonths={availableMonths} availableWeeks={availableWeeks} />

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => {
          const Icon = card.icon;
          return <Card key={idx} className="card-elevated">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{card.label}</p>
                      <p className={cn('text-lg font-bold mt-1', card.color)}>{card.value}</p>
                    </div>
                    <div className={cn('p-3 rounded-lg', card.bgColor)}>
                      <Icon className={cn('h-5 w-5', card.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>;
        })}
        </div>

        {/* Achievement Progress */}
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">
                {language === 'th' ? 'ความคืบหน้า Costdown' : 'Costdown Progress'}
              </span>
              <Badge variant={stats.achievementRate >= 100 ? 'default' : 'secondary'}>
                {stats.achievementRate}% of {formatCurrency(stats.cdGoal)}
              </Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div className={cn('h-full rounded-full transition-all duration-1000', stats.achievementRate >= 100 ? 'bg-success' : stats.achievementRate >= 75 ? 'bg-primary' : stats.achievementRate >= 50 ? 'bg-warning' : 'bg-destructive')} style={{
              width: `${Math.min(stats.achievementRate, 100)}%`
            }} />
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{language === 'th' ? 'ยอดจริง' : 'Actual'}: {formatCurrency(stats.actualAccumulate)}</span>
              <span>{language === 'th' ? 'ส่วนต่าง' : 'Gap'}: {formatCurrency(stats.gap)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Content based on Period View */}
        {periodView === 'monthly' ? <MonthlyDetailView language={language} monthKey={selectedMonth} monthlyData={selectedMonthData} /> : periodView === 'weekly' ? <WeeklyDetailView language={language} weekKey={selectedWeek} monthKey={weekMonth} /> : (/* Yearly View — Charts & Tables */
      <Tabs defaultValue="summary" className="space-y-4">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="summary" className="gap-2">
                <BarChart3 size={14} />
                {language === 'th' ? 'สรุปรายเดือน' : 'Monthly Summary'}
              </TabsTrigger>
              <TabsTrigger value="accumulate" className="gap-2">
                <TrendingUp size={14} />
                {language === 'th' ? 'Costdown สะสม' : 'Costdown Accumulate'}
              </TabsTrigger>
              <TabsTrigger value="credit-note" className="gap-2">
                <Receipt size={14} />
                {language === 'th' ? 'Credit Note (CN)' : 'Credit Note (CN)'}
              </TabsTrigger>
              <TabsTrigger value="detail" className="gap-2">
                <FileSpreadsheet size={14} />
                {language === 'th' ? 'รายละเอียด VA' : 'VA Detail'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary">
              <SummaryChart data={currentFY.data} language={language} />
            </TabsContent>

            <TabsContent value="accumulate">
              <AccumulateChart data={currentFY.data} language={language} />
            </TabsContent>

            <TabsContent value="credit-note">
              <CreditNoteTable language={language} />
            </TabsContent>

            <TabsContent value="detail">
              <VADetailTable language={language} />
            </TabsContent>
          </Tabs>)}
      </div>
    </MainLayout>;
}