import { NextRequest, NextResponse } from "next/server";
import { parseLinkedInExcel } from "@/lib/xlsx-parser";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Parse Excel data using SheetJS
    const parsedData = parseLinkedInExcel(buffer as unknown as ArrayBuffer);
    
    // Clear old records
    await db.clearAll();
    
    // Save records to database (Postgres or local JSON fallback)
    const savedPosts = await db.savePosts(parsedData.posts);
    const savedDaily = await db.saveDailyMetrics(parsedData.dailyMetrics);
    const savedFollowers = await db.saveFollowerMetrics(parsedData.followerMetrics);
    const savedDemo = await db.saveDemographicMetrics(parsedData.demographicMetrics);
    
    return NextResponse.json({
      success: true,
      message: "LinkedIn analytics report processed successfully.",
      summary: {
        postsCount: savedPosts.length,
        dailyMetricsCount: savedDaily.length,
        followerMetricsCount: savedFollowers.length,
        demographicMetricsCount: savedDemo.length,
      },
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred while uploading the file." },
      { status: 500 }
    );
  }
}
