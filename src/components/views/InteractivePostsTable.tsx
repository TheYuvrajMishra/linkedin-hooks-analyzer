import React from "react";
import { Post } from "@/types";
import { Search, Filter, ArrowUpDown, AlertCircle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";

interface InteractivePostsTableProps {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterHookType: string;
  setFilterHookType: (v: string) => void;
  filterTopic: string;
  setFilterTopic: (v: string) => void;
  posts: Post[];
  handleSort: (field: keyof Post) => void;
  paginatedPosts: Post[];
  setModalPost: (post: Post | null) => void;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  itemsPerPage: number;
  sortedPostsLength: number;
}

export function InteractivePostsTable({
  searchTerm,
  setSearchTerm,
  filterHookType,
  setFilterHookType,
  filterTopic,
  setFilterTopic,
  posts,
  handleSort,
  paginatedPosts,
  setModalPost,
  currentPage,
  setCurrentPage,
  totalPages,
  itemsPerPage,
  sortedPostsLength,
}: InteractivePostsTableProps) {
  return (
    <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl shadow-xl">
      <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] overflow-hidden">
        {/* Filters Row */}
        <div className="flex flex-col gap-4 border-b border-white/5 bg-[#0e0e11]/45 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-xs flex-grow">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" strokeWidth={1.2} />
            <input
              type="text"
              placeholder="Search hook, text or URL..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-full border border-white/10 bg-[#0e0e11] py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Filter Hook Type */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-500" strokeWidth={1.2} />
              <select
                value={filterHookType}
                onChange={(e) => {
                  setFilterHookType(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-white/10 bg-[#0e0e11] py-1.5 px-3 text-xs text-zinc-300 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all cursor-pointer font-sans"
              >
                <option value="all">All Hooks</option>
                {Array.from(new Set(posts.map((p) => p.hookType).filter(Boolean))).map((ht) => (
                  <option key={ht} value={ht!}>{ht}</option>
                ))}
              </select>
            </div>

            {/* Filter Topic */}
            <div className="flex items-center gap-2">
              <select
                value={filterTopic}
                onChange={(e) => {
                  setFilterTopic(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-full border border-white/10 bg-[#0e0e11] py-1.5 px-3 text-xs text-zinc-300 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all cursor-pointer font-sans"
              >
                <option value="all">All Topics</option>
                {Array.from(new Set(posts.map((p) => p.topic).filter(Boolean))).map((t) => (
                  <option key={t} value={t!}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table Data */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0e0e11]/80 text-zinc-400 font-bold border-b border-white/5 font-display uppercase tracking-wider">
              <tr>
                <th className="p-4">Publish Date</th>
                <th className="p-4 w-1/3">Hook Opening</th>
                <th className="p-4">Hook Style</th>
                <th className="p-4">Topic</th>
                <th
                  onClick={() => handleSort("impressions")}
                  className="p-4 text-right cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Impressions</span>
                    <ArrowUpDown className="h-3 w-3" strokeWidth={1.2} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("engagements")}
                  className="p-4 text-right cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Engagements</span>
                    <ArrowUpDown className="h-3 w-3" strokeWidth={1.2} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort("engagementRate")}
                  className="p-4 text-right cursor-pointer hover:text-white select-none transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>ER%</span>
                    <ArrowUpDown className="h-3 w-3" strokeWidth={1.2} />
                  </div>
                </th>
                <th className="p-4 text-center">Post</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-[#09090b]/20">
              {paginatedPosts.length > 0 ? (
                paginatedPosts.map((post) => (
                  <tr
                    key={post.id}
                    onClick={() => setModalPost(post)}
                    className="hover:bg-white/5 transition-colors cursor-pointer select-none group"
                  >
                    <td className="p-4 text-zinc-500 font-medium font-sans">
                      {post.publishedAt
                        ? new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                        : "N/A"}
                    </td>
                    <td className="p-4 font-normal">
                      {post.analyzed ? (
                        <div className="text-zinc-200 pr-4 italic line-clamp-2">
                          "{post.hook}"
                        </div>
                      ) : (
                        <div className="text-zinc-500 flex items-center gap-1.5">
                          <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" strokeWidth={1.2} />
                          <span className="truncate max-w-[200px] font-mono">{post.postUrl}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      {post.hookType ? (
                        <span className="inline-block rounded-full bg-white/10 border border-white/5 px-2.5 py-1 text-[9px] font-semibold text-white tracking-wide font-sans">
                          {post.hookType}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600 italic">Unprocessed</span>
                      )}
                    </td>
                    <td className="p-4">
                      {post.topic ? (
                        <span className="inline-block rounded-full bg-white/10 border border-white/5 px-2.5 py-1 text-[9px] font-semibold text-white tracking-wide font-sans">
                          {post.topic}
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-600 italic">Unprocessed</span>
                      )}
                    </td>
                    <td className="p-4 text-right text-zinc-300 font-semibold font-mono">
                      {post.impressions.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-zinc-300 font-semibold font-mono">
                      {post.engagements.toLocaleString()}
                    </td>
                    <td className="p-4 text-right text-zinc-200 font-bold font-mono">
                      {post.engagementRate.toFixed(2)}%
                    </td>
                    <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 hover:border-white/20 bg-zinc-950 hover:bg-white/10 text-zinc-500 hover:text-white transition-all cursor-pointer"
                      >
                        <ExternalLink className="h-3 w-3" strokeWidth={1.2} />
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500 italic">
                    No posts matched the current search filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-white/5 bg-[#0e0e11]/45 px-5 py-4">
            <div className="text-xs text-zinc-500 font-sans">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, sortedPostsLength)} of{" "}
              {sortedPostsLength} posts
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.max(p - 1, 1));
                }}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4" strokeWidth={1.2} />
              </button>
              <span className="text-xs text-zinc-400 font-semibold px-2 font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => {
                  setCurrentPage((p) => Math.min(p + 1, totalPages));
                }}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronRight className="h-4 w-4" strokeWidth={1.2} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
