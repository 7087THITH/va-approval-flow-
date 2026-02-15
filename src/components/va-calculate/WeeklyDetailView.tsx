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
import { vaCalculationItems, creditNoteItems } from '@/data/vaCalculateData';
import { Language } from '@/types/workflow';
import { cn } from '@/lib/utils';

interface WeeklyDetailViewProps {
  language: Language;
  weekKey: string; // e.g., "W1-Apr-24"
  monthKey: string; // extracted month e.g., "Apr-24"
}

export function WeeklyDetailView({ language, weekKey, monthKey }: WeeklyDetailViewProps) {
  // For demo: weekly view shows the same month items but with a week label
  // In production, items would have a specific week/date field
  const monthItems = vaCalculationItems.filter(
    (item) => item.applyMonth === monthKey
  );

  const monthCNs = creditNoteItems.filter(
    (cn) => cn.applyMonthActual === monthKey || cn.applyMonthTarget === monthKey
  );

  const totalCD = monthItems.reduce((s, i) => s + i.costdownPerYear, 0);

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <Card className="card-elevated border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">
                {language === 'th' ? `สัปดาห์: ${weekKey}` : `Week: ${weekKey}`}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'th'
                  ? 'แสดง VA Items และ Credit Note ที่มีการเปลี่ยนแปลงในสัปดาห์นี้'
                  : 'Showing VA Items and Credit Notes updated this week'}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">VA Items</p>
                <p className="text-sm font-bold">{monthItems.length}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">CN Items</p>
                <p className="text-sm font-bold">{monthCNs.length}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Total CD</p>
                <p className="text-sm font-bold text-success">{(totalCD / 1000000).toFixed(2)}M</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* VA Items Table */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {language === 'th' ? 'VA Items ที่อัพเดท' : 'Updated VA Items'}
            <Badge variant="secondary">{monthItems.length}</Badge>
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
                    <TableHead className="text-[11px] text-right">CD/Unit</TableHead>
                    <TableHead className="text-[11px] text-right">CD/Year</TableHead>
                    <TableHead className="text-[11px]">Rank</TableHead>
                    <TableHead className="text-[11px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-xs font-mono font-medium">{item.vaNo}</TableCell>
                      <TableCell className="text-xs">{item.supplierName}</TableCell>
                      <TableCell className="text-xs">{item.partName}</TableCell>
                      <TableCell className="text-xs text-right font-mono text-success">
                        -{item.costdownPerUnit.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-xs text-right font-mono font-bold text-success">
                        {item.costdownPerYear.toLocaleString()}
                      </TableCell>
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
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] bg-success/10 text-success">
                          {language === 'th' ? 'อนุมัติแล้ว' : 'Applied'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {language === 'th'
                ? 'ไม่มีรายการอัพเดทในสัปดาห์นี้'
                : 'No items updated this week'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
