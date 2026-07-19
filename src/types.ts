export interface ConversionSettings {
  stripHeadersFooters: boolean;
  optimizeTokens: boolean;
  formatTables: boolean;
  preserveImages: boolean;
  customGuidelines: string;
}

export type FileStatus = 'idle' | 'uploading' | 'converting' | 'success' | 'error';

export interface ConvertedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  progress: number;
  markdown: string;
  error?: string;
  stats?: {
    originalTokens: number;
    convertedTokens: number;
    tokenSaving: number;
    tokenSavingPercent: number;
  };
}

export interface StatsOverview {
  totalFiles: number;
  successfulConversions: number;
  totalOriginalTokens: number;
  totalConvertedTokens: number;
  totalTokensSaved: number;
}
