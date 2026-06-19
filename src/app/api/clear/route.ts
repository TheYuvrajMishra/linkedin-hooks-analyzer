import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    await db.clearAll();
    return NextResponse.json({
      success: true,
      message: "Database cleared successfully.",
    });
  } catch (error: any) {
    console.error("POST clear error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear database." },
      { status: 500 }
    );
  }
}
