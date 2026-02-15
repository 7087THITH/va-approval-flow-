import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { vaCalculationItems, creditNoteItems, MonthlyVAData } from '@/data/vaCalculateData';
import { Language } from '@/types/workflow';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MonthlyDetailViewProps {
  language: Language;
  monthKey: string; // e.g., "Apr-24"
  monthlyData?: MonthlyVAData;
}

export function MonthlyDetailView({ language, monthKey, monthlyData }: MonthlyDetailViewProps) {
  // Filter VA items that apply in this month
  const monthItems = vaCalculationItems.filter(
    (item) => item.applyMonth === monthKey
  );

  // Filter credit notes for this month
  const monthCNs = creditNoteItems.filter(
    (cn) => cn.applyMonthActual === monthKey || cn.applyMonthTarget === monthKey
  );

  const totalCD = monthItems.reduce((s, i) => s + i.costdownPerYear, 0);
  const totalCNTarget = monthCNs.reduce((s, i) => s + i.costdownTarget, 0);
  const totalCNActual = monthCNs.reduce((s, i) => s + i.costdownActual, 0);

  return (
    <div className="space-y-4">
      {/* Month Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="card-elevated">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {language === 'th' ? 'VA Items' : 'VA Items'}
            </p>
            <p className="text-lg font-bold text-foreground mt-1">{monthItems.length}</p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {language === 'th' ? 'รวม CD ของเดือน' : 'Total CD/Month'}
            </p>
            <p className="text-lg font-bold text-success mt-1">
              {(totalCD / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {language === 'th' ? 'CN Target' : 'CN Target'}
            </p>
            <p className="text-lg font-bold text-info mt-1">
              {(totalCNTarget / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {language === 'th' ? 'CN Actual' : 'CN Actual'}
            </p>
            <p className="text-lg font-bold text-warning mt-1">
              {(totalCNActual / 1000000).toFixed(2)}M
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Data Snapshot */}
      {monthlyData && (
        <Card className="card-elevated border-info/20 bg-info/5">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-muted-foreground">Estimate CD Target</p>
                  <p className="font-bold">{(monthlyData.estimateCDTarget / 1000000).toFixed(2)}M</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <div>
                  <p className="text-muted-foreground">Total CD/Month</p>
                  <p className="font-bold text-success">{(monthlyData.totalCDByMonth / 1000000).toFixed(2)}M</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-info" />
                <div>
                  <p className="text-muted-foreground">Accumulate</p>
                  <p className="font-bold text-info">{(monthlyData.totalCDAccumulate / 1000000).toFixed(2)}M</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VA Items for this month */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {language === 'th' ? `VA Items — ${monthKey}` : `VA Items — ${monthKey}`}
            <Badge variant="secondary">{monthItems.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {monthItems.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead className="text-[11px]">VA No.</TableHead>
                    <TableHead className="text-[11px]">Supplier</TableHead>
                    <TableHead className="text-[11px]">Part Name</TableHead>
                    <TableHead className="text-[11px] max-w-[180px]">VA Theme</TableHead>
                    <TableHead className="text-[11px] text-right">Before</TableHead>
                    <TableHead className="text-[11px] text-right">After</TableHead>
                    <TableHead className="text-[11px] text-right">CD/Unit</TableHead>
                    <TableHead className="text-[11px] text-right">CD/Year</TableHead>
                    <TableHead className="text-[11px]">Rank</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono font-medium">{item.vaNo}</TableCell>
                      <TableCell className="text-xs">{item.supplierName}</TableCell>
                      <TableCell className="text-xs">{item.partName}</TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">{item.vaTheme}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{item.beforeCost.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-mono">{item.afterCost.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-mono text-success">-{item.costdownPerUnit.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-mono font-bold text-success">{item.costdownPerYear.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px]',
                            item.rank === 'A' && 'border-success text-success',
                            item.rank === 'B' && 'border-warning text-warning',
                            item.rank === 'C' && 'border-muted-foreground text-muted-foreground'
                          )}
                        >
                          {item.rank}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/30 font-medium">
                    <TableCell colSpan={7} className="text-xs text-right">
                      {language === 'th' ? 'รวม CD/Year' : 'Total CD/Year'}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono font-bold text-success">
                      {totalCD.toLocaleString()}
                    </TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {language === 'th'
                ? `ไม่มี VA Items ที่ apply ในเดือน ${monthKey}`
                : `No VA items applied in ${monthKey}`}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Credit Notes for this month */}
      {monthCNs.length > 0 && (
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {language === 'th' ? `Credit Note — ${monthKey}` : `Credit Notes — ${monthKey}`}
              <Badge variant="secondary">{monthCNs.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead className="text-[11px]">VA No.</TableHead>
                    <TableHead className="text-[11px] max-w-[200px]">VA Theme</TableHead>
                    <TableHead className="text-[11px]">Rank</TableHead>
                    <TableHead className="text-[11px] text-right">CD Target</TableHead>
                    <TableHead className="text-[11px] text-right">CD Actual</TableHead>
                    <TableHead className="text-[11px]">Buyer</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthCNs.map((cn) => (
                    <TableRow key={cn.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono">{cn.vaNo}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{cn.vaTheme}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn.rank === 'A' ? 'text-[10px] border-success text-success' : 'text-[10px]'}>
                          {cn.rank}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono">{cn.costdownTarget.toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-right font-mono font-medium">{cn.costdownActual.toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{cn.buyerName}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn.cnStatus === 'issued' ? 'text-[10px] bg-success/10 text-success' : 'text-[10px] bg-warning/10 text-warning'}
                        >
                          {cn.cnStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
