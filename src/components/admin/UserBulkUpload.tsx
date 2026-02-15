import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { User, UserRole } from '@/types/workflow';
import { Upload, Download, FileSpreadsheet, Check, AlertTriangle, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { organizationStructure, getSelectableGroups } from '@/data/organizationStructure';

interface UserBulkUploadProps {
  onUsersImport: (users: User[]) => void;
  language: string;
}

interface ParsedRow {
  group: string;
  empCode: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  tel: string;
  jobDuty: string;
  password: string;
  valid: boolean;
  error?: string;
}

const TEMPLATE_HEADERS = [
  'GROUP',
  'EMP CODE',
  'FIRST NAME',
  'LAST NAME',
  'EMAIL',
  'POSIT',
  'TELL',
  'JOB DUTY',
  'PASSWORD',
];

// Get all selectable department groups from org structure
const selectableDepts = getSelectableGroups(organizationStructure);

function downloadTemplate() {
  const csvContent = [
    TEMPLATE_HEADERS.join(','),
    'PARTS PROCUREMENT 1 GROUP,EMP001,John,Smith,john.smith@daikin.com,Engineer,0812345678,Procurement Review,password123',
    'NEW MODEL GROUP,EMP002,Sarah,Johnson,sarah.j@daikin.com,Senior Engineer,0823456789,Quality Check,password456',
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'user_upload_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  return lines.slice(1).map((line) => {
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    fields.push(current.trim());

    const [group, empCode, firstName, lastName, email, position, tel, jobDuty, password] = fields;

    const valid = !!(firstName && lastName && email && email.includes('@'));
    const error = !valid
      ? !email?.includes('@')
        ? 'Invalid email'
        : 'Missing required fields (First Name, Last Name, Email)'
      : undefined;

    return {
      group: group || '',
      empCode: empCode || '',
      firstName: firstName || '',
      lastName: lastName || '',
      email: email || '',
      position: position || '',
      tel: tel || '',
      jobDuty: jobDuty || '',
      password: password || '',
      valid,
      error,
    };
  });
}

function mapRole(jobDuty: string): UserRole {
  const lower = jobDuty.toLowerCase();
  if (lower.includes('admin')) return 'admin';
  if (lower.includes('approv') || lower.includes('review') || lower.includes('check') || lower.includes('mgr') || lower.includes('manager') || lower.includes('gm') || lower.includes('engineer') || lower.includes('senior')) return 'approver';
  if (lower.includes('procure') || lower.includes('buyer') || lower.includes('purchase')) return 'procurement';
  return 'approver'; // Default to approver so they appear in approval route selection
}

export function UserBulkUpload({ onUsersImport, language }: UserBulkUploadProps) {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [imported, setImported] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
      setImported(false);
    };
    reader.readAsText(file);
  };

  const updateRowGroup = (index: number, newGroup: string) => {
    setParsedRows(prev => prev.map((row, i) => 
      i === index ? { ...row, group: newGroup } : row
    ));
  };

  const handleImport = () => {
    const validRows = parsedRows.filter((r) => r.valid);
    const users: User[] = validRows.map((r) => ({
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      email: r.email,
      name: `${r.firstName} ${r.lastName}`,
      role: mapRole(r.jobDuty),
      department: r.group || 'General',
      plant: '',
      position: r.position || '',
    }));
    onUsersImport(users);
    setImported(true);
  };

  const validCount = parsedRows.filter((r) => r.valid).length;
  const invalidCount = parsedRows.filter((r) => !r.valid).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Users className="h-4 w-4" />
          {language === 'th' ? 'อัพโหลดผู้ใช้หลายคน' : 'Bulk User Upload'}
        </CardTitle>
        <CardDescription className="text-xs">
          {language === 'th'
            ? 'ดาวน์โหลดเทมเพลต กรอกข้อมูล อัพโหลดกลับ แล้วเลือกแผนกจาก Dropdown ก่อนนำเข้า'
            : 'Download template, fill data, upload, then select department from dropdown before importing'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs" onClick={downloadTemplate}>
            <Download className="h-3.5 w-3.5 mr-1.5" />
            {language === 'th' ? 'ดาวน์โหลดเทมเพลต' : 'Download Template'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            {language === 'th' ? 'อัพโหลด CSV' : 'Upload CSV'}
          </Button>
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            accept=".csv,.txt"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = '';
            }}
          />
        </div>

        {/* Template columns info */}
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_HEADERS.map((h) => (
            <Badge key={h} variant="outline" className="text-[9px]">
              {h}
            </Badge>
          ))}
        </div>

        {/* Preview table */}
        {parsedRows.length > 0 && (
          <>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-muted-foreground">
                {language === 'th' ? `พบ ${parsedRows.length} รายการ` : `${parsedRows.length} rows found`}
              </span>
              {validCount > 0 && (
                <Badge variant="secondary" className="text-[10px] gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  {validCount} {language === 'th' ? 'ถูกต้อง' : 'valid'}
                </Badge>
              )}
              {invalidCount > 0 && (
                <Badge variant="destructive" className="text-[10px] gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {invalidCount} {language === 'th' ? 'มีปัญหา' : 'errors'}
                </Badge>
              )}
            </div>

            <div className="max-h-[400px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-[10px] w-8">#</TableHead>
                    <TableHead className="text-[10px] min-w-[200px]">
                      {language === 'th' ? 'แผนก/กลุ่ม' : 'Department/Group'}
                    </TableHead>
                    <TableHead className="text-[10px]">EMP Code</TableHead>
                    <TableHead className="text-[10px]">Name</TableHead>
                    <TableHead className="text-[10px]">Email</TableHead>
                    <TableHead className="text-[10px]">Position</TableHead>
                    <TableHead className="text-[10px]">Role</TableHead>
                    <TableHead className="text-[10px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedRows.map((row, idx) => (
                    <TableRow key={idx} className={cn(!row.valid && 'bg-destructive/5')}>
                      <TableCell className="text-[10px]">{idx + 1}</TableCell>
                      <TableCell className="text-[10px] p-1">
                        <Select
                          value={row.group}
                          onValueChange={(val) => updateRowGroup(idx, val)}
                        >
                          <SelectTrigger className="h-7 text-[10px] w-full">
                            <SelectValue placeholder={language === 'th' ? 'เลือกแผนก...' : 'Select dept...'} />
                          </SelectTrigger>
                          <SelectContent>
                            {selectableDepts.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name} className="text-[10px]">
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-[10px]">{row.empCode}</TableCell>
                      <TableCell className="text-[10px] font-medium">
                        {row.firstName} {row.lastName}
                      </TableCell>
                      <TableCell className="text-[10px]">{row.email}</TableCell>
                      <TableCell className="text-[10px]">{row.position}</TableCell>
                      <TableCell className="text-[10px]">
                        <Badge variant="outline" className="text-[9px] capitalize">
                          {mapRole(row.jobDuty)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px]">
                        {row.valid ? (
                          <Check className="h-3.5 w-3.5 text-green-600" />
                        ) : (
                          <span className="text-destructive text-[9px]">{row.error}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setParsedRows([]);
                  setImported(false);
                }}
              >
                {language === 'th' ? 'ล้าง' : 'Clear'}
              </Button>
              <Button
                size="sm"
                className="text-xs"
                onClick={handleImport}
                disabled={validCount === 0 || imported}
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                {imported
                  ? language === 'th'
                    ? 'นำเข้าแล้ว!'
                    : 'Imported!'
                  : language === 'th'
                  ? `นำเข้า ${validCount} คน`
                  : `Import ${validCount} users`}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
