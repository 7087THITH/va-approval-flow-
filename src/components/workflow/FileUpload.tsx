import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  file?: File;
}

interface FileUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  language: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
}

export function FileUpload({
  files,
  onFilesChange,
  language,
  accept,
  multiple = true,
  maxSizeMB = 20,
  label,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: file.name,
      size: file.size,
      type: file.type,
      url: URL.createObjectURL(file),
      file,
    }));
    onFilesChange([...files, ...newFiles]);
  };

  const removeFile = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (file?.url) URL.revokeObjectURL(file.url);
    onFilesChange(files.filter((f) => f.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}

      {/* Drop zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {language === 'th'
            ? 'ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์'
            : 'Drag & drop files here, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {language === 'th'
            ? `รองรับทุกนามสกุล (สูงสุด ${maxSizeMB}MB)`
            : `All file types accepted (max ${maxSizeMB}MB)`}
        </p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <div key={file.id} className="flex items-center gap-3 p-2.5 rounded-lg border bg-card">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{file.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatSize(file.size)}</p>
              </div>
              <div className="flex items-center gap-1">
                {file.url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(file.url, '_blank');
                    }}
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
