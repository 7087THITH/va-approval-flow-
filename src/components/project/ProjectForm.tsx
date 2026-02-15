import { useState } from 'react';
import { Project, ProjectStatus, projectStatusLabels } from '@/types/project';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>) => void;
  project?: Project | null;
}

const colorOptions = [
  { value: 'hsl(217 91% 60%)', label: 'Blue' },
  { value: 'hsl(152 60% 42%)', label: 'Green' },
  { value: 'hsl(38 92% 50%)', label: 'Orange' },
  { value: 'hsl(280 60% 55%)', label: 'Purple' },
  { value: 'hsl(0 72% 51%)', label: 'Red' },
  { value: 'hsl(199 89% 48%)', label: 'Cyan' },
  { value: 'hsl(340 82% 52%)', label: 'Pink' },
];

export function ProjectForm({ open, onClose, onSave, project }: ProjectFormProps) {
  const { language, currentUser } = useApp();
  const isEdit = !!project;

  const [name, setName] = useState(project?.name || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState<ProjectStatus>(project?.status || 'planning');
  const [startDate, setStartDate] = useState(
    project?.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    project?.endDate ? new Date(project.endDate).toISOString().split('T')[0] : ''
  );
  const [color, setColor] = useState(project?.color || colorOptions[0].value);

  const handleSubmit = () => {
    if (!name.trim() || !endDate) return;
    onSave({
      ...(project || {}),
      name: name.trim(),
      description: description.trim(),
      status,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      color,
      ownerId: project?.ownerId || currentUser?.id || '',
      ownerName: project?.ownerName || currentUser?.name || '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg glass">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEdit
              ? (language === 'th' ? 'แก้ไขโปรเจค' : 'Edit Project')
              : (language === 'th' ? 'สร้างโปรเจคใหม่' : 'New Project')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="form-label">{language === 'th' ? 'ชื่อโปรเจค' : 'Project Name'} *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder={language === 'th' ? 'ชื่อโปรเจค...' : 'Project name...'} />
          </div>

          <div className="space-y-1.5">
            <Label className="form-label">{language === 'th' ? 'รายละเอียด' : 'Description'}</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={language === 'th' ? 'อธิบายโปรเจค...' : 'Describe the project...'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="form-label">{language === 'th' ? 'วันเริ่ม' : 'Start Date'} *</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="form-label">{language === 'th' ? 'วันสิ้นสุด' : 'End Date'} *</Label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="form-label">{language === 'th' ? 'สถานะ' : 'Status'}</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ProjectStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(projectStatusLabels) as ProjectStatus[]).map(s => (
                    <SelectItem key={s} value={s}>{projectStatusLabels[s][language]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="form-label">{language === 'th' ? 'สีโปรเจค' : 'Color'}</Label>
              <div className="flex items-center gap-2 pt-1">
                {colorOptions.map(c => (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.value)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c.value ? 'border-foreground scale-110 shadow-md' : 'border-transparent hover:scale-105'}`}
                    style={{ background: c.value }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {language === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !endDate}>
            {isEdit
              ? (language === 'th' ? 'บันทึก' : 'Save')
              : (language === 'th' ? 'สร้างโปรเจค' : 'Create Project')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
