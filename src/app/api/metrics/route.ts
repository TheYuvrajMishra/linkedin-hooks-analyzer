import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const dailyMetrics = await db.getDailyMetrics();
    const followerMetrics = await db.getFollowerMetrics();
    const demographics = await db.getDemographicMetrics();

    return NextResponse.json({
      dailyMetrics,
      followerMetrics,
      demographics,
    });
  } catch (error: any) {
    console.error("GET metrics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve analytical metrics." },
      { status: 500 }
    );
  }
}
