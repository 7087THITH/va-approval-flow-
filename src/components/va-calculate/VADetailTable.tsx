import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { vaCalculationItems } from '@/data/vaCalculateData';
import { Language } from '@/types/workflow';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VADetailTableProps {
  language: Language;
}

export function VADetailTable({ language }: VADetailTableProps) {
  const [search, setSearch] = useState('');

  const filtered = vaCalculationItems.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.vaNo.toLowerCase().includes(q) ||
      item.partName.toLowerCase().includes(q) ||
      item.supplierName.toLowerCase().includes(q) ||
      item.buyerName.toLowerCase().includes(q) ||
      item.vaTheme.toLowerCase().includes(q)
    );
  });

  const totalCostdownPerYear = filtered.reduce((s, i) => s + i.costdownPerYear, 0);

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <Card className="card-elevated border-info/20 bg-info/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="text-xs text-info">
              <p className="font-medium mb-1">
                {language === 'th' ? 'FY23 VA Calculation Result' : 'FY23 VA Calculation Result'}
              </p>
              <p className="text-muted-foreground">
                Exchange Rate: 35.50 | CIF: 1.25% | FOB: 3.50%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder={language === 'th' ? 'ค้นหา VA No., Part, Supplier...' : 'Search VA No., Part, Supplier...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {language === 'th' ? 'รายละเอียดการคำนวณ VA' : 'VA Calculation Detail'}
            <Badge variant="secondary">{filtered.length} items</Badge>
            <Badge variant="outline" className="text-success border-success ml-2">
              Total: {(totalCostdownPerYear / 1000000).toFixed(2)}M
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="text-[11px]">VA No.</TableHead>
                  <TableHead className="text-[11px]">Category</TableHead>
                  <TableHead className="text-[11px]">Supplier</TableHead>
                  <TableHead className="text-[11px]">Drawing</TableHead>
                  <TableHead className="text-[11px]">Buyer</TableHead>
                  <TableHead className="text-[11px]">Part Name</TableHead>
                  <TableHead className="text-[11px] max-w-[180px]">VA Theme</TableHead>
                  <TableHead className="text-[11px] text-right">Before</TableHead>
                  <TableHead className="text-[11px] text-right">After</TableHead>
                  <TableHead className="text-[11px] text-right">CD/Unit</TableHead>
                  <TableHead className="text-[11px] text-right">Vol/Year</TableHead>
                  <TableHead className="text-[11px] text-right">CD/Year</TableHead>
                  <TableHead className="text-[11px]">Apply</TableHead>
                  <TableHead className="text-[11px]">Rank</TableHead>
                  <TableHead className="text-[11px]">Group</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell className="text-xs font-mono font-medium whitespace-nowrap">{item.vaNo}</TableCell>
                    <TableCell className="text-xs">{item.partCategory}</TableCell>
                    <TableCell className="text-xs">{item.supplierName}</TableCell>
                    <TableCell className="text-xs font-mono">{item.drawingPart}</TableCell>
                    <TableCell className="text-xs">{item.buyerName}</TableCell>
                    <TableCell className="text-xs whitespace-nowrap">{item.partName}</TableCell>
                    <TableCell className="text-xs max-w-[180px] truncate">{item.vaTheme}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{item.beforeCost.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-mono">{item.afterCost.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-mono text-success">
                      -{item.costdownPerUnit.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">{item.volumePerYear.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-right font-mono font-bold text-success">
                      {item.costdownPerYear.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">{item.applyMonth}</TableCell>
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
                    <TableCell className="text-xs">{item.group}</TableCell>
                  </TableRow>
                ))}
                {/* Totals */}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell colSpan={11} className="text-xs text-right">
                    {language === 'th' ? 'รวม Costdown/ปี' : 'Total Costdown/Year'}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono font-bold text-success">
                    {totalCostdownPerYear.toLocaleString()}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
