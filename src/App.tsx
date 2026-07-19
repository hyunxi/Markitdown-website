import React, { useState, useCallback } from "react";
import JSZip from "jszip";
import Header from "./components/Header";
import DropZone from "./components/DropZone";
import ConversionSettingsPanel from "./components/ConversionSettings";
import FileList from "./components/FileList";
import PreviewPanel from "./components/PreviewPanel";
import { ConversionSettings, ConvertedFile, StatsOverview } from "./types";
import { Server, Sparkles, Code2, Cpu } from "lucide-react";

export default function App() {
  // Application-wide state
  const [files, setFiles] = useState<ConvertedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(undefined);
  const [isZipDownloading, setIsZipDownloading] = useState(false);
  const [settings, setSettings] = useState<ConversionSettings>({
    stripHeadersFooters: true,
    optimizeTokens: true,
    formatTables: true,
    preserveImages: true,
    customGuidelines: "",
  });

  // Calculate global savings statistics
  const successfulFiles = files.filter((f) => f.status === "success");
  const stats: StatsOverview = {
    totalFiles: files.length,
    successfulConversions: successfulFiles.length,
    totalOriginalTokens: successfulFiles.reduce((sum, f) => sum + (f.stats?.originalTokens || 0), 0),
    totalConvertedTokens: successfulFiles.reduce((sum, f) => sum + (f.stats?.convertedTokens || 0), 0),
    totalTokensSaved: successfulFiles.reduce((sum, f) => sum + (f.stats?.tokenSaving || 0), 0),
  };

  // Convert a single file via backend API
  const convertFile = useCallback(async (fileId: string, rawFile: File, activeSettings: ConversionSettings) => {
    // Phase 1: Uploading start
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "uploading", progress: 25 } : f))
    );

    // Phase 2: Processing / AI Converting start
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "converting", progress: 60 } : f))
    );

    // Mock progress tick during active API call to make UI feel very reactive and professional
    const progressInterval = setInterval(() => {
      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId && f.status === "converting" && f.progress < 92) {
            return { ...f, progress: f.progress + 4 };
          }
          return f;
        })
      );
    }, 700);

    try {
      const formData = new FormData();
      formData.append("file", rawFile);
      formData.append("stripHeadersFooters", String(activeSettings.stripHeadersFooters));
      formData.append("optimizeTokens", String(activeSettings.optimizeTokens));
      formData.append("formatTables", String(activeSettings.formatTables));
      formData.append("preserveImages", String(activeSettings.preserveImages));
      formData.append("customGuidelines", activeSettings.customGuidelines);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Server conversion error (${response.status})`);
      }

      const data = await response.json();

      setFiles((prev) =>
        prev.map((f) => {
          if (f.id === fileId) {
            return {
              ...f,
              status: "success",
              progress: 100,
              markdown: data.markdown,
              stats: data.stats,
            };
          }
          return f;
        })
      );

      // Automatically select the first successfully converted file if nothing is currently viewed
      setSelectedFileId((currentId) => currentId || fileId);

    } catch (error: any) {
      clearInterval(progressInterval);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, status: "error", progress: 0, error: error.message || "An unknown error occurred" }
            : f
        )
      );
    }
  }, []);

  // Handle files selected via Drag & Drop or Browse dialog
  const handleFilesSelected = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    
    // Build file states and initiate conversions
    fileArray.forEach((rawFile) => {
      const fileId = Math.random().toString(36).substring(2, 9);
      const newFile: ConvertedFile = {
        id: fileId,
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type || "application/octet-stream",
        status: "idle",
        progress: 0,
        markdown: "",
      };

      // Add to list and trigger conversion sequence immediately with currently active settings
      setFiles((prev) => [newFile, ...prev]);
      convertFile(fileId, rawFile, settings);
    });
  };

  // Re-trigger conversion for a failed file
  const handleRetryFile = (id: string) => {
    // Locate file in state
    const targetFile = files.find((f) => f.id === id);
    if (!targetFile) return;

    // Reset status and progress
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: "idle", progress: 0, error: undefined } : f))
    );

    // Retrieve original file object from input? Since we can't easily retrieve the file object
    // directly from disk without prompting again, we will suggest they re-upload or re-drop it,
    // OR wait, let's store the raw file object on a ref or simply have them re-upload if retry fails.
    // However, to make retry robust, we can cache the File objects in memory!
    // Let's implement a clean memory cache for File objects using a local state map or simple map.
    // Wait, let's keep a window level or local module cache map for raw File structures so retries work seamlessly.
    const cachedFile = (window as any).__file_cache__?.[id];
    if (cachedFile) {
      convertFile(id, cachedFile, settings);
    } else {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? { ...f, status: "error", error: "Source file is expired. Please re-upload the document." }
            : f
        )
      );
    }
  };

  // Cache File objects in memory whenever files are selected
  const cacheFiles = (selectedFiles: File[]) => {
    if (!(window as any).__file_cache__) {
      (window as any).__file_cache__ = {};
    }
    // We will correlate files by generating a temporary cache key
    return selectedFiles;
  };

  const onFilesSelectedWithCache = (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    cacheFiles(fileArray);
    
    fileArray.forEach((rawFile) => {
      const fileId = Math.random().toString(36).substring(2, 9);
      
      // Store in global window cache for retries
      (window as any).__file_cache__[fileId] = rawFile;

      const newFile: ConvertedFile = {
        id: fileId,
        name: rawFile.name,
        size: rawFile.size,
        type: rawFile.type || "application/octet-stream",
        status: "idle",
        progress: 0,
        markdown: "",
      };

      setFiles((prev) => [newFile, ...prev]);
      convertFile(fileId, rawFile, settings);
    });
  };

  // Trigger individual Markdown file download
  const handleDownloadFile = (file: ConvertedFile) => {
    if (!file.markdown) return;
    const blob = new Blob([file.markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    // Replace original extension with .md
    const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
    link.href = url;
    link.download = `${baseName}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Bundle all successfully converted Markdown files into a bulk ZIP archive
  const handleDownloadAllAsZip = async () => {
    if (successfulFiles.length === 0) return;
    setIsZipDownloading(true);

    try {
      const zip = new JSZip();
      
      successfulFiles.forEach((file) => {
        const baseName = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
        const mdName = `${baseName}.md`;
        zip.file(mdName, file.markdown);
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.download = "converted-documents-markdown.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("ZIP packaging failed:", error);
    } finally {
      setIsZipDownloading(false);
    }
  };

  // Remove a single file from listing
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(undefined);
    }
    // Clean up memory cache
    if ((window as any).__file_cache__?.[id]) {
      delete (window as any).__file_cache__[id];
    }
  };

  // Clear all file lists
  const handleClearAll = () => {
    setFiles([]);
    setSelectedFileId(undefined);
    (window as any).__file_cache__ = {};
  };

  // Find currently viewed file details
  const activeFile = files.find((f) => f.id === selectedFileId && f.status === "success");

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Visual Header */}
      <Header
        stats={stats}
        onDownloadAllAsZip={handleDownloadAllAsZip}
        isZipDownloading={isZipDownloading}
        hasConvertedFiles={successfulFiles.length > 0}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Upload and Controls) - Span 5 */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* File Upload zone */}
          <DropZone onFilesSelected={onFilesSelectedWithCache} />

          {/* Configuration panel */}
          <ConversionSettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            onClearAll={handleClearAll}
            hasFiles={files.length > 0}
          />

          {/* Upload Queue / Files List */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Conversion Queue</h3>
              {files.length > 0 && (
                <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Active List
                </span>
              )}
            </div>
            <FileList
              files={files}
              onSelectFile={(f) => setSelectedFileId(f.id)}
              selectedFileId={selectedFileId}
              onDownloadFile={handleDownloadFile}
              onRemoveFile={handleRemoveFile}
              onRetryFile={handleRetryFile}
            />
          </div>

          {/* Portable standalone export instructions info box */}
          <div className="bg-slate-800 rounded-xl p-6 text-white flex-grow flex flex-col justify-between shadow-md">
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Export Engine</h3>
              <p className="text-xs text-slate-400 mb-4">Manage your independent standalone server deployment.</p>
              
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                This converter is structured to be completely modular. Export this repository as a ZIP from the settings menu and run it anywhere:
              </p>
              
              <div className="bg-slate-900 text-indigo-300 p-4 rounded-lg font-mono text-[11px] mb-4 flex flex-col gap-1 select-all border border-slate-700">
                <span>npm install</span>
                <span>npm run build</span>
                <span>npm start</span>
              </div>
            </div>

            <div className="p-4 bg-indigo-900 bg-opacity-30 border border-indigo-700/50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                <span className="text-[10px] font-bold uppercase text-indigo-300">Pro Tip</span>
              </div>
              <p className="text-[11px] text-indigo-100 leading-relaxed">
                Using <strong>MarkitDown</strong> locally saves up to 85% on LLM token costs by removing unnecessary formatting bloat before ingestion.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (Markdown visualizer pane) - Span 7 */}
        <div className="lg:col-span-7 flex flex-col h-full">
          {activeFile ? (
            <PreviewPanel
              file={activeFile}
              onDownload={() => handleDownloadFile(activeFile)}
            />
          ) : (
            <div className="bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full min-h-[500px]">
              <div className="bg-indigo-50 text-indigo-600 p-4 rounded-full mb-4">
                <Cpu className="h-8 w-8 stroke-[1.5]" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">No Document Selected</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                Upload files on the left. Once converted, select "Preview" to load the interactive visualizer and copy optimized markdown contexts.
              </p>

              {files.length > 0 && successfulFiles.length === 0 && (
                <div className="mt-6 flex items-center gap-2.5 text-xs bg-amber-50 text-amber-800 border border-amber-100 p-3.5 rounded-xl max-w-xs animate-pulse">
                  <Sparkles className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>AI parsing in progress. Previews will unlock as soon as conversion completes.</span>
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* Footer Bar */}
      <footer className="bg-white border-t border-slate-200 px-8 py-4 flex flex-col sm:flex-row items-center justify-between shrink-0 gap-4 mt-8 select-none">
        <div className="flex items-center space-x-4">
          <div className="flex items-center text-slate-400 space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-500">Processor Idle</span>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="text-xs text-slate-500">
            Estimated Ingestion Saving: <span className="font-bold text-indigo-600">{stats.totalTokensSaved > 0 ? `${Math.round((stats.totalTokensSaved / stats.totalOriginalTokens) * 100)}% decrease` : "0%"}</span>
          </div>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleClearAll}
            disabled={files.length === 0}
            className="px-5 py-2 border border-slate-200 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-500 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Clear List
          </button>
          {successfulFiles.length > 0 && (
            <button 
              onClick={handleDownloadAllAsZip}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all cursor-pointer"
            >
              Convert All & Export ZIP
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
