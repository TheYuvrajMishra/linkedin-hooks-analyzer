import { NextResponse } from "next/server";
import { parseLinkedInExcel } from "@/lib/xlsx-parser";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const filename = "AggregateAnalytics_Yuvraj Mishra_2025-06-20_2026-06-19.xlsx";
    const filepath = path.join(process.cwd(), filename);
    
    if (!fs.existsSync(filepath)) {
      return NextResponse.json(
        { error: `Spreadsheet report '${filename}' was not found in the workspace root.` },
        { status: 404 }
      );
    }
    
    const buffer = fs.readFileSync(filepath);
    const parsedData = parseLinkedInExcel(buffer);
    
    // Clear database to ensure fresh metrics import
    await db.clearAll();
    
    // Write imported records to database
    const savedPosts = await db.savePosts(parsedData.posts);
    const savedDaily = await db.saveDailyMetrics(parsedData.dailyMetrics);
    const savedFollowers = await db.saveFollowerMetrics(parsedData.followerMetrics);
    const savedDemo = await db.saveDemographicMetrics(parsedData.demographicMetrics);
    
    return NextResponse.json({
      success: true,
      message: `Auto-loaded report '${filename}' successfully.`,
      summary: {
        postsCount: savedPosts.length,
        dailyMetricsCount: savedDaily.length,
        followerMetricsCount: savedFollowers.length,
        demographicMetricsCount: savedDemo.length,
      },
    });
  } catch (error: any) {
    console.error("Auto-import error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to auto-import spreadsheet file." },
      { status: 500 }
    );
  }
}
