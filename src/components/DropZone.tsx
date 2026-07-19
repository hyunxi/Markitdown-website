import React, { useState, useRef } from "react";
import { UploadCloud, File, AlertCircle } from "lucide-react";

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  maxSizeMB?: number;
}

const SUPPORTED_EXTENSIONS = [
  ".pdf", ".docx", ".xlsx", ".xls", 
  ".txt", ".csv", ".html", ".json", ".md",
  ".png", ".jpg", ".jpeg", ".webp"
];

export default function DropZone({ onFilesSelected, maxSizeMB = 25 }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndProcessFiles = (files: FileList | File[]) => {
    setErrorMessage(null);
    const validFiles: File[] = [];
    const sizeLimitBytes = maxSizeMB * 1024 * 1024;

    Array.from(files).forEach((file) => {
      const extension = "." + file.name.split(".").pop()?.toLowerCase();
      
      if (!SUPPORTED_EXTENSIONS.includes(extension)) {
        setErrorMessage(`"${file.name}" has an unsupported format. Supported formats: ${SUPPORTED_EXTENSIONS.join(", ")}`);
        return;
      }

      if (file.size > sizeLimitBytes) {
        setErrorMessage(`"${file.name}" exceeds the ${maxSizeMB}MB file size limit.`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFiles(e.target.files);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        id="file-dropzone"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileInput}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition duration-200 flex flex-col items-center justify-center gap-4 group select-none min-h-[220px] ${
          isDragActive
            ? "border-indigo-500 bg-indigo-50/50 scale-[0.99] shadow-inner"
            : "border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50 bg-white"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
          accept={SUPPORTED_EXTENSIONS.join(",")}
        />

        <div className={`p-4 rounded-full transition-all duration-300 ${
          isDragActive 
            ? "bg-indigo-100 text-indigo-600 scale-110" 
            : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100/70"
        }`}>
          <UploadCloud className="h-8 w-8 stroke-[1.5]" />
        </div>

        <div>
          <span className="text-sm font-semibold text-slate-700 block">
            {isDragActive ? "Drop files to convert" : "Drop documents here for bulk conversion"}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Supports DOCX, PDF, XLSX, XLS, TXT, CSV, HTML, images up to {maxSizeMB}MB
          </span>
        </div>

        <button 
          type="button"
          className="px-5 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 bg-white shadow-sm hover:bg-slate-50 transition cursor-pointer"
        >
          Browse Files
        </button>
      </div>

      {errorMessage && (
        <div id="dropzone-error" className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
          <span className="font-semibold">{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
