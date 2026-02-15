import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Language } from '@/types/workflow';
import { Calendar, CalendarDays, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PeriodView = 'yearly' | 'monthly' | 'weekly';

interface PeriodFilterProps {
  language: Language;
  periodView: PeriodView;
  onPeriodViewChange: (view: PeriodView) => void;
  selectedMonth: string;
  onSelectedMonthChange: (month: string) => void;
  selectedWeek: string;
  onSelectedWeekChange: (week: string) => void;
  availableMonths: { value: string; label: string }[];
  availableWeeks: { value: string; label: string }[];
}

export function PeriodFilter({
  language,
  periodView,
  onPeriodViewChange,
  selectedMonth,
  onSelectedMonthChange,
  selectedWeek,
  onSelectedWeekChange,
  availableMonths,
  availableWeeks,
}: PeriodFilterProps) {
  const viewOptions: { value: PeriodView; label: string; labelTh: string; icon: typeof Calendar }[] = [
    { value: 'yearly', label: 'Yearly (FY)', labelTh: 'รายปีงบ (FY)', icon: CalendarRange },
    { value: 'monthly', label: 'Monthly', labelTh: 'รายเดือน', icon: CalendarDays },
    { value: 'weekly', label: 'Weekly', labelTh: 'รายสัปดาห์', icon: Calendar },
  ];

  return (
    <Card className="card-elevated">
      <CardContent className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Period View Buttons */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {viewOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => onPeriodViewChange(opt.value)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                    periodView === opt.value
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon size={13} />
                  {language === 'th' ? opt.labelTh : opt.label}
                </button>
              );
            })}
          </div>

          {/* Month Selector */}
          {periodView === 'monthly' && (
            <Select value={selectedMonth} onValueChange={onSelectedMonthChange}>
              <SelectTrigger className="w-[160px] h-8 text-xs">
                <SelectValue placeholder={language === 'th' ? 'เลือกเดือน' : 'Select Month'} />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Week Selector */}
          {periodView === 'weekly' && (
            <Select value={selectedWeek} onValueChange={onSelectedWeekChange}>
              <SelectTrigger className="w-[200px] h-8 text-xs">
                <SelectValue placeholder={language === 'th' ? 'เลือกสัปดาห์' : 'Select Week'} />
              </SelectTrigger>
              <SelectContent>
                {availableWeeks.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View Indicator */}
          <Badge variant="outline" className="text-[10px] ml-auto">
            {periodView === 'yearly'
              ? (language === 'th' ? 'แสดง 12 เดือน (Apr–Mar)' : 'Showing 12 months (Apr–Mar)')
              : periodView === 'monthly'
              ? (language === 'th' ? 'แสดงเฉพาะเดือนที่เลือก' : 'Showing selected month')
              : (language === 'th' ? 'แสดงเฉพาะสัปดาห์ที่เลือก' : 'Showing selected week')}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
