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
import { creditNoteItems } from '@/data/vaCalculateData';
import { Language } from '@/types/workflow';
import { Search, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreditNoteTableProps {
  language: Language;
}

export function CreditNoteTable({ language }: CreditNoteTableProps) {
  const [search, setSearch] = useState('');

  const filtered = creditNoteItems.filter(item => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.vaNo.toLowerCase().includes(q) ||
      item.vaTheme.toLowerCase().includes(q) ||
      item.buyerName.toLowerCase().includes(q) ||
      item.vaType.toLowerCase().includes(q)
    );
  });

  const totalTarget = filtered.reduce((s, i) => s + i.costdownTarget, 0);
  const totalActual = filtered.reduce((s, i) => s + i.costdownActual, 0);

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder={language === 'th' ? 'ค้นหา VA No., Theme, Buyer...' : 'Search VA No., Theme, Buyer...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* CN Table */}
      <Card className="card-elevated">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {language === 'th' ? 'Credit Note (CN) Tracking' : 'Credit Note (CN) Tracking'}
            <Badge variant="secondary">{filtered.length} items</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="table-header">
                  <TableHead className="text-[11px] w-8"></TableHead>
                  <TableHead className="text-[11px]">VA No.</TableHead>
                  <TableHead className="text-[11px] max-w-[200px]">VA Theme / Change Point</TableHead>
                  <TableHead className="text-[11px]">Rank</TableHead>
                  <TableHead className="text-[11px]">Apply (Target)</TableHead>
                  <TableHead className="text-[11px]">Apply (Actual)</TableHead>
                  <TableHead className="text-[11px] text-right">CD Target</TableHead>
                  <TableHead className="text-[11px] text-right">CD Actual</TableHead>
                  <TableHead className="text-[11px]">DCS No.</TableHead>
                  <TableHead className="text-[11px]">Buyer</TableHead>
                  <TableHead className="text-[11px]">VA Type</TableHead>
                  <TableHead className="text-[11px]">Idea By</TableHead>
                  <TableHead className="text-[11px]">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30">
                    <TableCell>
                      {item.cnStatus === 'issued' && (
                        <Star className="h-3 w-3 text-warning fill-warning" />
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-mono font-medium">{item.vaNo}</TableCell>
                    <TableCell className="text-xs max-w-[200px] truncate">{item.vaTheme}</TableCell>
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
                    <TableCell className="text-xs">{item.applyMonthTarget}</TableCell>
                    <TableCell className="text-xs">{item.applyMonthActual}</TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      {item.costdownTarget.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono font-medium">
                      {item.costdownActual.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{item.dcsNo || '-'}</TableCell>
                    <TableCell className="text-xs">{item.buyerName}</TableCell>
                    <TableCell className="text-xs">{item.vaType}</TableCell>
                    <TableCell className="text-xs">{item.createIdeaBy}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          item.cnStatus === 'issued' && 'bg-success/10 text-success border-success-border',
                          item.cnStatus === 'pending' && 'bg-warning/10 text-warning border-warning-border',
                          item.cnStatus === 'cancelled' && 'bg-destructive/10 text-destructive border-destructive-border'
                        )}
                      >
                        {item.cnStatus === 'issued'
                          ? (language === 'th' ? 'ออกแล้ว' : 'Issued')
                          : item.cnStatus === 'pending'
                          ? (language === 'th' ? 'รอดำเนินการ' : 'Pending')
                          : (language === 'th' ? 'ยกเลิก' : 'Cancelled')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals */}
                <TableRow className="bg-muted/30 font-medium">
                  <TableCell colSpan={6} className="text-xs text-right">
                    {language === 'th' ? 'รวม' : 'Total'}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono font-bold">
                    {totalTarget.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono font-bold">
                    {totalActual.toLocaleString()}
                  </TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
