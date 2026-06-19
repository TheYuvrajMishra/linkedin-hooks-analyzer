"use client";

import { useState, useEffect, useMemo } from "react";
import { RefreshCw, BarChart2, FileText, Sliders, Sparkles, Users } from "lucide-react";
import { setupFetchInterceptor } from "@/lib/fetch-interceptor";
import { Post, DailyMetric, FollowerMetric, DemographicMetric, AIAnalysis, DBStatus } from "@/types";

// Import modular components
import { Header } from "@/components/views/Header";
import { EmptyState } from "@/components/views/EmptyState";
import { ScraperBanner } from "@/components/views/ScraperBanner";
import { KpiGrid } from "@/components/views/KpiGrid";
import { DashboardOverview } from "@/components/views/DashboardOverview";
import { InteractivePostsTable } from "@/components/views/InteractivePostsTable";
import { HookIntelligence } from "@/components/views/HookIntelligence";
import { AIInsights } from "@/components/views/AIInsights";
import { Demographics } from "@/components/views/Demographics";
import { PostDetailModal } from "@/components/ui/PostDetailModal";

// Run fetch interceptor configuration (runs client-side only once)
if (typeof window !== "undefined") {
  setupFetchInterceptor();
}

export function LinkedInLooker() {
  // Mounting check for Recharts SSR compatibility
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
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "posts" | "hook-intelligence" | "ai-insights" | "demographics"
  >("dashboard");
  const [activeChartTab, setActiveChartTab] = useState<"impressions" | "engagements" | "followers">(
    "impressions"
  );
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
  const [explorerDimension, setExplorerDimension] = useState<
    "hookType" | "sentenceStructure" | "hookLength"
  >("hookType");
  const [explorerValue, setExplorerValue] = useState<string>("Curiosity");
  const [expandedStructure, setExpandedStructure] = useState<string | null>(null);

  // Modal state
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

  useEffect(() => {
    if (dbStatus && dbStatus.stats.totalPosts > 0) {
      fetchRawMetrics();
    }
  }, [dbStatus]);

  const fetchRawMetrics = async () => {
    try {
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
    if (
      !confirm(
        "Are you sure you want to delete all reports, metrics, and analyses? This cannot be undone."
      )
    )
      return;
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
    setAnalysisLogs([
      `Starting analysis of ${unanalyzedPosts.length} posts using Headless Browser Scraping...`,
    ]);

    let processed = 0;
    let errors = 0;

    for (const post of unanalyzedPosts) {
      try {
        setAnalysisLogs((prev) => [
          `[${processed + 1}/${unanalyzedPosts.length}] Processing: ${
            post.postUrl.split("_").slice(-1)[0] || "Post"
          }`,
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

    const matchesHookType = filterHookType === "all" || post.hookType === filterHookType;

    const matchesTopic = filterTopic === "all" || post.topic === filterTopic;

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
    const hookTypesMap: {
      [type: string]: { impSum: number; engSum: number; erSum: number; count: number };
    } = {};
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

    return Object.entries(hookTypesMap)
      .map(([type, s]) => ({
        name: type,
        avgImpressions: Math.round(s.impSum / s.count),
        avgEngagementRate: parseFloat((s.erSum / s.count).toFixed(2)),
        count: s.count,
      }))
      .sort((a, b) => {
        const scoreA = a.avgEngagementRate * (a.count / (a.count + 4));
        const scoreB = b.avgEngagementRate * (b.count / (b.count + 4));
        return scoreB - scoreA;
      });
  };

  const getTopicChartData = () => {
    const topicsMap: {
      [topic: string]: { impSum: number; engSum: number; erSum: number; count: number };
    } = {};
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

    return Object.entries(topicsMap)
      .map(([topic, s]) => ({
        name: topic,
        avgImpressions: Math.round(s.impSum / s.count),
        avgEngagementRate: parseFloat((s.erSum / s.count).toFixed(2)),
        count: s.count,
      }))
      .sort((a, b) => {
        const scoreA = a.avgEngagementRate * (a.count / (a.count + 4));
        const scoreB = b.avgEngagementRate * (b.count / (b.count + 4));
        return scoreB - scoreA;
      });
  };

  const getHookLengthChartData = () => {
    const categories = [
      { name: "Short (0-100 chars)", min: 0, max: 100, impSum: 0, engSum: 0, erSum: 0, count: 0 },
      {
        name: "Medium (101-200 chars)",
        min: 101,
        max: 200,
        impSum: 0,
        engSum: 0,
        erSum: 0,
        count: 0,
      },
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
    const structMap: {
      [struct: string]: { impSum: number; engSum: number; erSum: number; count: number };
    } = {};
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

    return Object.entries(structMap)
      .map(([struct, s]) => ({
        name: struct,
        avgImpressions: Math.round(s.impSum / s.count),
        avgEngagementRate: parseFloat((s.erSum / s.count).toFixed(2)),
        count: s.count,
      }))
      .sort((a, b) => {
        const scoreA = a.avgEngagementRate * (a.count / (a.count + 4));
        const scoreB = b.avgEngagementRate * (b.count / (b.count + 4));
        return scoreB - scoreA;
      });
  };

  const getTopOpeningWords = () => {
    const wordCounts: { [word: string]: { count: number; impSum: number; engSum: number } } = {};
    posts.forEach((p) => {
      if (!p.analyzed || !p.hook) return;
      const firstWord =
        p.hook.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") || "";
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
  const avgER =
    totalImpressions > 0 ? ((totalEngagements / totalImpressions) * 100).toFixed(2) : "0.00";

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
        newFollowers: 0,
      });
    });
    followerMetrics.forEach((f: any) => {
      if (map.has(f.date)) {
        map.get(f.date).newFollowers = Math.max(0, f.newFollowers || 0);
      } else {
        map.set(f.date, {
          date: f.date,
          impressions: 0,
          engagements: 0,
          newFollowers: Math.max(0, f.newFollowers || 0),
        });
      }
    });
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [dailyMetrics, followerMetrics]);

  const chartColors = ["#ffffff", "#d4d4d8", "#a1a1aa", "#71717a", "#52525b", "#3f3f46"];

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-200 antialiased selection:bg-white/20 selection:text-white relative overflow-hidden pb-12">
      {/* Subtle noise overlay */}
      <div className="noise-overlay" />

      {/* Floating Glass Navbar */}
      <Header
        dbStatus={dbStatus}
        actionLoading={actionLoading}
        handleClearDatabase={handleClearDatabase}
      />

      {/* Main Content Workspace */}
      <main className="relative z-10 mx-auto max-w-7xl px-4 pt-32 pb-16 sm:px-6 lg:px-8">
        {loadingStatus ? (
          <div className="flex h-96 flex-col items-center justify-center gap-4">
            <RefreshCw className="h-10 w-10 animate-spin text-white/60" strokeWidth={1.2} />
            <p className="text-sm text-zinc-400 font-medium">
              Initializing workspace database connection...
            </p>
          </div>
        ) : !dbStatus || dbStatus.stats.totalPosts === 0 ? (
          /* Empty onboarding state */
          <EmptyState
            dbStatus={dbStatus}
            actionLoading={actionLoading}
            uploadProgress={uploadProgress}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            handleAutoLoad={handleAutoLoad}
            handleFileUpload={handleFileUpload}
          />
        ) : (
          /* Active Dashboard Workspace */
          <div className="space-y-8">
            {/* 1. Scraper/Analysis progress banner */}
            <ScraperBanner
              dbStatus={dbStatus}
              analyzing={analyzing}
              actionLoading={actionLoading}
              analysisProgress={analysisProgress}
              analysisLogs={analysisLogs}
              runAnalysisPipeline={runAnalysisPipeline}
            />

            {/* 2. Overview KPI cards */}
            <KpiGrid
              dbStatus={dbStatus}
              totalImpressions={totalImpressions}
              totalEngagements={totalEngagements}
              avgER={avgER}
              bestPerformingHook={bestPerformingHook}
              bestPerformingTopic={bestPerformingTopic}
            />

            {/* 3. Navigation Tabs */}
            <div className="animate-on-scroll pb-1">
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
                      <Icon
                        className={`h-3.5 w-3.5 transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 ${
                          isActive ? "text-white" : "text-zinc-500"
                        }`}
                        strokeWidth={1.2}
                      />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* 4. Dynamic Tab Views */}
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

      {/* Post details modal popup */}
      <PostDetailModal modalPost={modalPost} closeModal={closeModal} />

      {/* Footer */}
      <footer className="relative z-10 mx-auto max-w-7xl px-4 mt-16 border-t border-white/5 py-8 text-center text-xs text-zinc-650 sm:px-6 lg:px-8">
        <p>
          © 2026 Linkedin Looker. All rights reserved. Locally executed for{" "}
          {dbStatus?.stats.totalPosts ? "Yuvraj Mishra" : "your account"}.
        </p>
      </footer>
    </div>
  );
}
