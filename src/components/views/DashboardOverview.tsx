import React from "react";
import {
  BarChart,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ComposedChart,
  Line,
} from "recharts";
import { CustomTooltip } from "@/components/ui/CustomTooltip";

interface DashboardOverviewProps {
  combinedMetrics: any[];
  activeChartTab: "impressions" | "engagements" | "followers";
  setActiveChartTab: (tab: "impressions" | "engagements" | "followers") => void;
  hookChartData: any[];
  topicChartData: any[];
  isMounted: boolean;
  chartColors: string[];
}

export function DashboardOverview({
  combinedMetrics,
  activeChartTab,
  setActiveChartTab,
  hookChartData,
  topicChartData,
  isMounted,
  chartColors,
}: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Unified Performance Trend */}
      {combinedMetrics.length > 0 && (
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <h3 className="font-display text-xs font-semibold text-white/40 uppercase tracking-widest">
                Performance Trends
              </h3>
              <div className="flex items-center gap-1 bg-[#0e0e11]/80 p-1 rounded-full border border-white/5">
                {(["impressions", "engagements", "followers"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveChartTab(tab)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
                      activeChartTab === tab
                        ? "bg-white/10 text-white shadow-md border border-white/10"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full">
              {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={combinedMetrics}
                    margin={{ top: 10, right: 16, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity={0.12} />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                      </linearGradient>
                      <linearGradient id="folGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
                        <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.03)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      scale="point"
                      padding={{ left: 10, right: 10 }}
                      stroke="transparent"
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(date) => {
                        try {
                          const d = new Date(date);
                          return `${d.getMonth() + 1}/${d.getDate()}`;
                        } catch {
                          return date;
                        }
                      }}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) =>
                        v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                      }
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ stroke: "rgba(255,255,255,0.08)", strokeWidth: 1 }}
                    />

                    {activeChartTab === "impressions" && (
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        name="Impressions"
                        stroke="#ffffff"
                        strokeWidth={1.5}
                        fill="url(#impGrad)"
                        dot={false}
                        activeDot={{ r: 3, fill: "#fff", strokeWidth: 0 }}
                      />
                    )}
                    {activeChartTab === "engagements" && (
                      <Line
                        type="monotone"
                        dataKey="engagements"
                        name="Engagements"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                      />
                    )}
                    {activeChartTab === "followers" && (
                      <Area
                        type="monotone"
                        dataKey="newFollowers"
                        name="New Followers"
                        stroke="#22c55e"
                        strokeWidth={2}
                        fill="url(#folGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#22c55e", strokeWidth: 0 }}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Grid for Topic and Hook Type Bar Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Hook style chart */}
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <div className="mb-6">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Engagement Rate by Hook Style
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                Average ER% calculated across classified categories
              </p>
            </div>
            <div className="h-64 w-full">
              {isMounted && hookChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hookChartData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={9}
                      tickLine={false}
                      label={{
                        value: "ER %",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#6b7280", fontSize: 9 },
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="avgEngagementRate"
                      name="Avg. Engagement Rate"
                      fill={chartColors[0]}
                      radius={[3, 3, 0, 0]}
                    >
                      {hookChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                  AI Hook classifications pending. Run pipeline to visualize.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Topic chart */}
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
            <div className="mb-6">
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Engagement Rate by Topic
              </h3>
              <p className="text-[10px] text-zinc-500 mt-1">
                Comparison of audience engagement across core subject matters
              </p>
            </div>
            <div className="h-64 w-full">
              {isMounted && topicChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topicChartData} margin={{ bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={9}
                      tickLine={false}
                      label={{
                        value: "ER %",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#6b7280", fontSize: 9 },
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar
                      dataKey="avgEngagementRate"
                      name="Avg. Engagement Rate"
                      fill={chartColors[0]}
                      radius={[3, 3, 0, 0]}
                    >
                      {topicChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                  AI Topic classifications pending. Run pipeline to visualize.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
