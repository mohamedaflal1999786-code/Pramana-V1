"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";
import { Button } from "./Button";

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "ready" | "processing" | "uploaded" | "error";
  errorMessage?: string;
}

export interface FileUploadProps {
  onFilesSelected?: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  className?: string;
  disabled?: boolean;
}

export function FileUpload({
  onFilesSelected,
  maxFiles = 5,
  maxSizeMB = 25,
  acceptedFormats = [".pdf", ".txt", ".json", ".xml", ".hl7"],
  className,
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [selectedFiles, setSelectedFiles] = React.useState<UploadedFile[]>([]);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || disabled) return;
    setValidationError(null);

    const validNewFiles: File[] = [];
    const newItems: UploadedFile[] = [];

    if (selectedFiles.length + fileList.length > maxFiles) {
      setValidationError(`Maximum allowed limit is ${maxFiles} documents per session.`);
      return;
    }

    Array.from(fileList).forEach((file) => {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      const isFormatValid = acceptedFormats.some((fmt) => fmt.toLowerCase() === ext);
      const isSizeValid = file.size <= maxSizeMB * 1024 * 1024;

      if (!isFormatValid) {
        setValidationError(`Unsupported file extension (${ext}). Permitted formats: ${acceptedFormats.join(", ")}`);
        return;
      }

      if (!isSizeValid) {
        setValidationError(`File ${file.name} exceeds maximum allowed size of ${maxSizeMB}MB.`);
        return;
      }

      validNewFiles.push(file);
      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        name: file.name,
        size: file.size,
        type: file.type || ext,
        status: "ready",
      });
    });

    if (newItems.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newItems]);
      if (onFilesSelected) onFilesSelected(validNewFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-[12px] p-8 text-center transition-colors cursor-pointer bg-white",
          isDragging ? "border-[var(--green)] bg-[#f3f7f1]" : "border-[var(--line)] hover:border-[#a9b9ae]",
          disabled && "opacity-50 cursor-not-allowed bg-[#f8faf7]"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(",")}
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
          aria-label="Upload clinical documents"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#e6ede2] flex items-center justify-center text-[var(--green)]">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[15px] font-[650] text-[var(--ink)]">
              Drop clinical records here or <span className="text-[var(--green)] underline underline-offset-2">browse files</span>
            </p>
            <p className="text-[13px] text-[var(--muted)] mt-1">
              Supports {acceptedFormats.join(", ").toUpperCase()} up to {maxSizeMB}MB
            </p>
          </div>
        </div>
      </div>

      {validationError && (
        <div className="flex items-center gap-2 text-[13px] text-[#b91c1c] bg-[#fdf2f2] p-3 rounded-[7px] border border-[#f5c6c6]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="border border-[var(--line)] rounded-[8px] bg-white divide-y divide-[var(--line)]">
          <div className="p-3 bg-[#faf9f5] flex justify-between items-center text-[12px] font-[650] text-[var(--muted)]">
            <span>SELECTED DOCUMENTS ({selectedFiles.length}/{maxFiles})</span>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-[#8b261e] hover:underline"
            >
              Clear all
            </button>
          </div>
          {selectedFiles.map((file) => (
            <div key={file.id} className="p-3 flex items-center justify-between gap-3 text-[13px]">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-5 h-5 text-[var(--green)] shrink-0" />
                <div className="min-w-0">
                  <p className="font-[600] text-[var(--ink)] truncate">{file.name}</p>
                  <p className="text-[11px] text-[var(--muted)]">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeFile(file.id)}
                className="text-[var(--muted)] hover:text-[var(--ink)] p-1 rounded"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
