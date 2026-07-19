import React from "react";
import { 
  FileText, 
  FileCode, 
  Table, 
  Image as ImageIcon, 
  File, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Eye, 
  RefreshCw, 
  Trash2,
  TrendingDown
} from "lucide-react";
import { ConvertedFile } from "../types";

interface FileListProps {
  files: ConvertedFile[];
  onSelectFile: (file: ConvertedFile) => void;
  selectedFileId?: string;
  onDownloadFile: (file: ConvertedFile) => void;
  onRemoveFile: (id: string) => void;
  onRetryFile: (id: string) => void;
}

export default function FileList({
  files,
  onSelectFile,
  selectedFileId,
  onDownloadFile,
  onRemoveFile,
  onRetryFile,
}: FileListProps) {
  
  const getFileIcon = (mimeType: string, filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    
    if (ext === "pdf" || mimeType.includes("pdf")) {
      return <div className="w-8 h-8 bg-rose-50 text-rose-600 rounded flex items-center justify-center font-bold text-[10px] shrink-0">PDF</div>;
    }
    if (ext === "docx" || mimeType.includes("word")) {
      return <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center font-bold text-[10px] shrink-0">DOCX</div>;
    }
    if (["xlsx", "xls", "csv"].includes(ext || "") || mimeType.includes("sheet") || mimeType.includes("csv")) {
      return <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center font-bold text-[10px] shrink-0">XLSX</div>;
    }
    if (["png", "jpg", "jpeg", "webp"].includes(ext || "") || mimeType.includes("image")) {
      return <div className="w-8 h-8 bg-purple-50 text-purple-600 rounded flex items-center justify-center font-bold text-[10px] shrink-0">IMG</div>;
    }
    if (["html", "json", "xml", "js", "ts"].includes(ext || "")) {
      return <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded flex items-center justify-center font-bold text-[10px] shrink-0">HTML</div>;
    }
    return <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded flex items-center justify-center font-bold text-[10px] shrink-0">FILE</div>;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  if (files.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px]">
        <FileText className="h-12 w-12 text-slate-200 stroke-[1.5] mb-3" />
        <p className="text-sm font-semibold text-slate-600">No documents uploaded yet</p>
        <p className="text-xs text-slate-400 mt-1 max-w-sm">
          Select or drag files into the zone above to begin high-fidelity Markdown conversions.
        </p>
      </div>
    );
  }

  return (
    <div id="uploaded-files-list" className="flex flex-col gap-3 max-h-[700px] overflow-y-auto pr-1">
      {files.map((file) => {
        const isSelected = selectedFileId === file.id;
        const hasStats = file.stats && file.status === "success";

        return (
          <div
            key={file.id}
            onClick={() => {
              if (file.status === "success") onSelectFile(file);
            }}
            className={`border rounded-xl p-4 transition duration-200 flex flex-col gap-3 select-none ${
              isSelected
                ? "border-indigo-500 bg-indigo-50/10 ring-1 ring-indigo-500/10"
                : "border-slate-200 hover:border-slate-300 bg-white"
            } ${file.status === "success" ? "cursor-pointer" : "cursor-default"}`}
          >
            {/* Main file line */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {getFileIcon(file.type, file.name)}
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-700 truncate block max-w-xs md:max-w-md">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                    {formatSize(file.size)}
                  </span>
                </div>
              </div>

              {/* Status and Actions badge */}
              <div className="flex items-center gap-2 shrink-0">
                {file.status === "idle" && (
                  <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-50 uppercase tracking-wide">
                    Queued
                  </span>
                )}
                {file.status === "uploading" && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1.5 uppercase tracking-wide">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading
                  </span>
                )}
                {file.status === "converting" && (
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1.5 uppercase tracking-wide">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" /> AI Converting
                  </span>
                )}
                {file.status === "success" && (
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide">
                    <CheckCircle className="h-3 w-3" /> Ready
                  </span>
                )}
                {file.status === "error" && (
                  <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide">
                    <AlertCircle className="h-3 w-3" /> Failed
                  </span>
                )}

                {/* Individual Remove button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile(file.id);
                  }}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                  title="Remove file"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Error Message */}
            {file.status === "error" && file.error && (
              <div className="bg-rose-50 text-rose-800 text-xs p-2.5 rounded-lg border border-rose-100 flex flex-col gap-2">
                <p className="font-medium">{file.error}</p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRetryFile(file.id);
                  }}
                  className="self-start inline-flex items-center gap-1 bg-white hover:bg-rose-100/50 border border-rose-200 text-rose-700 font-bold px-2.5 py-1 rounded-lg transition text-[10px] cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Retry Conversion
                </button>
              </div>
            )}

            {/* Stats Bar */}
            {hasStats && file.stats && (
              <div className="bg-slate-50/50 border border-slate-100 rounded-lg p-2.5 flex items-center justify-between flex-wrap gap-2 text-[10px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-3.5 w-3.5 text-indigo-500" />
                  <span className="font-bold text-slate-600">Token Saved:</span>
                  <span className="font-mono bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                    -{file.stats.tokenSavingPercent}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <span>Original:</span> <strong className="font-bold text-slate-600">{file.stats.originalTokens}</strong>
                  </div>
                  <div className="text-slate-300">|</div>
                  <div>
                    <span>Converted:</span> <strong className="font-bold text-indigo-600">{file.stats.convertedTokens}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons (only if success) */}
            {file.status === "success" && (
              <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectFile(file);
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  {isSelected ? "Viewing" : "Preview"}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadFile(file);
                  }}
                  className="inline-flex items-center gap-1 bg-slate-150 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" /> Download MD
                </button>
              </div>
            )}

            {/* Progress Bar (if uploading/converting) */}
            {(file.status === "uploading" || file.status === "converting") && (
              <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    file.status === "uploading" ? "bg-indigo-500" : "bg-amber-500 animate-pulse"
                  }`}
                  style={{ width: `${file.progress}%` }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
