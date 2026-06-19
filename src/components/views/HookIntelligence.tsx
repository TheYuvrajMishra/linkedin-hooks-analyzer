import React, { Fragment } from "react";
import { Post } from "@/types";
import { ChevronRight, ExternalLink, Zap } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface HookIntelligenceProps {
  posts: Post[];
  isMounted: boolean;
  getHookLengthChartData: () => any[];
  getSentenceStructureChartData: () => any[];
  getTopOpeningWords: () => any[];
  expandedStructure: string | null;
  setExpandedStructure: React.Dispatch<React.SetStateAction<string | null>>;
  setModalPost: (post: Post | null) => void;
  explorerDimension: "hookType" | "sentenceStructure" | "hookLength";
  setExplorerDimension: React.Dispatch<React.SetStateAction<"hookType" | "sentenceStructure" | "hookLength">>;
  explorerValue: string;
  setExplorerValue: React.Dispatch<React.SetStateAction<string>>;
  chartColors: string[];
}

export function HookIntelligence({
  posts,
  isMounted,
  getHookLengthChartData,
  getSentenceStructureChartData,
  getTopOpeningWords,
  expandedStructure,
  setExpandedStructure,
  setModalPost,
  explorerDimension,
  setExplorerDimension,
  explorerValue,
  setExplorerValue,
  chartColors,
}: HookIntelligenceProps) {
  return (
    <div className="space-y-6">
      {/* Overview cards of hook insights */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Hook Length analysis */}
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <div className="mb-4">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">ER% by Hook Length</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Comparing character counts (Short, Medium, Long)</p>
            </div>
            <div className="h-56 w-full">
              {isMounted && posts.some((p) => p.analyzed && p.hookLength !== null) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getHookLengthChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={8} tickLine={false} />
                    <YAxis stroke="#6b7280" fontSize={9} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill={chartColors[0]} radius={[3, 3, 0, 0]}>
                      {getHookLengthChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                  Run analysis pipeline to populate hook length analytics.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sentence Structures analysis */}
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <div className="mb-4">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">ER% by Structure</h3>
              <p className="text-[10px] text-zinc-500 mt-1">Comparison of opening copy sentence styles</p>
            </div>
            <div className="h-56 w-full">
              {isMounted && posts.some((p) => p.analyzed && p.sentenceStructure) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getSentenceStructureChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={8} tickLine={false} tickFormatter={(val) => val.split(" ")[0]} />
                    <YAxis stroke="#6b7280" fontSize={9} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill={chartColors[0]} radius={[3, 3, 0, 0]}>
                      {getSentenceStructureChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                  Run analysis pipeline to profile sentence structure metrics.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Opening Words list */}
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <div className="mb-4">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">Top Opening Words</h3>
              <p className="text-[10px] text-zinc-500 mt-1">First words of hooks sorted by frequency & impact</p>
            </div>
            <div className="space-y-3.5 font-sans">
              {posts.some((p) => p.analyzed && p.hook) ? (
                getTopOpeningWords().map((wordData, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-zinc-500 font-mono">#{idx + 1}</span>
                      <span className="text-xs font-bold text-white font-mono">"{wordData.word}"</span>
                      <span className="text-[9px] text-zinc-600 font-mono">({wordData.count} posts)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-400 font-mono">{wordData.avgImpressions.toLocaleString()} imp</span>
                      <span className="text-xs font-bold text-zinc-200 font-mono">{wordData.avgEngagementRate}% ER</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-36 items-center justify-center text-xs text-zinc-500 italic">
                  Analyze posts to extract opening word distributions.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Hook Intelligence detailed view */}
      <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
        <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
          <h3 className="font-display text-sm font-bold text-white mb-6 uppercase tracking-wider">Deep Sentence Structure Engagement Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#0e0e11]/80 text-zinc-400 font-bold border-b border-white/5 font-display uppercase tracking-wider">
                <tr>
                  <th className="p-3">Structure Model</th>
                  <th className="p-3">Count</th>
                  <th className="p-3 text-right">Avg Impressions</th>
                  <th className="p-3 text-right">Avg Engagement Rate</th>
                  <th className="p-3">Opening Examples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 bg-transparent font-sans">
                {posts.some((p) => p.analyzed && p.sentenceStructure) ? (
                  getSentenceStructureChartData().map((struct, idx) => {
                    const examples = posts
                      .filter((p) => p.analyzed && p.sentenceStructure === struct.name && p.hook)
                      .slice(0, 2)
                      .map((p) => p.hook!.trim().split("\n")[0])
                      .join(" // ");
                    
                    const isExpanded = expandedStructure === struct.name;
                    return (
                      <Fragment key={idx}>
                        <tr
                          onClick={() => setExpandedStructure(isExpanded ? null : struct.name)}
                          className="hover:bg-white/5 transition-colors cursor-pointer select-none border-b border-white/5"
                        >
                          <td className="p-3 font-semibold text-zinc-200">
                            <div className="flex items-center gap-2">
                              <ChevronRight className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-90 text-white" : ""}`} strokeWidth={1.2} />
                              <span>{struct.name}</span>
                            </div>
                          </td>
                          <td className="p-3 text-zinc-500 font-mono">{struct.count} posts</td>
                          <td className="p-3 text-right text-zinc-300 font-mono">{struct.avgImpressions.toLocaleString()}</td>
                          <td className="p-3 text-right text-zinc-200 font-bold font-mono">{struct.avgEngagementRate.toFixed(2)}%</td>
                          <td className="p-3 text-zinc-500 italic max-w-sm truncate">"{examples}"</td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-zinc-950/20">
                            <td colSpan={5} className="p-4 border-b border-white/5">
                              <div className="space-y-3">
                                <div className="text-[10px] font-bold text-zinc-500 flex items-center justify-between uppercase tracking-wider font-display">
                                  <span>All posts matching "{struct.name}" (sorted by Engagement Rate):</span>
                                </div>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 font-sans">
                                  {posts
                                    .filter((p) => p.analyzed && p.sentenceStructure === struct.name)
                                    .sort((a, b) => b.engagementRate - a.engagementRate)
                                    .map((p, pIdx) => (
                                      <div
                                        key={p.id || pIdx}
                                        onClick={() => setModalPost(p)}
                                        className="rounded-xl border border-white/5 bg-[#09090b] p-4 shadow-md hover:border-white/10 transition-all duration-300 hover:scale-[1.01] cursor-pointer"
                                      >
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                          <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 border border-white/10 font-mono">
                                            #{pIdx + 1}
                                          </span>
                                          <span className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400">
                                            View Details <ExternalLink className="h-3 w-3" strokeWidth={1.2} />
                                          </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-300 line-clamp-3 mb-3 italic leading-relaxed">
                                          "{p.hook || p.postText || "(No hook text)"}"
                                        </p>
                                        <div className="grid grid-cols-3 gap-2 border-t border-white/5 pt-2 text-[9px] text-zinc-500 text-center">
                                          <div>
                                            <span className="block text-zinc-500">Impressions</span>
                                            <span className="text-zinc-300 font-bold font-mono">{p.impressions.toLocaleString()}</span>
                                          </div>
                                          <div>
                                            <span className="block text-zinc-500">Engagements</span>
                                            <span className="text-zinc-300 font-bold font-mono">{p.engagements.toLocaleString()}</span>
                                          </div>
                                          <div>
                                            <span className="block text-zinc-500">ER</span>
                                            <span className="text-zinc-200 font-bold font-mono">{p.engagementRate.toFixed(2)}%</span>
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-zinc-500 italic">
                      Run analysis pipeline to compile detailed sentence structure engagement.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Interactive Winning Reels Inspector */}
      <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
        <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                <Zap className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
                <span>🏆 Hook Performance Deep-Dive Explorer</span>
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">Select a metric segment below to see the exact LinkedIn posts that used it and won</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter by Dimension */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-sans">
                <span>Segment:</span>
                <select
                  value={explorerDimension}
                  onChange={(e) => {
                    const newDim = e.target.value as any;
                    setExplorerDimension(newDim);
                    if (newDim === "hookType") {
                      setExplorerValue("Curiosity");
                    } else if (newDim === "sentenceStructure") {
                      setExplorerValue("First-Person Narrative");
                    } else {
                      setExplorerValue("Medium (101-200 chars)");
                    }
                  }}
                  className="rounded-full border border-white/10 bg-[#0e0e11] px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/10 cursor-pointer"
                >
                  <option value="hookType">Hook Style (AI)</option>
                  <option value="sentenceStructure">Sentence Structure</option>
                  <option value="hookLength">Hook Character Length</option>
                </select>
              </div>

              {/* Filter by Value */}
              <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-sans">
                <span>Value:</span>
                <select
                  value={explorerValue}
                  onChange={(e) => setExplorerValue(e.target.value)}
                  className="rounded-full border border-white/10 bg-[#0e0e11] px-3 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-white/10 cursor-pointer"
                >
                  {explorerDimension === "hookType" && [
                    "Curiosity", "Contrarian", "Story", "Failure", "Achievement", "Opinion", "Question", "Educational", "Building In Public", "Career"
                  ].map(v => <option key={v} value={v}>{v}</option>)}

                  {explorerDimension === "sentenceStructure" && [
                    "Action/Instructional", "First-Person Narrative", "Numbered List/Listicle", "Interrogative/Question", "Negative/Contrarian Assertion", "Declarative Statement"
                  ].map(v => <option key={v} value={v}>{v}</option>)}

                  {explorerDimension === "hookLength" && [
                    "Short (0-100 chars)", "Medium (101-200 chars)", "Long (200+ chars)"
                  ].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Inspector Results */}
          {isMounted && posts.some(p => p.analyzed) ? (
            (() => {
              const matchingPosts = posts.filter(p => {
                if (!p.analyzed) return false;
                if (explorerDimension === "hookType") {
                  return p.hookType === explorerValue;
                }
                if (explorerDimension === "sentenceStructure") {
                  return p.sentenceStructure === explorerValue;
                }
                if (explorerDimension === "hookLength") {
                  if (explorerValue === "Short (0-100 chars)") {
                    return p.hookLength !== null && p.hookLength <= 100;
                  } else if (explorerValue === "Medium (101-200 chars)") {
                    return p.hookLength !== null && p.hookLength > 100 && p.hookLength <= 200;
                  } else {
                    return p.hookLength !== null && p.hookLength > 200;
                  }
                }
                return false;
              }).sort((a, b) => b.engagementRate - a.engagementRate);

              if (matchingPosts.length === 0) {
                return (
                  <div className="flex h-36 items-center justify-center text-xs text-zinc-500 italic border border-dashed border-white/5 rounded-2xl font-sans">
                    No analyzed posts found in this segment. Try another option or run the analysis.
                  </div>
                );
              }

              return (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 font-sans">
                  {matchingPosts.map((post, idx) => (
                    <div
                      key={post.id || idx}
                      onClick={() => setModalPost(post)}
                      className={`group relative rounded-2xl border p-5 shadow-lg transition-all duration-300 hover:scale-[1.01] cursor-pointer ${
                        idx === 0
                          ? "border-white/15 bg-white/[0.03] hover:border-white/20"
                          : "border-white/5 bg-[#09090b] hover:border-white/10"
                      }`}
                    >
                      {idx === 0 && (
                        <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-lg">
                          🏆
                        </span>
                      )}

                      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3 text-[10px]">
                        <span className="font-bold text-zinc-500 uppercase tracking-wider font-display">Post #{idx + 1}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-zinc-400 group-hover:text-white transition-colors">
                          View Details <ExternalLink className="h-3 w-3" strokeWidth={1.2} />
                        </span>
                      </div>

                      <div className="min-h-[64px] text-xs text-zinc-200 leading-relaxed italic bg-black/40 border border-white/[0.02] rounded-xl p-3 mb-3 max-h-24 overflow-y-auto font-mono scrollbar-thin select-text">
                        "{post.hook || post.postText || "(No hook content)"}"
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-white/5 pt-3">
                        <div className="border-r border-white/5">
                          <span className="text-zinc-500 block">Impressions</span>
                          <span className="text-zinc-200 font-bold font-mono">{post.impressions.toLocaleString()}</span>
                        </div>
                        <div className="border-r border-white/5">
                          <span className="text-zinc-500 block">Engagements</span>
                          <span className="text-zinc-200 font-bold font-mono">{post.engagements.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block">Engagement Rate</span>
                          <span className="text-zinc-200 font-extrabold font-mono text-[11px]">{post.engagementRate.toFixed(2)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="flex h-36 items-center justify-center text-xs text-zinc-500 border border-dashed border-white/5 rounded-2xl italic font-sans">
              Run the analysis pipeline to inspect hook performance details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
