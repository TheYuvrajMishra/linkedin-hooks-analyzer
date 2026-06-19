"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { 
  Upload, Sparkles, TrendingUp, Users, Eye, BarChart2, Filter, ChevronLeft, ChevronRight, Maximize2, X, FileText, CheckCircle2, AlertCircle, Bookmark, MessageSquare, Heart, RefreshCw 
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const SUPPORTED_HOOK_TYPES = [
  'Curiosity',
  'Contrarian',
  'Story',
  'Failure',
  'Achievement',
  'Opinion',
  'Question'
];

const SUPPORTED_TOPICS = [
  'AI',
  'Startups',
  'Career',
  'Freelancing',
  'Full Stack Development',
  'React',
  'Next.js',
  'UI/UX',
  'Productivity',
  'Personal Branding',
  'Remote Work',
  'Hiring',
  'Entrepreneurship'
];

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [postsData, setPostsData] = useState<any>({ posts: [], total: 0, page: 1, limit: 10 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('reach'); // 'reach' | 'engagement'
  const [activeInsightTab, setActiveInsightTab] = useState('hooks'); // 'hooks' | 'topics' | 'patterns' | 'recommendations'
  
  // Table filters
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedHookType, setSelectedHookType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selected post for modal
  const [selectedPost, setSelectedPost] = useState<any>(null);
  
  // File upload state
  const [uploadStatus, setUploadStatus] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchDashboard();
    fetchPosts();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedTopic, selectedHookType, currentPage]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/dashboard`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      if (selectedTopic) queryParams.append('topic', selectedTopic);
      if (selectedHookType) queryParams.append('hook_type', selectedHookType);

      const res = await fetch(`${API_BASE}/posts?${queryParams.toString()}`);
      const json = await res.json();
      setPostsData(json);
    } catch (err) {
      console.error("Error fetching posts:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadStatus({ type: 'info', message: 'Uploading and parsing Excel sheet...' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const json = await res.json();
      if (res.ok) {
        setUploadStatus({ 
          type: 'success', 
          message: `Successfully processed ${json.recordsProcessed} posts. You can now run the AI Analysis.` 
        });
        fetchDashboard();
        fetchPosts();
      } else {
        setUploadStatus({ type: 'error', message: json.error || 'Failed to upload file.' });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Failed to connect to the server.' });
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerAiAnalysis = async () => {
    setAnalyzing(true);
    setUploadStatus({ type: 'info', message: 'AI is reading post URLs, extracting hooks, and classifying content. Please wait...' });
    try {
      const res = await fetch(`${API_BASE}/analyze`, { method: 'POST' });
      const json = await res.json();
      if (res.ok) {
        setUploadStatus({ 
          type: 'success', 
          message: json.processed > 0 
            ? `Successfully analyzed ${json.processed} new posts!` 
            : 'All posts were already analyzed.' 
        });
        fetchDashboard();
        fetchPosts();
      } else {
        setUploadStatus({ type: 'error', message: json.error || 'AI Analysis failed.' });
      }
    } catch (err) {
      setUploadStatus({ type: 'error', message: 'Connection error during AI analysis.' });
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate scores for list display
  // Reach Score = (Impressions / Max Impressions) * 100
  // Performance Score = (0.7 * Reach Score) + (0.3 * ER)
  const maxImpressions = data?.overallMetrics?.impressions 
    ? Math.max(...(postsData?.posts?.map(p => p.impressions) || [1])) 
    : 10000;

  const getScores = (impressions: number, er: number) => {
    const reachScore = Math.min((impressions / (maxImpressions || 1)) * 100, 100);
    const perfScore = (0.7 * reachScore) + (0.3 * er);
    return {
      reachScore: parseFloat(reachScore.toFixed(1)),
      performanceScore: parseFloat(perfScore.toFixed(1))
    };
  };

  const formatPublishDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Color mappings
  const getHookTypeColor = (type: string | null | undefined) => {
    switch (type) {
      case 'Curiosity': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Contrarian': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Story': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Failure': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'Achievement': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Opinion': return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
      case 'Question': return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getTopicColor = (topic: string | null | undefined) => {
    switch (topic) {
      case 'AI': return 'bg-cyan-950 text-cyan-400 border border-cyan-800/30';
      case 'Startups': return 'bg-emerald-950 text-emerald-400 border border-emerald-800/30';
      case 'Career': return 'bg-blue-950 text-blue-400 border border-blue-800/30';
      case 'Freelancing': return 'bg-indigo-950 text-indigo-400 border border-indigo-800/30';
      case 'Full Stack Development': return 'bg-violet-950 text-violet-400 border border-violet-800/30';
      case 'React': return 'bg-teal-950 text-teal-400 border border-teal-800/30';
      case 'Next.js': return 'bg-slate-900 text-slate-300 border border-slate-700/30';
      case 'UI/UX': return 'bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-800/30';
      case 'Productivity': return 'bg-orange-950 text-orange-400 border border-orange-800/30';
      case 'Personal Branding': return 'bg-amber-950 text-amber-400 border border-amber-800/30';
      case 'Remote Work': return 'bg-lime-950 text-lime-400 border border-lime-800/30';
      case 'Hiring': return 'bg-rose-950 text-rose-400 border border-rose-800/30';
      case 'Entrepreneurship': return 'bg-pink-950 text-pink-400 border border-pink-800/30';
      default: return 'bg-gray-800 text-gray-400 border border-gray-700/30';
    }
  };

  const topPosts = activeTab === 'reach' 
    ? (data?.topReachPosts || []) 
    : (data?.topEngagementPosts || []);

  const totalPages = Math.ceil(postsData.total / postsData.limit) || 1;

  // Custom styling for recharts tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel p-3 rounded-lg border border-white/10 shadow-lg text-sm">
          <p className="font-semibold text-white mb-1">{label}</p>
          {payload.map((p: any, idx: number) => (
            <p key={idx} style={{ color: p.color }}>
              {p.name}: <span className="font-bold">{p.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/3 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <header className="border-b border-white/5 glass-panel sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight">LinkedIn Hooks</h1>
              <p className="text-xs text-indigo-400/80 font-medium tracking-wide uppercase">AI Analyzer & Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => { fetchDashboard(); fetchPosts(); }} 
              className="p-2 rounded-lg border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <a 
              href="https://linkedin.com" 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600/90 hover:bg-indigo-600 rounded-lg transition-all shadow-md shadow-indigo-600/20 flex items-center space-x-1.5"
            >
              <span>Go to LinkedIn</span>
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {/* Banner / Stat Overview */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border-l-2 border-l-indigo-500">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Total Posts</p>
            <h2 className="text-3xl font-extrabold mt-2 text-white">{data?.totalPosts || 0}</h2>
            <p className="text-xs text-gray-400 mt-2">Analyzed posts in system</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border-l-2 border-l-purple-500">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Eye className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Impressions</p>
            <h2 className="text-3xl font-extrabold mt-2 text-white">
              {data?.overallMetrics?.impressions ? data.overallMetrics.impressions.toLocaleString() : 0}
            </h2>
            <p className="text-xs text-gray-400 mt-2">Overall audience impressions</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border-l-2 border-l-emerald-500">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Engagements</p>
            <h2 className="text-3xl font-extrabold mt-2 text-white">
              {data?.overallMetrics?.engagements ? data.overallMetrics.engagements.toLocaleString() : 0}
            </h2>
            <p className="text-xs text-gray-400 mt-2">Likes, comments, shares, clicks</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl relative overflow-hidden transition-all duration-300 hover:scale-[1.01] border-l-2 border-l-amber-500">
            <div className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Average ER</p>
            <h2 className="text-3xl font-extrabold mt-2 text-white">
              {data?.overallMetrics?.avgEr || '0.00'}%
            </h2>
            <p className="text-xs text-gray-400 mt-2">Average engagement rate</p>
          </div>
        </section>

        {/* Processing Control Box */}
        <section className="glass-panel p-6 rounded-3xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Data Source Management
              </h2>
              <p className="text-sm text-gray-400 max-w-2xl">
                Upload your LinkedIn analytics Excel sheet (`.xlsx`) exported directly from LinkedIn. The tool automatically isolates target sheets, runs URL-scraping, and processes hooks with Gemini AI.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {/* Custom styled File Upload button */}
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || analyzing}
                className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-sm font-semibold text-white flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Upload className="w-4 h-4 text-gray-300" />
                <span>{uploading ? 'Processing File...' : 'Upload Excel Sheet'}</span>
              </button>
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".xlsx" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              
              <button 
                onClick={triggerAiAnalysis}
                disabled={uploading || analyzing || !data?.totalPosts}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-40 text-sm font-semibold text-white flex items-center space-x-2 transition-all shadow-lg shadow-indigo-500/25 cursor-pointer"
              >
                {analyzing ? (
                  <Sparkles className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )}
                <span>{analyzing ? 'AI Classifying Posts...' : 'Run AI Analysis'}</span>
              </button>
            </div>
          </div>

          {/* Status Message Display */}
          {uploadStatus && (
            <div className={`mt-6 p-4 rounded-xl border flex items-start gap-3 transition-all animate-fadeIn ${
              uploadStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-300' :
              uploadStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
              'bg-indigo-500/10 border-indigo-500/20 text-indigo-300 animate-pulse'
            }`}>
              {uploadStatus.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              {uploadStatus.type === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
              {uploadStatus.type === 'info' && <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5 animate-spin" />}
              <span className="text-sm font-medium">{uploadStatus.message}</span>
            </div>
          )}
        </section>

        {/* AI Insights & Recommendations (PRD: AI Insights) */}
        {data?.aiInsights && (
          <section className="glass-panel p-6 rounded-3xl space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <h2 className="text-xl font-bold text-white">AI Content DNA Insights</h2>
              </div>
              
              {/* Insight Tabs */}
              <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 text-xs font-semibold">
                <button 
                  onClick={() => setActiveInsightTab('hooks')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeInsightTab === 'hooks' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Winning Hooks
                </button>
                <button 
                  onClick={() => setActiveInsightTab('topics')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeInsightTab === 'topics' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Winning Topics
                </button>
                <button 
                  onClick={() => setActiveInsightTab('patterns')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeInsightTab === 'patterns' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Posting Patterns
                </button>
                <button 
                  onClick={() => setActiveInsightTab('recommendations')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${activeInsightTab === 'recommendations' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
                >
                  Recommendations
                </button>
              </div>
            </div>

            {/* Insight Content Panel */}
            <div className="min-h-[140px] flex items-center">
              {activeInsightTab === 'hooks' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {data.aiInsights.winningHooks?.map((insight, idx) => (
                    <div key={idx} className="bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/10 rounded-2xl p-5 transition-all text-sm leading-relaxed text-indigo-200">
                      {insight}
                    </div>
                  )) || <p className="text-gray-400">No hook insights generated yet.</p>}
                </div>
              )}

              {activeInsightTab === 'topics' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {data.aiInsights.winningTopics?.map((insight, idx) => (
                    <div key={idx} className="bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/10 rounded-2xl p-5 transition-all text-sm leading-relaxed text-purple-200">
                      {insight}
                    </div>
                  )) || <p className="text-gray-400">No topic insights generated yet.</p>}
                </div>
              )}

              {activeInsightTab === 'patterns' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                  {data.aiInsights.postingPatterns?.map((insight, idx) => (
                    <div key={idx} className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 rounded-2xl p-5 transition-all text-sm leading-relaxed text-emerald-200">
                      {insight}
                    </div>
                  )) || <p className="text-gray-400">No posting patterns generated yet.</p>}
                </div>
              )}

              {activeInsightTab === 'recommendations' && (
                <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-5">
                  <ul className="space-y-3.5">
                    {data.aiInsights.recommendations?.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm text-gray-200">
                        <span className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center flex-shrink-0 font-bold text-xs mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    )) || <p className="text-gray-400">No recommendations available.</p>}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Visual Charts (PRD: Best Hook Types & Best Topics) */}
        {isMounted && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hook Performance Chart */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div>
                <h3 className="font-bold text-lg text-white">Best Hook Types</h3>
                <p className="text-xs text-gray-400">Hook type compared against Average Impressions</p>
              </div>
              <div className="h-[300px]">
                {data?.bestHookTypes?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bestHookTypes} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="hook_type" 
                        stroke="#9ca3af" 
                        fontSize={10} 
                        tickLine={false} 
                        angle={-15} 
                        textAnchor="end"
                      />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgImpressions" name="Avg Impressions" fill="#6366f1" radius={[4, 4, 0, 0]}>
                        {data.bestHookTypes.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#818cf8' : index === 1 ? '#a78bfa' : '#4f46e5'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No hook data available. Run AI Analysis to generate classifications.
                  </div>
                )}
              </div>
            </div>

            {/* Topic Performance Chart */}
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <div>
                <h3 className="font-bold text-lg text-white">Best Content Topics</h3>
                <p className="text-xs text-gray-400">Content topic compared against Average Engagement Rate %</p>
              </div>
              <div className="h-[300px]">
                {data?.bestTopics?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bestTopics} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis 
                        dataKey="topic" 
                        stroke="#9ca3af" 
                        fontSize={10} 
                        tickLine={false} 
                        angle={-15} 
                        textAnchor="end"
                      />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} unit="%" />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgEr" name="Avg ER (%)" fill="#10b981" radius={[4, 4, 0, 0]}>
                        {data.bestTopics.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#34d399' : index === 1 ? '#6ee7b7' : '#059669'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm">
                    No topic data available. Run AI Analysis to generate classifications.
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Top Reach / Engagement Posts Grid */}
        <section className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Top Performing Posts</h2>
              <p className="text-xs text-gray-400">Insights from your top 5 creators posts</p>
            </div>
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 text-xs font-semibold self-start">
              <button 
                onClick={() => setActiveTab('reach')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${activeTab === 'reach' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Top Reach (Impressions)</span>
              </button>
              <button 
                onClick={() => setActiveTab('engagement')}
                className={`px-4 py-2 rounded-lg transition-all flex items-center space-x-1.5 ${activeTab === 'engagement' ? 'bg-indigo-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Top Engagement (ER %)</span>
              </button>
            </div>
          </div>

          {/* Top Posts Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topPosts.length > 0 ? (
              topPosts.map((post, idx) => {
                const { performanceScore } = getScores(post.impressions, post.er);
                return (
                  <div 
                    key={post.id} 
                    onClick={() => setSelectedPost(post)}
                    className="bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02]"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                          Rank #{idx + 1}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatPublishDate(post.publish_date)}
                        </span>
                      </div>
                      
                      <p className="text-xs text-gray-300 line-clamp-4 leading-relaxed italic">
                        {post.hook ? `"${post.hook}"` : 'No post content analyzed yet. Check post details...'}
                      </p>
                    </div>

                    <div className="mt-5 space-y-3 border-t border-white/5 pt-3">
                      <div className="flex flex-wrap gap-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getHookTypeColor(post.hook_type)}`}>
                          {post.hook_type || 'Unknown'}
                        </span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${getTopicColor(post.topic)}`}>
                          {post.topic || 'Unknown'}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <div className="text-gray-400">
                          <p className="text-[9px] uppercase tracking-wider">Perf Score</p>
                          <p className="font-extrabold text-white">{performanceScore}/100</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] uppercase tracking-wider text-gray-400">
                            {activeTab === 'reach' ? 'Impressions' : 'ER%'}
                          </p>
                          <p className="font-extrabold text-indigo-400">
                            {activeTab === 'reach' ? post.impressions.toLocaleString() : `${post.er.toFixed(2)}%`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-5 py-12 text-center text-gray-500 text-sm">
                No performance records to display. Upload an Excel sheet to populate data.
              </div>
            )}
          </div>
        </section>

        {/* Detailed Library Table (PRD: Table View) */}
        <section className="glass-panel p-6 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-400" />
                Post Performance Library
              </h2>
              <p className="text-xs text-gray-400">Filter, navigate, and drill down on every post structure</p>
            </div>

            {/* Filter Toolbar */}
            <div className="flex flex-wrap gap-2.5">
              {/* Topic Select */}
              <div className="flex items-center space-x-1.5 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select 
                  value={selectedTopic}
                  onChange={(e) => { setSelectedTopic(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent border-none text-xs font-semibold text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="">All Topics</option>
                  {SUPPORTED_TOPICS.map(t => (
                    <option key={t} value={t} className="bg-slate-900 text-gray-300">{t}</option>
                  ))}
                </select>
              </div>

              {/* Hook Type Select */}
              <div className="flex items-center space-x-1.5 bg-white/5 border border-white/5 px-2.5 py-1.5 rounded-xl">
                <Bookmark className="w-3.5 h-3.5 text-gray-400" />
                <select 
                  value={selectedHookType}
                  onChange={(e) => { setSelectedHookType(e.target.value); setCurrentPage(1); }}
                  className="bg-transparent border-none text-xs font-semibold text-gray-300 focus:outline-none cursor-pointer"
                >
                  <option value="">All Hook Types</option>
                  {SUPPORTED_HOOK_TYPES.map(h => (
                    <option key={h} value={h} className="bg-slate-900 text-gray-300">{h}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-white/5">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-gray-400 font-semibold text-xs tracking-wider uppercase">
                  <th className="p-4">Publish Date</th>
                  <th className="p-4 w-[40%]">Hook Preview</th>
                  <th className="p-4">Classifications</th>
                  <th className="p-4 text-right">Impressions</th>
                  <th className="p-4 text-right">Engagements</th>
                  <th className="p-4 text-right">ER %</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {postsData.posts.length > 0 ? (
                  postsData.posts.map(post => {
                    const { performanceScore } = getScores(post.impressions, post.er);
                    return (
                      <tr key={post.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="p-4 whitespace-nowrap text-xs text-gray-400">
                          {formatPublishDate(post.publish_date)}
                        </td>
                        <td className="p-4">
                          <p className="line-clamp-2 italic text-xs leading-relaxed max-w-lg">
                            {post.hook ? `"${post.hook}"` : (
                              <span className="text-gray-500 font-normal">Pending analysis (run Run AI Analysis)</span>
                            )}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1.5 max-w-[150px]">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full w-fit font-semibold border ${getHookTypeColor(post.hook_type)}`}>
                              {post.hook_type || 'Opinion'}
                            </span>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full w-fit font-semibold ${getTopicColor(post.topic)}`}>
                              {post.topic || 'Career'}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-semibold text-xs whitespace-nowrap">
                          {post.impressions.toLocaleString()}
                        </td>
                        <td className="p-4 text-right text-xs whitespace-nowrap">
                          {post.engagements.toLocaleString()}
                        </td>
                        <td className="p-4 text-right font-bold text-indigo-400 text-xs whitespace-nowrap">
                          {post.er.toFixed(2)}%
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <div className="inline-flex flex-col items-center">
                            <span className="text-xs font-black text-white">{performanceScore}</span>
                            <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Perf Score</span>
                          </div>
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button 
                            onClick={() => setSelectedPost(post)}
                            className="p-1.5 rounded-lg border border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all text-gray-400"
                            title="Inspect Post details"
                          >
                            <Maximize2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-gray-500">
                      No records matched the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <span className="text-xs text-gray-400 font-medium">
                Showing page <span className="text-white font-bold">{currentPage}</span> of <span className="text-white font-bold">{totalPages}</span> ({postsData.total} items)
              </span>

              <div className="flex space-x-1.5">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-white/5 bg-white/5 disabled:opacity-30 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-white/5 bg-white/5 disabled:opacity-30 hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 text-center text-xs text-gray-500 border-t border-white/5 pt-8">
        <p>&copy; {new Date().getFullYear()} LinkedIn Hooks & Content DNA Analyzer. All rights reserved.</p>
      </footer>

      {/* Post Inspection Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-[#0f1626] border border-white/10 w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="font-extrabold text-white text-base">LinkedIn Content Inspector</h3>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-semibold tracking-wider">
                  Published: {formatPublishDate(selectedPost.publish_date)}
                </p>
              </div>
              <button 
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Metrics Badge Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Impressions</p>
                  <p className="text-xl font-black text-white mt-1">{selectedPost.impressions.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Engagements</p>
                  <p className="text-xl font-black text-white mt-1">{selectedPost.engagements.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/5 p-4 rounded-2xl text-center">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Engagement Rate</p>
                  <p className="text-xl font-black text-indigo-400 mt-1">{selectedPost.er.toFixed(2)}%</p>
                </div>
              </div>

              {/* Hook Analysis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Extracted Hook</p>
                  <div className="flex gap-1.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${getHookTypeColor(selectedPost.hook_type)}`}>
                      Hook Type: {selectedPost.hook_type || 'Opinion'}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${getTopicColor(selectedPost.topic)}`}>
                      Topic: {selectedPost.topic || 'Career'}
                    </span>
                  </div>
                </div>
                
                <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 italic text-sm text-indigo-200 whitespace-pre-line leading-relaxed">
                  {selectedPost.hook ? `"${selectedPost.hook}"` : 'Pending hook extraction analysis.'}
                </div>
              </div>

              {/* Full Text */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Post Text</p>
                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-gray-300 whitespace-pre-line leading-relaxed max-h-[250px] overflow-y-auto">
                  {selectedPost.text || 'Pending full text collection. Run AI Analysis to scrape LinkedIn content.'}
                </div>
              </div>

              {/* Media & URL metadata */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 border border-white/5 rounded-2xl p-4 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 font-medium">Format:</span>
                  <span className="font-semibold text-white px-2 py-0.5 bg-white/5 rounded">{selectedPost.media_type || 'Text'}</span>
                </div>

                <a 
                  href={selectedPost.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center space-x-1 underline"
                >
                  <span>Open URL on LinkedIn</span>
                  <Maximize2 className="w-3.5 h-3.5 inline" />
                </a>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
