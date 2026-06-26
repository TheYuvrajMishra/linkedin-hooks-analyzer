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

          {/* Drag & Drop Manual File Upload */}
          <div className="space-y-6">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="rounded-2xl border-2 border-dashed border-white/5 bg-[#0e0e11]/25 p-8 hover:border-white/10 transition-all cursor-pointer relative group">
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
                    className="h-10 w-10 text-zinc-500 group-hover:text-zinc-300 transition-colors mb-3"
                    strokeWidth={1.2}
                  />
                  <span className="text-sm font-semibold text-zinc-300 font-display">
                    {selectedFile ? selectedFile.name : "Select or drag your LinkedIn Excel report (.xlsx)"}
                  </span>
                  <span className="text-[10px] text-zinc-600 mt-1 font-mono">Maximum size: 50MB</span>
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

            {/* Collapsible Guide */}
            <details className="group text-left border border-white/5 bg-zinc-950/30 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-4 text-xs font-bold text-zinc-300 cursor-pointer hover:bg-white/5 select-none transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-400" strokeWidth={1.2} />
                  <span>How to get your LinkedIn report file?</span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-500 transition-transform duration-300 group-open:rotate-90" strokeWidth={1.2} />
              </summary>
              <div className="p-4 pt-0 border-t border-white/5 bg-zinc-950/20 text-xs text-zinc-400 space-y-3">
                <p>To export your analytics report directly from LinkedIn:</p>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>
                    Go to your <strong>LinkedIn Creator Analytics</strong> dashboard (or visit <a href="https://www.linkedin.com/analytics/creator/" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-zinc-200">linkedin.com/analytics/creator/</a>).
                  </li>
                  <li>
                    Select the <strong>Past 365 Days</strong> (or your custom range) from the date filter at the top.
                  </li>
                  <li>
                    Click the <strong>Export</strong> button in the top right corner.
                  </li>
                  <li>
                    Save the downloaded Excel file (usually named <code>AggregateAnalytics_...xlsx</code>) and upload it here.
                  </li>
                </ol>
                <p className="text-[10px] text-zinc-500 italic">
                  Note: The exported sheet must contain the default worksheets: ENGAGEMENT, FOLLOWERS, DEMOGRAPHICS, and TOP POSTS.
                </p>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
