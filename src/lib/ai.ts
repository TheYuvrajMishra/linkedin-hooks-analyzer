import Groq from "groq-sdk";

// ─────────────────────────────────────────────────────────────────────────────
// Groq client
// ─────────────────────────────────────────────────────────────────────────────
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || process.env.api_key || "",
});

// ─────────────────────────────────────────────────────────────────────────────
// Free-tier model pool (fast, zero-cost on Groq free plan)
// Rate limits (free tier, per-model): ~30 req/min, ~6 000 tok/min, ~500 000 tok/day
// We rotate through all three so no single model exhausts its window.
// ─────────────────────────────────────────────────────────────────────────────
const MODEL_POOL = [
  "llama-3.1-8b-instant",   // Ultra-fast, very low token cost
  "gemma2-9b-it",           // Google Gemma 2, solid JSON adherence
  "llama3-8b-8192",         // Meta Llama 3, reliable fallback
] as const;

type GroqModel = (typeof MODEL_POOL)[number];

// Round-robin cursor — shared across the process lifetime
let modelCursor = 0;

/**
 * Pick the next model in rotation and advance the cursor.
 */
function nextModel(): GroqModel {
  const model = MODEL_POOL[modelCursor % MODEL_POOL.length];
  modelCursor++;
  return model;
}

// ─────────────────────────────────────────────────────────────────────────────
// Retry helper — exponential backoff with automatic model rotation on 429
// ─────────────────────────────────────────────────────────────────────────────
const MAX_RETRIES = MODEL_POOL.length * 2; // Try every model at least twice
const BASE_DELAY_MS = 1200;               // 1.2 s initial wait (stays under RPM)

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * Call Groq with automatic retry + model rotation on rate-limit (429) errors.
 * Other errors are surfaced immediately.
 */
async function groqChat(
  messages: ChatMessage[],
  temperature = 0.1,
): Promise<string> {
  let lastError: unknown;
  let delay = BASE_DELAY_MS;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const model = nextModel();
    try {
      const res = await groq.chat.completions.create({
        model,
        messages,
        temperature,
        response_format: { type: "json_object" },
        max_tokens: 512,           // Keep each call tiny to protect TPM budget
      });
      return res.choices[0]?.message?.content ?? "{}";
    } catch (err: unknown) {
      lastError = err;

      // Check for rate-limit (429) or service-unavailable (503)
      const status = (err as { status?: number })?.status;
      if (status === 429 || status === 503) {
        console.warn(
          `[Groq] Rate-limit on model "${model}" (attempt ${attempt + 1}/${MAX_RETRIES}). ` +
            `Rotating model and waiting ${delay}ms…`,
        );
        await sleep(delay);
        delay = Math.min(delay * 2, 15_000); // Cap at 15 s back-off
        continue;
      }

      // Non-rate-limit error — fail fast so the caller's fallback kicks in
      throw err;
    }
  }

  throw lastError;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inter-post throttle
// Groq free tier: ~30 req/min = 1 req / 2 s.
// We issue 1 call per post, so 2 s gap keeps us comfortably under 30 req/min.
// ─────────────────────────────────────────────────────────────────────────────
const INTER_POST_DELAY_MS = 2000;

// ─────────────────────────────────────────────────────────────────────────────
// Public types (unchanged — preserved for full backward compatibility)
// ─────────────────────────────────────────────────────────────────────────────
export interface AnalyzedPost {
  id?: string;
  postUrl: string;
  publishedAt?: Date | string | null;
  impressions: number;
  engagements: number;
  engagementRate: number;
  postText?: string | null;
  hook?: string | null;
  hookType?: string | null;
  topic?: string | null;
  hookLength?: number | null;
  openingWords?: string | null;
  sentenceStructure?: string | null;
  analyzed?: boolean;
}

interface HookPatternSummary {
  hook: string;
  topic: string | null | undefined;
  hookType: string | null | undefined;
  impressions: number;
  engagementRate: number;
  sentenceStructure: string | null | undefined;
  length: number | null | undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Fallback heuristics (zero API calls — used when Groq fails)
// ─────────────────────────────────────────────────────────────────────────────
function fallbackClassifyHookType(hook: string): string {
  const h = hook.toLowerCase();
  if (h.includes("?")) return "Question";
  if (h.includes("fail") || h.includes("mistake") || h.includes("broke")) return "Failure";
  if (h.includes("won") || h.includes("got") || h.includes("achieved") || h.includes("revenue")) return "Achievement";
  if (h.includes("story") || h.includes("years ago") || h.includes("when i")) return "Story";
  if (h.includes("how to") || h.includes("guide") || h.includes("learn")) return "Educational";
  if (h.includes("building") || h.includes("public") || h.includes("ship") || h.includes("behind the scenes")) return "Building In Public";
  if (h.includes("salary") || h.includes("hired") || h.includes("job") || h.includes("career")) return "Career";
  if (h.includes("unpopular") || h.includes("stop") || h.includes("don't")) return "Contrarian";
  return "Curiosity";
}

function fallbackClassifyTopic(postText: string): string {
  const t = postText.toLowerCase();
  if (t.includes("next.js") || t.includes("nextjs")) return "Next.js";
  if (t.includes("react")) return "React";
  if (t.includes("ai ") || t.includes("artificial") || t.includes("gpt") || t.includes("llm")) return "AI";
  if (t.includes("saas") || t.includes("micro-saas")) return "SaaS";
  if (t.includes("startup") || t.includes("founder")) return "Startups";
  if (t.includes("hire") || t.includes("recruiting") || t.includes("team")) return "Hiring";
  if (t.includes("freelance") || t.includes("contract")) return "Freelancing";
  if (t.includes("design") || t.includes("ui") || t.includes("ux")) return "UI/UX";
  if (t.includes("productive") || t.includes("focus") || t.includes("habit")) return "Productivity";
  if (t.includes("brand") || t.includes("audience") || t.includes("write")) return "Personal Branding";
  if (t.includes("career") || t.includes("job") || t.includes("developer")) return "Career";
  return "Entrepreneurship";
}

// ─────────────────────────────────────────────────────────────────────────────
// Core per-post analysis — ONE Groq call per post
// Extracts hook + classifies hook type + topic in a single request.
// ─────────────────────────────────────────────────────────────────────────────
const HOOK_CATEGORIES = [
  "Curiosity", "Contrarian", "Story", "Failure", "Achievement",
  "Opinion", "Question", "Educational", "Building In Public", "Career",
] as const;

const TOPIC_CATEGORIES = [
  "AI", "Startups", "SaaS", "Career", "Hiring", "Freelancing",
  "Full Stack", "React", "Next.js", "UI/UX", "Productivity",
  "Entrepreneurship", "Personal Branding",
] as const;

export async function extractHook(postText: string): Promise<string> {
  if (!postText) return "";
  try {
    const raw = await groqChat([
      {
        role: "system",
        content:
          'You are a LinkedIn content analyzer. Extract the hook (first 2-3 lines, max 280 chars). Return ONLY JSON: { "hook": "extracted hook text" }.',
      },
      { role: "user", content: `Post:\n${postText.slice(0, 800)}` },
    ]);
    const data = JSON.parse(raw);
    return data.hook || postText.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n").trim();
  } catch {
    return postText.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n").trim();
  }
}

export async function classifyHookType(hook: string): Promise<string> {
  try {
    const raw = await groqChat([
      {
        role: "system",
        content: `Classify the LinkedIn hook into ONE of: ${HOOK_CATEGORIES.join(", ")}. Return ONLY JSON: { "hookType": "CategoryName" }.`,
      },
      { role: "user", content: `Hook:\n${hook.slice(0, 400)}` },
    ]);
    const data = JSON.parse(raw);
    if (HOOK_CATEGORIES.includes(data.hookType)) return data.hookType;
  } catch {
    // fall through
  }
  return fallbackClassifyHookType(hook);
}

export async function classifyTopic(postText: string): Promise<string> {
  try {
    const raw = await groqChat([
      {
        role: "system",
        content: `Classify the topic of the LinkedIn post into ONE of: ${TOPIC_CATEGORIES.join(", ")}. Return ONLY JSON: { "topic": "TopicName" }.`,
      },
      { role: "user", content: `Post text:\n${postText.slice(0, 800)}` },
    ]);
    const data = JSON.parse(raw);
    if (TOPIC_CATEGORIES.includes(data.topic)) return data.topic;
  } catch {
    // fall through
  }
  return fallbackClassifyTopic(postText);
}

/**
 * Combined post analysis — ONE Groq call covers all three tasks.
 * Includes a 2 s inter-call delay to stay well under Groq free-tier rate limits.
 */
export async function analyzePostContent(
  postText: string,
): Promise<{ hook: string; hookType: string; topic: string }> {
  if (!postText) {
    return { hook: "", hookType: "Curiosity", topic: "Entrepreneurship" };
  }

  // Truncate input to ~800 chars — enough context, far fewer tokens consumed
  const truncated = postText.slice(0, 800);

  try {
    const raw = await groqChat([
      {
        role: "system",
        content: `You are an expert LinkedIn content analyzer.
Analyze the post and return ONLY this JSON (no markdown, no extra keys):
{
  "hook": "<first 2-3 lines, max 280 chars>",
  "hookType": "<one of: ${HOOK_CATEGORIES.join(" | ")}>",
  "topic": "<one of: ${TOPIC_CATEGORIES.join(" | ")}>"
}`,
      },
      { role: "user", content: `Post:\n${truncated}` },
    ]);

    const data = JSON.parse(raw);

    let hook: string = data.hook || "";
    if (!hook) hook = postText.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n").trim();
    if (hook.length > 280) hook = hook.slice(0, 277) + "…";

    const hookType: string = HOOK_CATEGORIES.includes(data.hookType)
      ? data.hookType
      : fallbackClassifyHookType(hook);

    const topic: string = TOPIC_CATEGORIES.includes(data.topic)
      ? data.topic
      : fallbackClassifyTopic(postText);

    // Polite delay before next post call
    await sleep(INTER_POST_DELAY_MS);

    return { hook, hookType, topic };
  } catch (error) {
    console.error("[Groq] analyzePostContent failed — using heuristic fallback:", error);
    const hook = postText.split("\n").filter((l) => l.trim()).slice(0, 3).join("\n").trim();
    return {
      hook,
      hookType: fallbackClassifyHookType(hook),
      topic: fallbackClassifyTopic(postText),
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Strategic AI insight analysis — single large call (done once, not per-post)
// ─────────────────────────────────────────────────────────────────────────────
export interface AIAnalysisResult {
  winningHooks: string[];
  winningTopics: string[];
  recommendations: string[];
  suggestedHooks?: Array<{
    hookTemplate: string;
    hookType: string;
    topic: string;
    explanation: string;
  }>;
}

interface MetricStat {
  name: string;
  count: number;
  totalImpressions: number;
  avgImpressions: number;
  totalEngagements: number;
  avgEngagements: number;
  avgER: number;
}

interface DetailedStats {
  topics: MetricStat[];
  hookTypes: MetricStat[];
  lengths: MetricStat[];
  structures: MetricStat[];
  top5: HookPatternSummary[];
  bottom5: HookPatternSummary[];
}

function calculateDetailedStats(posts: AnalyzedPost[]): DetailedStats {
  const topicStats: Record<string, { count: number; imp: number; eng: number; erSum: number }> = {};
  const hookTypeStats: Record<string, { count: number; imp: number; eng: number; erSum: number }> = {};
  const lengthStats: Record<string, { count: number; imp: number; eng: number; erSum: number }> = {
    "Short (< 100 chars)": { count: 0, imp: 0, eng: 0, erSum: 0 },
    "Medium (100-200 chars)": { count: 0, imp: 0, eng: 0, erSum: 0 },
    "Long (> 200 chars)": { count: 0, imp: 0, eng: 0, erSum: 0 },
  };
  const structureStats: Record<string, { count: number; imp: number; eng: number; erSum: number }> = {};

  for (const post of posts) {
    const t = post.topic || "Unknown";
    const ht = post.hookType || "Unknown";
    const len = post.hookLength || (post.hook ? post.hook.length : 0);
    const struct = post.sentenceStructure || "Unknown";
    const imp = post.impressions || 0;
    const eng = post.engagements || 0;
    const er = post.engagementRate || 0;

    if (!topicStats[t]) topicStats[t] = { count: 0, imp: 0, eng: 0, erSum: 0 };
    topicStats[t].count++; topicStats[t].imp += imp; topicStats[t].eng += eng; topicStats[t].erSum += er;

    if (!hookTypeStats[ht]) hookTypeStats[ht] = { count: 0, imp: 0, eng: 0, erSum: 0 };
    hookTypeStats[ht].count++; hookTypeStats[ht].imp += imp; hookTypeStats[ht].eng += eng; hookTypeStats[ht].erSum += er;

    let lenKey = "Short (< 100 chars)";
    if (len >= 100 && len <= 200) lenKey = "Medium (100-200 chars)";
    else if (len > 200) lenKey = "Long (> 200 chars)";
    lengthStats[lenKey].count++; lengthStats[lenKey].imp += imp; lengthStats[lenKey].eng += eng; lengthStats[lenKey].erSum += er;

    if (!structureStats[struct]) structureStats[struct] = { count: 0, imp: 0, eng: 0, erSum: 0 };
    structureStats[struct].count++; structureStats[struct].imp += imp; structureStats[struct].eng += eng; structureStats[struct].erSum += er;
  }

  const mapToStatsList = (
    statsMap: Record<string, { count: number; imp: number; eng: number; erSum: number }>,
  ): MetricStat[] =>
    Object.entries(statsMap)
      .map(([name, val]) => ({
        name,
        count: val.count,
        totalImpressions: val.imp,
        avgImpressions: val.count > 0 ? Math.round(val.imp / val.count) : 0,
        totalEngagements: val.eng,
        avgEngagements: val.count > 0 ? Math.round(val.eng / val.count) : 0,
        avgER: val.count > 0 ? parseFloat((val.erSum / val.count).toFixed(2)) : 0,
      }))
      .sort((a, b) => {
        const sA = a.avgER * (a.count / (a.count + 4));
        const sB = b.avgER * (b.count / (b.count + 4));
        return sB - sA;
      });

  const topics = mapToStatsList(topicStats);
  const hookTypes = mapToStatsList(hookTypeStats);
  const lengths = mapToStatsList(lengthStats).filter((l) => l.count > 0);
  const structures = mapToStatsList(structureStats);

  const sortedByER = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
  const top5 = sortedByER.slice(0, 5).map((p) => ({
    hook: p.hook || "",
    topic: p.topic,
    hookType: p.hookType,
    impressions: p.impressions,
    engagementRate: p.engagementRate,
    sentenceStructure: p.sentenceStructure,
    length: p.hookLength,
  }));
  const bottom5 = sortedByER
    .slice(-5)
    .reverse()
    .map((p) => ({
      hook: p.hook || "",
      topic: p.topic,
      hookType: p.hookType,
      impressions: p.impressions,
      engagementRate: p.engagementRate,
      sentenceStructure: p.sentenceStructure,
      length: p.hookLength,
    }));

  return { topics, hookTypes, lengths, structures, top5, bottom5 };
}

function formatStatsSection(list: MetricStat[]): string {
  const reliable = list.filter((i) => i.count >= 3);
  const emerging = list.filter((i) => i.count < 3);
  let out = "";
  if (reliable.length)
    out += `Reliable (>= 3 posts):\n` +
      reliable.map((t, i) => `  ${i + 1}. ${t.name}: ${t.count} posts, AvgER: ${t.avgER}%, AvgImp: ${t.avgImpressions}`).join("\n") + "\n\n";
  if (emerging.length)
    out += `Emerging (< 3 posts — HIGH VARIANCE):\n` +
      emerging.map((t) => `  - ${t.name}: ${t.count} posts, AvgER: ${t.avgER}%`).join("\n") + "\n\n";
  return out.trim() || "No data";
}

/**
 * Analyzes post patterns and returns strategic AI insights.
 * This is ONE large Groq call (runs only once per analysis session).
 * Uses a slightly larger model limit since it's infrequent.
 */
export async function analyzeContentPatterns(
  posts: AnalyzedPost[],
): Promise<AIAnalysisResult> {
  if (!posts || posts.length === 0) {
    return {
      winningHooks: ["No posts uploaded yet."],
      winningTopics: ["No posts uploaded yet."],
      recommendations: ["Upload your LinkedIn analytics Excel file to receive AI-powered copy recommendations."],
      suggestedHooks: [],
    };
  }

  const stats = calculateDetailedStats(posts);
  const bestTopicStat = stats.topics[0];
  const bestHookStat = stats.hookTypes[0];

  // Compact metric summary — keeps prompt small to save tokens
  const metricsSummary = `
Posts analyzed: ${posts.length}

TOP TOPIC: ${bestTopicStat?.name ?? "N/A"} (AvgER: ${bestTopicStat?.avgER ?? 0}%, AvgImp: ${bestTopicStat?.avgImpressions ?? 0}, n=${bestTopicStat?.count ?? 0})
TOP HOOK TYPE: ${bestHookStat?.name ?? "N/A"} (AvgER: ${bestHookStat?.avgER ?? 0}%, n=${bestHookStat?.count ?? 0})

TOPICS:\n${formatStatsSection(stats.topics)}
HOOK TYPES:\n${formatStatsSection(stats.hookTypes)}
HOOK LENGTHS:\n${stats.lengths.map((l, i) => `  ${i + 1}. ${l.name}: n=${l.count}, AvgER=${l.avgER}%`).join("\n")}
SENTENCE STRUCTURES:\n${stats.structures.map((s, i) => `  ${i + 1}. ${s.name}: n=${s.count}, AvgER=${s.avgER}%`).join("\n")}

TOP 5 HOOKS:\n${stats.top5.map((p, i) => `  #${i + 1} ER=${p.engagementRate}% Imp=${p.impressions} Type=${p.hookType} Topic=${p.topic}\n  Hook: "${p.hook.replace(/\n/g, " ").slice(0, 120)}"`).join("\n")}

BOTTOM 5 HOOKS:\n${stats.bottom5.map((p, i) => `  #${i + 1} ER=${p.engagementRate}% Type=${p.hookType}\n  Hook: "${p.hook.replace(/\n/g, " ").slice(0, 80)}"`).join("\n")}
`.trim();

  try {
    // For the insight call, allow more output tokens
    const model = nextModel();
    const res = await groq.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an elite LinkedIn viral copywriter and strategist.
Analyze the user's aggregated LinkedIn performance data and return ONLY this JSON (no markdown):
{
  "winningHooks": ["<2-3 specific insights about high-ER hook patterns, citing actual data>"],
  "winningTopics": ["<2-3 specific insights about winning topics with their metrics>"],
  "recommendations": ["<3 actionable copy rules derived from their own data>"],
  "suggestedHooks": [
    { "hookTemplate": "<ready-to-use hook with [brackets]>", "hookType": "<type>", "topic": "<topic>", "explanation": "<why derived from their data>" }
  ]
}
RULES: Prioritize reliable data (>= 3 posts). Do NOT treat low-volume flukes as strategic wins. Be specific — mention numbers and hook examples.`,
        },
        {
          role: "user",
          content: `LinkedIn Performance Data:\n${metricsSummary}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1500,
    });

    const content = res.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(content);
    return {
      winningHooks: Array.isArray(data.winningHooks) ? data.winningHooks : [],
      winningTopics: Array.isArray(data.winningTopics) ? data.winningTopics : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      suggestedHooks: Array.isArray(data.suggestedHooks) ? data.suggestedHooks : [],
    };
  } catch (error) {
    console.error("[Groq] analyzeContentPatterns failed — using heuristic fallback:", error);
    return calculateSimpleRecommendations(posts);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pure-code fallback — no LLM required
// ─────────────────────────────────────────────────────────────────────────────
function calculateSimpleRecommendations(posts: AnalyzedPost[]): AIAnalysisResult {
  const stats = calculateDetailedStats(posts);
  const bestHookStat = stats.hookTypes[0];
  const bestTopicStat = stats.topics[0];
  const secondBestTopicStat = stats.topics[1];
  const secondBestHookStat = stats.hookTypes[1];

  const bestHook = bestHookStat?.name || "Failure";
  const bestTopic = bestTopicStat?.name || "Next.js";
  const bestLength = stats.lengths[0]?.name || "Medium (100-200 chars)";
  const bestStruct = stats.structures[0]?.name || "Declarative Statement";
  const secondBestTopic = secondBestTopicStat?.name || "AI";
  const secondBestHook = secondBestHookStat?.name || "Contrarian";
  const topPost = [...posts].sort((a, b) => b.engagementRate - a.engagementRate)[0];

  return {
    winningHooks: [
      `Hook style "${bestHook}" is your primary engagement engine — avg ER ${bestHookStat?.avgER ?? 0}% across ${bestHookStat?.count ?? 0} posts.`,
      topPost
        ? `Your best post used "${topPost.hookType}" style: "${topPost.hook?.split("\n")[0] ?? ""}". Real specifics drive comments.`
        : `Your audience responds best to the "${bestHook}" format.`,
    ],
    winningTopics: [
      `"${bestTopic}" leads in average engagement rate (${bestTopicStat?.avgER ?? 0}% across ${bestTopicStat?.count ?? 0} posts).`,
      secondBestTopicStat
        ? `"${secondBestTopicStat.name}" is a strong second — ${secondBestTopicStat.avgImpressions} avg impressions per post.`
        : "Diversify your themes to optimize reach.",
    ],
    recommendations: [
      `Double down on "${bestTopic}" posts with a "${bestHook}" styled hook.`,
      `Use "${bestStruct}" sentence structure at "${bestLength}" — proven most effective in your dataset.`,
      topPost
        ? `Model your hook length after your top post (${topPost.hookLength ?? "~120"} chars). Short sentences, deliberate line breaks.`
        : `Keep hooks under 120 characters. One punchy claim per line maximizes mobile viewport impact.`,
    ],
    suggestedHooks: [
      {
        hookTemplate: `I spent 30 days building with ${bestTopic}.\n\nHere's the single mistake that cost me [Insert Time/Money]:`,
        hookType: bestHook,
        topic: bestTopic,
        explanation: `Replicates your top post style — pairs your best topic (${bestTopic}) with your best hook archetype (${bestHook}).`,
      },
      {
        hookTemplate: `Everyone says [Insert Common Advice] when building in ${bestTopic}.\n\nAfter [Insert Time], I realized it's a trap.\n\nHere's what to do instead:`,
        hookType: secondBestHook || "Contrarian",
        topic: bestTopic,
        explanation: `High-conversion contrarian hook for ${bestTopic} — disrupts the feed and drives click-throughs.`,
      },
      {
        hookTemplate: `How to master ${secondBestTopic} in [Timeframe] without [Common Struggle].\n\nNo courses. No bootcamps. Just these 3 rules:`,
        hookType: "Educational",
        topic: secondBestTopic,
        explanation: `Authority-building template for your second strongest topic (${secondBestTopic}).`,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Post Writer & Programmatic Humanizer
// ─────────────────────────────────────────────────────────────────────────────

export interface GeneratePostParams {
  topic: string;
  angle: string;
  audience: string;
  length: string;
  hookFormula: string;
  anecdotes?: string;
  specificNumbers?: string;
  namedEntity?: string;
  firstPersonDetail?: string;
  vulnerability?: string;
  pastPosts: any[];
}

export function programmaticallyScrubAndAudit(text: string): {
  scrubbedText: string;
  auditResults: {
    passed: boolean;
    checks: Array<{ name: string; status: "PASS" | "WARNING" | "FAIL"; message: string }>;
  };
} {
  let scrubbed = text;
  const checks: Array<{ name: string; status: "PASS" | "WARNING" | "FAIL"; message: string }> = [];

  // 1. Programmatic Scrubbing (Forensic & Strict)
  scrubbed = scrubbed.replace(/—/g, " - ");
  scrubbed = scrubbed.replace(/--/g, " - ");

  const vocabSwaps: Record<string, string> = {
    "leverage": "use",
    "utilize": "use",
    "delve": "look",
    "harness": "use",
    "foster": "build",
    "cultivate": "grow",
    "vibrant": "alive",
    "robust": "solid",
    "intricate": "complex",
    "garner": "get",
    "showcase": "show",
    "underscore": "show",
    "game-changer": "major shift",
    "deep dive": "close look",
    "move the needle": "make a difference",
    "in today's fast-paced world": "today",
    "at the end of the day": "ultimately",
  };

  for (const [bad, good] of Object.entries(vocabSwaps)) {
    const regex = new RegExp(`\\b${bad}\\b`, "gi");
    scrubbed = scrubbed.replace(regex, good);
  }

  const fillers = ["fundamentally", "essentially", "ultimately", "crucially", "notably"];
  for (const filler of fillers) {
    const regex = new RegExp(`\\b${filler}\\b`, "gi");
    scrubbed = scrubbed.replace(regex, "");
  }

  // Punctuation normalisation
  scrubbed = scrubbed.replace(/[\u201C\u201D]/g, '"'); // curly double quotes
  scrubbed = scrubbed.replace(/[\u2018\u2019]/g, "'"); // curly single quotes

  // Clean cliché closers
  scrubbed = scrubbed.replace(/what do you think\?/gi, "");
  scrubbed = scrubbed.replace(/tag someone who needs this/gi, "");

  // Clean empty lines or double spaces resulting from removals
  scrubbed = scrubbed.replace(/[ \t]+/g, " ");

  // 2. Perform Audit Heuristics
  const charCount = scrubbed.length;
  if (charCount >= 900 && charCount <= 1300) {
    checks.push({ name: "Post Length", status: "PASS", message: `Post is ${charCount} characters (fits the 900-1300 sweet spot).` });
  } else if (charCount >= 300 && charCount < 900) {
    checks.push({ name: "Post Length", status: "PASS", message: `Post is ${charCount} characters (short form).` });
  } else if (charCount > 1300 && charCount <= 1900) {
    checks.push({ name: "Post Length", status: "WARNING", message: `Post is ${charCount} characters (long form, slightly above sweet spot).` });
  } else {
    checks.push({ name: "Post Length", status: "FAIL", message: `Post is ${charCount} characters (keep between 300 and 1900).` });
  }

  const lines = scrubbed.split("\n").filter(l => l.trim());
  const hookText = lines.slice(0, 2).join("\n");
  if (hookText.length <= 210) {
    checks.push({ name: "Hook Length", status: "PASS", message: `First lines are ${hookText.length} characters (will display fully before 'see more').` });
  } else {
    checks.push({ name: "Hook Length", status: "FAIL", message: `First lines are ${hookText.length} characters (exceeds the 210-character limit).` });
  }

  if (/[—]/.test(text) || /--/.test(text)) {
    checks.push({ name: "Em Dashes", status: "WARNING", message: "Em-dashes were detected in the draft and were programmatically replaced/removed." });
  } else {
    checks.push({ name: "Em Dashes", status: "PASS", message: "No em-dashes found." });
  }

  const detectedAIWords = Object.keys(vocabSwaps).concat(fillers).filter(word => {
    const regex = new RegExp(`\\b${word}\\b`, "i");
    return regex.test(text);
  });
  if (detectedAIWords.length > 0) {
    checks.push({ name: "AI Vocabulary", status: "WARNING", message: `Detected AI vocabulary words (${detectedAIWords.join(", ")}) which were cleaned.` });
  } else {
    checks.push({ name: "AI Vocabulary", status: "PASS", message: "No AI signature vocabulary detected." });
  }

  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu;
  const emojis = text.match(emojiRegex) || [];
  if (emojis.length > 3) {
    checks.push({ name: "Emoji Density", status: "WARNING", message: `Found ${emojis.length} emojis. High emoji density can trigger LinkedIn spam filters.` });
  } else {
    checks.push({ name: "Emoji Density", status: "PASS", message: `Found ${emojis.length} emojis.` });
  }

  const passed = !checks.some(c => c.status === "FAIL");

  return {
    scrubbedText: scrubbed,
    auditResults: {
      passed,
      checks
    }
  };
}

export async function generateAndHumanizePost(params: GeneratePostParams) {
  const topicCounts: Record<string, number> = {};
  const hookCounts: Record<string, number> = {};
  const totalPostsCount = params.pastPosts.length;
  
  params.pastPosts.forEach(p => {
    if (p.topic) topicCounts[p.topic] = (topicCounts[p.topic] || 0) + 1;
    if (p.hookType) hookCounts[p.hookType] = (hookCounts[p.hookType] || 0) + 1;
  });

  const topPastPosts = [...params.pastPosts]
    .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
    .slice(0, 5)
    .map(p => ({
      topic: p.topic,
      hookType: p.hookType,
      er: p.engagementRate,
      hook: p.hook ? p.hook.replace(/\n/g, " ").slice(0, 100) : ""
    }));

  const historySummary = {
    totalPostsCount,
    topicsDistribution: topicCounts,
    hookTypesDistribution: hookCounts,
    topPerformingPosts: topPastPosts
  };

  const formulas: Record<string, string> = {
    "F1": "Platform Risk Anaphora: Repetitive starting lines pointing out platform risk, followed by your custom fix/product.",
    "F2": "R.I.P. Obituary: Format post as obituary claiming an old strategy/norm is dead, and explain the new pivot.",
    "F3": "Year-over-Year Pivot: Contrast what you did/thought in past years vs now.",
    "F4": "Time-Anchor Confession: Start with a confession about something you did or believed X years ago, and reveal the truth.",
    "F5": "Self-Proving Meta: Commit to a public challenge, detailing the plan and how readers can track your progress.",
    "F6": "Comment-Gate Lead Magnet: Announce a valuable free resource and tell users to comment to get it.",
    "F7": "Odd-Precision Money Ledger: Share precise financial figures (revenue/costs) with odd decimals or amounts, and break down why.",
    "F8": "Paid-vs-Free Reversal: Contrast what people pay thousands of dollars for with what you give away for free.",
    "F9": "Curiosity-Gap Teaser: Share a surprising, counter-intuitive data pattern or finding and trace it behind the scenes.",
    "F10": "Contrarian + Historical Receipts: Share a sacred-cow tech/AI take, backed by historical context/analogies.",
  };

  const selectedFormulaDesc = formulas[params.hookFormula] || "Choose the best matching formula from F1 to F10 based on the topic.";

  const systemPrompt = `You are an elite LinkedIn copywriter and positioning analyst.
Analyze the user's past posting history, topic distribution, and performance.
Create a LinkedIn post that:
1. Aligns with their historical context (avoids direct duplicates, maintains style continuity).
2. Adheres to the designated hook formula or picks the best matching one.
3. Fits the length constraint: ${params.length} characters (short: 300-500, medium: 900-1300, long: 1500-1900).
4. Integrates the user's provided anecdotes, specific numbers, and personal details.
5. Employs aggressive sentence-length variance, breaks parallel lists, and inserts sentence fragments.
6. Absolutely avoids em dashes (—), negative parallelisms, and corporate buzzwords ("delve", "leverage", "robust", etc.).

Return ONLY JSON matching this format:
{
  "contextReport": {
    "situationOverview": "<Analysis of what they have posted previously and how this topic fits in.>",
    "topicCheck": "<Verification of whether they have already written about this specific angle.>",
    "relevanceExplanation": "<Explanation of why this topic is relevant to their situation and target audience.>"
  },
  "chosenFormula": {
    "code": "<Formula Code, e.g. F3>",
    "name": "<Formula Name>",
    "reason": "<Why this formula was selected>"
  },
  "initialDraft": "<The first draft of the post adhering to length and structure, before advanced humanizer passes.>",
  "humanizedDraft": "<The post draft after applying the humanizer rules (Forensic, Strict, and Aesthetic passes, using variance, fragments, specific numbers, named entities, and vulnerability).>",
  "humanizationDiff": [
    { "original": "<Original phrase/word>", "replacement": "<Humanized phrase/word>", "reason": "<Why the change was made (e.g. AI Vocab word leverage replaced)>" }
  ],
  "messageOfRelevance": "<A message to the user explaining how the post fits their situation.>"
}`;

  const userPrompt = `
Topic: ${params.topic}
Angle: ${params.angle}
Target Audience: ${params.audience}
Target Length Category: ${params.length}
Selected Hook Formula: ${params.hookFormula} (Description: ${selectedFormulaDesc})

User Situation Context:
- Specific Numbers: ${params.specificNumbers || "None provided"}
- Named Entity: ${params.namedEntity || "None provided"}
- First-Person Detail: ${params.firstPersonDetail || "None provided"}
- Vulnerability / Stakes: ${params.vulnerability || "None provided"}
- Anecdotes / Draft Ideas: ${params.anecdotes || "None provided"}

User Past Posts Summary:
${JSON.stringify(historySummary, null, 2)}
`;

  try {
    const raw = await groqChat([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ], 0.3);
    
    const data = JSON.parse(raw);
    
    // Apply strict programmatic cleanup and auditing as a safety net
    const finalDraft = data.humanizedDraft || data.initialDraft || "";
    const cleanResults = programmaticallyScrubAndAudit(finalDraft);
    
    return {
      ...data,
      humanizedDraft: cleanResults.scrubbedText,
      audit: cleanResults.auditResults
    };
  } catch (error) {
    console.error("Error in generateAndHumanizePost:", error);
    throw error;
  }
}
