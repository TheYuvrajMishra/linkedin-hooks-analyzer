import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const posts = await db.getPosts();
    const daily = await db.getDailyMetrics();
    const followers = await db.getFollowerMetrics();
    const demo = await db.getDemographicMetrics();
    const latestAnalysis = await db.getLatestAnalysisResult();
    
    const analyzedPostsCount = posts.filter((p) => p.analyzed).length;
    
    return NextResponse.json({
      isFallback: db.isFallback(),
      databaseType: db.isFallback() ? "Local JSON File Database" : "PostgreSQL Database (Prisma)",
      stats: {
        totalPosts: posts.length,
        analyzedPosts: analyzedPostsCount,
        dailyMetricsCount: daily.length,
        followerMetricsCount: followers.length,
        demographicsCount: demo.length,
        hasAIInsights: !!latestAnalysis,
      },
    });
  } catch (error: any) {
    console.error("GET db-status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve database status." },
      { status: 500 }
    );
  }
}
