import React from 'react';

export const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-white/10 bg-zinc-950/90 p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-bold text-zinc-300 font-display uppercase tracking-wider">{label}</p>
        <div className="mt-2 space-y-1">
          {payload.map((item: any, index: number) => (
            <p key={index} className="text-xs font-mono" style={{ color: item.color || item.fill }}>
              {item.name}: {item.value.toLocaleString()} {item.name.toLowerCase().includes("rate") ? "%" : ""}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};
