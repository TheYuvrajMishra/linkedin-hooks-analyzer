import OpenAI from "openai";

const apiKey = process.env.FREELLM_API_KEY || "freellmapi-ee8a352746a891c55ecc1a17b56c356ab0f1cce2c9b5442b";
const baseURL = process.env.FREELLM_BASE_URL || "http://localhost:3001/v1";
const model = process.env.FREELLM_MODEL || "gpt-4o-mini";

// Create client
const client = new OpenAI({
  apiKey,
  baseURL,
});

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
    // Simple regex/split fallback: first 3 non-empty lines
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

  // Fallback heuristic classification
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

  // Fallback heuristic classification
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

export interface AIAnalysisResult {
  winningHooks: string[];
  winningTopics: string[];
  recommendations: string[];
}

/**
 * Analyzes post patterns and returns strategic AI insights.
 */
export async function analyzeContentPatterns(posts: any[]): Promise<AIAnalysisResult> {
  if (!posts || posts.length === 0) {
    return {
      winningHooks: ["No posts uploaded yet."],
      winningTopics: ["No posts uploaded yet."],
      recommendations: ["Upload your LinkedIn analytics Excel file to receive AI-powered copy recommendations."],
    };
  }

  // Sample or summarize posts for context limit safety
  const postsSummary = posts.map((p) => ({
    hook: p.hook || p.postUrl,
    hookType: p.hookType,
    topic: p.topic,
    impressions: p.impressions,
    engagements: p.engagements,
    er: p.engagementRate,
  }));

  try {
    const response = await client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content: `You are a senior LinkedIn growth strategist and copywriter. Analyze the provided post performance data.
Your goal is to extract:
1. Winning hook patterns (what hooks performed best and why, referencing hook types like Curiosity, Story, etc.)
2. Winning topics (which topics generated highest engagements/impressions and why)
3. Actionable strategic recommendations (specific advice on what to post more, what to avoid, suggested topics, and structural hook edits).

Return ONLY a JSON object matching this structure:
{
  "winningHooks": ["insight 1", "insight 2"],
  "winningTopics": ["topic insight 1", "topic insight 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}
Ensure the elements are detailed, professional, and directly backed by the metrics provided in the dataset.`,
        },
        {
          role: "user",
          content: `LinkedIn Performance Dataset:\n${JSON.stringify(postsSummary.slice(0, 40), null, 2)}`,
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
    };
  } catch (error) {
    console.error("Error in content pattern analysis:", error);
    // Return metric-driven default fallback recommendations
    return calculateSimpleRecommendations(posts);
  }
}

function calculateSimpleRecommendations(posts: any[]): AIAnalysisResult {
  // Aggregate hook types
  const hookStats: { [type: string]: { imp: number; eng: number; count: number } } = {};
  const topicStats: { [topic: string]: { imp: number; eng: number; count: number } } = {};

  for (const post of posts) {
    const ht = post.hookType || "Unknown";
    const top = post.topic || "Unknown";
    
    if (!hookStats[ht]) hookStats[ht] = { imp: 0, eng: 0, count: 0 };
    hookStats[ht].imp += post.impressions;
    hookStats[ht].eng += post.engagements;
    hookStats[ht].count += 1;

    if (!topicStats[top]) topicStats[top] = { imp: 0, eng: 0, count: 0 };
    topicStats[top].imp += post.impressions;
    topicStats[top].eng += post.engagements;
    topicStats[top].count += 1;
  }

  // Calculate average ER
  const hookList = Object.entries(hookStats).map(([name, stat]) => ({
    name,
    avgImp: Math.round(stat.imp / stat.count),
    avgEr: stat.imp > 0 ? parseFloat(((stat.eng / stat.imp) * 100).toFixed(2)) : 0,
    count: stat.count,
  }));

  const topicList = Object.entries(topicStats).map(([name, stat]) => ({
    name,
    avgImp: Math.round(stat.imp / stat.count),
    avgEr: stat.imp > 0 ? parseFloat(((stat.eng / stat.imp) * 100).toFixed(2)) : 0,
    count: stat.count,
  }));

  // Sort
  hookList.sort((a, b) => b.avgEr - a.avgEr);
  topicList.sort((a, b) => b.avgEr - a.avgEr);

  const bestHook = hookList[0]?.name || "N/A";
  const bestTopic = topicList[0]?.name || "N/A";

  return {
    winningHooks: [
      `Hook style "${bestHook}" is your top engagement driver, achieving an average engagement rate of ${hookList[0]?.avgEr || 0}%.`,
      hookList[1]
        ? `"${hookList[1].name}" hooks also perform well, yielding ${hookList[1].avgImp} average impressions per post.`
        : "Add more variety to your opening hooks to collect deeper analysis.",
    ],
    winningTopics: [
      `Posts covering "${bestTopic}" show the highest resonance with your audience, leading other topics in average engagement.`,
      topicList[1]
        ? `Content focused on "${topicList[1].name}" is a strong second, with a solid ${topicList[1].avgEr}% engagement rate.`
        : "Diversify your themes (e.g. Next.js, React, Startups) to optimize reach.",
    ],
    recommendations: [
      `Increase output of "${bestTopic}" posts using a "${bestHook}" styled hook structure to capture high engagement early.`,
      `Refine lower-performing categories (e.g., "${hookList[hookList.length - 1]?.name || "unclassified"}" hooks) by keeping the opening line shorter (under 80 characters).`,
      "Aim to include a single question or controversial assertion in your opening line to lift comment rates.",
    ],
  };
}
