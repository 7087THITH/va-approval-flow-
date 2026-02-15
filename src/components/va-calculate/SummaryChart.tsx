import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiscalYearSummary } from '@/data/vaCalculateData';
import { Language } from '@/types/workflow';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from 'recharts';

interface SummaryChartProps {
  data: FiscalYearSummary;
  language: Language;
}

export function SummaryChart({ data, language }: SummaryChartProps) {
  const chartData = data.monthlyData.map(m => ({
    month: m.monthShort,
    estimateCDTarget: Math.round(m.estimateCDTarget / 1000000),
    totalCDByMonth: Math.round(m.totalCDByMonth / 1000000),
    includedNewIdea: Math.round(m.includedNewIdea / 1000000),
  }));

  const formatValue = (value: number) => `${value}M`;

  return (
    <div className="space-y-4">
      {/* Target vs Actual by Month */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {language === 'th'
              ? `สรุปผล VA (${data.fiscalYear}) — Estimate CD Target vs Actual CD รายเดือน`
              : `Summary result of VA (${data.fiscalYear}) — Estimate CD Target vs Actual CD by Month`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatValue}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}M THB`,
                    name === 'estimateCDTarget'
                      ? (language === 'th' ? 'Estimate CD Target' : 'Estimate CD Target')
                      : name === 'totalCDByMonth'
                      ? (language === 'th' ? 'Actual CD/เดือน' : 'Actual CD/Month')
                      : (language === 'th' ? 'ไอเดียใหม่' : 'New Ideas'),
                  ]}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--card))',
                    fontSize: '12px',
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value) => {
                    if (value === 'estimateCDTarget') return language === 'th' ? 'Estimate CD Target' : 'Estimate CD Target';
                    if (value === 'totalCDByMonth') return language === 'th' ? 'Actual CD/เดือน' : 'Actual CD/Month';
                    return language === 'th' ? 'ไอเดียใหม่' : 'New Ideas';
                  }}
                />
                <Bar
                  dataKey="estimateCDTarget"
                  fill="hsl(217, 91%, 60%)"
                  radius={[4, 4, 0, 0]}
                  opacity={0.7}
                />
                <Bar
                  dataKey="totalCDByMonth"
                  fill="hsl(152, 60%, 42%)"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  type="monotone"
                  dataKey="includedNewIdea"
                  stroke="hsl(38, 92%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(38, 92%, 50%)', r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Data Table */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {language === 'th' ? 'ข้อมูลรายเดือน (ล้านบาท)' : 'Monthly Data (Million THB)'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="table-header">
                  <th className="px-3 py-2 text-left">{language === 'th' ? 'เดือน' : 'Month'}</th>
                  <th className="px-3 py-2 text-right">Estimate CD Target</th>
                  <th className="px-3 py-2 text-right">Total CD/Month</th>
                  <th className="px-3 py-2 text-right">Total CD Accum.</th>
                  <th className="px-3 py-2 text-right">Target CD</th>
                  <th className="px-3 py-2 text-right">Estimate Accum.</th>
                  <th className="px-3 py-2 text-right">New Ideas</th>
                </tr>
              </thead>
              <tbody>
                {data.monthlyData.map((m, idx) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{m.month}</td>
                    <td className="px-3 py-2 text-right font-mono">{(m.estimateCDTarget / 1000000).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono">{(m.totalCDByMonth / 1000000).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">{(m.totalCDAccumulate / 1000000).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-muted-foreground">{(m.targetCD / 1000000).toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-info">{(m.estimateAccumCDResult / 1000000).toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono text-warning">{(m.includedNewIdea / 1000000).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
