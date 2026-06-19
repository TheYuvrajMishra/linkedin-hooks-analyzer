import React from "react";
import { DemographicMetric } from "@/types";
import { Users } from "lucide-react";

interface DemographicsProps {
  demographics: DemographicMetric[];
  getDemographicsGrouped: () => { [category: string]: DemographicMetric[] };
}

export function Demographics({ demographics, getDemographicsGrouped }: DemographicsProps) {
  return (
    <div className="space-y-6">
      {demographics.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(getDemographicsGrouped()).map(([category, items], idx) => {
            const sortedItems = [...items].sort((a, b) => b.percentage - a.percentage).slice(0, 8);
            
            return (
              <div key={idx} className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
                <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
                  <div>
                    <h3 className="font-display text-sm font-bold text-white border-b border-white/5 pb-3 mb-4 flex items-center justify-between uppercase tracking-wider">
                      <span>Top {category}s</span>
                      <span className="text-[9px] text-zinc-500 tracking-widest font-mono">Demographics</span>
                    </h3>
                    
                    <div className="space-y-4">
                      {sortedItems.map((item, itemIdx) => (
                        <div key={itemIdx} className="space-y-1.5 font-sans">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-zinc-300 truncate max-w-[200px]" title={item.value}>
                              {item.value}
                            </span>
                            <span className="font-bold text-zinc-200 font-mono">{item.percentage}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-950 overflow-hidden">
                            <div
                              className="h-full bg-white/50 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
          <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] text-center">
            <Users className="mx-auto h-8 w-8 text-zinc-500 mb-2" strokeWidth={1.2} />
            <h3 className="font-display text-sm font-bold text-zinc-400 mb-1 uppercase tracking-wider">No demographics data imported</h3>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto">
              The sheet DEMOGRAPHICS was not found or was empty in the spreadsheet report.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
