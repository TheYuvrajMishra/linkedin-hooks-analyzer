"use client";

import { useState, useEffect, Fragment } from "react";
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
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

// Standard Types mapping to Prisma Schema
interface Post {
  id: string;
  postUrl: string;
  publishedAt: string | null;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postText: string | null;
  hook: string | null;
  hookType: string | null;
  topic: string | null;
  hookLength: number | null;
  openingWords: string | null;
  sentenceStructure: string | null;
  analyzed: boolean;
}

interface DailyMetric {
  id: string;
  date: string;
  impressions: number;
  engagements: number;
}

interface FollowerMetric {
  id: string;
  date: string;
  newFollowers: number;
}

interface DemographicMetric {
  id: string;
  category: string;
  value: string;
  percentage: number;
}

interface AIAnalysis {
  id: string;
  winningHooks: string[];
  winningTopics: string[];
  recommendations: string[];
  suggestedHooks?: Array<{ hookTemplate: string; hookType: string; topic: string; explanation: string }>;
  createdAt: string;
}

interface DBStatus {
  isFallback: boolean;
  databaseType: string;
  stats: {
    totalPosts: number;
    analyzedPosts: number;
    dailyMetricsCount: number;
    followerMetricsCount: number;
    demographicsCount: number;
    hasAIInsights: boolean;
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
  
  // Post Details expand state
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

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

  const chartColors = ["#ffffff", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46"];

  const CustomTooltip = ({ active, payload, label }: any) => {
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

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-200 antialiased selection:bg-white/20 selection:text-white relative overflow-hidden pb-12">
      {/* Subtle noise overlay only */}
      <div className="noise-overlay" />

      {/* Floating Glass Navbar */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className="pointer-events-auto flex w-full max-w-7xl items-center justify-between rounded-full border border-white/10 bg-zinc-950/65 px-6 py-3.5 backdrop-blur-xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:border-white/15">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5">
              <Sparkles className="h-4.5 w-4.5 text-white" strokeWidth={1.2} />
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

      {/* Main Content Workspace */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        
        {/* Loading Spinner */}
        {loadingStatus ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-white/60" strokeWidth={1.2} />
            <p className="text-sm text-zinc-400 font-medium">Initializing workspace database connection...</p>
          </div>
        ) : !dbStatus || dbStatus.stats.totalPosts === 0 ? (
          
          /* Empty State - Initial Configuration */
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

                {/* Action Progress Info */}
                {uploadProgress && (
                  <div className="mb-6 rounded-lg border border-white/10 bg-white/5 p-3.5 text-xs text-zinc-300 flex items-center justify-center gap-2">
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" strokeWidth={1.2} />
                    <span>{uploadProgress}</span>
                  </div>
                )}

                {/* Upload Card Options */}
                <div className="grid gap-6">
                  
                  {/* Option 1: Workspace Auto-Load (Preferred for direct spreadsheet) */}
                  <div className="rounded-2xl border border-white/5 bg-[#0e0e11]/50 p-6 text-left hover:border-white/10 transition-all duration-550">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                      <div>
                        <span className="inline-block rounded-full bg-white/5 border border-white/10 px-3 py-0.5 text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                          Fast Track
                        </span>
                        <h3 className="text-sm font-bold text-white font-display">Load Root Workspace Report</h3>
                        <p className="text-xs text-zinc-400 mt-1">
                          Use the pre-positioned file: <code className="text-zinc-300 bg-zinc-950 px-1.5 py-0.5 rounded">AggregateAnalytics_Yuvraj Mishra...xlsx</code>.
                        </p>
                      </div>
                      <button
                        onClick={handleAutoLoad}
                        disabled={actionLoading}
                        className="group flex items-center justify-between gap-4 rounded-full bg-white pl-6 pr-2 py-2 text-xs font-bold text-black shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer w-full sm:w-auto"
                      >
                        <span>Load Account Report</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/15 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                          <ChevronRight className="h-4 w-4 text-black" strokeWidth={1.2} />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-white/5"></div>
                    <span className="flex-shrink mx-4 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">or</span>
                    <div className="flex-grow border-t border-white/5"></div>
                  </div>

                  {/* Option 2: Drag & Drop Manual File Upload */}
                  <form onSubmit={handleFileUpload} className="space-y-4">
                    <div className="rounded-2xl border-2 border-dashed border-white/5 bg-[#0e0e11]/25 p-6 hover:border-white/10 transition-all cursor-pointer relative group">
                      <input
                        type="file"
                        accept=".xlsx, .csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setSelectedFile(file);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center">
                        <FileText className="h-8 w-8 text-zinc-500 group-hover:text-zinc-300 transition-colors mb-2" strokeWidth={1.2} />
                        <span className="text-xs font-semibold text-zinc-300 font-display">
                          {selectedFile ? selectedFile.name : "Select LinkedIn Excel report (.xlsx)"}
                        </span>
                        <span className="text-[9px] text-zinc-600 mt-1 font-mono">Maximum size: 50MB</span>
                      </div>
                    </div>

                    {selectedFile && (
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full flex h-11 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow-lg transition-all hover:bg-zinc-100 disabled:opacity-50 cursor-pointer"
                      >
                        Upload & Parse Selected File
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : (
          
          /* Active Dashboard Screen */
          <div className="space-y-8">
            
            {/* 1. Header Analysis Pipeline Status */}
            {dbStatus.stats.analyzedPosts < dbStatus.stats.totalPosts && (
              <div className="animate-on-scroll relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.03] p-2 shadow-xl backdrop-blur-md">
                <div className="h-full rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4.5 w-4.5 text-zinc-300" strokeWidth={1.2} />
                        <h2 className="font-display text-sm font-bold text-white uppercase tracking-wider">AI Hook Processing Pending</h2>
                      </div>
                      <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                        You loaded <span className="text-zinc-200 font-semibold">{dbStatus.stats.totalPosts} posts</span>.
                        The system needs to retrieve the post text and run classification models for Hook Type and Topics.
                      </p>
                      
                      {/* Scraper Status Info */}
                      <div className="flex items-center gap-2 pt-1 text-[10px] text-zinc-500">
                        <Shield className="h-3.5 w-3.5 text-zinc-400" strokeWidth={1.2} />
                        <span>Headless Puppeteer Scraper active (visits live URLs to extract actual post content).</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <button
                        onClick={runAnalysisPipeline}
                        disabled={analyzing || actionLoading}
                        className="group relative flex items-center justify-between gap-6 rounded-full bg-white pl-6 pr-2 py-2 text-xs font-bold text-black shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                      >
                        <span className="tracking-wide">{analyzing ? "Analyzing Dataset..." : "Run AI Analysis Pipeline"}</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
                          <Zap className="h-4 w-4 text-black" strokeWidth={1.2} />
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {analyzing && (
                    <div className="mt-6 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-zinc-400">Processing Progress</span>
                        <span className="text-zinc-300 font-mono">{analysisProgress}% Complete</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-zinc-950 overflow-hidden">
                        <div
                          className="h-full bg-white/70 rounded-full transition-all duration-300"
                          style={{ width: `${analysisProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Terminal logs list */}
                  {analysisLogs.length > 0 && (
                    <div className="mt-4 rounded-xl border border-white/5 bg-zinc-950/90 p-4 font-mono text-[10px] text-zinc-400 shadow-inner max-h-36 overflow-y-auto space-y-1">
                      <div className="flex items-center gap-1.5 text-zinc-500 border-b border-white/5 pb-1.5 mb-1.5">
                        <Terminal className="h-3.5 w-3.5" strokeWidth={1.2} />
                        <span>Analysis Engine Console logs</span>
                      </div>
                      {analysisLogs.map((log, idx) => (
                        <div key={idx} className={log.startsWith("⚠️") ? "text-zinc-300" : log.startsWith("❌") ? "text-zinc-400" : log.startsWith("⭐") ? "text-white" : ""}>
                          {log}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Overview KPI statistics cards - Asymmetrical Bento Grid */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-12">
              
              {/* Card 1: Total Posts - Span 3 */}
              <div className="animate-on-scroll lg:col-span-3 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">Total Posts</span>
                    <FileText className="h-4 w-4 text-zinc-500" strokeWidth={1.2} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-white font-mono">{dbStatus.stats.totalPosts}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">
                    {dbStatus.stats.analyzedPosts} analyzed ({Math.round((dbStatus.stats.analyzedPosts / dbStatus.stats.totalPosts) * 100)}%)
                  </div>
                </div>
              </div>

              {/* Card 2: Total Impressions - Span 5 (Asymmetric larger card) */}
              <div className="animate-on-scroll lg:col-span-5 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">Total Impressions</span>
                    <Activity className="h-4 w-4 text-zinc-500" strokeWidth={1.2} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3.5xl font-display font-bold text-white font-mono">
                      {totalImpressions.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">Annual accumulated reach across all campaigns</div>
                </div>
              </div>

              {/* Card 3: Engagements - Span 4 */}
              <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">Engagements</span>
                    <Users className="h-4 w-4 text-zinc-500" strokeWidth={1.2} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-white font-mono">
                      {totalEngagements.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">Likes, comments, shares, and clicks</div>
                </div>
              </div>

              {/* Card 4: Avg. ER% - Span 4 (Highlighted in bento) */}
              <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/10 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/15">
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">Avg. ER%</span>
                    <TrendingUp className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-3xl font-display font-bold text-white font-mono">{avgER}%</span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500 font-medium">Benchmark industry rate: 2.0%</div>
                </div>
              </div>

              {/* Card 5: Best Hook Style - Span 4 */}
              <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">Best Hook Style</span>
                    <Sparkles className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-lg font-display font-bold text-white truncate max-w-full">
                      {bestPerformingHook}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">Highest average Engagement Rate</div>
                </div>
              </div>

              {/* Card 6: Top Content Topic - Span 4 */}
              <div className="animate-on-scroll lg:col-span-4 rounded-[2rem] border border-white/5 bg-white/5 p-1.5 backdrop-blur-md shadow-lg transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.02] hover:border-white/10">
                <div className="h-full rounded-[calc(2rem-0.375rem)] bg-[#09090b]/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-zinc-400 font-display">Top Content Topic</span>
                    <BookOpen className="h-4 w-4 text-zinc-300" strokeWidth={1.2} />
                  </div>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-lg font-display font-bold text-white truncate max-w-full">
                      {bestPerformingTopic}
                    </span>
                  </div>
                  <div className="mt-2 text-[10px] text-zinc-500">Audience content interest peak</div>
                </div>
              </div>
            </div>

            {/* 3. Navigation tabs */}
            <div className="animate-on-scroll border-b border-white/10 pb-1">
              <nav className="flex flex-wrap gap-2 sm:gap-6">
                {[
                  { id: "dashboard", label: "Analytics Overview", icon: BarChart2 },
                  { id: "posts", label: "Posts Table", icon: FileText },
                  { id: "hook-intelligence", label: "Hook Intelligence", icon: Sliders },
                  { id: "ai-insights", label: "AI Strategic Insights", icon: Sparkles },
                  { id: "demographics", label: "Demographics", icon: Users },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id as any);
                        setCurrentPage(1);
                      }}
                      className={`group flex items-center gap-2 border-b-2 py-3.5 px-1 text-xs font-semibold tracking-wider uppercase transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 cursor-pointer ${
                        isActive
                          ? "border-white text-white font-bold"
                          : "border-transparent text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      <Icon className={`h-3.5 w-3.5 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${isActive ? "text-white" : "text-zinc-500"}`} strokeWidth={1.2} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 4. Tab Views rendering */}
            
            {/* View A: Dashboard Overview Charts */}
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                
                {/* Daily Engagement trend lines — split layout */}
                {dailyMetrics.length > 0 && (
                  <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl">
                    <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                      <h3 className="font-display text-sm font-bold text-white mb-6 uppercase tracking-wider">Daily Audience Reach & Actions</h3>

                      {/* Top: Impressions area */}
                      <div>
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-display">Impressions</span>
                        <div className="h-44 w-full mt-2">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={dailyMetrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <defs>
                                  <linearGradient id="impGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#ffffff" stopOpacity={0.12} />
                                    <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis
                                  dataKey="date"
                                  stroke="#52525b"
                                  fontSize={9}
                                  tickLine={false}
                                  tickFormatter={(date) => {
                                    try { const d = new Date(date); return `${d.getMonth()+1}/${d.getDate()}`; } catch(e) { return date; }
                                  }}
                                />
                                <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                  type="monotone"
                                  dataKey="impressions"
                                  name="Impressions"
                                  stroke="#ffffff"
                                  strokeWidth={1.5}
                                  fill="url(#impGrad)"
                                  dot={false}
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>

                      {/* Bottom: Engagements bar */}
                      <div className="mt-6 border-t border-white/5 pt-4">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest font-display">Engagements</span>
                        <div className="h-28 w-full mt-2">
                          {isMounted && (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={dailyMetrics} margin={{ top: 0, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis
                                  dataKey="date"
                                  stroke="#52525b"
                                  fontSize={9}
                                  tickLine={false}
                                  tickFormatter={(date) => {
                                    try { const d = new Date(date); return `${d.getMonth()+1}/${d.getDate()}`; } catch(e) { return date; }
                                  }}
                                />
                                <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="engagements" name="Engagements" fill="#ffffff" fillOpacity={0.18} radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
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
                        <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">Engagement Rate by Hook Style</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Average ER% calculated across classified categories</p>
                      </div>
                      <div className="h-64 w-full">
                        {isMounted && hookChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={hookChartData} margin={{ bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                              <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                              <YAxis stroke="#6b7280" fontSize={9} tickLine={false} label={{ value: 'ER %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 9 } }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill={chartColors[0]} radius={[3, 3, 0, 0]}>
                                {hookChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
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
                        <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">Engagement Rate by Topic</h3>
                        <p className="text-[10px] text-zinc-500 mt-1">Comparison of audience engagement across core subject matters</p>
                      </div>
                      <div className="h-64 w-full">
                        {isMounted && topicChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topicChartData} margin={{ bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                              <XAxis dataKey="name" stroke="#6b7280" fontSize={9} tickLine={false} />
                              <YAxis stroke="#6b7280" fontSize={9} tickLine={false} label={{ value: 'ER %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 9 } }} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill={chartColors[0]} radius={[3, 3, 0, 0]}>
                                {topicChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
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

                {/* Follower metrics growth */}
                {followerMetrics.length > 0 && (
                  <div className="animate-on-scroll rounded-[2.5rem] border border-white/5 bg-white/5 p-2 backdrop-blur-2xl transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] shadow-xl">
                    <div className="rounded-[calc(2.5rem-0.5rem)] bg-[#09090b]/80 p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)]">
                      <h3 className="font-display text-sm font-bold text-white mb-6 uppercase tracking-wider">Follower Gains Trend</h3>
                      <div className="h-64 w-full">
                        {isMounted && (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={followerMetrics} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="followerGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.10} />
                                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                              <XAxis
                                dataKey="date"
                                stroke="#52525b"
                                fontSize={9}
                                tickLine={false}
                                tickFormatter={(date) => {
                                  try {
                                    const d = new Date(date);
                                    return `${d.getMonth() + 1}/${d.getDate()}`;
                                  } catch (e) {
                                    return date;
                                  }
                                }}
                              />
                              <YAxis stroke="#52525b" fontSize={9} tickLine={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Area
                                type="monotone"
                                dataKey="newFollowers"
                                name="New Followers"
                                stroke="#a1a1aa"
                                strokeWidth={1.5}
                                fill="url(#followerGrad)"
                                dot={false}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* View B: Interactive Posts Table */}
            {activeTab === "posts" && (
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
                          paginatedPosts.map((post) => {
                            const isPostExpanded = expandedPostId === post.id;
                            return (
                              <Fragment key={post.id}>
                                <tr 
                                  onClick={() => setExpandedPostId(isPostExpanded ? null : post.id)}
                                  className="hover:bg-white/5 transition-colors cursor-pointer select-none"
                                >
                                  <td className="p-4 text-zinc-500 font-medium font-sans">
                                    {post.publishedAt 
                                      ? new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                      : "N/A"}
                                  </td>
                                  <td className="p-4 font-normal">
                                    {post.analyzed ? (
                                      <div className="flex items-center gap-2">
                                        <ChevronRight className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 flex-shrink-0 ${isPostExpanded ? "rotate-90 text-white" : ""}`} strokeWidth={1.2} />
                                        <div className={`text-zinc-200 pr-4 italic ${isPostExpanded ? "" : "line-clamp-2"}`}>
                                          "{post.hook}"
                                        </div>
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
                                {isPostExpanded && post.postText && (
                                  <tr className="bg-zinc-950/20">
                                    <td colSpan={8} className="p-4 border-b border-white/5">
                                      <div className="rounded-2xl border border-white/5 bg-zinc-950/50 p-4 shadow-inner">
                                        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2 font-display">Full Post Content</div>
                                        <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono select-text bg-[#030303]/30 p-4 rounded-xl border border-white/[0.02]">
                                          {post.postText}
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
                        {Math.min(currentPage * itemsPerPage, sortedPosts.length)} of{" "}
                        {sortedPosts.length} posts
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
            )}

            {/* View C: Hook Intelligence */}
            {activeTab === "hook-intelligence" && (
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
                                                <div key={p.id || pIdx} className="rounded-xl border border-white/5 bg-[#09090b] p-4 shadow-md hover:border-white/10 transition-all duration-550 hover:scale-[1.01]">
                                                  <div className="flex items-start justify-between gap-2 mb-3">
                                                    <span className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[9px] font-bold text-zinc-400 border border-white/10 font-mono">
                                                      #{pIdx + 1}
                                                    </span>
                                                    <a
                                                      href={p.postUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-white transition-colors"
                                                    >
                                                      View Post <ExternalLink className="h-3 w-3" strokeWidth={1.2} />
                                                    </a>
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
                                className={`group relative rounded-2xl border p-5 shadow-lg transition-all duration-350 hover:scale-[1.01] ${
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
                                  <a
                                    href={post.postUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-bold text-zinc-400 group-hover:text-white transition-colors"
                                  >
                                    Open Post <ExternalLink className="h-3 w-3" strokeWidth={1.2} />
                                  </a>
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
            )}

            {/* View D: AI Insights & Recommendations */}
            {activeTab === "ai-insights" && (
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
            )}

            {/* View E: Demographics */}
            {activeTab === "demographics" && (
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
            )}

          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-7xl px-4 mt-16 border-t border-white/5 py-8 text-center text-xs text-zinc-650 sm:px-6 lg:px-8">
        <p>© 2026 Linkedin Looker. All rights reserved. Locally executed for {dbStatus?.stats.totalPosts ? "Yuvraj Mishra" : "your account"}.</p>
      </footer>
    </div>
  );
}
