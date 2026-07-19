import React from "react";
import { Settings, Sparkles, Trash2, HelpCircle, FileJson, GraduationCap, ClipboardList } from "lucide-react";
import { ConversionSettings } from "../types";

interface ConversionSettingsProps {
  settings: ConversionSettings;
  onSettingsChange: (settings: ConversionSettings) => void;
  onClearAll: () => void;
  hasFiles: boolean;
}

const PRESETS = [
  {
    name: "Standard Optimization",
    icon: Sparkles,
    description: "Balanced, high-density output suitable for general GPT/Gemini ingestion.",
    guidelines: "",
  },
  {
    name: "Strict Data Extraction",
    icon: FileJson,
    description: "Formats visual structures into clean GFM tables and strips descriptive fluff.",
    guidelines: "Prioritize table GFM formats. For any statistical text, construct clear lists or data tables. Ignore narrative introductions and summaries.",
  },
  {
    name: "Academic & Research",
    icon: GraduationCap,
    description: "Preserves complex citations, sections, equations, and structures.",
    guidelines: "Preserve block quotations, bibliographies, and footnoted numbers. Standardize scientific notations and wrap equations in markdown math syntax if present.",
  },
  {
    name: "Dense Summarization",
    icon: ClipboardList,
    description: "Compresses repetitive guidelines and outputs bulleted, punchy markdown.",
    guidelines: "Synthesize lengthy descriptive sections into clear summaries. Convert paragraph sequences into bullet lists where lists provide better semantic clarity for prompting.",
  },
];

export default function ConversionSettingsPanel({
  settings,
  onSettingsChange,
  onClearAll,
  hasFiles,
}: ConversionSettingsProps) {
  const handleToggle = (key: keyof Omit<ConversionSettings, "customGuidelines">) => {
    onSettingsChange({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleGuidelinesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onSettingsChange({
      ...settings,
      customGuidelines: e.target.value,
    });
  };

  const applyPreset = (guidelines: string) => {
    onSettingsChange({
      ...settings,
      customGuidelines: guidelines,
    });
  };

  return (
    <div id="conversion-settings" className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col gap-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <h2 className="font-display font-bold text-base text-slate-800 flex items-center gap-2">
          <Settings className="h-4.5 w-4.5 text-indigo-600" /> LLM Optimization
        </h2>
        {hasFiles && (
          <button
            id="clear-all-btn"
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear Queue
          </button>
        )}
      </div>

      {/* Feature Toggles */}
      <div className="flex flex-col gap-4">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tuning & Cleanup</h3>

        {/* Strip Headers and Footers */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={settings.stripHeadersFooters}
            onChange={() => handleToggle("stripHeadersFooters")}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition">
              Strip Headers & Footers
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Removes repeating page numbers, running headers, and footers.
            </span>
          </div>
        </label>

        {/* Optimize Token Spacing */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={settings.optimizeTokens}
            onChange={() => handleToggle("optimizeTokens")}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition">
              Optimize Token Spacing
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Condenses multiple blank lines and trims fluff to minimize LLM usage.
            </span>
          </div>
        </label>

        {/* GFM Tables */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={settings.formatTables}
            onChange={() => handleToggle("formatTables")}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition">
              Format GFM Tables
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Converts charts, sheets, and visual grids into GFM pipe tables.
            </span>
          </div>
        </label>

        {/* Transcribe Figures */}
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={settings.preserveImages}
            onChange={() => handleToggle("preserveImages")}
            className="mt-0.5 h-4 w-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer"
          />
          <div>
            <span className="text-sm font-semibold text-slate-700 group-hover:text-indigo-600 transition">
              Describe Figures & Images
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Transcribes flowchart maps, diagrams, and graphic images in text.
            </span>
          </div>
        </label>
      </div>

      {/* Preset Rules */}
      <div className="border-t border-slate-100 pt-5 flex flex-col gap-3">
        <div className="flex items-center gap-1.5">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Format Presets</h3>
          <span className="text-[10px] text-indigo-600 font-medium bg-indigo-50 border border-indigo-150 px-2 rounded-full flex items-center gap-0.5 select-none">
            <HelpCircle className="h-2.5 w-2.5" /> Sets guidelines
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = settings.customGuidelines === preset.guidelines;
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => applyPreset(preset.guidelines)}
                className={`p-3 rounded-xl border text-left transition duration-200 flex items-start gap-2.5 cursor-pointer ${
                  isSelected
                    ? "bg-indigo-50 border-indigo-200 text-indigo-950"
                    : "bg-slate-50/50 hover:bg-slate-100/50 border-slate-200 text-slate-800"
                }`}
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-indigo-100 text-indigo-700" : "bg-white border border-slate-200 text-slate-400"}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-bold block">{preset.name}</span>
                  <span className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {preset.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Guidelines */}
      <div className="border-t border-slate-100 pt-5 flex flex-col gap-2">
        <label htmlFor="custom-guidelines-input" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Custom Formatting Instructions
        </label>
        <textarea
          id="custom-guidelines-input"
          value={settings.customGuidelines}
          onChange={handleGuidelinesChange}
          placeholder="E.g., Format code samples in python, translate document headers to Japanese, remove footnotes entirely, etc."
          rows={3}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-550/20 focus:border-indigo-500 focus:bg-white transition placeholder:text-slate-400 font-sans"
        />
      </div>
    </div>
  );
}
