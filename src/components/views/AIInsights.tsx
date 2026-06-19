import React from "react";
import { AIAnalysis } from "@/types";
import { Sparkles, TrendingUp, Lightbulb, CheckCircle, Zap } from "lucide-react";

interface AIInsightsProps {
  aiAnalysis: AIAnalysis | null;
  generateAIRecommendations: () => Promise<void>;
  copyToClipboard: (text: string, idx: number) => void;
  copiedHookIdx: number | null;
}

export function AIInsights({
  aiAnalysis,
  generateAIRecommendations,
  copyToClipboard,
  copiedHookIdx,
}: AIInsightsProps) {
  return (
    <div className="space-y-6">
      {aiAnalysis ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Winning Hooks Card */}
            <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 shadow-xl backdrop-blur-md">
              <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Sparkles className="h-4.5 w-4.5 text-zinc-300" strokeWidth={1.2} />
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">Winning Hook Patterns</h3>
                  </div>
                  <ul className="space-y-4 font-sans">
                    {aiAnalysis.winningHooks.map((hookInsight, idx) => (
                      <li key={idx} className="flex gap-3 text-xs leading-relaxed text-zinc-300">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-300 border border-white/10 font-mono">
                          {idx + 1}
                        </span>
                        <span>{hookInsight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Winning Topics Card */}
            <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 shadow-xl backdrop-blur-md">
              <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp className="h-4.5 w-4.5 text-zinc-300" strokeWidth={1.2} />
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">Winning Topics</h3>
                  </div>
                  <ul className="space-y-4 font-sans">
                    {aiAnalysis.winningTopics.map((topicInsight, idx) => (
                      <li key={idx} className="flex gap-3 text-xs leading-relaxed text-zinc-300">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-300 border border-white/10 font-mono">
                          {idx + 1}
                        </span>
                        <span>{topicInsight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Actionable Recommendations Card */}
            <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 shadow-xl backdrop-blur-md">
              <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Lightbulb className="h-4.5 w-4.5 text-zinc-300" strokeWidth={1.2} />
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">Strategic Copywriting Advice</h3>
                  </div>
                  <ul className="space-y-4 font-sans">
                    {aiAnalysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3 text-xs leading-relaxed text-zinc-300">
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-white/5 text-[10px] font-bold text-zinc-300 border border-white/10 font-mono">
                          {idx + 1}
                        </span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Suggested copy-pasteable Hooks */}
          {aiAnalysis.suggestedHooks && aiAnalysis.suggestedHooks.length > 0 && (
            <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
              <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/5 pb-4 mb-6 gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-zinc-300" strokeWidth={1.2} />
                    <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">Suggested Hooks to Write Next</h3>
                  </div>
                  <span className="rounded-full bg-white/5 px-3 py-0.5 text-[9px] font-bold text-zinc-400 border border-white/10 uppercase tracking-widest self-start sm:self-auto font-display">
                    ⭐ Copy-Pasteable Templates
                  </span>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {aiAnalysis.suggestedHooks.map((sh, idx) => (
                    <div key={idx} className="flex flex-col justify-between rounded-2xl border border-white/5 bg-zinc-950/60 p-5 shadow-lg hover:border-white/10 transition-all duration-550 hover:scale-[1.01]">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1.5">
                            <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[8px] font-bold text-zinc-400 uppercase tracking-wider font-display">
                              {sh.hookType}
                            </span>
                            <span className="rounded bg-white/[0.03] border border-white/5 px-2 py-0.5 text-[8px] font-bold text-zinc-500 uppercase tracking-wider font-display">
                              {sh.topic}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(sh.hookTemplate, idx)}
                            className={`flex h-7 px-3.5 items-center justify-center gap-1 rounded-full text-[10px] font-bold transition-all duration-500 cursor-pointer font-sans ${
                              copiedHookIdx === idx
                                ? "bg-white/10 border border-white/20 text-white"
                                : "border border-white/10 bg-zinc-900 hover:text-white hover:bg-white/5 text-zinc-400"
                            }`}
                          >
                            {copiedHookIdx === idx ? (
                              <>
                                <CheckCircle className="h-3 w-3 text-white" strokeWidth={1.2} />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Zap className="h-3 w-3 text-zinc-400" strokeWidth={1.2} />
                                <span>Copy Hook</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="rounded-xl border border-white/[0.02] bg-[#030303]/60 p-4 font-mono text-[10.5px] text-zinc-300 whitespace-pre-wrap leading-relaxed select-all">
                          {sh.hookTemplate}
                        </div>
                      </div>
                      <div className="mt-4 border-t border-white/5 pt-3 text-[10px] text-zinc-500 italic">
                        {sh.explanation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] text-center">
            <Sparkles className="mx-auto h-8 w-8 text-zinc-300 mb-3" strokeWidth={1.2} />
            <h3 className="font-display text-sm font-bold text-white mb-1 uppercase tracking-wider">AI Recommendation Insights Not Generated</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-6">
              Complete the analysis pipeline for your posts to generate custom copywriting ideas and pattern checks.
            </p>
            <button
              onClick={generateAIRecommendations}
              className="inline-flex h-10 items-center justify-center rounded-full bg-white px-6 text-xs font-bold text-black shadow-lg transition-all hover:bg-zinc-100 cursor-pointer active:scale-98"
            >
              Run recommendations generator
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
