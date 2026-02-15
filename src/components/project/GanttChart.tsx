import { useMemo } from 'react';
import { Project } from '@/types/project';
import { useApp } from '@/context/AppContext';
import { format, differenceInDays, startOfMonth, endOfMonth, eachMonthOfInterval, eachWeekOfInterval, startOfWeek, addDays, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface GanttChartProps {
  projects: Project[];
  singleProject?: boolean;
}

export function GanttChart({ projects, singleProject = false }: GanttChartProps) {
  const { language } = useApp();

  const { startDate, endDate, totalDays, months } = useMemo(() => {
    const allDates: Date[] = [];
    projects.forEach(p => {
      allDates.push(p.startDate);
      allDates.push(p.endDate);
      p.tasks.forEach(t => {
        if (t.startDate) allDates.push(t.startDate);
        if (t.endDate) allDates.push(t.endDate);
      });
    });

    if (allDates.length === 0) {
      const now = new Date();
      return { startDate: now, endDate: addDays(now, 180), totalDays: 180, months: [] };
    }

    const minDate = startOfMonth(new Date(Math.min(...allDates.map(d => d.getTime()))));
    const maxDate = endOfMonth(new Date(Math.max(...allDates.map(d => d.getTime()))));
    const days = differenceInDays(maxDate, minDate) + 1;
    const monthList = eachMonthOfInterval({ start: minDate, end: maxDate });

    return { startDate: minDate, endDate: maxDate, totalDays: days, months: monthList };
  }, [projects]);

  const dayWidth = 4;
  const chartWidth = totalDays * dayWidth;
  const rowHeight = 36;

  const getBarStyle = (start: Date, end: Date, color: string, progress: number) => {
    const left = differenceInDays(start, startDate) * dayWidth;
    const width = Math.max((differenceInDays(end, start) + 1) * dayWidth, 16);
    return { left, width, color, progress };
  };

  // Build rows
  const rows = useMemo(() => {
    const result: Array<{
      id: string;
      label: string;
      type: 'project' | 'task';
      start: Date;
      end: Date;
      color: string;
      progress: number;
      indent: boolean;
    }> = [];

    projects.forEach(project => {
      if (!singleProject) {
        result.push({
          id: project.id,
          label: project.name,
          type: 'project',
          start: project.startDate,
          end: project.endDate,
          color: project.color,
          progress: project.progress,
          indent: false,
        });
      }

      project.tasks.forEach(task => {
        if (task.startDate && task.endDate) {
          result.push({
            id: task.id,
            label: task.title,
            type: 'task',
            start: task.startDate,
            end: task.endDate,
            color: project.color,
            progress: task.progress,
            indent: !singleProject,
          });
        }
      });
    });

    return result;
  }, [projects, singleProject]);

  // Today marker
  const today = new Date();
  const todayOffset = differenceInDays(today, startDate) * dayWidth;
  const showToday = todayOffset >= 0 && todayOffset <= chartWidth;

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
        {language === 'th' ? 'ยังไม่มีข้อมูล Schedule' : 'No schedule data available'}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex">
        {/* Left panel - labels */}
        <div className="w-52 shrink-0 border-r bg-muted/30">
          {/* Month header spacer */}
          <div className="h-10 border-b flex items-center px-3">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              {language === 'th' ? 'รายการ' : 'Item'}
            </span>
          </div>
          {rows.map(row => (
            <div
              key={row.id}
              className={cn(
                'flex items-center gap-2 border-b px-3 text-xs',
                row.type === 'project' ? 'font-semibold text-foreground' : 'text-muted-foreground',
              )}
              style={{ height: rowHeight, paddingLeft: row.indent ? 28 : 12 }}
            >
              {row.type === 'task' && <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: row.color }} />}
              <span className="truncate">{row.label}</span>
            </div>
          ))}
        </div>

        {/* Right panel - chart */}
        <ScrollArea className="flex-1">
          <div style={{ width: chartWidth, minWidth: '100%' }}>
            {/* Month headers */}
            <div className="h-10 border-b flex relative">
              {months.map((month, i) => {
                const daysInMonth = differenceInDays(
                  i < months.length - 1 ? months[i + 1] : addDays(endDate, 1),
                  month
                );
                const left = differenceInDays(month, startDate) * dayWidth;
                const width = daysInMonth * dayWidth;
                return (
                  <div
                    key={month.toISOString()}
                    className="absolute top-0 h-full border-r flex items-center justify-center"
                    style={{ left, width }}
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {format(month, 'MMM yyyy')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Rows */}
            <TooltipProvider>
              <div className="relative">
                {/* Grid lines */}
                {months.map(month => {
                  const left = differenceInDays(month, startDate) * dayWidth;
                  return (
                    <div
                      key={`grid-${month.toISOString()}`}
                      className="absolute top-0 bottom-0 border-r border-border/30"
                      style={{ left }}
                    />
                  );
                })}

                {/* Today line */}
                {showToday && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-destructive/60 z-10"
                    style={{ left: todayOffset }}
                  >
                    <div className="absolute -top-0 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-[8px] px-1 rounded-b font-medium">
                      {language === 'th' ? 'วันนี้' : 'Today'}
                    </div>
                  </div>
                )}

                {rows.map(row => {
                  const bar = getBarStyle(row.start, row.end, row.color, row.progress);
                  const isProject = row.type === 'project';
                  return (
                    <div key={row.id} className="relative border-b" style={{ height: rowHeight }}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              'absolute top-1/2 -translate-y-1/2 rounded-md cursor-pointer transition-all hover:brightness-110 hover:shadow-md',
                              isProject ? 'h-5' : 'h-3.5',
                            )}
                            style={{
                              left: bar.left,
                              width: bar.width,
                              background: `${bar.color}33`,
                              border: `1px solid ${bar.color}66`,
                            }}
                          >
                            {/* Progress fill */}
                            <div
                              className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                              style={{
                                width: `${bar.progress}%`,
                                background: isProject
                                  ? `linear-gradient(90deg, ${bar.color}, ${bar.color}cc)`
                                  : bar.color,
                                opacity: isProject ? 0.9 : 0.7,
                              }}
                            />
                            {/* Progress text */}
                            {bar.width > 40 && (
                              <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-foreground/80 mix-blend-multiply dark:mix-blend-screen dark:text-foreground/60">
                                {bar.progress}%
                              </span>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-semibold">{row.label}</p>
                          <p className="text-muted-foreground">
                            {format(row.start, 'dd MMM')} → {format(row.end, 'dd MMM yyyy')}
                          </p>
                          <p>{language === 'th' ? 'ความคืบหน้า' : 'Progress'}: {row.progress}%</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
