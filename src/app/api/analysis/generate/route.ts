import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeContentPatterns } from "@/lib/ai";

export async function POST() {
  try {
    const posts = await db.getPosts();
    
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
    
    // Save to database
    const savedResult = await db.saveAnalysisResult(analysisResult);
    
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
