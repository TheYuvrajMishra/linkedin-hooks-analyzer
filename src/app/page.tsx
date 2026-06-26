"use client";

import { useState, useEffect, Fragment, useMemo } from "react";
import Link from "next/link";
import {
  Upload,
  FileText,
  Activity,
  Users,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Database,
  Sparkles,
  Filter,
  ArrowUpDown,
  Trash2,
  Search,
  ExternalLink,
  BookOpen,
  BarChart2,
  TrendingUp,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Terminal,
  Shield,
  Lightbulb,
  Zap,
} from "lucide-react";

import { Post, DailyMetric, FollowerMetric, DemographicMetric, AIAnalysis, DBStatus } from "@/types";
import { CustomTooltip } from "@/components/ui/CustomTooltip";
import { parseLinkedInExcel } from "@/lib/xlsx-parser";
import { DashboardOverview } from "@/components/views/DashboardOverview";
import { InteractivePostsTable } from "@/components/views/InteractivePostsTable";
import { HookIntelligence } from "@/components/views/HookIntelligence";
import { AIInsights } from "@/components/views/AIInsights";
import { Demographics } from "@/components/views/Demographics";

if (typeof window !== "undefined" && !(window as any).__FETCH_OVERRIDDEN) {
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
    }
  };

  window.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : (input as Request).url;
    
    if (url === '/api/db-status') {
      const posts = ls.get('posts') || [];
      return new Response(JSON.stringify({
        isFallback: true, databaseType: "Browser LocalStorage (Private)",
        stats: { totalPosts: posts.length, analyzedPosts: posts.filter((p:any)=>p.analyzed).length, dailyMetricsCount: (ls.get('dailyMetrics')||[]).length, followerMetricsCount: (ls.get('followerMetrics')||[]).length, demographicsCount: (ls.get('demographicMetrics')||[]).length, hasAIInsights: !!ls.get('aiAnalysis') }
      }));
    }
    
    if (url === '/api/posts') return new Response(JSON.stringify({ posts: ls.get('posts') || [] }));
    if (url === '/api/analysis/latest') return new Response(JSON.stringify({ analysis: ls.get('aiAnalysis') || null }));
    if (url === '/api/metrics') return new Response(JSON.stringify({ dailyMetrics: ls.get('dailyMetrics')||[], followerMetrics: ls.get('followerMetrics')||[], demographics: ls.get('demographicMetrics')||[] }));
    if (url === '/api/clear') { ls.clear(); return new Response(JSON.stringify({ success: true })); }
    
    if (url === '/api/upload') {
      const formData = init?.body as FormData;
      const file = formData.get('file') as File;
      const buffer = await file.arrayBuffer();
      const parsedData = parseLinkedInExcel(buffer);
      ls.set('posts', parsedData.posts);
      ls.set('dailyMetrics', parsedData.dailyMetrics);
      ls.set('followerMetrics', parsedData.followerMetrics);
      ls.set('demographicMetrics', parsedData.demographicMetrics);
      return new Response(JSON.stringify({ success: true }));
    }
    
    if (url === '/api/analysis/generate') {
      return originalFetch(url, {
        ...init,
        method: 'POST',
        headers: { ...init?.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts: ls.get('posts') || [] })
      }).then(async res => {
        const data = await res.clone().json();
        if (data.analysis) ls.set('aiAnalysis', data.analysis);
        return res;
      });
    }
    
    if (url === '/api/posts/analyze') {
      const body = JSON.parse(init?.body as string);
      const posts = ls.get('posts') || [];
      const post = posts.find((p:any) => p.postUrl === body.postUrl);
      return originalFetch(url, {
        ...init,
        method: 'POST',
        headers: { ...init?.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ post })
      }).then(async res => {
        const data = await res.clone().json();
        if (data.post) {
           const updatedPosts = posts.map((p:any) => p.postUrl === data.post.postUrl ? data.post : p);
           ls.set('posts', updatedPosts);
        }
        return res;
      });
    }

    return originalFetch(input, init);
  };
}

export default function Home() {
  // Mounting check for Recharts SSR
  const [isMounted, setIsMounted] = useState(false);
  
  // App states
  const [dbStatus, setDbStatus] = useState<DBStatus | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetric[]>([]);
  const [followerMetrics, setFollowerMetrics] = useState<FollowerMetric[]>([]);
  const [demographics, setDemographics] = useState<DemographicMetric[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  
  // Loading states
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  
  // Analysis Pipeline states
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);

  // Interactive controls
  const [activeTab, setActiveTab] = useState<"dashboard" | "posts" | "hook-intelligence" | "ai-insights" | "demographics">("dashboard");
  const [activeChartTab, setActiveChartTab] = useState<"impressions" | "engagements" | "followers">("impressions");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterHookType, setFilterHookType] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [sortBy, setSortBy] = useState<keyof Post>("impressions");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Selected file for manual upload
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Clipboard copy state
  const [copiedHookIdx, setCopiedHookIdx] = useState<number | null>(null);

  // Hook Intelligence Explorer states
  const [explorerDimension, setExplorerDimension] = useState<"hookType" | "sentenceStructure" | "hookLength">("hookType");
  const [explorerValue, setExplorerValue] = useState<string>("Curiosity");
  const [expandedStructure, setExpandedStructure] = useState<string | null>(null);
  
  // Post Details expand state (kept for hook-intelligence table)
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Modal state — used in Posts Table AND Hook Intelligence cards
  const [modalPost, setModalPost] = useState<Post | null>(null);
  const closeModal = () => setModalPost(null);

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedHookIdx(idx);
    setTimeout(() => setCopiedHookIdx(null), 2000);
  };

  useEffect(() => {
    setIsMounted(true);
    fetchDatabaseState();
  }, []);

  // IntersectionObserver for scroll-reveal animations
  useEffect(() => {
    if (!isMounted) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.05 }
    );

    const timeout = setTimeout(() => {
      document.querySelectorAll(".animate-on-scroll").forEach((el) => {
        observer.observe(el);
      });
    }, 200);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [isMounted, activeTab, posts, dailyMetrics, aiAnalysis, demographics]);

  const fetchDatabaseState = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch("/api/db-status");
      const data = await res.json();
      setDbStatus(data);

      if (data?.stats?.totalPosts > 0) {
        // Fetch posts
        const postsRes = await fetch("/api/posts");
        const postsData = await postsRes.json();
        setPosts(postsData.posts || []);

        const aiRes = await fetch("/api/analysis/latest");
        const aiData = await aiRes.json();
        setAiAnalysis(aiData.analysis);

        const metricsRes = await fetch("/api/metrics");
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setDailyMetrics(metricsData.dailyMetrics || []);
          setFollowerMetrics(metricsData.followerMetrics || []);
          setDemographics(metricsData.demographics || []);
        }
      } else {
        setPosts([]);
        setDailyMetrics([]);
        setFollowerMetrics([]);
        setDemographics([]);
        setAiAnalysis(null);
      }
    } catch (err) {
      console.error("Error loading app state:", err);
    } finally {
      setLoadingStatus(false);
    }
  };

  // Helper to load metrics
  useEffect(() => {
    if (dbStatus && dbStatus.stats.totalPosts > 0) {
      fetchRawMetrics();
    }
  }, [dbStatus]);

  const fetchRawMetrics = async () => {
    try {
      const res = await fetch("/api/db-status");
      const mRes = await fetch("/api/metrics");
      if (mRes.ok) {
        const mData = await mRes.json();
        setDailyMetrics(mData.dailyMetrics || []);
        setFollowerMetrics(mData.followerMetrics || []);
        setDemographics(mData.demographics || []);
      }
    } catch (e) {
      console.error("Failed to load metrics", e);
    }
  };

  const handleAutoLoad = async () => {
    try {
      setActionLoading(true);
      setUploadProgress("Reading AggregateAnalytics spreadsheet from project directory...");
      const res = await fetch("/api/upload/auto", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setUploadProgress("Success! Imported data into database.");
        setTimeout(() => setUploadProgress(null), 3000);
        await fetchDatabaseState();
      } else {
        alert(data.error || "Failed to auto-load spreadsheet");
        setUploadProgress(null);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
      setUploadProgress(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setActionLoading(true);
      setUploadProgress("Uploading and parsing spreadsheet...");
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setUploadProgress("Report processed successfully!");
        setTimeout(() => setUploadProgress(null), 3000);
        setSelectedFile(null);
        await fetchDatabaseState();
      } else {
        alert(data.error || "File upload failed.");
        setUploadProgress(null);
      }
    } catch (err: any) {
      alert("Upload error: " + err.message);
      setUploadProgress(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearDatabase = async () => {
    if (!confirm("Are you sure you want to delete all reports, metrics, and analyses? This cannot be undone.")) return;
    try {
      setActionLoading(true);
      const res = await fetch("/api/clear", { method: "POST" });
      if (res.ok) {
        await fetchDatabaseState();
      }
    } catch (err) {
      console.error("Clear database failed:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const runAnalysisPipeline = async () => {
    const unanalyzedPosts = posts.filter((p) => !p.analyzed);
    if (unanalyzedPosts.length === 0) {
      generateAIRecommendations();
      return;
    }

    setAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisLogs([`Starting analysis of ${unanalyzedPosts.length} posts using Headless Browser Scraping...`]);
    
    let processed = 0;
    let errors = 0;

    for (const post of unanalyzedPosts) {
      try {
        setAnalysisLogs((prev) => [
          `[${processed + 1}/${unanalyzedPosts.length}] Processing: ${post.postUrl.split("_").slice(-1)[0] || "Post"}`,
          ...prev,
        ]);

        const res = await fetch("/api/posts/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postUrl: post.postUrl }),
        });

        if (!res.ok) {
          throw new Error(`Server returned status ${res.status}`);
        }

        const data = await res.json();
        if (data.success) {
          setPosts((prevPosts) =>
            prevPosts.map((p) => (p.postUrl === post.postUrl ? data.post : p))
          );
        } else {
          throw new Error(data.error || "Analysis failed");
        }
      } catch (err: any) {
        errors++;
        console.error(`Error analyzing post ${post.postUrl}:`, err);
        setAnalysisLogs((prev) => [
          `⚠️ Error analyzing ${post.postUrl.substring(0, 45)}...: ${err.message}`,
          ...prev,
        ]);
      } finally {
        processed++;
        setAnalysisProgress(Math.round((processed / unanalyzedPosts.length) * 100));
      }
    }

    setAnalysisLogs((prev) => [
      `Completed post-processing. Total processed: ${processed}, Errors: ${errors}. Generating overall strategic recommendations...`,
      ...prev,
    ]);

    await generateAIRecommendations();
    setAnalyzing(false);
    await fetchDatabaseState();
  };

  const generateAIRecommendations = async () => {
    try {
      setAnalysisLogs((prev) => ["Running Content Pattern Analysis LLM...", ...prev]);
      const res = await fetch("/api/analysis/generate", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setAiAnalysis(data.analysis);
        setAnalysisLogs((prev) => ["⭐ AI strategic recommendations generated successfully!", ...prev]);
      } else {
        throw new Error(data.error || "Failed to generate AI insights");
      }
    } catch (err: any) {
      console.error(err);
      setAnalysisLogs((prev) => [`❌ AI Insight Generation failed: ${err.message}`, ...prev]);
    }
  };

  const handleSort = (field: keyof Post) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.postUrl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.postText || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (post.hook || "").toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesHookType =
      filterHookType === "all" || post.hookType === filterHookType;
      
    const matchesTopic =
      filterTopic === "all" || post.topic === filterTopic;

    return matchesSearch && matchesHookType && matchesTopic;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (valA === null || valA === undefined) return 1;
    if (valB === null || valB === undefined) return -1;

    if (typeof valA === "string") {
      return sortOrder === "asc"
        ? (valA as string).localeCompare(valB as string)
        : (valB as string).localeCompare(valA as string);
    } else {
      return sortOrder === "asc"
        ? (valA as number) - (valB as number)
        : (valB as number) - (valA as number);
    }
  });

  const totalPages = Math.ceil(sortedPosts.length / itemsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getHookTypeChartData = () => {
    const hookTypesMap: { [type: string]: { impSum: number; engSum: number; erSum: number; count: number } } = {};
    posts.forEach((p) => {
      if (!p.analyzed || !p.hookType) return;
      if (!hookTypesMap[p.hookType]) {
        hookTypesMap[p.hookType] = { impSum: 0, engSum: 0, erSum: 0, count: 0 };
      }
      hookTypesMap[p.hookType].impSum += p.impressions;
      hookTypesMap[p.hookType].engSum += p.engagements;
      hookTypesMap[p.hookType].erSum += p.engagementRate;
      hookTypesMap[p.hookType].count += 1;
    });

    return Object.entries(hookTypesMap).map(([type, s]) => ({
      name: type,
      avgImpressions: Math.round(s.impSum / s.count),
      avgEngagementRate: parseFloat((s.erSum / s.count).toFixed(2)),
      count: s.count,
    })).sort((a, b) => {
      const scoreA = a.avgEngagementRate * (a.count / (a.count + 4));
      const scoreB = b.avgEngagementRate * (b.count / (b.count + 4));
      return scoreB - scoreA;
    });
  };

  const getTopicChartData = () => {
    const topicsMap: { [topic: string]: { impSum: number; engSum: number; erSum: number; count: number } } = {};
    posts.forEach((p) => {
      if (!p.analyzed || !p.topic) return;
      if (!topicsMap[p.topic]) {
        topicsMap[p.topic] = { impSum: 0, engSum: 0, erSum: 0, count: 0 };
      }
      topicsMap[p.topic].impSum += p.impressions;
      topicsMap[p.topic].engSum += p.engagements;
      topicsMap[p.topic].erSum += p.engagementRate;
      topicsMap[p.topic].count += 1;
    });

    return Object.entries(topicsMap).map(([topic, s]) => ({
      name: topic,
      avgImpressions: Math.round(s.impSum / s.count),
      avgEngagementRate: parseFloat((s.erSum / s.count).toFixed(2)),
      count: s.count,
    })).sort((a, b) => {
      const scoreA = a.avgEngagementRate * (a.count / (a.count + 4));
      const scoreB = b.avgEngagementRate * (b.count / (b.count + 4));
      return scoreB - scoreA;
    });
  };

  const getHookLengthChartData = () => {
    const categories = [
      { name: "Short (0-100 chars)", min: 0, max: 100, impSum: 0, engSum: 0, erSum: 0, count: 0 },
      { name: "Medium (101-200 chars)", min: 101, max: 200, impSum: 0, engSum: 0, erSum: 0, count: 0 },
      { name: "Long (200+ chars)", min: 201, max: 9999, impSum: 0, engSum: 0, erSum: 0, count: 0 },
    ];

    posts.forEach((p) => {
      if (!p.analyzed || p.hookLength === null) return;
      const cat = categories.find((c) => p.hookLength! >= c.min && p.hookLength! <= c.max);
      if (cat) {
        cat.impSum += p.impressions;
        cat.engSum += p.engagements;
        cat.erSum += p.engagementRate;
        cat.count += 1;
      }
    });

    return categories
      .filter((c) => c.count > 0)
      .map((c) => ({
        name: c.name,
        avgImpressions: Math.round(c.impSum / c.count),
        avgEngagementRate: parseFloat((c.erSum / c.count).toFixed(2)),
        count: c.count,
      }));
  };

  const getSentenceStructureChartData = () => {
    const structMap: { [struct: string]: { impSum: number; engSum: number; erSum: number; count: number } } = {};
    posts.forEach((p) => {
      if (!p.analyzed || !p.sentenceStructure) return;
      if (!structMap[p.sentenceStructure]) {
        structMap[p.sentenceStructure] = { impSum: 0, engSum: 0, erSum: 0, count: 0 };
      }
      structMap[p.sentenceStructure].impSum += p.impressions;
      structMap[p.sentenceStructure].engSum += p.engagements;
      structMap[p.sentenceStructure].erSum += p.engagementRate;
      structMap[p.sentenceStructure].count += 1;
    });

    return Object.entries(structMap).map(([struct, s]) => ({
      name: struct,
      avgImpressions: Math.round(s.impSum / s.count),
      avgEngagementRate: parseFloat((s.erSum / s.count).toFixed(2)),
      count: s.count,
    })).sort((a, b) => {
      const scoreA = a.avgEngagementRate * (a.count / (a.count + 4));
      const scoreB = b.avgEngagementRate * (b.count / (b.count + 4));
      return scoreB - scoreA;
    });
  };

  const getTopOpeningWords = () => {
    const wordCounts: { [word: string]: { count: number; impSum: number; engSum: number } } = {};
    posts.forEach((p) => {
      if (!p.analyzed || !p.hook) return;
      const firstWord = p.hook.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") || "";
      if (firstWord.length < 3) return;
      
      if (!wordCounts[firstWord]) {
        wordCounts[firstWord] = { count: 0, impSum: 0, engSum: 0 };
      }
      wordCounts[firstWord].count += 1;
      wordCounts[firstWord].impSum += p.impressions;
      wordCounts[firstWord].engSum += p.engagements;
    });

    return Object.entries(wordCounts)
      .map(([word, s]) => ({
        word: word.charAt(0).toUpperCase() + word.slice(1),
        count: s.count,
        avgImpressions: Math.round(s.impSum / s.count),
        avgEngagementRate: parseFloat(((s.engSum / s.impSum) * 100).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  };

  const getDemographicsGrouped = () => {
    const grouped: { [category: string]: DemographicMetric[] } = {};
    demographics.forEach((d) => {
      if (!grouped[d.category]) {
        grouped[d.category] = [];
      }
      grouped[d.category].push(d);
    });
    return grouped;
  };

  const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
  const totalEngagements = posts.reduce((sum, p) => sum + p.engagements, 0);
  const avgER = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(2) : "0.00";
  
  const hookChartData = getHookTypeChartData();
  const topicChartData = getTopicChartData();
  const bestPerformingHook = hookChartData[0]?.name || "N/A";
  const bestPerformingTopic = topicChartData[0]?.name || "N/A";

  const combinedMetrics = useMemo(() => {
    const map = new Map<string, any>();
    dailyMetrics.forEach((d: any) => {
      map.set(d.date, { 
        date: d.date, 
        impressions: Math.max(0, d.impressions || 0), 
        engagements: Math.max(0, d.engagements || 0), 
        newFollowers: 0 
      });
    });
    followerMetrics.forEach((f: any) => {
      if (map.has(f.date)) {
        map.get(f.date).newFollowers = Math.max(0, f.newFollowers || 0);
      } else {
        map.set(f.date, { date: f.date, impressions: 0, engagements: 0, newFollowers: Math.max(0, f.newFollowers || 0) });
      }
    });
    return Array.from(map.values()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dailyMetrics, followerMetrics]);

  const chartColors = ["#ffffff", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46"];

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-200 antialiased selection:bg-white/20 selection:text-white relative overflow-hidden pb-12">
      <div className="noise-overlay" />

      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-zinc-950/65 px-6 py-3.5 backdrop-blur-xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/15">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4.5 w-4.5 text-white">
                <path d="M12 24c0-6.627-5.373-12-12-12 6.627 0 12-5.373 12-12 0 6.627 5.373 12 12 12-6.627 0-12 5.373-12 12z" />
              </svg>
            </div>
            <div>
              <h1 className="font-display text-sm font-bold tracking-wider text-white uppercase sm:text-base">Linkedin Looker</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dbStatus && (
              <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-[10px] font-medium border border-white/5">
                <Database className="h-3 w-3 text-zinc-400" strokeWidth={1.2} />
                <span className="text-zinc-500 hidden sm:inline">Mode:</span>
                <span className="text-zinc-300 font-semibold">
                  {dbStatus.databaseType}
                </span>
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

      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        {loadingStatus ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-white/60" strokeWidth={1.2} />
            <p className="text-sm text-zinc-400 font-medium">Initializing workspace database connection...</p>
          </div>
        ) : !dbStatus || dbStatus.stats.totalPosts === 0 ? (
          <div className="mx-auto max-w-2xl">
            <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.01] hover:border-white/10 shadow-2xl">
              <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 mb-6 shadow-inner">
                  <Upload className="h-6 w-6 text-zinc-300" strokeWidth={1.2} />
                </div>
                <h2 className="font-display text-2xl font-bold text-white mb-2 tracking-wide">Analyze Your LinkedIn Performance</h2>
                <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
                  Upload your LinkedIn analytics Excel spreadsheet report to profile your hooks, topics, and metrics.
                </p>

                {uploadProgress && (
                  <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-3.5 text-xs text-zinc-300 flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.2} />
                    <span>{uploadProgress}</span>
                  </div>
                )}

                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-6 text-left transition-colors hover:border-white/10">
                    <form onSubmit={handleFileUpload} className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="flex-1 rounded-full border border-white/10 bg-zinc-950 px-4 py-1.5 text-xs text-zinc-300 file:mr-4 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-white hover:file:bg-white/20 transition-all cursor-pointer"
                        required
                      />
                      <button
                        type="submit"
                        disabled={!selectedFile || actionLoading}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-full border border-white/10 bg-zinc-900 px-5 text-xs font-bold text-white transition-all hover:bg-zinc-800 active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5" strokeWidth={1.2} />
                        Upload
                      </button>
                    </form>
                  </div>

                  <details className="group text-left border border-white/5 bg-zinc-950/30 rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden">
                    <summary className="flex items-center justify-between p-4 text-xs font-bold text-zinc-300 cursor-pointer hover:bg-white/5 select-none transition-colors">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-zinc-400" strokeWidth={1.2} />
                        <span>How to get your LinkedIn report file?</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-zinc-500 transition-transform duration-300 group-open:rotate-90" strokeWidth={1.2} />
                    </summary>
                    <div className="p-4 pt-0 border-t border-white/5 bg-zinc-950/20 text-xs text-zinc-400 space-y-3">
                      <p>To export your analytics report directly from LinkedIn:</p>
                      <ol className="list-decimal pl-4 space-y-2">
                        <li>
                          Go to your <strong>LinkedIn Creator Analytics</strong> dashboard (or visit <a href="https://www.linkedin.com/analytics/creator/" target="_blank" rel="noopener noreferrer" className="text-white underline hover:text-zinc-200">linkedin.com/analytics/creator/</a>).
                        </li>
                        <li>
                          Select the <strong>Past 365 Days</strong> (or your custom range) from the date filter at the top.
                        </li>
                        <li>
                          Click the <strong>Export</strong> button in the top right corner.
                        </li>
                        <li>
                          Save the downloaded Excel file (usually named <code>AggregateAnalytics_...xlsx</code>) and upload it here.
                        </li>
                      </ol>
                      <p className="text-[10px] text-zinc-500 italic">
                        Note: The exported sheet must contain the default worksheets: ENGAGEMENT, FOLLOWERS, DEMOGRAPHICS, and TOP POSTS.
                      </p>
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="mb-8 grid gap-4 md:grid-cols-4">
              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 border border-white/10">
                    <FileText className="h-4 w-4" strokeWidth={1.2} />
                  </div>
                  <h3 className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Analyzed Posts</h3>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="font-mono text-2xl font-semibold text-white">{posts.filter(p => p.analyzed).length}</p>
                  <p className="text-xs text-zinc-500 font-mono">/ {posts.length}</p>
                </div>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 border border-white/10">
                    <Activity className="h-4 w-4" strokeWidth={1.2} />
                  </div>
                  <h3 className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Impr.</h3>
                </div>
                <p className="font-mono text-2xl font-semibold text-white">{totalImpressions.toLocaleString()}</p>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 border border-white/10">
                    <BarChart2 className="h-4 w-4" strokeWidth={1.2} />
                  </div>
                  <h3 className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Avg ER%</h3>
                </div>
                <p className="font-mono text-2xl font-semibold text-white">{avgER}%</p>
              </div>

              <div className="rounded-3xl border border-white/5 bg-white/[0.02] p-5 backdrop-blur-xl transition-all duration-500 hover:border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-400 border border-white/10">
                    <Lightbulb className="h-4 w-4" strokeWidth={1.2} />
                  </div>
                  <h3 className="font-display text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Winning Style</h3>
                </div>
                <p className="font-sans text-sm font-semibold text-white truncate" title={bestPerformingHook}>{bestPerformingHook}</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-4">
              <div className="flex flex-wrap gap-2">
                {(["dashboard", "posts", "hook-intelligence", "ai-insights", "demographics"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 font-display ${
                      activeTab === tab
                        ? "bg-white text-black shadow-lg shadow-white/10"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                    }`}
                  >
                    {tab.replace("-", " ")}
                  </button>
                ))}
                <button
                  disabled
                  className="px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 font-display bg-white/5 text-zinc-600 border border-white/5 inline-flex items-center gap-1.5 opacity-50 cursor-not-allowed"
                  title="Post Writer is currently disabled"
                >
                  <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                  Post Writer
                </button>
              </div>

              {posts.some(p => !p.analyzed) && (
                <button
                  onClick={runAnalysisPipeline}
                  disabled={analyzing}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-5 text-xs font-bold text-black transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)]"
                >
                  {analyzing ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.2} />
                      Analyzing... ({analysisProgress}%)
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" strokeWidth={1.2} />
                      Run AI Analysis Pipeline
                    </>
                  )}
                </button>
              )}
            </div>

            {analyzing && analysisLogs.length > 0 && (
              <div className="animate-on-scroll rounded-2xl border border-white/10 bg-black/80 p-4 font-mono text-[10px] text-zinc-400 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <Terminal className="h-3.5 w-3.5 text-zinc-300" strokeWidth={1.2} />
                  <span className="font-bold text-white uppercase tracking-widest">Analysis Pipeline Logs</span>
                </div>
                <div className="h-32 overflow-y-auto space-y-1.5 scrollbar-thin">
                  {analysisLogs.map((log, idx) => (
                    <div key={idx} className={idx === 0 ? "text-white font-semibold" : "opacity-70"}>
                      <span className="text-zinc-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "dashboard" && (
              <DashboardOverview
                combinedMetrics={combinedMetrics}
                activeChartTab={activeChartTab}
                setActiveChartTab={setActiveChartTab}
                hookChartData={hookChartData}
                topicChartData={topicChartData}
                isMounted={isMounted}
                chartColors={chartColors}
              />
            )}

            {activeTab === "posts" && (
              <InteractivePostsTable
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterHookType={filterHookType}
                setFilterHookType={setFilterHookType}
                filterTopic={filterTopic}
                setFilterTopic={setFilterTopic}
                posts={posts}
                handleSort={handleSort}
                paginatedPosts={paginatedPosts}
                setModalPost={setModalPost}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                totalPages={totalPages}
                itemsPerPage={itemsPerPage}
                sortedPostsLength={sortedPosts.length}
              />
            )}

            {activeTab === "hook-intelligence" && (
              <HookIntelligence
                posts={posts}
                isMounted={isMounted}
                getHookLengthChartData={getHookLengthChartData}
                getSentenceStructureChartData={getSentenceStructureChartData}
                getTopOpeningWords={getTopOpeningWords}
                expandedStructure={expandedStructure}
                setExpandedStructure={setExpandedStructure}
                setModalPost={setModalPost}
                explorerDimension={explorerDimension}
                setExplorerDimension={setExplorerDimension}
                explorerValue={explorerValue}
                setExplorerValue={setExplorerValue}
                chartColors={chartColors}
              />
            )}

            {activeTab === "ai-insights" && (
              <AIInsights
                aiAnalysis={aiAnalysis}
                generateAIRecommendations={generateAIRecommendations}
                copyToClipboard={copyToClipboard}
                copiedHookIdx={copiedHookIdx}
              />
            )}

            {activeTab === "demographics" && (
              <Demographics
                demographics={demographics}
                getDemographicsGrouped={getDemographicsGrouped}
              />
            )}
          </div>
        )}
      </main>
      
      {/* ====================== POST DETAIL MODAL ====================== */}
      {modalPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={closeModal}>
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-zinc-950 p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h2 className="text-lg font-bold text-white">Post Details</h2>
              <button onClick={closeModal} className="text-zinc-500 hover:text-white">&times;</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs text-zinc-500">Post URL</p>
                <a href={modalPost.postUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline break-all">{modalPost.postUrl}</a>
              </div>
              <div>
                <p className="text-xs text-zinc-500">Hook</p>
                <p className="text-sm text-zinc-200">{modalPost.hook || "N/A"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Impressions</p>
                  <p className="text-sm text-zinc-200">{modalPost.impressions.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Engagements</p>
                  <p className="text-sm text-zinc-200">{modalPost.engagements.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Engagement Rate</p>
                  <p className="text-sm text-zinc-200">{modalPost.engagementRate.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Published</p>
                  <p className="text-sm text-zinc-200">{modalPost.publishedAt ? new Date(modalPost.publishedAt).toLocaleDateString() : "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
