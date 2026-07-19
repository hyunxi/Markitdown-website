import React, { useState } from "react";
import Markdown from "react-markdown";
import { 
  Eye, 
  Code, 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  FileText,
  Bookmark,
  ChevronRight
} from "lucide-react";
import { ConvertedFile } from "../types";

interface PreviewPanelProps {
  file: ConvertedFile;
  onDownload: () => void;
}

type TabType = "preview" | "raw" | "llm";

export default function PreviewPanel({ file, onDownload }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [copied, setCopied] = useState(false);

  // XML container optimized for LLM prompting ingestion
  const getLLMOptimizedContent = () => {
    return `<document name="${file.name}">
<metadata>
  <original_size_bytes>${file.size}</original_size_bytes>
  <format>${file.type}</format>
</metadata>
<content>
${file.markdown}
</content>
</document>`;
  };

  const handleCopy = async () => {
    try {
      const textToCopy = activeTab === "llm" ? getLLMOptimizedContent() : file.markdown;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div id="file-preview-panel" className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col h-full min-h-[600px]">
      
      {/* Panel Header */}
      <div className="border-b border-slate-150 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 select-none bg-slate-50/50 rounded-t-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <FileText className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-slate-800 truncate">
              {file.name}
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5 font-semibold">
              <span>{formatSize(file.size)}</span>
              <span>•</span>
              <span className="font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                {file.stats?.convertedTokens} tokens
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switches */}
        <div className="flex bg-slate-100 rounded-lg p-0.5 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === "preview"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Render
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("raw")}
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === "raw"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Code className="h-3.5 w-3.5" /> Markdown
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("llm")}
            className={`flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-md transition cursor-pointer ${
              activeTab === "llm"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" /> LLM Package
          </button>
        </div>
      </div>

      {/* Primary Toolbar */}
      <div className="border-b border-slate-100 px-4 py-2 flex items-center justify-between bg-white text-[11px] text-slate-500 select-none">
        <div className="flex items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5 text-indigo-500" />
          {activeTab === "preview" && <span>Interactive formatted HTML view</span>}
          {activeTab === "raw" && <span>Raw Github Flavored Markdown (GFM)</span>}
          {activeTab === "llm" && <span>High-token density XML container for prompting context</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer text-[10px] uppercase tracking-wider"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 animate-scale-up" />
                <span className="text-emerald-700">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-lg transition cursor-pointer text-[10px] uppercase tracking-wider"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Active Tab Viewport Area */}
      <div className="flex-grow overflow-auto p-5 max-h-[550px] relative bg-slate-50/20">
        
        {/* Render Tab */}
        {activeTab === "preview" && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 min-h-[400px] shadow-sm max-w-full overflow-x-auto">
            <div className="markdown-body">
              <Markdown>{file.markdown}</Markdown>
            </div>
          </div>
        )}

        {/* Raw Markdown Tab */}
        {activeTab === "raw" && (
          <div className="h-full">
            <textarea
              readOnly
              value={file.markdown}
              className="w-full h-[400px] bg-slate-900 text-slate-100 font-mono text-xs rounded-xl p-5 border border-slate-850 focus:outline-none resize-none shadow-inner leading-relaxed"
            />
          </div>
        )}

        {/* LLM Container Tab */}
        {activeTab === "llm" && (
          <div className="flex flex-col gap-4 h-full">
            <div className="bg-indigo-50/60 border border-indigo-100 text-indigo-900 text-[11px] rounded-lg p-3 flex items-start gap-2 select-none leading-relaxed">
              <ChevronRight className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
              <div>
                <span className="font-bold">Prompting Pro-Tip:</span> Wrapping document context in descriptive XML enclosures makes it easier for LLMs (like Gemini, Claude, and GPT-4) to differentiate between your instructions and the source document text.
              </div>
            </div>
            <textarea
              readOnly
              value={getLLMOptimizedContent()}
              className="w-full h-[335px] bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl p-5 border border-slate-850 focus:outline-none resize-none shadow-inner leading-relaxed"
            />
          </div>
        )}

      </div>
    </div>
  );
}
