import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ClipboardCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  VACheckSheet as VACheckSheetType, 
  VACheckSheetItem, 
  VA_CHECK_SHEET_ITEMS 
} from '@/types/workflow';

interface VACheckSheetProps {
  checkSheet?: VACheckSheetType;
  partName?: string;
  supplier?: string;
  language: 'en' | 'th';
  editable?: boolean;
  onUpdate?: (checkSheet: VACheckSheetType) => void;
  onComplete?: (checkSheet: VACheckSheetType) => void;
}

export function VACheckSheetComponent({
  checkSheet,
  partName,
  supplier,
  language,
  editable = false,
  onUpdate,
  onComplete,
}: VACheckSheetProps) {
  const [items, setItems] = useState<VACheckSheetItem[]>(
    checkSheet?.items || VA_CHECK_SHEET_ITEMS.map((item, idx) => ({
      ...item,
      id: `check-${idx}`,
      checked: false,
      remark: '',
    }))
  );
  const [comment, setComment] = useState(checkSheet?.comment || '');

  const allChecked = items.every(i => i.checked);
  const checkedCount = items.filter(i => i.checked).length;

  const handleToggle = (idx: number) => {
    if (!editable) return;
    const updated = items.map((item, i) => 
      i === idx ? { ...item, checked: !item.checked } : item
    );
    setItems(updated);
    onUpdate?.({
      items: updated,
      vaTheme: partName,
      supplier,
      comment,
      isComplete: updated.every(i => i.checked),
    });
  };

  const handleRemarkChange = (idx: number, remark: string) => {
    if (!editable) return;
    const updated = items.map((item, i) => 
      i === idx ? { ...item, remark } : item
    );
    setItems(updated);
  };

  const handleComplete = () => {
    if (!allChecked) return;
    onComplete?.({
      items,
      vaTheme: partName,
      supplier,
      comment,
      isComplete: true,
      date: new Date().toISOString(),
    });
  };

  return (
    <Card className={cn(
      "border-2",
      allChecked ? "border-success/30" : "border-warning/30"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <ClipboardCheck size={18} />
            VA PROPOSAL INFORMATION CHECK SHEET
          </CardTitle>
          <Badge variant={allChecked ? 'default' : 'secondary'} className={cn(
            allChecked ? "bg-success text-success-foreground" : ""
          )}>
            {checkedCount}/{items.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Header info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">VA Theme:</span>
            <p className="font-medium">{partName || '-'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Supplier:</span>
            <p className="font-medium">{supplier || '-'}</p>
          </div>
        </div>

        {/* Check items table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-[40px_1fr_120px_60px_1fr] gap-0 bg-muted/50 text-xs font-semibold p-2 border-b">
            <span>No</span>
            <span>Description</span>
            <span>Format</span>
            <span className="text-center">Check</span>
            <span>Remark</span>
          </div>
          {items.map((item, idx) => {
            const isHighlight = item.no >= 7;
            return (
              <div 
                key={item.id} 
                className={cn(
                  "grid grid-cols-[40px_1fr_120px_60px_1fr] gap-0 p-2 border-b last:border-b-0 items-center text-sm",
                  isHighlight && "bg-warning/5",
                  item.checked && "bg-success/5"
                )}
              >
                <span className="font-medium text-muted-foreground">{item.no}</span>
                <span className={cn("pr-2", isHighlight && "text-warning font-medium")}>
                  {language === 'th' ? item.descriptionTh : item.description}
                </span>
                <span className="text-xs text-muted-foreground">{item.format}</span>
                <div className="flex justify-center">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={() => handleToggle(idx)}
                    disabled={!editable}
                  />
                </div>
                <div>
                  {editable ? (
                    <Input
                      value={item.remark || ''}
                      onChange={(e) => handleRemarkChange(idx, e.target.value)}
                      placeholder="Remark"
                      className="h-7 text-xs"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{item.remark || '-'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Comment */}
        {editable ? (
          <div className="space-y-2">
            <Label className="text-sm">Comment</Label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={language === 'th' ? 'ความเห็นเพิ่มเติม...' : 'Additional comments...'}
              rows={2}
            />
          </div>
        ) : checkSheet?.comment ? (
          <div className="text-sm">
            <span className="text-muted-foreground">Comment:</span>
            <p className="mt-1">{checkSheet.comment}</p>
          </div>
        ) : null}

        {/* Status / Action */}
        {editable && (
          <div className="pt-2">
            {!allChecked ? (
              <div className="flex items-center gap-2 text-warning text-sm">
                <AlertTriangle size={16} />
                {language === 'th' 
                  ? `ยังเหลืออีก ${items.length - checkedCount} รายการที่ยังไม่ได้ตรวจ` 
                  : `${items.length - checkedCount} item(s) remaining`}
              </div>
            ) : (
              <Button 
                variant="success" 
                className="w-full" 
                onClick={handleComplete}
              >
                <CheckCircle size={16} className="mr-2" />
                {language === 'th' ? 'เช็คครบแล้ว — อนุมัติส่งต่อ' : 'All Checked — Approve & Forward'}
              </Button>
            )}
          </div>
        )}

        {/* Read-only completed status */}
        {!editable && checkSheet?.isComplete && (
          <div className="flex items-center gap-2 text-success text-sm font-medium">
            <CheckCircle size={16} />
            {language === 'th' ? 'เอกสารครบถ้วน ✓' : 'Documents Complete ✓'}
            {checkSheet.checkedByName && (
              <span className="text-muted-foreground font-normal">
                — {language === 'th' ? 'ตรวจโดย' : 'by'} {checkSheet.checkedByName}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
