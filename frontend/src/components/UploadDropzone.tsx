import { useRef } from "react";
import { FileUp, X } from "lucide-react";

import { Button } from "./Button";

type UploadDropzoneProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export const UploadDropzone = ({ file, onFileChange }: UploadDropzoneProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-md border border-dashed border-ink-300 bg-white p-5">
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".csv,.txt,text/csv,text/plain"
        onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-ink-900 text-white">
            <FileUp className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold text-ink-900">{file ? file.name : "Upload CSV or TXT email list"}</p>
            <p className="mt-1 text-sm text-ink-500">
              {file ? `${formatFileSize(file.size)} selected` : "One email per row. CSV first column is used."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Choose File
          </Button>
          {file ? (
            <Button type="button" variant="ghost" onClick={() => onFileChange(null)}>
              <X className="h-4 w-4" aria-hidden="true" />
              Remove
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
