import OpenAI from "openai";

const apiKey = process.env.FREELLM_API_KEY || "freellmapi-ee8a352746a891c55ecc1a17b56c356ab0f1cce2c9b5442b";
const baseURL = process.env.FREELLM_BASE_URL || "http://localhost:3001/v1";
const model = process.env.FREELLM_MODEL || "auto";

// Create client
const client = new OpenAI({
  apiKey,
  baseURL,
});

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

/**
 * Fallback classification heuristic for hook type.
 */
function fallbackClassifyHookType(hook: string): string {
  const lowerHook = hook.toLowerCase();
  if (lowerHook.includes("?")) return "Question";
  if (lowerHook.includes("fail") || lowerHook.includes("mistake") || lowerHook.includes("broke")) return "Failure";
  if (lowerHook.includes("won") || lowerHook.includes("got") || lowerHook.includes("achieved") || lowerHook.includes("revenue")) return "Achievement";
  if (lowerHook.includes("story") || lowerHook.includes("years ago") || lowerHook.includes("when i")) return "Story";
  if (lowerHook.includes("how to") || lowerHook.includes("guide") || lowerHook.includes("learn")) return "Educational";
  if (lowerHook.includes("building") || lowerHook.includes("public") || lowerHook.includes("ship") || lowerHook.includes("behind the scenes")) return "Building In Public";
  if (lowerHook.includes("salary") || lowerHook.includes("hired") || lowerHook.includes("job") || lowerHook.includes("career")) return "Career";
  if (lowerHook.includes("unpopular") || lowerHook.includes("stop") || lowerHook.includes("don't")) return "Contrarian";
  return "Curiosity";
}

/**
 * Fallback classification heuristic for topic.
 */
function fallbackClassifyTopic(postText: string): string {
  const textLower = postText.toLowerCase();
  if (textLower.includes("next.js") || textLower.includes("nextjs")) return "Next.js";
  if (textLower.includes("react")) return "React";
  if (textLower.includes("ai ") || textLower.includes("artificial") || textLower.includes("gpt") || textLower.includes("llm")) return "AI";
  if (textLower.includes("saas") || textLower.includes("micro-saas")) return "SaaS";
  if (textLower.includes("startup") || textLower.includes("founder")) return "Startups";
  if (textLower.includes("hire") || textLower.includes("recruiting") || textLower.includes("team")) return "Hiring";
  if (textLower.includes("freelance") || textLower.includes("contract")) return "Freelancing";
  if (textLower.includes("design") || textLower.includes("ui") || textLower.includes("ux")) return "UI/UX";
  if (textLower.includes("productive") || textLower.includes("focus") || textLower.includes("habit")) return "Productivity";
  if (textLower.includes("brand") || textLower.includes("audience") || textLower.includes("write")) return "Personal Branding";
  if (textLower.includes("career") || textLower.includes("job") || textLower.includes("developer")) return "Career";
  return "Entrepreneurship";
}

/**
 * Extracts the hook (first 2-3 lines) from a LinkedIn post.
 */
export async function extractHook(postText: string): Promise<string> {
  if (!postText) return "";
  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: "You are a LinkedIn content analyzer. Your task is to extract the hook (first 2-3 lines, maximum 280 characters) from a given LinkedIn post text. Return ONLY a JSON object: { \"hook\": \"extracted hook text\" }.",
        },
        {
          role: "user",
          content: `Post:\n${postText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);
    return data.hook || postText.split("\n").slice(0, 3).join("\n").trim();
  } catch (error) {
    console.error("Error in AI hook extraction:", error);
    return postText.split("\n").filter((l) => l.trim().length > 0).slice(0, 3).join("\n").trim();
  }
}

/**
 * Classifies a hook into one of the allowed categories.
 */
export async function classifyHookType(hook: string): Promise<string> {
  const allowedCategories = [
    "Curiosity",
    "Contrarian",
    "Story",
    "Failure",
    "Achievement",
    "Opinion",
    "Question",
    "Educational",
    "Building In Public",
    "Career",
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an AI classifier. Classify the given LinkedIn hook into exactly ONE of the following categories: ${allowedCategories.join(
            ", "
          )}. Return ONLY a JSON object: { "hookType": "CategoryName" }.`,
        },
        {
          role: "user",
          content: `Hook:\n${hook}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);
    const result = data.hookType;
    if (allowedCategories.includes(result)) {
      return result;
    }
  } catch (error) {
    console.error("Error in AI hook classification:", error);
  }

  return fallbackClassifyHookType(hook);
}

/**
 * Classifies the post content into a specific topic.
 */
export async function classifyTopic(postText: string): Promise<string> {
  const allowedTopics = [
    "AI",
    "Startups",
    "SaaS",
    "Career",
    "Hiring",
    "Freelancing",
    "Full Stack",
    "React",
    "Next.js",
    "UI/UX",
    "Productivity",
    "Entrepreneurship",
    "Personal Branding",
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an AI classifier. Classify the topic of the following LinkedIn post into exactly ONE of the following topics: ${allowedTopics.join(
            ", "
          )}. Return ONLY a JSON object: { "topic": "TopicName" }.`,
        },
        {
          role: "user",
          content: `Post text:\n${postText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);
    const result = data.topic;
    if (allowedTopics.includes(result)) {
      return result;
    }
  } catch (error) {
    console.error("Error in AI topic classification:", error);
  }

  return fallbackClassifyTopic(postText);
}

/**
 * Combined post analysis (hook extraction, hook type classification, topic classification) in a single LLM call.
 * Cuts the number of API requests per post from 3 to 1, increasing pipeline efficiency by 3x.
 */
export async function analyzePostContent(postText: string): Promise<{ hook: string; hookType: string; topic: string }> {
  if (!postText) {
    return { hook: "", hookType: "Curiosity", topic: "Entrepreneurship" };
  }

  const allowedCategories = [
    "Curiosity",
    "Contrarian",
    "Story",
    "Failure",
    "Achievement",
    "Opinion",
    "Question",
    "Educational",
    "Building In Public",
    "Career",
  ];

  const allowedTopics = [
    "AI",
    "Startups",
    "SaaS",
    "Career",
    "Hiring",
    "Freelancing",
    "Full Stack",
    "React",
    "Next.js",
    "UI/UX",
    "Productivity",
    "Entrepreneurship",
    "Personal Branding",
  ];

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an expert LinkedIn content analyzer.
Analyze the provided LinkedIn post text and perform three tasks:
1. Extract the hook: the first 2-3 lines (maximum 280 characters) of the post.
2. Classify the hook type: choose exactly ONE from: ${allowedCategories.join(", ")}.
3. Classify the topic: choose exactly ONE from: ${allowedTopics.join(", ")}.

Return ONLY a JSON object with this exact structure:
{
  "hook": "extracted hook text",
  "hookType": "CategoryName",
  "topic": "TopicName"
}`,
        },
        {
          role: "user",
          content: `Post Text:\n${postText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);
    
    let hook = data.hook || "";
    if (!hook) {
      hook = postText.split("\n").filter((l) => l.trim().length > 0).slice(0, 3).join("\n").trim();
    }
    if (hook.length > 280) {
      hook = hook.substring(0, 277) + "...";
    }
    
    let hookType = data.hookType || "";
    if (!allowedCategories.includes(hookType)) {
      hookType = fallbackClassifyHookType(hook);
    }

    let topic = data.topic || "";
    if (!allowedTopics.includes(topic)) {
      topic = fallbackClassifyTopic(postText);
    }

    return { hook, hookType, topic };
  } catch (error) {
    console.error("Error in combined AI post content analysis:", error);
    
    const hook = postText.split("\n").filter((l) => l.trim().length > 0).slice(0, 3).join("\n").trim();
    const hookType = fallbackClassifyHookType(hook);
    const topic = fallbackClassifyTopic(postText);
    
    return { hook, hookType, topic };
  }
}

export interface AIAnalysisResult {
  winningHooks: string[];
  winningTopics: string[];
  recommendations: string[];
  suggestedHooks?: Array<{ hookTemplate: string; hookType: string; topic: string; explanation: string }>;
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

/**
 * Local helper to compute granular analytics on posts.
 */
function calculateDetailedStats(posts: AnalyzedPost[]): DetailedStats {
  const topicStats: Record<string, { count: number; imp: number; eng: number; erSum: number }> = {};
  const hookTypeStats: Record<string, { count: number; imp: number; eng: number; erSum: number }> = {};
  const lengthStats: Record<string, { count: number; imp: number; eng: number; erSum: number }> = {
    "Short (< 100 chars)": { count: 0, imp: 0, eng: 0, erSum: 0 },
    "Medium (100-200 chars)": { count: 0, imp: 0, eng: 0, erSum: 0 },
    "Long (> 200 chars)": { count: 0, imp: 0, eng: 0, erSum: 0 }
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

    // Topic
    if (!topicStats[t]) topicStats[t] = { count: 0, imp: 0, eng: 0, erSum: 0 };
    topicStats[t].count++;
    topicStats[t].imp += imp;
    topicStats[t].eng += eng;
    topicStats[t].erSum += er;

    // Hook Type
    if (!hookTypeStats[ht]) hookTypeStats[ht] = { count: 0, imp: 0, eng: 0, erSum: 0 };
    hookTypeStats[ht].count++;
    hookTypeStats[ht].imp += imp;
    hookTypeStats[ht].eng += eng;
    hookTypeStats[ht].erSum += er;

    // Hook Length
    let lenKey = "Short (< 100 chars)";
    if (len >= 100 && len <= 200) lenKey = "Medium (100-200 chars)";
    else if (len > 200) lenKey = "Long (> 200 chars)";
    lengthStats[lenKey].count++;
    lengthStats[lenKey].imp += imp;
    lengthStats[lenKey].eng += eng;
    lengthStats[lenKey].erSum += er;

    // Structure
    if (!structureStats[struct]) structureStats[struct] = { count: 0, imp: 0, eng: 0, erSum: 0 };
    structureStats[struct].count++;
    structureStats[struct].imp += imp;
    structureStats[struct].eng += eng;
    structureStats[struct].erSum += er;
  }

  const mapToStatsList = (statsMap: Record<string, { count: number; imp: number; eng: number; erSum: number }>): MetricStat[] => {
    return Object.entries(statsMap)
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
        const scoreA = a.avgER * (a.count / (a.count + 4));
        const scoreB = b.avgER * (b.count / (b.count + 4));
        return scoreB - scoreA;
      });
  };

  const topics = mapToStatsList(topicStats);
  const hookTypes = mapToStatsList(hookTypeStats);
  const lengths = mapToStatsList(lengthStats).filter(l => l.count > 0);
  const structures = mapToStatsList(structureStats);

  // Top and Bottom posts
  const sortedByER = [...posts].sort((a, b) => b.engagementRate - a.engagementRate);
  const top5 = sortedByER.slice(0, 5).map(p => ({
    hook: p.hook || "",
    topic: p.topic,
    hookType: p.hookType,
    impressions: p.impressions,
    engagementRate: p.engagementRate,
    sentenceStructure: p.sentenceStructure,
    length: p.hookLength
  }));
  const bottom5 = sortedByER.slice(-5).reverse().map(p => ({
    hook: p.hook || "",
    topic: p.topic,
    hookType: p.hookType,
    impressions: p.impressions,
    engagementRate: p.engagementRate,
    sentenceStructure: p.sentenceStructure,
    length: p.hookLength
  }));

  return { topics, hookTypes, lengths, structures, top5, bottom5 };
}

/**
 * Format a stats list into Reliable Trends vs Emerging Styles sections for the LLM prompt.
 */
function formatStatsSection(list: MetricStat[]): string {
  const reliable = list.filter(item => item.count >= 3);
  const emerging = list.filter(item => item.count < 3);

  let output = "";
  if (reliable.length > 0) {
    output += `**Reliable Trends (>= 3 posts, sorted by average engagement rate):**\n`;
    output += reliable.map((t, i) => `- ${i + 1}. ${t.name}: ${t.count} posts, Avg ER: ${t.avgER}%, Avg Impressions: ${t.avgImpressions}`).join('\n') + "\n\n";
  }
  if (emerging.length > 0) {
    output += `**Emerging / Low-Volume Styles (< 3 posts - HIGH VARIANCE, do not prioritize for top recommendations):**\n`;
    output += emerging.map((t) => `- ${t.name}: ${t.count} posts, Avg ER: ${t.avgER}%, Avg Impressions: ${t.avgImpressions}`).join('\n') + "\n\n";
  }
  return output.trim() || "No data available";
}

/**
 * Analyzes post patterns and returns strategic AI insights.
 * Computes deep programmatic performance stats on the user's data and passes it to the LLM.
 * This guarantees the LLM receives exact, ranked data to make accurate predictions.
 */
export async function analyzeContentPatterns(posts: AnalyzedPost[]): Promise<AIAnalysisResult> {
  if (!posts || posts.length === 0) {
    return {
      winningHooks: ["No posts uploaded yet."],
      winningTopics: ["No posts uploaded yet."],
      recommendations: ["Upload your LinkedIn analytics Excel file to receive AI-powered copy recommendations."],
      suggestedHooks: [],
    };
  }

  // Pre-calculate precise metrics from all posts
  const stats = calculateDetailedStats(posts);
  const bestTopicStat = stats.topics[0];
  const bestHookStat = stats.hookTypes[0];

  // Construct a highly detailed prompt containing the aggregated metrics and top/bottom examples
  const metricsSummary = `
Aggregated performance data calculated programmatically from all ${posts.length} analyzed posts:

### Overall Best Performance (Reliability Weighted):
- Top Reliable Topic by ER: ${bestTopicStat?.name || "N/A"} (Avg ER: ${bestTopicStat?.avgER || 0}%, Avg Impressions: ${bestTopicStat?.avgImpressions || 0}, Count: ${bestTopicStat?.count || 0})
- Top Reliable Hook Type by ER: ${bestHookStat?.name || "N/A"} (Avg ER: ${bestHookStat?.avgER || 0}%, Avg Impressions: ${bestHookStat?.avgImpressions || 0}, Count: ${bestHookStat?.count || 0})

### Topics Performance:
${formatStatsSection(stats.topics)}

### Hook Types Performance:
${formatStatsSection(stats.hookTypes)}

### Hook Length Ranges Performance (Sorted by Average Engagement Rate):
${stats.lengths.map((l, i) => `${i + 1}. ${l.name}: ${l.count} posts, Avg ER: ${l.avgER}%, Avg Impressions: ${l.avgImpressions}`).join('\n')}

### Sentence Structure Performance (Sorted by Average Engagement Rate):
${stats.structures.map((s, i) => `${i + 1}. ${s.name}: ${s.count} posts, Avg ER: ${s.avgER}%, Avg Impressions: ${s.avgImpressions}`).join('\n')}

### Top Performing Hooks (Actual hooks that worked best for the user):
${stats.top5.map((p, i) => `Top #${i + 1}:
- Hook Text: "${p.hook.replace(/\n/g, ' ')}"
- Topic: ${p.topic} | Hook Type: ${p.hookType}
- Engagement Rate: ${p.engagementRate}% | Impressions: ${p.impressions}
- Sentence Structure: ${p.sentenceStructure} | Length: ${p.length} characters
`).join('\n')}

### Bottom Performing Hooks (Hooks that underperformed):
${stats.bottom5.map((p, i) => `Bottom #${i + 1}:
- Hook Text: "${p.hook.replace(/\n/g, ' ')}"
- Topic: ${p.topic} | Hook Type: ${p.hookType}
- Engagement Rate: ${p.engagementRate}% | Impressions: ${p.impressions}
- Sentence Structure: ${p.sentenceStructure} | Length: ${p.length} characters
`).join('\n')}
`;

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are an elite LinkedIn viral copywriter and performance strategist.
Analyze the user's LinkedIn post metrics to extract extremely detailed, granular insights. Avoid generic boilerplate advice.

CRITICAL DATA RELIABILITY RULE:
When recommending "Winning Hook Patterns" and "Winning Topics", you MUST prioritize "Reliable Trends" (>= 3 posts) over "Emerging / Low-Volume Styles" (< 3 posts).
DO NOT identify a topic or hook style as the user's top strategic success driver if it has fewer than 3 posts, even if its average engagement rate is high. Low-volume categories (< 3 posts) are high-variance flukes. Replicate and build suggested templates based on actual "Reliable Trends".

Analyze and output:
1. Winning Hook Patterns: Identify the exact attributes (first 5-8 words, hook length, or sentence structures) that drove high engagement. Contrast specific successful hooks (mentioning their impressions/ER) against low-performing ones to explain why they succeeded (structural sentence layout, tone, punctuation).
2. Winning Topics: Detail why specific topics resonate, backed by aggregated impressions and average engagement rates of reliable topics.
3. Tactical Recommendations: Give specific structural rules (e.g. character lengths, lists, hooks to avoid) referencing their own posts.
4. Suggested Hooks: Generate 5 concrete, ready-to-use custom hook templates based on their top performing topics and best hook type patterns. Do NOT use generic templates. Make them match the style and topic of the user's best performing posts. Include brackets for placeholders (e.g., '[Insert Detail]').

Return ONLY a JSON object matching this structure:
{
  "winningHooks": [
    "Detailed analysis of successful Hook A (Impressions, ER%). Ex: '...' succeeded because it opened with a personal failure and a concrete number...",
    "Detailed analysis of successful Hook B (Impressions, ER%). Ex: '...' succeeded because it used a short, punchy single-sentence assertion..."
  ],
  "winningTopics": [
    "Specific topic metrics comparison. Ex: Next.js drove X% more impressions, but SaaS architecture topics saw 3x higher comments because...",
    "Specific topic content suggestion backed by data..."
  ],
  "recommendations": [
    "Actionable copy tip: Keep hooks under X characters because your post '...' (Y% ER) showed that short narrative starts out-engage long ones...",
    "Actionable structural tip: Start with [Action Word/Number] instead of questions based on post Z's performance..."
  ],
  "suggestedHooks": [
    {
      "hookTemplate": "Custom copy-pasteable hook template with bracket placeholders tailored to their top performance",
      "hookType": "Failure / Contrarian / etc.",
      "topic": "Next.js / AI / etc.",
      "explanation": "Detailed explanation of why this template was derived from their top post data (e.g., combines their top 'Next.js' topic with their high-performing 'Failure' style)"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `LinkedIn Performance Dataset:\n${metricsSummary}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);
    return {
      winningHooks: Array.isArray(data.winningHooks) ? data.winningHooks : [],
      winningTopics: Array.isArray(data.winningTopics) ? data.winningTopics : [],
      recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
      suggestedHooks: Array.isArray(data.suggestedHooks) ? data.suggestedHooks : [],
    };
  } catch (error) {
    console.error("Error in content pattern analysis:", error);
    // Return metric-driven default fallback recommendations
    return calculateSimpleRecommendations(posts);
  }
}

/**
 * Returns highly detailed, metric-driven recommendations when LLM analysis fails.
 * Fully computes insights programmatically from the user's data so they remain personalized.
 * Respects sample size constraints.
 */
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
      `Hook style "${bestHook}" is your primary engagement engine. It achieved a reliable average engagement rate of ${bestHookStat?.avgER || 0}% across ${bestHookStat?.count || 0} posts.`,
      topPost
        ? `Your best performing post opened with a hook style classified as "${topPost.hookType}" ("${topPost.hook?.split("\n")[0] || ""}"). Showing real-world details drives immediate comments.`
        : `Your audience responds best to the "${bestHook}" format, which generates higher interest than traditional hooks.`
    ],
    winningTopics: [
      `Posts covering "${bestTopic}" show the highest resonance with your audience, leading other topics in average engagement rate (${bestTopicStat?.avgER || 0}% across ${bestTopicStat?.count || 0} posts).`,
      secondBestTopicStat
        ? `Content focused on "${secondBestTopicStat.name}" is a strong second, yielding ${secondBestTopicStat.avgImpressions} average impressions per post.`
        : "Diversify your themes to optimize reach."
    ],
    recommendations: [
      `Double down on "${bestTopic}" posts. When writing, use a "${bestHook}" styled hook structure to capture high engagement early.`,
      `Structure your opening hooks using "${bestStruct}" styles with a target length of "${bestLength}", as this combination has proven most effective in your dataset.`,
      topPost
        ? `Model your opening copy length after your highest performing post (${topPost.hookLength} characters). Keep sentences short and use line breaks between assertions.`
        : `Keep your hooks under 120 characters and break the first line into a single, punchy claim to maximize mobile viewport readability.`
    ],
    suggestedHooks: [
      {
        hookTemplate: `I spent 30 days building a project with ${bestTopic}.\n\nHere is the single biggest mistake that cost me [Insert Time/Money/Traction]:`,
        hookType: bestHook,
        topic: bestTopic,
        explanation: `Designed to replicate your top post style. Combines your highest-converting topic (${bestTopic}) with your best hook archetype (${bestHook}).`
      },
      {
        hookTemplate: `Everyone tells you to [Insert Common Advice] when building in ${bestTopic}.\n\nBut after working on it for [Insert Time], I realized it's a trap.\n\nHere is what you should do instead:`,
        hookType: secondBestHook || "Contrarian",
        topic: bestTopic,
        explanation: `A high-conversion contrarian hook designed to disrupt the feed and capture click-throughs about ${bestTopic}.`
      },
      {
        hookTemplate: `How to master ${secondBestTopic || "React"} in [Insert Timeframe] without [Insert Common Struggle].\n\nNo courses. No bootcamps. Just these 3 simple rules:`,
        hookType: "Educational",
        topic: secondBestTopic || "React",
        explanation: `Authority-building educational template tailored to your second most successful topic (${secondBestTopic || "React"}).`
      }
    ]
  };
}

