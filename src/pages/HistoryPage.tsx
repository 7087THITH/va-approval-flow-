import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { StatusBadge, ConfidentialityBadge } from '@/components/workflow/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import { Search, FileText, Download, Eye } from 'lucide-react';
import { ProposalStatus } from '@/types/workflow';
import { cn } from '@/lib/utils';

export default function HistoryPage() {
  const { proposals, language, t } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all');
  const [sortField, setSortField] = useState<'date' | 'proposalNo' | 'partName'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const filteredProposals = useMemo(() => {
    let result = [...proposals];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.partName.toLowerCase().includes(q) ||
        p.proposalNo.toLowerCase().includes(q) ||
        p.requesterName.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        (p.supplierManufacturer?.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'proposalNo') {
        cmp = (a.proposalNo || '').localeCompare(b.proposalNo || '');
      } else if (sortField === 'partName') {
        cmp = a.partName.localeCompare(b.partName);
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });

    return result;
  }, [proposals, statusFilter, searchQuery, sortField, sortDir]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: proposals.length };
    proposals.forEach(p => {
      counts[p.status] = (counts[p.status] || 0) + 1;
    });
    return counts;
  }, [proposals]);

  const statusOptions: { value: ProposalStatus | 'all'; label: string; labelTh: string }[] = [
    { value: 'all', label: 'All', labelTh: 'ทั้งหมด' },
    { value: 'draft', label: 'Draft', labelTh: 'ร่าง' },
    { value: 'pending', label: 'Pending', labelTh: 'รอดำเนินการ' },
    { value: 'approved', label: 'Approved', labelTh: 'อนุมัติแล้ว' },
    { value: 'rejected', label: 'Rejected', labelTh: 'ถูกปฏิเสธ' },
    { value: 'returned', label: 'Returned', labelTh: 'ส่งคืน' },
    { value: 'revision', label: 'Revision', labelTh: 'ขอแก้ไข' },
  ];

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('history')}</h1>
            <p className="text-muted-foreground text-sm">
              {language === 'th'
                ? `ประวัติเอกสารทั้งหมด ${proposals.length} รายการ`
                : `All ${proposals.length} proposals in the system`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder={language === 'th' ? 'ค้นหา ชื่อ, เลข VA, ผู้ขอ, แผนก...' : 'Search by name, VA no., requester, department...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {language === 'th' ? opt.labelTh : opt.label}
                      {statusCounts[opt.value] !== undefined && ` (${statusCounts[opt.value]})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {statusOptions.map(opt => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? 'default' : 'outline'}
              size="sm"
              className="text-xs"
              onClick={() => setStatusFilter(opt.value)}
            >
              {language === 'th' ? opt.labelTh : opt.label}
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px]">
                {statusCounts[opt.value] || 0}
              </span>
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="text-[11px] cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('proposalNo')}
                  >
                    {language === 'th' ? 'เลขที่' : 'VA No.'}
                    {sortField === 'proposalNo' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead
                    className="text-[11px] cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('partName')}
                  >
                    {language === 'th' ? 'ชื่อชิ้นส่วน' : 'Part Name'}
                    {sortField === 'partName' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead className="text-[11px]">
                    {language === 'th' ? 'ผู้ขอ' : 'Requester'}
                  </TableHead>
                  <TableHead className="text-[11px]">
                    {language === 'th' ? 'แผนก' : 'Department'}
                  </TableHead>
                  <TableHead className="text-[11px]">
                    {language === 'th' ? 'สถานะ' : 'Status'}
                  </TableHead>
                  <TableHead className="text-[11px]">
                    {language === 'th' ? 'ความลับ' : 'Confidentiality'}
                  </TableHead>
                  <TableHead
                    className="text-[11px] cursor-pointer hover:text-foreground"
                    onClick={() => toggleSort('date')}
                  >
                    {language === 'th' ? 'วันที่สร้าง' : 'Created'}
                    {sortField === 'date' && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </TableHead>
                  <TableHead className="text-[11px]">
                    {language === 'th' ? 'ประหยัด/ปี' : 'Savings/yr'}
                  </TableHead>
                  <TableHead className="text-[11px] text-right">
                    {language === 'th' ? 'ดำเนินการ' : 'Action'}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProposals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="text-muted-foreground" size={32} />
                        <p className="text-sm text-muted-foreground">
                          {language === 'th' ? 'ไม่พบเอกสาร' : 'No proposals found'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProposals.map(proposal => (
                    <TableRow
                      key={proposal.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/proposal/${proposal.id}`)}
                    >
                      <TableCell className="text-xs font-mono">
                        {proposal.proposalNo || (
                          <span className="text-muted-foreground italic">Draft</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs font-medium max-w-[200px] truncate">
                        {proposal.partName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {proposal.requesterName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {language === 'th' && proposal.departmentTh ? proposal.departmentTh : proposal.department}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={proposal.status} />
                      </TableCell>
                      <TableCell>
                        <ConfidentialityBadge level={proposal.confidentiality} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(proposal.createdAt, 'yyyy-MM-dd')}
                      </TableCell>
                      <TableCell className={cn(
                        "text-xs font-medium",
                        proposal.cost.annualContribution < 0 ? "text-success" :
                        proposal.cost.annualContribution > 0 ? "text-destructive" :
                        "text-muted-foreground"
                      )}>
                        {proposal.cost.annualContribution !== 0
                          ? `${proposal.cost.annualContribution < 0 ? '' : '+'}${proposal.cost.annualContribution.toLocaleString()}K`
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/proposal/${proposal.id}`);
                          }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="text-xs text-muted-foreground text-center">
          {language === 'th'
            ? `แสดง ${filteredProposals.length} จาก ${proposals.length} รายการ`
            : `Showing ${filteredProposals.length} of ${proposals.length} proposals`}
        </div>
      </div>
    </MainLayout>
  );
}
