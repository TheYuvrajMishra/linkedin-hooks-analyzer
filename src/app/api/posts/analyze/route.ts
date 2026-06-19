import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scrapePostText } from "@/lib/scraper";
import { analyzePostContent } from "@/lib/ai";

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

export async function POST(req: NextRequest) {
  try {
    const { post } = await req.json();
    if (!post || !post.postUrl) {
      return NextResponse.json({ error: "post object with postUrl is required" }, { status: 400 });
    }

    const postUrl = post.postUrl;

    // 1. Scrape the full text of the post
    const postText = await scrapePostText(postUrl);
    
    // 2. Extract hook, classify hook type and topic using AI (single combined call)
    const { hook, hookType, topic } = await analyzePostContent(postText);
    
    // 5. Calculate hook analytics properties
    const hookLength = hook.length;
    const openingWords = hook.split(/\s+/).slice(0, 5).join(" ");
    const sentenceStructure = detectSentenceStructure(hook);
    
    // 6. Return updated record without saving to DB
    const updatedPost = {
      ...post,
      postText,
      hook,
      hookType,
      topic,
      hookLength,
      openingWords,
      sentenceStructure,
      analyzed: true,
    };

    return NextResponse.json({
      success: true,
      post: updatedPost,
    });
  } catch (error: unknown) {
    console.error("Post analysis handler error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to analyze post.";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
