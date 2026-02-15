import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Language } from '@/types/workflow';
import { Plus, Save, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface FYSetting {
  id: string;
  fiscalYear: string;
  cdGoal: number;
  exchangeRate: number;
  cifPercent: number;
  fobPercent: number;
  currency: string;
  isActive: boolean;
}

interface VACalculateSettingsProps {
  language: Language;
}

export function VACalculateSettings({ language }: VACalculateSettingsProps) {
  const [settings, setSettings] = useState<FYSetting[]>([
    {
      id: 'fy-1',
      fiscalYear: 'OB2024',
      cdGoal: 162000000,
      exchangeRate: 35.50,
      cifPercent: 1.25,
      fobPercent: 3.50,
      currency: 'THB',
      isActive: true,
    },
    {
      id: 'fy-2',
      fiscalYear: 'RB2023',
      cdGoal: 220000000,
      exchangeRate: 35.50,
      cifPercent: 1.25,
      fobPercent: 3.50,
      currency: 'THB',
      isActive: false,
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<FYSetting, 'id'>>({
    fiscalYear: '',
    cdGoal: 0,
    exchangeRate: 35.50,
    cifPercent: 1.25,
    fobPercent: 3.50,
    currency: 'THB',
    isActive: true,
  });

  const startEdit = (setting: FYSetting) => {
    setEditingId(setting.id);
    setForm({
      fiscalYear: setting.fiscalYear,
      cdGoal: setting.cdGoal,
      exchangeRate: setting.exchangeRate,
      cifPercent: setting.cifPercent,
      fobPercent: setting.fobPercent,
      currency: setting.currency,
      isActive: setting.isActive,
    });
  };

  const startNew = () => {
    setEditingId('new');
    setForm({
      fiscalYear: '',
      cdGoal: 0,
      exchangeRate: 35.50,
      cifPercent: 1.25,
      fobPercent: 3.50,
      currency: 'THB',
      isActive: true,
    });
  };

  const save = () => {
    if (!form.fiscalYear.trim()) {
      toast.error(language === 'th' ? 'กรุณากรอกปีงบประมาณ' : 'Please enter fiscal year');
      return;
    }
    if (form.cdGoal <= 0) {
      toast.error(language === 'th' ? 'กรุณากรอก CD Goal ที่มากกว่า 0' : 'CD Goal must be greater than 0');
      return;
    }

    if (editingId === 'new') {
      setSettings((prev) => [
        ...prev,
        { ...form, id: `fy-${Date.now()}` },
      ]);
      toast.success(language === 'th' ? 'เพิ่มปีงบประมาณสำเร็จ' : 'Fiscal year added successfully');
    } else {
      setSettings((prev) =>
        prev.map((s) => (s.id === editingId ? { ...s, ...form } : s))
      );
      toast.success(language === 'th' ? 'อัพเดทสำเร็จ' : 'Updated successfully');
    }
    setEditingId(null);
  };

  const deleteSetting = (id: string) => {
    if (confirm(language === 'th' ? 'ยืนยันลบปีงบประมาณ?' : 'Confirm delete fiscal year?')) {
      setSettings((prev) => prev.filter((s) => s.id !== id));
      toast.success(language === 'th' ? 'ลบสำเร็จ' : 'Deleted successfully');
    }
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return value.toLocaleString();
  };

  return (
    <div className="space-y-4">
      {/* Settings Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm">
            {language === 'th' ? 'ตั้งค่า VA Calculate ประจำปี' : 'VA Calculate Fiscal Year Settings'}
          </CardTitle>
          <Button size="sm" onClick={startNew} className="text-xs">
            <Plus className="h-3.5 w-3.5 mr-1" />
            {language === 'th' ? 'เพิ่มปีงบ' : 'Add FY'}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[11px]">{language === 'th' ? 'ปีงบ' : 'Fiscal Year'}</TableHead>
                <TableHead className="text-[11px] text-right">CD Goal</TableHead>
                <TableHead className="text-[11px] text-right">Exchange Rate</TableHead>
                <TableHead className="text-[11px] text-right">CIF %</TableHead>
                <TableHead className="text-[11px] text-right">FOB %</TableHead>
                <TableHead className="text-[11px]">{language === 'th' ? 'สกุลเงิน' : 'Currency'}</TableHead>
                <TableHead className="text-[11px]">{language === 'th' ? 'สถานะ' : 'Status'}</TableHead>
                <TableHead className="text-[11px] text-right">{language === 'th' ? 'จัดการ' : 'Actions'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settings.map((setting) => (
                <TableRow key={setting.id}>
                  <TableCell className="text-xs font-medium">{setting.fiscalYear}</TableCell>
                  <TableCell className="text-xs text-right font-mono font-bold text-success">
                    {formatCurrency(setting.cdGoal)}
                  </TableCell>
                  <TableCell className="text-xs text-right font-mono">{setting.exchangeRate.toFixed(2)}</TableCell>
                  <TableCell className="text-xs text-right font-mono">{setting.cifPercent}%</TableCell>
                  <TableCell className="text-xs text-right font-mono">{setting.fobPercent}%</TableCell>
                  <TableCell className="text-xs">{setting.currency}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={setting.isActive ? 'text-[10px] bg-success/10 text-success' : 'text-[10px]'}
                    >
                      {setting.isActive
                        ? (language === 'th' ? 'ใช้งาน' : 'Active')
                        : (language === 'th' ? 'ปิด' : 'Inactive')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon-sm" onClick={() => startEdit(setting)} className="h-7 w-7">
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => deleteSetting(setting.id)} className="h-7 w-7 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit/Add Form */}
      {editingId && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              {editingId === 'new'
                ? (language === 'th' ? 'เพิ่มปีงบประมาณใหม่' : 'Add New Fiscal Year')
                : (language === 'th' ? 'แก้ไขปีงบประมาณ' : 'Edit Fiscal Year')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'th' ? 'ปีงบประมาณ' : 'Fiscal Year'}</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.fiscalYear}
                  onChange={(e) => setForm((f) => ({ ...f, fiscalYear: e.target.value }))}
                  placeholder="e.g., OB2025"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CD Goal (THB)</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  value={form.cdGoal}
                  onChange={(e) => setForm((f) => ({ ...f, cdGoal: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Exchange Rate</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  step="0.01"
                  value={form.exchangeRate}
                  onChange={(e) => setForm((f) => ({ ...f, exchangeRate: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">CIF %</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  step="0.01"
                  value={form.cifPercent}
                  onChange={(e) => setForm((f) => ({ ...f, cifPercent: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">FOB %</Label>
                <Input
                  className="h-8 text-xs"
                  type="number"
                  step="0.01"
                  value={form.fobPercent}
                  onChange={(e) => setForm((f) => ({ ...f, fobPercent: Number(e.target.value) }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{language === 'th' ? 'สกุลเงิน' : 'Currency'}</Label>
                <Input
                  className="h-8 text-xs"
                  value={form.currency}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={save} className="text-xs">
                <Save className="h-3.5 w-3.5 mr-1" />
                {language === 'th' ? 'บันทึก' : 'Save'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="text-xs">
                {language === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
