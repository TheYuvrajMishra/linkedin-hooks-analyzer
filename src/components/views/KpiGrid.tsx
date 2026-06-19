import React from "react";
import { DBStatus } from "@/types";
import { FileText, Activity, Users, TrendingUp, Sparkles, BookOpen } from "lucide-react";

interface KpiGridProps {
  dbStatus: DBStatus | null;
  totalImpressions: number;
  totalEngagements: number;
  avgER: string;
  bestPerformingHook: string;
  bestPerformingTopic: string;
}

export function KpiGrid({
  dbStatus,
  totalImpressions,
  totalEngagements,
  avgER,
  bestPerformingHook,
  bestPerformingTopic,
}: KpiGridProps) {
  if (!dbStatus) return null;

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
      {/* Card 1: Total Posts - Span 3 */}
      <div className="animate-on-scroll lg:col-span-3 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
        <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">
              Total Posts
            </span>
            <FileText className="h-4 w-4 text-zinc-500" strokeWidth={1.2} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white font-mono">
              {dbStatus.stats.totalPosts}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500">
            {dbStatus.stats.analyzedPosts} analyzed (
            {Math.round((dbStatus.stats.analyzedPosts / dbStatus.stats.totalPosts) * 100)}%)
          </div>
        </div>
      </div>

      {/* Card 2: Total Impressions - Span 5 */}
      <div className="animate-on-scroll lg:col-span-5 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
        <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">
              Total Impressions
            </span>
            <Activity className="h-4 w-4 text-zinc-500" strokeWidth={1.2} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3.5xl font-display font-bold text-white font-mono">
              {totalImpressions.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium">
            Annual accumulated reach across all campaigns
          </div>
        </div>
      </div>

      {/* Card 3: Engagements - Span 4 */}
      <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
        <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">
              Engagements
            </span>
            <Users className="h-4 w-4 text-zinc-500" strokeWidth={1.2} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white font-mono">
              {totalEngagements.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium">
            Likes, comments, shares, and clicks
          </div>
        </div>
      </div>

      {/* Card 4: Avg. ER% - Span 4 */}
      <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/10 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/15">
        <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">
              Avg. ER%
            </span>
            <TrendingUp className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-display font-bold text-white font-mono">{avgER}%</span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium">
            Benchmark industry rate: 2.0%
          </div>
        </div>
      </div>

      {/* Card 5: Best Hook Style - Span 4 */}
      <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
        <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">
              Best Hook Style
            </span>
            <Sparkles className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-lg font-display font-bold text-white truncate max-w-full">
              {bestPerformingHook}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium">
            Highest average Engagement Rate
          </div>
        </div>
      </div>

      {/* Card 6: Top Content Topic - Span 4 */}
      <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
        <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">
              Top Content Topic
            </span>
            <BookOpen className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-lg font-display font-bold text-white truncate max-w-full">
              {bestPerformingTopic}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-zinc-500 font-medium">
            Audience content interest peak
          </div>
        </div>
      </div>
    </div>
  );
}
