import React from "react";
import { FileText, Cpu, Download, Sparkles, ExternalLink } from "lucide-react";
import { StatsOverview } from "../types";

interface HeaderProps {
  stats: StatsOverview;
  onDownloadAllAsZip: () => void;
  isZipDownloading: boolean;
  hasConvertedFiles: boolean;
}

export default function Header({
  stats,
  onDownloadAllAsZip,
  isZipDownloading,
  hasConvertedFiles,
}: HeaderProps) {
  // Format token counts nicely (e.g. 1.2k, 15k, etc)
  const formatTokens = (count: number) => {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1) + "M";
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + "k";
    }
    return count.toString();
  };

  // Heuristic: $15.00 per million tokens (generic average LLM input costs across Gemini/Claude/OpenAI)
  const calculateSavingsInDollars = (savedTokens: number) => {
    const costPerToken = 15.00 / 1000000;
    return (savedTokens * costPerToken).toFixed(2);
  };

  return (
    <header id="app-header" className="bg-white border-b border-slate-200 py-5 px-8 select-none">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Title and Badge */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-100">
            <span className="text-white font-display font-bold text-sm tracking-tight">MD</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl font-bold text-slate-800 tracking-tight">
                MarkitDown <span className="text-indigo-600">Web</span>
              </h1>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1 uppercase tracking-wide">
                <Cpu className="h-3 w-3" /> LLM-Optimized
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Powered by Microsoft MarkitDown engine guidelines. Turn documents into clean Markdown to save API tokens.
            </p>
          </div>
        </div>

        {/* Global Action / Repository info */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="bg-indigo-50/60 border border-indigo-100 text-indigo-900 rounded-xl px-4 py-2 text-xs max-w-sm hidden lg:block">
            <span className="font-bold text-indigo-800 block">💡 Deploy Anywhere</span>
            Download this repository as a ZIP from Settings. Runs on any server with <code className="bg-white px-1 py-0.5 rounded font-mono border border-indigo-200">npm start</code>.
          </div>

          {hasConvertedFiles && (
            <button
              id="download-all-zip-btn"
              onClick={onDownloadAllAsZip}
              disabled={isZipDownloading}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-100 cursor-pointer"
            >
              <Download className={`h-4 w-4 ${isZipDownloading ? "animate-bounce" : ""}`} />
              {isZipDownloading ? "Packing ZIP..." : "Download Bulk ZIP"}
            </button>
          )}
        </div>
      </div>

      {/* Stats Dashboard Widget */}
      <div className="max-w-7xl mx-auto mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Files converted */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Converted Queue</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl font-bold text-slate-800">
              {stats.successfulConversions}
            </span>
            <span className="text-xs text-slate-400">
              of {stats.totalFiles} uploaded
            </span>
          </div>
        </div>

        {/* Total Original Tokens */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Original Ingest Size</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl font-bold text-slate-700">
              {formatTokens(stats.totalOriginalTokens)}
            </span>
            <span className="text-xs text-slate-400">est. input tokens</span>
          </div>
        </div>

        {/* Total Tokens Saved */}
        <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tokens Compressed</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-2xl font-bold text-indigo-600">
              {formatTokens(stats.totalTokensSaved)}
            </span>
            {stats.totalOriginalTokens > 0 && (
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                -{Math.round((stats.totalTokensSaved / stats.totalOriginalTokens) * 100)}%
              </span>
            )}
          </div>
        </div>

        {/* Estimated API Cost Savings */}
        <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-indigo-600" /> Estimated Cost Savings
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xs font-bold text-indigo-600">$</span>
            <span className="font-display text-2xl font-bold text-indigo-700">
              {calculateSavingsInDollars(stats.totalTokensSaved)}
            </span>
            <span className="text-[10px] text-indigo-500 ml-1">saved (Avg $15/M)</span>
          </div>
        </div>
      </div>
    </header>
  );
}
