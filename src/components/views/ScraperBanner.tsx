import React from "react";
import { DBStatus } from "@/types";
import { Sparkles, Shield, Zap, Terminal } from "lucide-react";

interface ScraperBannerProps {
  dbStatus: DBStatus | null;
  analyzing: boolean;
  actionLoading: boolean;
  analysisProgress: number;
  analysisLogs: string[];
  runAnalysisPipeline: () => Promise<void>;
}

export function ScraperBanner({
  dbStatus,
  analyzing,
  actionLoading,
  analysisProgress,
  analysisLogs,
  runAnalysisPipeline,
}: ScraperBannerProps) {
  if (!dbStatus) return null;
  if (dbStatus.stats.analyzedPosts >= dbStatus.stats.totalPosts) return null;

  return (
    <div className="animate-on-scroll relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.03] p-2 shadow-xl backdrop-blur-md">
      <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-zinc-300" strokeWidth={1.2} />
              <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                AI Hook Processing Pending
              </h2>
            </div>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              You loaded <span className="text-zinc-200 font-semibold">{dbStatus.stats.totalPosts} posts</span>.
              The system needs to retrieve the post text and run classification models for Hook Type and Topics.
            </p>

            {/* Scraper Status Info */}
            <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500">
              <Shield className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.2} />
              <span>Headless Puppeteer Scraper active (visits live URLs to extract actual post content).</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={runAnalysisPipeline}
              disabled={analyzing || actionLoading}
              className="group relative flex items-center justify-between gap-6 rounded-full bg-white pl-6 pr-2 py-2 text-xs font-bold text-black shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <span className="tracking-wide">
                {analyzing ? "Analyzing Dataset..." : "Run AI Analysis Pipeline"}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                <Zap className="h-4 w-4 text-black" strokeWidth={1.2} />
              </div>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        {analyzing && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-400">Processing Progress</span>
              <span className="text-zinc-300 font-mono">{analysisProgress}% Complete</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-950 overflow-hidden">
              <div
                className="h-full bg-white/70 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Terminal logs list */}
        {analysisLogs.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/5 bg-zinc-950/90 p-4 font-mono text-[10px] text-zinc-400 shadow-inner max-h-36 overflow-y-auto space-y-1">
            <div className="flex items-center gap-1.5 text-zinc-500 border-b border-white/5 pb-1.5 mb-1.5">
              <Terminal className="h-3.5 w-3.5" strokeWidth={1.2} />
              <span>Analysis Engine Console logs</span>
            </div>
            {analysisLogs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.startsWith("⚠️")
                    ? "text-zinc-300"
                    : log.startsWith("❌")
                    ? "text-zinc-400"
                    : log.startsWith("⭐")
                    ? "text-white"
                    : ""
                }
              >
                {log}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
