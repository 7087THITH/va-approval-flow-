import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FiscalYearSummary } from '@/data/vaCalculateData';
import { Language } from '@/types/workflow';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from 'recharts';

interface AccumulateChartProps {
  data: FiscalYearSummary;
  language: Language;
}

export function AccumulateChart({ data, language }: AccumulateChartProps) {
  const chartData = data.monthlyData.map(m => ({
    month: m.monthShort,
    actualAccumulate: Math.round(m.totalCDAccumulate / 1000000),
    estimateAccumulate: Math.round(m.estimateAccumCDResult / 1000000),
    targetCD: Math.round(m.targetCD / 1000000),
  }));

  const cdGoalLine = Math.round(data.cdGoal / 1000000);

  return (
    <div className="space-y-4">
      {/* Accumulate Chart */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {language === 'th'
              ? `Costdown สะสม (${data.fiscalYear}) — เทียบ CD Goal ${cdGoalLine}M`
              : `Costdown Accumulate (${data.fiscalYear}) — vs CD Goal ${cdGoalLine}M`}
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
                  tickFormatter={(v) => `${v}M`}
                  className="fill-muted-foreground"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value}M THB`,
                    name === 'actualAccumulate'
                      ? (language === 'th' ? 'ยอดสะสมจริง' : 'Actual Accumulate')
                      : name === 'estimateAccumulate'
                      ? (language === 'th' ? 'ประมาณการสะสม' : 'Estimate Accumulate')
                      : 'CD Goal',
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
                    if (value === 'actualAccumulate') return language === 'th' ? 'ยอดสะสมจริง' : 'Actual Accumulate';
                    if (value === 'estimateAccumulate') return language === 'th' ? 'ประมาณการสะสม' : 'Estimate Accumulate';
                    return 'CD Goal';
                  }}
                />
                <ReferenceLine
                  y={cdGoalLine}
                  stroke="hsl(0, 72%, 51%)"
                  strokeDasharray="8 4"
                  strokeWidth={2}
                  label={{
                    value: `CD Goal: ${cdGoalLine}M`,
                    position: 'right',
                    fontSize: 11,
                    fill: 'hsl(0, 72%, 51%)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="estimateAccumulate"
                  fill="hsl(199, 89%, 48%)"
                  fillOpacity={0.1}
                  stroke="hsl(199, 89%, 48%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(199, 89%, 48%)', r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="actualAccumulate"
                  stroke="hsl(152, 60%, 42%)"
                  strokeWidth={3}
                  dot={{ fill: 'hsl(152, 60%, 42%)', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Costdown Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'th' ? 'Costdown Accumulate' : 'Costdown Accumulate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">CD Goal</span>
                <span className="text-sm font-bold">{(data.cdGoal / 1000000).toFixed(0)} MB</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {language === 'th' ? 'ยอดสะสมจริง (Actual)' : 'Actual Accumulate'}
                </span>
                <span className="text-sm font-bold text-success">
                  {(data.costdownAccumulate / 1000000).toFixed(1)} MB
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">
                  {language === 'th' ? 'Costdown Challenge' : 'Costdown Challenge'}
                </span>
                <span className="text-sm font-bold text-info">
                  {(data.costdownChallenge / 1000000).toFixed(1)} MB
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">
                  {language === 'th' ? 'ส่วนต่างจาก Goal' : 'Gap from Goal'}
                </span>
                <span className={`text-sm font-bold ${data.costdownAccumulate >= data.cdGoal ? 'text-success' : 'text-destructive'}`}>
                  {((data.costdownAccumulate - data.cdGoal) / 1000000).toFixed(1)} MB
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'th' ? 'อัตราผลสำเร็จ' : 'Achievement Rate'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {language === 'th' ? 'Actual vs Goal' : 'Actual vs Goal'}
                  </span>
                  <span className="text-xs font-medium">
                    {((data.costdownAccumulate / data.cdGoal) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-success h-full rounded-full"
                    style={{ width: `${Math.min((data.costdownAccumulate / data.cdGoal) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-muted-foreground">
                    {language === 'th' ? 'Estimate vs Goal' : 'Estimate vs Goal'}
                  </span>
                  <span className="text-xs font-medium">
                    {((data.costdownChallenge / data.cdGoal) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div
                    className="bg-info h-full rounded-full"
                    style={{ width: `${Math.min((data.costdownChallenge / data.cdGoal) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
