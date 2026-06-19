import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapePostText } from "@/lib/scraper";
import { extractHook, classifyHookType, classifyTopic } from "@/lib/ai";

function detectSentenceStructure(hook: string): string {
  const clean = hook.trim().toLowerCase();
  if (clean.startsWith("how to") || clean.startsWith("here is how") || clean.startsWith("here's how")) {
    return "Action/Instructional";
  }
  if (clean.startsWith("i ") || clean.startsWith("we ") || clean.startsWith("my ") || clean.startsWith("years ago") || clean.startsWith("when i")) {
    return "First-Person Narrative";
  }
  if (/^\d+/.test(clean)) {
    return "Numbered List/Listicle";
  }
  if (clean.includes("?")) {
    return "Interrogative/Question";
  }
  if (clean.includes("don't") || clean.includes("stop") || clean.includes("never") || clean.includes("mistake") || clean.includes("avoid")) {
    return "Negative/Contrarian Assertion";
  }
  return "Declarative Statement";
}

function getFallbackPostText(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const parts = pathname.split("/");
    const lastPart = parts[parts.length - 1] || "";
    const splitParts = lastPart.split("_");
    const keywordSlug = splitParts[splitParts.length - 1] || lastPart;
    const keywords = keywordSlug
      .split("-")
      .filter((w) => w && isNaN(Number(w)) && w.length > 2 && w !== "share" && w !== "ugcPost")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
      
    if (keywords) {
      return `Building and sharing insights about ${keywords} in my journey as a developer. (Note: Content parsed from post URL keywords).`;
    }
  } catch (e) {}
  
  return `Sharing my thoughts and updates on LinkedIn. (Note: Content simulated as LinkedIn is currently blocking scrapers).`;
}

export async function POST(req: NextRequest) {
  try {
    const { postUrl, simulate } = await req.json();
    if (!postUrl) {
      return NextResponse.json({ error: "postUrl is required" }, { status: 400 });
    }

    const post = await db.getPostByUrl(postUrl);
    if (!post) {
      return NextResponse.json({ error: "Post not found in database" }, { status: 444 });
    }

    // 1. Scrape the full text or generate fallback in simulation mode
    let postText = "";
    if (simulate) {
      postText = getFallbackPostText(postUrl);
    } else {
      postText = await scrapePostText(postUrl);
    }
    
    // 2. Extract the hook using AI
    const hook = await extractHook(postText);
    
    // 3. Classify Hook Type
    const hookType = await classifyHookType(hook);
    
    // 4. Classify Topic
    const topic = await classifyTopic(postText);
    
    // 5. Calculate hook analytics properties
    const hookLength = hook.length;
    const openingWords = hook.split(/\s+/).slice(0, 5).join(" ");
    const sentenceStructure = detectSentenceStructure(hook);
    
    // 6. Update database record
    const updatedPost = await db.savePost({
      ...post,
      postText,
      hook,
      hookType,
      topic,
      hookLength,
      openingWords,
      sentenceStructure,
      analyzed: true,
    });

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error: any) {
    console.error("Post analysis handler error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze post." },
      { status: 500 }
    );
  }
}
