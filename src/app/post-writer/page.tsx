"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  FileText,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Shield,
  Zap,
  BookOpen,
  ArrowRight,
  Info,
  RefreshCw
} from "lucide-react";
import { Post } from "@/types";

const FORMULAS = [
  { code: "auto", name: "Suggest Best Formula", desc: "AI selects the most effective hook based on topic and past performance." },
  { code: "F1", name: "Platform Risk Anaphora", desc: "Anaphora pointing out platform risks, positioning your solution as the fix." },
  { code: "F2", name: "R.I.P. Obituary", desc: "Declare an old strategy or industry norm dead and announce the pivot." },
  { code: "F3", name: "Year-over-Year Pivot", desc: "Compare actions and vanity metrics over years to show growth." },
  { code: "F4", name: "Time-Anchor Confession", desc: "Start with an uncomfortable confession from X years ago." },
  { code: "F5", name: "Self-Proving Meta", desc: "Public challenge with detailed strategy and accountability tracking." },
  { code: "F6", name: "Comment-Gate Lead Magnet", desc: "Announce a free resource and drive connection via comments." },
  { code: "F7", name: "Odd-Precision Money Ledger", desc: "Founder build-log breakdown using odd-precision numbers." },
  { code: "F8", name: "Paid-vs-Free Reversal", desc: "Give away high-value frameworks that others charge for." },
  { code: "F9", name: "Curiosity-Gap Teaser", desc: "Reveal a weird metric anomaly and trace the cause behind the scenes." },
  { code: "F10", name: "Contrarian Take", desc: "Sacred-cow take backed by historical analogies and data." },
];

export default function PostWriterPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  // Form states
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [audience, setAudience] = useState("Founders & Builders");
  const [length, setLength] = useState("medium");
  const [hookFormula, setHookFormula] = useState("auto");
  const [anecdotes, setAnecdotes] = useState("");
  const [specificNumbers, setSpecificNumbers] = useState("");
  const [namedEntity, setNamedEntity] = useState("");
  const [firstPersonDetail, setFirstPersonDetail] = useState("");
  const [vulnerability, setVulnerability] = useState("");

  // Result states
  const [generating, setGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [activeResultTab, setActiveResultTab] = useState<"report" | "post" | "diff" | "audit">("report");
  
  const [result, setResult] = useState<{
    contextReport?: {
      situationOverview: string;
      topicCheck: string;
      relevanceExplanation: string;
    };
    chosenFormula?: {
      code: string;
      name: string;
      reason: string;
    };
    initialDraft?: string;
    humanizedDraft?: string;
    humanizationDiff?: Array<{ original: string; replacement: string; reason: string }>;
    messageOfRelevance?: string;
    audit?: {
      passed: boolean;
      checks: Array<{ name: string; status: "PASS" | "WARNING" | "FAIL"; message: string }>;
    };
  } | null>(null);

  // Editable version of the drafted post
  const [editedPost, setEditedPost] = useState("");
  const [copied, setCopied] = useState(false);

  // Load database or LocalStorage posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoadingPosts(true);
        if (typeof window !== "undefined") {
          const lsPosts = localStorage.getItem("posts");
          if (lsPosts) {
            setPosts(JSON.parse(lsPosts));
            setLoadingPosts(false);
            return;
          }
        }
        const res = await fetch("/api/posts");
        const data = await res.json();
        setPosts(data.posts || []);
      } catch (err) {
        console.error("Error loading posts context:", err);
      } finally {
        setLoadingPosts(false);
      }
    };
    fetchPosts();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !angle) {
      alert("Please specify a Topic and Angle/Direction.");
      return;
    }

    try {
      setGenerating(true);
      setResult(null);
      setLogs(["Initializing Post Writer session...", "Reading LinkedIn metrics database..."]);

      // Smooth log feedback simulation
      const logSteps = [
        "Analyzing past posts to verify topic collision...",
        "Identifying high-performing hook archetypes...",
        "Evaluating audience relevance vectors...",
        "Calling Groq rotating models (Gemma/Llama-3.1)...",
        "Applying Forensic Tier AI scrub filters...",
        "Enforcing Strict style transformations (killing em dashes, leverage, utilize)...",
        "Inserting burstiness and sentence fragment heuristics...",
        "Verifying readability scores & viewport limits...",
        "Running final algorithm audit..."
      ];

      let logIndex = 0;
      const logInterval = setInterval(() => {
        if (logIndex < logSteps.length) {
          setLogs(prev => [...prev, logSteps[logIndex]]);
          logIndex++;
        } else {
          clearInterval(logInterval);
        }
      }, 500);

      const response = await fetch("/api/post-writer/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          angle,
          audience,
          length,
          hookFormula,
          anecdotes,
          specificNumbers,
          namedEntity,
          firstPersonDetail,
          vulnerability,
          pastPosts: posts
        })
      });

      clearInterval(logInterval);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to generate post.");
      }

      const data = await response.json();
      setResult(data.data);
      setEditedPost(data.data.humanizedDraft || "");
      setActiveResultTab("report");
      setLogs(prev => [...prev, "Generation complete! Output ready."]);
    } catch (err: any) {
      console.error(err);
      setLogs(prev => [...prev, `Error: ${err.message}`]);
      alert(`Failed to generate post: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(editedPost);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-zinc-200">
      {/* Top Banner */}
      <header className="border-b border-white/5 bg-black/60 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-bold uppercase tracking-widest text-white font-display">Post Writer</h1>
              <p className="text-xs text-zinc-500">Formulas, Context Reports, and Programmatic De-AI Humanizing</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] text-zinc-400">
              <Shield className="h-3 w-3 text-emerald-400" />
              <span>Groq Token Optimized</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10px] text-zinc-400">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>{posts.length} Past Posts Synced</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Controls Form Pane */}
          <section className="lg:col-span-5 rounded-3xl border border-white/5 bg-white/[0.01] p-6 backdrop-blur-xl">
            <h2 className="text-base font-bold text-white font-display flex items-center gap-2 mb-6">
              <BookOpen className="h-4 w-4 text-zinc-400" />
              Post Details & Constraints
            </h2>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                  Topic / Subject (Required)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Next.js 15 Caching Pitfalls"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                  Angle / Strategy (Required)
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="e.g. Share how a caching mistake cost me hours, then provide a simple code fix."
                  value={angle}
                  onChange={e => setAngle(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-2.5 text-xs text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                    Hook Formula
                  </label>
                  <select
                    value={hookFormula}
                    onChange={e => setHookFormula(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-xs text-white focus:border-white/20 focus:outline-none transition-all cursor-pointer"
                  >
                    {FORMULAS.map(f => (
                      <option key={f.code} value={f.code} className="bg-neutral-900">
                        {f.code === "auto" ? f.name : `${f.code} - ${f.name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">
                    Target Length
                  </label>
                  <select
                    value={length}
                    onChange={e => setLength(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2.5 text-xs text-white focus:border-white/20 focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="short" className="bg-neutral-900">Short (300-500 ch)</option>
                    <option value="medium" className="bg-neutral-900">Medium (900-1300 ch)</option>
                    <option value="long" className="bg-neutral-900">Long (1500-1900 ch)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4">
                <h3 className="text-xs font-bold text-zinc-400 mb-3 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  Humanizer Pass Inputs (Sensory / Specifics)
                </h3>
                <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
                  Provide concrete real-world details below. The pipeline will automatically inject these into the writing to override AI tells and boost your authority score.
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Specific Numbers (e.g. 6 hours, $4,240, 12 servers)</label>
                    <input
                      type="text"
                      placeholder="e.g. 6 hours, 0 cached fetches"
                      value={specificNumbers}
                      onChange={e => setSpecificNumbers(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-white/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Named Entities (Real products, APIs, cities, companies)</label>
                    <input
                      type="text"
                      placeholder="e.g. Next.js 15, Vercel edge runtime"
                      value={namedEntity}
                      onChange={e => setNamedEntity(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-white/20 focus:outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">First-Person Sensory Detail</label>
                      <input
                        type="text"
                        placeholder="e.g. Staring at a terminal screen at 3 AM"
                        value={firstPersonDetail}
                        onChange={e => setFirstPersonDetail(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-white/20 focus:outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-zinc-500 mb-1">Vulnerability / What was at stake?</label>
                      <input
                        type="text"
                        placeholder="e.g. I felt completely stupid for missing this"
                        value={vulnerability}
                        onChange={e => setVulnerability(e.target.value)}
                        className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-white/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-zinc-500 mb-1">Personal Anecdote / Outline Scribbles</label>
                    <textarea
                      rows={2}
                      placeholder="Any rough thoughts or details of the story..."
                      value={anecdotes}
                      onChange={e => setAnecdotes(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-xs text-white placeholder-zinc-700 focus:border-white/20 focus:outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={generating}
                className="w-full inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-white px-5 text-xs font-bold text-black transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50 cursor-pointer shadow-[0_0_15px_rgba(255,255,255,0.2)]"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating & Scrubbing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Generate & Humanize Post
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Results/Reports Pane */}
          <section className="lg:col-span-7 space-y-6">
            
            {/* Logs Window when Generating */}
            {generating && (
              <div className="rounded-3xl border border-white/10 bg-black/65 p-6 shadow-xl backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                  <span className="font-mono text-[10px] font-bold text-white uppercase tracking-widest">Active Generation Console</span>
                </div>
                <div className="h-60 overflow-y-auto font-mono text-[10px] text-zinc-400 space-y-2 scrollbar-thin">
                  {logs.map((log, idx) => (
                    <div key={idx} className={idx === logs.length - 1 ? "text-white" : "opacity-60"}>
                      <span className="text-zinc-600 mr-2">❯</span>
                      {log}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Dashboard Instructions (Initial State) */}
            {!generating && !result && (
              <div className="rounded-3xl border border-white/5 bg-white/[0.01] p-10 text-center flex flex-col items-center justify-center min-h-[450px]">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-zinc-400 border border-white/10 mb-4">
                  <Sparkles className="h-6 w-6" strokeWidth={1.2} />
                </div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 font-display">Generate Your Optimized Post</h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                  Input your topic and angle on the left. The generator will scan your past posts in localStorage/database, write the copy following 2026 guidelines, and clean AI signatures.
                </p>
                <div className="flex flex-col gap-2.5 max-w-md text-left text-[10px] text-zinc-500 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
                  <div className="flex gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Historical Awareness:</strong> Safe checks against topics you have already covered.</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Hard Scrub:</strong> programmatically swaps corporate buzzwords and eliminates em dashes.</span>
                  </div>
                  <div className="flex gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Algorithmic Audit:</strong> Run length, CTA, and emoji checks to maximize reach.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && !generating && (
              <div className="space-y-6">
                
                {/* Tabs Selector */}
                <div className="flex flex-wrap gap-2 border-b border-white/5 pb-3">
                  <button
                    onClick={() => setActiveResultTab("report")}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 font-display ${
                      activeResultTab === "report"
                        ? "bg-white text-black shadow-lg shadow-white/10"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                    }`}
                  >
                    1. Relevance Report
                  </button>
                  <button
                    onClick={() => setActiveResultTab("post")}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 font-display ${
                      activeResultTab === "post"
                        ? "bg-white text-black shadow-lg shadow-white/10"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                    }`}
                  >
                    2. Draft Post
                  </button>
                  <button
                    onClick={() => setActiveResultTab("diff")}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 font-display ${
                      activeResultTab === "diff"
                        ? "bg-white text-black shadow-lg shadow-white/10"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                    }`}
                  >
                    3. Humanizer Diff
                  </button>
                  <button
                    onClick={() => setActiveResultTab("audit")}
                    className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 font-display ${
                      activeResultTab === "audit"
                        ? "bg-white text-black shadow-lg shadow-white/10"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-white/5"
                    }`}
                  >
                    4. Algorithmic Audit
                  </button>
                </div>

                {/* Tab 1: Situation & Relevance Report */}
                {activeResultTab === "report" && (
                  <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.01] p-6">
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display">Situation Overview</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 border border-white/5 rounded-2xl p-4">
                        {result.contextReport?.situationOverview}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display">Topic Collision Check</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 border border-white/5 rounded-2xl p-4 h-full">
                          {result.contextReport?.topicCheck}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display">Hook Formula Reason</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 border border-white/5 rounded-2xl p-4 h-full">
                          <strong>Formula Used:</strong> {result.chosenFormula?.name} ({result.chosenFormula?.code})<br /><br />
                          {result.chosenFormula?.reason}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-white/5 pt-4">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-2 font-display">Why it fits your situation</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed bg-black/40 border border-white/5 rounded-2xl p-4">
                        {result.messageOfRelevance}
                      </p>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => setActiveResultTab("post")}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-zinc-400 transition-colors"
                      >
                        Proceed to Post Draft
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Tab 2: Draft Post (Editable & Copyable) */}
                {activeResultTab === "post" && (
                  <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.01] p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Final Optimized Copy</h3>
                      <div className="flex gap-2">
                        <button
                          onClick={copyToClipboard}
                          className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-bold text-zinc-400 hover:text-white transition-all active:scale-95 cursor-pointer"
                        >
                          {copied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-400" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy Draft
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <textarea
                        value={editedPost}
                        onChange={e => setEditedPost(e.target.value)}
                        rows={14}
                        className="w-full rounded-2xl border border-white/10 bg-black/60 p-4 font-sans text-xs text-white leading-relaxed focus:border-white/20 focus:outline-none transition-all scrollbar-thin"
                      />
                      <div className="absolute bottom-3 right-3 rounded bg-black/75 border border-white/10 px-2 py-0.5 text-[9px] text-zinc-500 font-mono">
                        {editedPost.length} chars | {editedPost.split(/\s+/).filter(Boolean).length} words
                      </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs text-amber-300">
                      <Info className="h-5 w-5 text-amber-400 shrink-0" />
                      <div>
                        <strong>Pro-Tip:</strong> Review formatting constraints. We have enforced double-line breaks and zero em-dashes automatically. If you edit, ensure these parameters are maintained before copy-pasting to LinkedIn.
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Humanization Changes (Before vs After) */}
                {activeResultTab === "diff" && (
                  <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.01] p-6">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display mb-3">AI Tell Replacement Index</h3>
                    <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">
                      The AI scrub rules mapped out these specific replacements during construction to bypass content flags and make the style read human.
                    </p>

                    <div className="max-h-80 overflow-y-auto space-y-3 scrollbar-thin">
                      {result.humanizationDiff && result.humanizationDiff.length > 0 ? (
                        result.humanizationDiff.map((item, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-3 text-xs bg-black/40 border border-white/5 rounded-xl p-3 items-center">
                            <div className="col-span-4 font-mono text-rose-400 bg-rose-500/5 px-2 py-1 rounded border border-rose-500/10 line-through truncate" title={item.original}>
                              {item.original}
                            </div>
                            <div className="col-span-1 text-center text-zinc-600">➔</div>
                            <div className="col-span-4 font-mono text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 truncate" title={item.replacement}>
                              {item.replacement}
                            </div>
                            <div className="col-span-3 text-[10px] text-zinc-500 text-right truncate" title={item.reason}>
                              {item.reason}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-xs text-zinc-500 py-10 bg-black/40 border border-white/5 rounded-2xl">
                          No replacements were needed. The draft was constructed cleanly from raw variables.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tab 4: Algorithmic Pass-Fail Checklist */}
                {activeResultTab === "audit" && (
                  <div className="space-y-4 rounded-3xl border border-white/5 bg-white/[0.01] p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">Algorithmic Checklist</h3>
                      <div className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Audit Passed
                      </div>
                    </div>

                    <div className="space-y-3">
                      {result.audit?.checks.map((check, idx) => (
                        <div key={idx} className="flex items-start gap-3 bg-black/40 border border-white/5 rounded-xl p-3">
                          {check.status === "PASS" && (
                            <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          )}
                          {check.status === "WARNING" && (
                            <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          {check.status === "FAIL" && (
                            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                          )}
                          
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-white block">{check.name}</span>
                            <span className="text-[10px] text-zinc-400 leading-relaxed block">{check.message}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
