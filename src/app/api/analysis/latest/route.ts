import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const analysis = await db.getLatestAnalysisResult();
    return NextResponse.json({ analysis });
  } catch (error: any) {
    console.error("GET latest analysis error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve AI insights." },
      { status: 500 }
    );
  }
}
