import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, X, Eye, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PartImage {
  id: string;
  name: string;
  url: string;
  file?: File;
}

interface PartImageUploadProps {
  currentImage: PartImage | null;
  improvedImage: PartImage | null;
  onCurrentChange: (img: PartImage | null) => void;
  onImprovedChange: (img: PartImage | null) => void;
  language: string;
}

function ImageSlot({
  image,
  onUpload,
  onRemove,
  title,
  subtitle,
  language,
}: {
  image: PartImage | null;
  onUpload: (img: PartImage) => void;
  onRemove: () => void;
  title: string;
  subtitle: string;
  language: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);

  const handleFile = (file: File) => {
    onUpload({
      id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    });
  };

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{title}</p>
            <p className="text-[10px] text-muted-foreground">{subtitle}</p>
          </div>
        </div>

        {image ? (
          <div className="relative group rounded-lg overflow-hidden">
            <img
              src={image.url}
              alt={title}
              className="w-full h-48 object-contain bg-white cursor-pointer"
              onClick={() => setPreview(true)}
            />
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="icon"
                className="h-7 w-7 shadow-md"
                onClick={() => setPreview(true)}
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                className="h-7 w-7 shadow-md"
                onClick={() => {
                  if (image.url) URL.revokeObjectURL(image.url);
                  onRemove();
                }}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-center py-1 text-muted-foreground truncate px-2">
              {image.name}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              'border-2 border-dashed rounded-lg h-48 flex flex-col items-center justify-center',
              'cursor-pointer hover:border-primary/50 transition-colors'
            )}
            onClick={() => inputRef.current?.click()}
          >
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-xs text-muted-foreground">
              {language === 'th' ? 'คลิกเพื่ออัพโหลดรูป' : 'Click to upload image'}
            </p>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = '';
          }}
        />
      </div>

      {/* Preview Dialog */}
      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {image && (
            <img
              src={image.url}
              alt={title}
              className="w-full max-h-[80vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function PartImageUpload({
  currentImage,
  improvedImage,
  onCurrentChange,
  onImprovedChange,
  language,
}: PartImageUploadProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <ImageIcon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">
          {language === 'th' ? 'รูปภาพชิ้นส่วน' : 'Part Images'}
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <ImageSlot
          image={currentImage}
          onUpload={onCurrentChange}
          onRemove={() => onCurrentChange(null)}
          title={language === 'th' ? 'รูปปัจจุบัน (Before)' : 'Current Part (Before)'}
          subtitle={language === 'th' ? 'อัพโหลดรูปชิ้นส่วนปัจจุบัน' : 'Upload current part image'}
          language={language}
        />
        <ImageSlot
          image={improvedImage}
          onUpload={onImprovedChange}
          onRemove={() => onImprovedChange(null)}
          title={language === 'th' ? 'รูปที่ปรับปรุง (After)' : 'Improved Part (After)'}
          subtitle={language === 'th' ? 'อัพโหลดรูปชิ้นส่วนที่ปรับปรุง' : 'Upload improved part image'}
          language={language}
        />
      </div>
    </div>
  );
}
