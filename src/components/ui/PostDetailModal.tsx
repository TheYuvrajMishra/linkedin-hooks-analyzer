import React from "react";
import { Post } from "@/types";
import { FileText, ExternalLink } from "lucide-react";

interface PostDetailModalProps {
  modalPost: Post | null;
  closeModal: () => void;
}

export function PostDetailModal({ modalPost, closeModal }: PostDetailModalProps) {
  if (!modalPost) return null;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(0,0,0,0.75)" }}
      onClick={closeModal}
    >
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-white/10 bg-[#09090b] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: "modalFadeIn 0.22s cubic-bezier(0.32,0.72,0,1)" }}
      >
        {/* Modal header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#09090b]/95 px-6 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <FileText className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-display font-bold">
                Post Details
              </p>
              <p className="text-xs text-zinc-400 font-sans">
                {modalPost.publishedAt
                  ? new Date(modalPost.publishedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Date unknown"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={modalPost.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all font-sans"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.2} /> Open on LinkedIn
            </a>
            <button
              onClick={closeModal}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10 transition-all text-lg leading-none cursor-pointer"
            >
              ×
            </button>
          </div>
        </div>

        {/* Modal body */}
        <div className="p-6 space-y-5">
          {/* Hook */}
          {modalPost.hook && (
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500 font-display font-bold">
                Hook Opening
              </p>
              <div className="rounded-xl border border-white/5 bg-black/40 p-4">
                <p className="text-sm text-zinc-100 italic leading-relaxed font-mono">
                  "{modalPost.hook}"
                </p>
              </div>
            </div>
          )}

          {/* Tags row */}
          <div className="flex flex-wrap gap-3">
            {modalPost.hookType && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-display font-bold">
                  Hook Style
                </span>
                <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white font-sans">
                  {modalPost.hookType}
                </span>
              </div>
            )}
            {modalPost.topic && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-display font-bold">
                  Topic
                </span>
                <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white font-sans">
                  {modalPost.topic}
                </span>
              </div>
            )}
            {modalPost.sentenceStructure && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-display font-bold">
                  Structure
                </span>
                <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white font-sans">
                  {modalPost.sentenceStructure}
                </span>
              </div>
            )}
            {modalPost.hookLength !== null && (
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-widest text-zinc-600 font-display font-bold">
                  Hook Length
                </span>
                <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white font-sans">
                  {modalPost.hookLength} chars
                </span>
              </div>
            )}
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Impressions", value: modalPost.impressions.toLocaleString() },
              { label: "Engagements", value: modalPost.engagements.toLocaleString() },
              { label: "Engagement Rate", value: `${modalPost.engagementRate.toFixed(2)}%` },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 text-center">
                <span className="block text-[10px] text-zinc-500 uppercase tracking-wider font-display mb-1 font-bold">
                  {label}
                </span>
                <span className="text-sm font-bold text-zinc-100 font-mono">{value}</span>
              </div>
            ))}
          </div>

          {/* Full post text */}
          {modalPost.postText && (
            <div>
              <p className="mb-2 text-[10px] uppercase tracking-widest text-zinc-500 font-display font-bold">
                Full Post Content
              </p>
              <div className="rounded-xl border border-white/[0.04] bg-[#030303]/60 p-4 max-h-72 overflow-y-auto">
                <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono select-text">
                  {modalPost.postText}
                </p>
              </div>
            </div>
          )}

          {/* Copy hook button */}
          {modalPost.hook && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(modalPost.hook!);
              }}
              className="w-full rounded-full border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all font-sans cursor-pointer"
            >
              Copy Hook to Clipboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
