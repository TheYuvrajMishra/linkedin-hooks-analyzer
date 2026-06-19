import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeContentPatterns } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const { posts } = await req.json();
    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json({ error: "posts array is required" }, { status: 400 });
    }
    
    // Filter to only analyzed posts to avoid polluting AI analysis with empty strings
    const analyzedPosts = posts.filter((p: any) => p.analyzed);
    
    if (analyzedPosts.length === 0) {
      return NextResponse.json(
        { error: "No analyzed posts available. Please analyze posts before generating AI insights." },
        { status: 400 }
      );
    }

    // Run AI analysis
    const analysisResult = await analyzeContentPatterns(analyzedPosts);
    
    // 4. Return result without saving to database
    const savedResult = analysisResult;
    
    return NextResponse.json({
      success: true,
      analysis: savedResult,
    });
  } catch (error: any) {
    console.error("AI recommendations generator error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI recommendations." },
      { status: 500 }
    );
  }
}
