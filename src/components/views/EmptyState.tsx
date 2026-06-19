import React from "react";
import { DBStatus } from "@/types";
import { Upload, FileText, ChevronRight, RefreshCw } from "lucide-react";

interface EmptyStateProps {
  dbStatus: DBStatus | null;
  actionLoading: boolean;
  uploadProgress: string | null;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  handleAutoLoad: () => Promise<void>;
  handleFileUpload: (e: React.FormEvent) => Promise<void>;
}

export function EmptyState({
  dbStatus,
  actionLoading,
  uploadProgress,
  selectedFile,
  setSelectedFile,
  handleAutoLoad,
  handleFileUpload,
}: EmptyStateProps) {
  if (dbStatus && dbStatus.stats.totalPosts > 0) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01] hover:border-white/10 shadow-2xl">
        <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 mb-6 shadow-inner">
            <Upload className="h-6 w-6 text-zinc-300" strokeWidth={1.2} />
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-2 tracking-wide">
            Analyze Your LinkedIn Performance
          </h2>
          <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
            Upload your LinkedIn analytics Excel spreadsheet report to profile your hooks, topics, and metrics.
          </p>

          {/* Action Progress Info */}
          {uploadProgress && (
            <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-3.5 text-xs text-zinc-300 flex items-center justify-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.2} />
              <span>{uploadProgress}</span>
            </div>
          )}

          {/* Upload Card Options */}
          <div className="grid gap-6">
            {/* Option 1: Workspace Auto-Load (Preferred for direct spreadsheet) */}
            <div className="rounded-2xl border border-white/5 bg-[#0e0e11]/50 p-6 text-left hover:border-white/10 transition-all duration-550">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                  <span className="inline-block rounded-full bg-white/5 border border-white/10 px-3 py-0.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                    Fast Track
                  </span>
                  <h3 className="text-sm font-bold text-white font-display">
                    Load Root Workspace Report
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Use the pre-positioned file:{" "}
                    <code className="text-zinc-300 bg-zinc-950 px-1.5 py-0.5 rounded">
                      AggregateAnalytics_Yuvraj Mishra...xlsx
                    </code>
                    .
                  </p>
                </div>
                <button
                  onClick={handleAutoLoad}
                  disabled={actionLoading}
                  className="group flex items-center justify-between gap-4 rounded-full bg-white pl-6 pr-2 py-2 text-xs font-bold text-black shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                >
                  <span>Load Account Report</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                    <ChevronRight className="h-4 w-4 text-black" strokeWidth={1.2} />
                  </div>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                or
              </span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* Option 2: Drag & Drop Manual File Upload */}
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="rounded-2xl border-2 border-dashed border-white/5 bg-[#0e0e11]/25 p-6 hover:border-white/10 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".xlsx, .csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSelectedFile(file);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="flex flex-col items-center">
                  <FileText
                    className="h-8 w-8 text-zinc-500 group-hover:text-zinc-300 transition-colors mb-2"
                    strokeWidth={1.2}
                  />
                  <span className="text-xs font-semibold text-zinc-300 font-display">
                    {selectedFile ? selectedFile.name : "Select LinkedIn Excel report (.xlsx)"}
                  </span>
                  <span className="text-[9px] text-zinc-600 mt-1 font-mono">Maximum size: 50MB</span>
                </div>
              </div>

              {selectedFile && (
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full flex h-11 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-lg transition-all hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
                >
                  Upload & Parse Selected File
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
