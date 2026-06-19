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

export async function POST(req: NextRequest) {
  try {
    const { postUrl } = await req.json();
    if (!postUrl) {
      return NextResponse.json({ error: "postUrl is required" }, { status: 400 });
    }

    const post = await db.getPostByUrl(postUrl);
    if (!post) {
      return NextResponse.json({ error: "Post not found in database" }, { status: 444 });
    }

    // 1. Scrape the full text of the post
    const postText = await scrapePostText(postUrl);
    
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
