"use client";

import { useState, useEffect, Fragment } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  TooltipProps,
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

        // Fetch other metrics directly from DB state endpoint helper if they were populated
        // To be thorough, let's fetch daily metrics, follower metrics, demographics, and AI analysis
        const dailyRes = await fetch("/api/db-status"); // We get totals, but let's query the specific content
        // We will fetch posts and latest AI analysis
        const aiRes = await fetch("/api/analysis/latest");
        const aiData = await aiRes.json();
        setAiAnalysis(aiData.analysis);

        // Fetch remaining metrics from custom routes if we need them, but we can also extract daily/followers
        // from a separate state helper or mock/aggregate them.
        // Let's query db-status which has totals, let's add custom routes to get raw daily/followers if we need
        // Or we can retrieve them in db-status! Let's modify db-status later if needed, but actually we returned them!
        // Wait, does db-status return raw metrics lists? No, it returned counts.
        // Let's make a quick route `/api/metrics` to return daily, followers, and demographics!
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
      // Let's create an API route for `/api/metrics` next, or fetch them from a consolidated endpoint.
      // For now, let's fetch from our custom `/api/metrics` route which we will write shortly.
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
      // Re-run the recommendations generation if all posts are analyzed but no recommendations
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
          // Update posts state with analyzed details
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

    // Generate AI recommendations now
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

  // --- Search, Filtering and Sorting ---
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

  // Pagination
  const totalPages = Math.ceil(sortedPosts.length / itemsPerPage);
  const paginatedPosts = sortedPosts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // --- Aggregate Charts Calculations ---
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
    // Length categories
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
      // Get the first word, lowercase it, clean non-alpha
      const firstWord = p.hook.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") || "";
      if (firstWord.length < 3) return; // skip small connecting words
      
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

  // Demographic grouping
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

  // KPI Calculations
  const totalImpressions = posts.reduce((sum, p) => sum + p.impressions, 0);
  const totalEngagements = posts.reduce((sum, p) => sum + p.engagements, 0);
  const avgER = totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(2) : "0.00";
  
  const hookChartData = getHookTypeChartData();
  const topicChartData = getTopicChartData();
  const bestPerformingHook = hookChartData[0]?.name || "N/A";
  const bestPerformingTopic = topicChartData[0]?.name || "N/A";

  const chartColors = ["#818cf8", "#c084fc", "#fb7185", "#34d399", "#fbbf24", "#38bdf8"];

  // Custom tooltips for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-xl">
          <p className="text-sm font-semibold text-zinc-300">{label}</p>
          <div className="mt-2 space-y-1">
            {payload.map((item: any, index: number) => (
              <p key={index} className="text-xs" style={{ color: item.color || item.fill }}>
                {item.name}: {item.value} {item.name.toLowerCase().includes("rate") ? "%" : ""}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 font-sans text-zinc-200 antialiased selection:bg-indigo-600 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white sm:text-xl">HookCraft AI</h1>
              <p className="hidden text-xs text-zinc-400 sm:block">LinkedIn Hooks Intelligence Dashboard</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {dbStatus && (
              <div className="flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium border border-zinc-800">
                <Database className="h-3.5 w-3.5 text-zinc-400" />
                <span className="text-zinc-400">Mode:</span>
                <span className={dbStatus.isFallback ? "text-amber-400" : "text-emerald-400"}>
                  {dbStatus.databaseType}
                </span>
              </div>
            )}
            
            {dbStatus && dbStatus.stats.totalPosts > 0 && (
              <button
                onClick={handleClearDatabase}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg border border-red-950 bg-red-950/30 px-3 py-1.5 text-xs font-semibold text-red-400 transition-all hover:bg-red-950/60 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Loading Spinner */}
        {loadingStatus ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-indigo-500" />
            <p className="text-sm text-zinc-400">Initializing workspace database connection...</p>
          </div>
        ) : !dbStatus || dbStatus.stats.totalPosts === 0 ? (
          
          /* Empty State - Initial Configuration */
          <div className="mx-auto max-w-2xl">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 border border-zinc-700 text-zinc-400 mb-6 shadow-inner animate-pulse">
                <Upload className="h-6 w-6 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Analyze Your LinkedIn Performance</h2>
              <p className="text-sm text-zinc-400 mb-8 max-w-md mx-auto">
                Upload your LinkedIn analytics Excel spreadsheet report to profile your hooks, topics, and metrics.
              </p>

              {/* Action Progress Info */}
              {uploadProgress && (
                <div className="mb-6 rounded-lg border border-indigo-900 bg-indigo-950/50 p-3 text-xs text-indigo-300 flex items-center justify-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>{uploadProgress}</span>
                </div>
              )}

              {/* Upload Card Options */}
              <div className="grid gap-6">
                
                {/* Option 1: Workspace Auto-Load (Preferred for direct spreadsheet) */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-5 text-left hover:border-zinc-700 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block rounded-md bg-indigo-950 border border-indigo-900 px-2 py-0.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">
                        Fast Track
                      </span>
                      <h3 className="text-sm font-semibold text-white">Load Root Workspace Report</h3>
                      <p className="text-xs text-zinc-400 mt-1">
                        Use the pre-positioned file: <code className="text-zinc-300">AggregateAnalytics_Yuvraj Mishra...xlsx</code> in this directory.
                      </p>
                    </div>
                    <button
                      onClick={handleAutoLoad}
                      disabled={actionLoading}
                      className="flex h-10 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Load Account Report
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-zinc-800"></div>
                  <span className="flex-shrink mx-4 text-xs font-bold text-zinc-600 uppercase tracking-wider">or</span>
                  <div className="flex-grow border-t border-zinc-800"></div>
                </div>

                {/* Option 2: Drag & Drop Manual File Upload */}
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="rounded-xl border-2 border-dashed border-zinc-800 bg-zinc-950/20 p-6 hover:border-zinc-700 transition-all cursor-pointer relative group">
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
                      <FileText className="h-8 w-8 text-zinc-500 group-hover:text-indigo-400 transition-colors mb-2" />
                      <span className="text-xs font-semibold text-zinc-300">
                        {selectedFile ? selectedFile.name : "Select LinkedIn Excel report (.xlsx)"}
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-1">Maximum size: 50MB</span>
                    </div>
                  </div>

                  {selectedFile && (
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full flex h-10 items-center justify-center rounded-lg bg-indigo-600 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 disabled:opacity-50"
                    >
                      Upload & Parse Selected File
                    </button>
                  )}
                </form>
              </div>
            </div>
          </div>
        ) : (
          
          /* Active Dashboard Screen */
          <div className="space-y-8">
            
            {/* 1. Header Analysis Pipeline Status */}
            {dbStatus.stats.analyzedPosts < dbStatus.stats.totalPosts && (
              <div className="relative overflow-hidden rounded-2xl border border-indigo-900 bg-gradient-to-r from-indigo-950/40 via-zinc-900/60 to-indigo-950/40 p-6 shadow-xl backdrop-blur-md">
                <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/5 blur-3xl"></div>
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                      <h2 className="text-base font-bold text-white">AI Hook Processing Pending</h2>
                    </div>
                    <p className="text-xs text-zinc-400 max-w-xl">
                      You loaded <span className="text-zinc-200 font-semibold">{dbStatus.stats.totalPosts} posts</span>.
                      The system needs to retrieve the post text and run classification models for Hook Type and Topics.
                    </p>
                    
                    {/* Scraper Status Info */}
                    <div className="flex items-center gap-2 pt-2 text-[10.5px] text-zinc-400">
                      <Shield className="h-3.5 w-3.5 text-emerald-500" />
                      <span>Headless Puppeteer Scraper active (visits live URLs to extract actual post content).</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <button
                      onClick={runAnalysisPipeline}
                      disabled={analyzing || actionLoading}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 text-xs font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:scale-[1.02] hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
                    >
                      <Zap className="h-4 w-4" />
                      <span>{analyzing ? "Analyzing Dataset..." : "Run AI Analysis Pipeline"}</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {analyzing && (
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-zinc-400">Processing Progress</span>
                      <span className="text-indigo-400">{analysisProgress}% Complete</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-zinc-950 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-300"
                        style={{ width: `${analysisProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Terminal logs list */}
                {analysisLogs.length > 0 && (
                  <div className="mt-4 rounded-xl border border-zinc-950 bg-zinc-950/80 p-4 font-mono text-[10px] text-zinc-400 shadow-inner max-h-36 overflow-y-auto space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500 border-b border-zinc-900 pb-1.5 mb-1.5">
                      <Terminal className="h-3 w-3" />
                      <span>Analysis Engine Console logs</span>
                    </div>
                    {analysisLogs.map((log, idx) => (
                      <div key={idx} className={log.startsWith("⚠️") ? "text-amber-400" : log.startsWith("❌") ? "text-red-400" : log.startsWith("⭐") ? "text-emerald-400" : ""}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. Overview KPI statistics cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
              
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Total Posts</span>
                  <FileText className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">{dbStatus.stats.totalPosts}</span>
                  <span className="text-[10px] text-zinc-500 font-semibold">posts</span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">
                  {dbStatus.stats.analyzedPosts} analyzed ({Math.round((dbStatus.stats.analyzedPosts / dbStatus.stats.totalPosts) * 100)}%)
                </div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Total Impressions</span>
                  <Activity className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {totalImpressions.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">Annual accumulated reach</div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Engagements</span>
                  <Users className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-white">
                    {totalEngagements.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">Likes, comments, shares</div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Avg. ER%</span>
                  <TrendingUp className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-indigo-400">{avgER}%</span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">Benchmark rate: 2.0%</div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Best Hook Style</span>
                  <Sparkles className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold tracking-tight text-purple-400 truncate max-w-full">
                    {bestPerformingHook}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">Highest Engagement Rate</div>
              </div>

              <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-5 shadow-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-400">Top Content Topic</span>
                  <BookOpen className="h-4 w-4 text-zinc-500" />
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-bold tracking-tight text-sky-400 truncate max-w-full">
                    {bestPerformingTopic}
                  </span>
                </div>
                <div className="mt-1 text-[10px] text-zinc-500">Audience interest peak</div>
              </div>
            </div>

            {/* 3. Navigation tabs */}
            <div className="border-b border-zinc-900">
              <nav className="flex space-x-6">
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
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 border-b-2 py-3 px-1 text-sm font-semibold transition-all ${
                        isActive
                          ? "border-indigo-500 text-white font-bold"
                          : "border-transparent text-zinc-400 hover:border-zinc-800 hover:text-zinc-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
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
                
                {/* Daily Engagement trend lines */}
                {dailyMetrics.length > 0 && (
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-4">Daily Audience Reach & Actions</h3>
                    <div className="h-72 w-full">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={dailyMetrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis
                              dataKey="date"
                              stroke="#6b7280"
                              fontSize={10}
                              tickFormatter={(date) => {
                                try {
                                  const d = new Date(date);
                                  return `${d.getMonth() + 1}/${d.getDate()}`;
                                } catch (e) {
                                  return date;
                                }
                              }}
                            />
                            <YAxis yAxisId="left" stroke="#818cf8" fontSize={10} />
                            <YAxis yAxisId="right" orientation="right" stroke="#34d399" fontSize={10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line
                              yAxisId="left"
                              type="monotone"
                              dataKey="impressions"
                              name="Impressions"
                              stroke="#818cf8"
                              strokeWidth={2}
                              dot={false}
                            />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="engagements"
                              name="Engagements"
                              stroke="#34d399"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                )}

                {/* Grid for Topic and Hook Type Bar Charts */}
                <div className="grid gap-6 md:grid-cols-2">
                  
                  {/* Hook style chart */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white">Engagement Rate by Hook Style</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Average ER% calculated across classified categories</p>
                    </div>
                    <div className="h-64 w-full">
                      {isMounted && hookChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={hookChartData} margin={{ bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                            <YAxis stroke="#6b7280" fontSize={10} label={{ value: 'ER %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 10 } }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill="#a78bfa" radius={[4, 4, 0, 0]}>
                              {hookChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          AI Hook classifications pending. Run pipeline to visualize.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Topic chart */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white">Engagement Rate by Topic</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Comparison of audience engagement across core subject matters</p>
                    </div>
                    <div className="h-64 w-full">
                      {isMounted && topicChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={topicChartData} margin={{ bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                            <YAxis stroke="#6b7280" fontSize={10} label={{ value: 'ER %', angle: -90, position: 'insideLeft', style: { fill: '#6b7280', fontSize: 10 } }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill="#38bdf8" radius={[4, 4, 0, 0]}>
                              {topicChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[(index + 2) % chartColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          AI Topic classifications pending. Run pipeline to visualize.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Follower metrics growth */}
                {followerMetrics.length > 0 && (
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                    <h3 className="text-sm font-bold text-white mb-4">Follower Gains Trend</h3>
                    <div className="h-64 w-full">
                      {isMounted && (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={followerMetrics}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis
                              dataKey="date"
                              stroke="#6b7280"
                              fontSize={10}
                              tickFormatter={(date) => {
                                try {
                                  const d = new Date(date);
                                  return `${d.getMonth() + 1}/${d.getDate()}`;
                                } catch (e) {
                                  return date;
                                }
                              }}
                            />
                            <YAxis stroke="#c084fc" fontSize={10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line
                              type="monotone"
                              dataKey="newFollowers"
                              name="New Followers"
                              stroke="#c084fc"
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* View B: Interactive Posts Table */}
            {activeTab === "posts" && (
              <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 shadow-xl backdrop-blur-md overflow-hidden">
                
                {/* Filters Row */}
                <div className="flex flex-col gap-4 border-b border-zinc-900 bg-zinc-950/40 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="relative max-w-xs flex-grow">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search hook, text or URL..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-4 text-xs text-zinc-300 placeholder-zinc-500 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Filter Hook Type */}
                    <div className="flex items-center gap-2">
                      <Filter className="h-3.5 w-3.5 text-zinc-500" />
                      <select
                        value={filterHookType}
                        onChange={(e) => {
                          setFilterHookType(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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
                        className="rounded-lg border border-zinc-800 bg-zinc-950 py-1.5 px-3 text-xs text-zinc-300 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
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
                    <thead className="bg-zinc-950/60 text-zinc-400 font-bold border-b border-zinc-900">
                      <tr>
                        <th className="p-4">Publish Date</th>
                        <th className="p-4 w-1/3">Hook Opening</th>
                        <th className="p-4">Hook Style</th>
                        <th className="p-4">Topic</th>
                        <th 
                          onClick={() => handleSort("impressions")}
                          className="p-4 text-right cursor-pointer hover:text-white select-none"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Impressions</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("engagements")}
                          className="p-4 text-right cursor-pointer hover:text-white select-none"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>Engagements</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort("engagementRate")}
                          className="p-4 text-right cursor-pointer hover:text-white select-none"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span>ER%</span>
                            <ArrowUpDown className="h-3 w-3" />
                          </div>
                        </th>
                        <th className="p-4 text-center">Post</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-900/60 bg-zinc-900/10">
                      {paginatedPosts.length > 0 ? (
                        paginatedPosts.map((post) => {
                          const isPostExpanded = expandedPostId === post.id;
                          return (
                            <Fragment key={post.id}>
                              <tr 
                                onClick={() => setExpandedPostId(isPostExpanded ? null : post.id)}
                                className="hover:bg-zinc-900/20 transition-colors cursor-pointer select-none"
                              >
                                <td className="p-4 text-zinc-400 font-medium">
                                  {post.publishedAt 
                                    ? new Date(post.publishedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                    : "N/A"}
                                </td>
                                <td className="p-4 font-normal">
                                  {post.analyzed ? (
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 flex-shrink-0 ${isPostExpanded ? "rotate-90 text-indigo-400" : ""}`} />
                                      <div className={`text-zinc-200 pr-4 italic ${isPostExpanded ? "" : "line-clamp-2"}`}>
                                        "{post.hook}"
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-zinc-500 flex items-center gap-1.5">
                                      <AlertCircle className="h-3 w-3 text-amber-500 flex-shrink-0" />
                                      <span className="truncate max-w-[200px]">{post.postUrl}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="p-4">
                                  {post.hookType ? (
                                    <span className="inline-block rounded-md border border-purple-900 bg-purple-950/40 px-2 py-0.5 text-[10px] font-bold text-purple-400">
                                      {post.hookType}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-zinc-600 italic">Unprocessed</span>
                                  )}
                                </td>
                                <td className="p-4">
                                  {post.topic ? (
                                    <span className="inline-block rounded-md border border-sky-900 bg-sky-950/40 px-2 py-0.5 text-[10px] font-bold text-sky-400">
                                      {post.topic}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-zinc-600 italic">Unprocessed</span>
                                  )}
                                </td>
                                <td className="p-4 text-right text-zinc-300 font-semibold">
                                  {post.impressions.toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-zinc-300 font-semibold">
                                  {post.engagements.toLocaleString()}
                                </td>
                                <td className="p-4 text-right text-indigo-400 font-bold">
                                  {post.engagementRate.toFixed(2)}%
                                </td>
                                <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                                  <a
                                    href={post.postUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-colors"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                </td>
                              </tr>
                              {isPostExpanded && post.postText && (
                                <tr className="bg-zinc-950/15">
                                  <td colSpan={8} className="p-4 border-b border-zinc-900/60">
                                    <div className="rounded-lg border border-zinc-900 bg-zinc-950/50 p-4 shadow-inner">
                                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Full Post Content</div>
                                      <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap font-mono">
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
                  <div className="flex items-center justify-between border-t border-zinc-900 bg-zinc-950/40 px-5 py-4">
                    <div className="text-xs text-zinc-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                      {Math.min(currentPage * itemsPerPage, sortedPosts.length)} of{" "}
                      {sortedPosts.length} posts
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <span className="text-xs text-zinc-300 font-semibold px-2">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* View C: Hook Intelligence */}
            {activeTab === "hook-intelligence" && (
              <div className="space-y-6">
                
                {/* Overview cards of hook insights */}
                <div className="grid gap-6 md:grid-cols-3">
                  
                  {/* Hook Length analysis */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white">Engagement Rate by Hook Length</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Comparing character counts (Short, Medium, Long)</p>
                    </div>
                    <div className="h-56 w-full">
                      {isMounted && posts.some((p) => p.analyzed && p.hookLength !== null) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getHookLengthChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={9} />
                            <YAxis stroke="#6b7280" fontSize={10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill="#a78bfa" radius={[4, 4, 0, 0]}>
                              {getHookLengthChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          Run analysis pipeline to populate hook length analytics.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sentence Structures analysis */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white">Engagement Rate by Sentence Structure</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Comparison of opening copy sentence styles</p>
                    </div>
                    <div className="h-56 w-full">
                      {isMounted && posts.some((p) => p.analyzed && p.sentenceStructure) ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getSentenceStructureChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={8} tickFormatter={(val) => val.split(" ")[0]} />
                            <YAxis stroke="#6b7280" fontSize={10} />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="avgEngagementRate" name="Avg. Engagement Rate" fill="#fb7185" radius={[4, 4, 0, 0]}>
                              {getSentenceStructureChartData().map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={chartColors[(index + 3) % chartColors.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                          Run analysis pipeline to profile sentence structure metrics.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Opening Words list */}
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                    <div className="mb-4">
                      <h3 className="text-sm font-bold text-white">Top Opening Hook Words</h3>
                      <p className="text-[10px] text-zinc-500 mt-1">First words of hooks sorted by frequency & impact</p>
                    </div>
                    <div className="space-y-3">
                      {posts.some((p) => p.analyzed && p.hook) ? (
                        getTopOpeningWords().map((wordData, idx) => (
                          <div key={idx} className="flex items-center justify-between border-b border-zinc-800 pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-zinc-400">#{idx + 1}</span>
                              <span className="text-xs font-bold text-white">"{wordData.word}"</span>
                              <span className="text-[10px] text-zinc-500">({wordData.count} posts)</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] text-zinc-400">{wordData.avgImpressions.toLocaleString()} imp</span>
                              <span className="text-xs font-bold text-indigo-400">{wordData.avgEngagementRate}% ER</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex h-36 items-center justify-center text-xs text-zinc-500">
                          Analyze posts to extract opening word distributions.
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Additional Hook Intelligence detailed view */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                  <h3 className="text-sm font-bold text-white mb-4">Deep Sentence Structure Engagement Table</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-zinc-950/40 text-zinc-400 font-bold border-b border-zinc-900">
                        <tr>
                          <th className="p-3">Structure Model</th>
                          <th className="p-3">Count</th>
                          <th className="p-3 text-right">Avg Impressions</th>
                          <th className="p-3 text-right">Avg Engagement Rate</th>
                          <th className="p-3">Opening Examples</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/40">
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
                                  className="hover:bg-zinc-900/20 transition-colors cursor-pointer select-none border-b border-zinc-900/40"
                                >
                                  <td className="p-3 font-semibold text-zinc-200">
                                    <div className="flex items-center gap-2">
                                      <ChevronRight className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${isExpanded ? "rotate-90 text-indigo-400" : ""}`} />
                                      <span>{struct.name}</span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-zinc-400">{struct.count} posts</td>
                                  <td className="p-3 text-right text-zinc-300">{struct.avgImpressions.toLocaleString()}</td>
                                  <td className="p-3 text-right text-indigo-400 font-bold">{struct.avgEngagementRate.toFixed(2)}%</td>
                                  <td className="p-3 text-zinc-500 italic max-w-sm truncate">"{examples}"</td>
                                </tr>
                                {isExpanded && (
                                  <tr className="bg-zinc-950/20">
                                    <td colSpan={5} className="p-4 border-b border-zinc-900">
                                      <div className="space-y-3">
                                        <div className="text-[11px] font-bold text-zinc-400 flex items-center justify-between">
                                          <span>All posts matching "{struct.name}" (sorted by Engagement Rate):</span>
                                        </div>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                          {posts
                                            .filter((p) => p.analyzed && p.sentenceStructure === struct.name)
                                            .sort((a, b) => b.engagementRate - a.engagementRate)
                                            .map((p, pIdx) => (
                                              <div key={p.id || pIdx} className="rounded-lg border border-zinc-900 bg-zinc-900/40 p-3 shadow-md hover:border-zinc-800 transition-all">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                  <span className="inline-flex items-center gap-1 rounded bg-indigo-950 px-1.5 py-0.5 text-[9px] font-semibold text-indigo-400 border border-indigo-900">
                                                    #{pIdx + 1}
                                                  </span>
                                                  <a
                                                    href={p.postUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-white transition-colors"
                                                  >
                                                    View Post <ExternalLink className="h-2.5 w-2.5" />
                                                  </a>
                                                </div>
                                                <p className="text-[11px] text-zinc-300 line-clamp-3 mb-2 italic">
                                                  "{p.hook || p.postText || "(No hook text)"}"
                                                </p>
                                                <div className="grid grid-cols-3 gap-2 border-t border-zinc-900/40 pt-2 text-[9px] text-zinc-500">
                                                  <div>
                                                    <span className="block text-zinc-500">Impressions</span>
                                                    <span className="text-zinc-300 font-bold">{p.impressions.toLocaleString()}</span>
                                                  </div>
                                                  <div>
                                                    <span className="block text-zinc-500">Engagements</span>
                                                    <span className="text-zinc-300 font-bold">{p.engagements.toLocaleString()}</span>
                                                  </div>
                                                  <div>
                                                    <span className="block text-zinc-500">ER</span>
                                                    <span className="text-indigo-400 font-bold">{p.engagementRate.toFixed(2)}%</span>
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

                {/* Interactive Winning Reels Inspector */}
                <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Zap className="h-4 w-4 text-amber-400" />
                        <span>🏆 Hook Performance Deep-Dive Explorer</span>
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-1">Select a metric segment below to see the exact LinkedIn posts (reels) that used it and won</p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Filter by Dimension */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span>Segment by:</span>
                        <select
                          value={explorerDimension}
                          onChange={(e) => {
                            const newDim = e.target.value as any;
                            setExplorerDimension(newDim);
                            // Auto-select first option of the new dimension
                            if (newDim === "hookType") {
                              setExplorerValue("Curiosity");
                            } else if (newDim === "sentenceStructure") {
                              setExplorerValue("First-Person Narrative");
                            } else {
                              setExplorerValue("Medium (101-200 chars)");
                            }
                          }}
                          className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="hookType">Hook Style (AI)</option>
                          <option value="sentenceStructure">Sentence Structure</option>
                          <option value="hookLength">Hook Character Length</option>
                        </select>
                      </div>

                      {/* Filter by Value */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <span>Value:</span>
                        <select
                          value={explorerValue}
                          onChange={(e) => setExplorerValue(e.target.value)}
                          className="rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                          <div className="flex h-36 items-center justify-center text-xs text-zinc-500 italic border border-dashed border-zinc-800 rounded-xl">
                            No analyzed posts found in this segment. Try another option or run the analysis.
                          </div>
                        );
                      }

                      return (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {matchingPosts.map((post, idx) => (
                            <div
                              key={post.id || idx}
                              className={`group relative rounded-xl border p-4 shadow-lg transition-all duration-300 ${
                                idx === 0 
                                  ? "border-amber-500/30 bg-amber-950/5 hover:border-amber-500/50" 
                                  : "border-zinc-900 bg-zinc-900/30 hover:border-zinc-800"
                              }`}
                            >
                              {/* Trophy badge for top performer */}
                              {idx === 0 && (
                                <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black shadow-lg">
                                  🏆
                                </span>
                              )}
                              
                              <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2 mb-3 text-[10px]">
                                <span className="font-bold text-zinc-500">Post #{idx + 1}</span>
                                <a
                                  href={post.postUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors"
                                >
                                  Open Post <ExternalLink className="h-3 w-3" />
                                </a>
                              </div>
                              
                              {/* Hook text */}
                              <div className="min-h-[64px] text-xs text-zinc-200 leading-relaxed italic bg-zinc-950/20 rounded p-2.5 mb-3 max-h-24 overflow-y-auto font-mono scrollbar-thin">
                                "{post.hook || post.postText || "(No hook content)"}"
                              </div>
                              
                              {/* Performance grid */}
                              <div className="grid grid-cols-3 gap-2 text-center text-[10px] border-t border-zinc-900/40 pt-3">
                                <div className="border-r border-zinc-900/40">
                                  <span className="text-zinc-500 block">Impressions</span>
                                  <span className="text-zinc-200 font-bold font-mono">{post.impressions.toLocaleString()}</span>
                                </div>
                                <div className="border-r border-zinc-900/40">
                                  <span className="text-zinc-500 block">Engagements</span>
                                  <span className="text-zinc-200 font-bold font-mono">{post.engagements.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-zinc-500 block">Engagement Rate</span>
                                  <span className="text-indigo-400 font-extrabold font-mono text-[11px]">{post.engagementRate.toFixed(2)}%</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="flex h-36 items-center justify-center text-xs text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                      Run the analysis pipeline to inspect hook performance details.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* View D: AI Insights & Recommendations */}
            {activeTab === "ai-insights" && (
              <div className="space-y-6">
                
                {/* AI Insights Card */}
                {aiAnalysis ? (
                  <>
                    <div className="grid gap-6 md:grid-cols-3">
                    
                    {/* Winning Hooks Card */}
                    <div className="rounded-2xl border border-zinc-900 bg-gradient-to-b from-purple-950/20 to-zinc-950/50 p-6 shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5 text-purple-400" />
                        <h3 className="text-base font-bold text-white">Winning Hook Patterns</h3>
                      </div>
                      <ul className="space-y-4">
                        {aiAnalysis.winningHooks.map((hookInsight, idx) => (
                          <li key={idx} className="flex gap-3 text-xs leading-relaxed text-zinc-300">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-purple-950 text-[10px] font-bold text-purple-400 border border-purple-900">
                              {idx + 1}
                            </span>
                            <span>{hookInsight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Winning Topics Card */}
                    <div className="rounded-2xl border border-zinc-900 bg-gradient-to-b from-sky-950/20 to-zinc-950/50 p-6 shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="h-5 w-5 text-sky-400" />
                        <h3 className="text-base font-bold text-white">Winning Topics</h3>
                      </div>
                      <ul className="space-y-4">
                        {aiAnalysis.winningTopics.map((topicInsight, idx) => (
                          <li key={idx} className="flex gap-3 text-xs leading-relaxed text-zinc-300">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-sky-950 text-[10px] font-bold text-sky-400 border border-sky-900">
                              {idx + 1}
                            </span>
                            <span>{topicInsight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actionable Recommendations Card */}
                    <div className="rounded-2xl border border-zinc-900 bg-gradient-to-b from-emerald-950/20 to-zinc-950/50 p-6 shadow-xl backdrop-blur-md">
                      <div className="flex items-center gap-2 mb-4">
                        <Lightbulb className="h-5 w-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white">Strategic Copywriting Advice</h3>
                      </div>
                      <ul className="space-y-4">
                        {aiAnalysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex gap-3 text-xs leading-relaxed text-zinc-300">
                            <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-emerald-950 text-[10px] font-bold text-emerald-400 border border-emerald-900">
                              {idx + 1}
                            </span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>

                  {/* Suggested copy-pasteable Hooks */}
                  {aiAnalysis.suggestedHooks && aiAnalysis.suggestedHooks.length > 0 && (
                    <div className="mt-8 rounded-2xl border border-zinc-900 bg-zinc-900/10 p-6 shadow-xl backdrop-blur-md">
                      <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-6">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-indigo-400" />
                          <h3 className="text-base font-bold text-white">Suggested Hooks to Write Next</h3>
                        </div>
                        <span className="rounded-full bg-indigo-950 px-2.5 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-900">
                          ⭐ Copy-Pasteable Templates
                        </span>
                      </div>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {aiAnalysis.suggestedHooks.map((sh, idx) => (
                          <div key={idx} className="flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg hover:border-zinc-700 transition-all">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1.5">
                                  <span className="rounded bg-purple-950 border border-purple-900 px-1.5 py-0.5 text-[8px] font-bold text-purple-400 uppercase tracking-wider">
                                    {sh.hookType}
                                  </span>
                                  <span className="rounded bg-sky-950 border border-sky-900 px-1.5 py-0.5 text-[8px] font-bold text-sky-400 uppercase tracking-wider">
                                    {sh.topic}
                                  </span>
                                </div>
                                <button
                                  onClick={() => copyToClipboard(sh.hookTemplate, idx)}
                                  className={`flex h-7 px-2.5 items-center justify-center gap-1 rounded-md text-[10px] font-bold transition-colors ${
                                    copiedHookIdx === idx
                                      ? "bg-emerald-950 border border-emerald-900 text-emerald-400"
                                      : "border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                  }`}
                                >
                                  {copiedHookIdx === idx ? (
                                    <>
                                      <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                                      <span>Copied!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Zap className="h-3.5 w-3.5 text-indigo-400" />
                                      <span>Copy Hook</span>
                                    </>
                                  )}
                                </button>
                              </div>
                              <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-3.5 font-mono text-[10.5px] text-zinc-300 whitespace-pre-wrap leading-relaxed select-all">
                                {sh.hookTemplate}
                              </div>
                            </div>
                            <div className="mt-4 border-t border-zinc-900 pt-3 text-[10px] text-zinc-500 italic">
                              {sh.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8 shadow-xl text-center">
                    <Sparkles className="mx-auto h-8 w-8 text-indigo-400 animate-pulse mb-3" />
                    <h3 className="text-base font-bold text-white mb-1">AI Recommendation Insights Not Generated</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto mb-4">
                      Complete the analysis pipeline for your posts to generate custom copywriting ideas and pattern checks.
                    </p>
                    <button
                      onClick={generateAIRecommendations}
                      className="inline-flex h-9 items-center justify-center rounded-lg bg-indigo-600 px-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-500"
                    >
                      Run recommendations generator
                    </button>
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
                      
                      // Sort by percentage descending
                      const sortedItems = [...items].sort((a, b) => b.percentage - a.percentage).slice(0, 8);
                      
                      return (
                        <div key={idx} className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6 shadow-xl backdrop-blur-md">
                          <h3 className="text-sm font-bold text-white border-b border-zinc-800 pb-3 mb-4 flex items-center justify-between">
                            <span>Top {category}s</span>
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider">Demographics</span>
                          </h3>
                          
                          <div className="space-y-4">
                            {sortedItems.map((item, itemIdx) => (
                              <div key={itemIdx} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-semibold text-zinc-300 truncate max-w-[200px]" title={item.value}>
                                    {item.value}
                                  </span>
                                  <span className="font-bold text-indigo-400">{item.percentage}%</span>
                                </div>
                                <div className="h-1.5 w-full rounded-full bg-zinc-950 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                    style={{ width: `${item.percentage}%` }}
                                  ></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 p-8 shadow-xl text-center">
                    <Users className="mx-auto h-8 w-8 text-zinc-500 mb-2" />
                    <h3 className="text-sm font-bold text-zinc-400">No demographics data imported</h3>
                    <p className="text-xs text-zinc-500">
                      The sheet DEMOGRAPHICS was not found or was empty in the spreadsheet report.
                    </p>
                  </div>
                )}

              </div>
            )}

          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-auto border-t border-zinc-900/60 bg-zinc-950 py-6 text-center text-xs text-zinc-600">
        <p>© 2026 HookCraft AI. All rights reserved. Locally executed for {dbStatus?.stats.totalPosts ? "Yuvraj Mishra" : "your account"}.</p>
      </footer>
    </div>
  );
}
