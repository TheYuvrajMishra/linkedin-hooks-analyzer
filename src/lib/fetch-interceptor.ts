import { parseLinkedInExcel } from "@/lib/xlsx-parser";

export function setupFetchInterceptor() {
  if (typeof window === "undefined" || (window as any).__FETCH_OVERRIDDEN) {
    return;
  }

  (window as any).__FETCH_OVERRIDDEN = true;
  const originalFetch = window.fetch;

  const ls = {
    get: (k: string) => JSON.parse(localStorage.getItem(k) || "null"),
    set: (k: string, v: any) => localStorage.setItem(k, JSON.stringify(v)),
    clear: () => {
      localStorage.removeItem("posts");
      localStorage.removeItem("dailyMetrics");
      localStorage.removeItem("followerMetrics");
      localStorage.removeItem("demographicMetrics");
      localStorage.removeItem("aiAnalysis");
    },
  };

  window.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;

    if (url === "/api/db-status") {
      const posts = ls.get("posts") || [];
      return new Response(
        JSON.stringify({
          isFallback: true,
          databaseType: "Browser LocalStorage (Private)",
          stats: {
            totalPosts: posts.length,
            analyzedPosts: posts.filter((p: any) => p.analyzed).length,
            dailyMetricsCount: (ls.get("dailyMetrics") || []).length,
            followerMetricsCount: (ls.get("followerMetrics") || []).length,
            demographicsCount: (ls.get("demographicMetrics") || []).length,
            hasAIInsights: !!ls.get("aiAnalysis"),
          },
        })
      );
    }

    if (url === "/api/posts") return new Response(JSON.stringify({ posts: ls.get("posts") || [] }));
    if (url === "/api/analysis/latest") return new Response(JSON.stringify({ analysis: ls.get("aiAnalysis") || null }));
    if (url === "/api/metrics") {
      return new Response(
        JSON.stringify({
          dailyMetrics: ls.get("dailyMetrics") || [],
          followerMetrics: ls.get("followerMetrics") || [],
          demographics: ls.get("demographicMetrics") || [],
        })
      );
    }
    if (url === "/api/clear") {
      ls.clear();
      return new Response(JSON.stringify({ success: true }));
    }

    if (url === "/api/upload") {
      const formData = init?.body as FormData;
      const file = formData.get("file") as File;
      const buffer = await file.arrayBuffer();
      const parsedData = parseLinkedInExcel(buffer);
      ls.set("posts", parsedData.posts);
      ls.set("dailyMetrics", parsedData.dailyMetrics);
      ls.set("followerMetrics", parsedData.followerMetrics);
      ls.set("demographicMetrics", parsedData.demographicMetrics);
      return new Response(JSON.stringify({ success: true }));
    }

    if (url === "/api/analysis/generate") {
      return originalFetch(url, {
        ...init,
        method: "POST",
        headers: { ...init?.headers, "Content-Type": "application/json" },
        body: JSON.stringify({ posts: ls.get("posts") || [] }),
      }).then(async (res) => {
        const data = await res.clone().json();
        if (data.analysis) ls.set("aiAnalysis", data.analysis);
        return res;
      });
    }

    if (url === "/api/posts/analyze") {
      const body = JSON.parse(init?.body as string);
      const posts = ls.get("posts") || [];
      const post = posts.find((p: any) => p.postUrl === body.postUrl);
      return originalFetch(url, {
        ...init,
        method: "POST",
        headers: { ...init?.headers, "Content-Type": "application/json" },
        body: JSON.stringify({ post }),
      }).then(async (res) => {
        const data = await res.clone().json();
        if (data.post) {
          const updatedPosts = posts.map((p: any) =>
            p.postUrl === data.post.postUrl ? data.post : p
          );
          ls.set("posts", updatedPosts);
        }
        return res;
      });
    }

    return originalFetch(input, init);
  };
}
