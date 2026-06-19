import React from "react";
import { DBStatus } from "@/types";
import { Database, Trash2 } from "lucide-react";

interface HeaderProps {
  dbStatus: DBStatus | null;
  actionLoading: boolean;
  handleClearDatabase: () => Promise<void>;
}

export function Header({ dbStatus, actionLoading, handleClearDatabase }: HeaderProps) {
  return (
    <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-zinc-950/65 px-6 py-3.5 backdrop-blur-xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/15">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="h-4.5 w-4.5 text-white"
            >
              <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12z" />
            </svg>
          </div>
          <div>
            <h1 className="font-display text-sm font-bold tracking-wider text-white uppercase sm:text-base">
              Linkedin Looker
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {dbStatus && (
            <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-medium border border-white/5">
              <Database className="h-3 w-3 text-zinc-400" strokeWidth={1.2} />
              <span className="text-zinc-500 hidden sm:inline">Mode:</span>
              <span className="text-zinc-300 font-semibold">{dbStatus.databaseType}</span>
            </div>
          )}

          {dbStatus && dbStatus.stats.totalPosts > 0 && (
            <button
              onClick={handleClearDatabase}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[10px] font-bold text-zinc-400 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/10 hover:text-white active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.2} />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
