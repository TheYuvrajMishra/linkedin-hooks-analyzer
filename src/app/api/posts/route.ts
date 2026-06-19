import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const posts = await db.getPosts();
    return NextResponse.json({ posts });
  } catch (error: any) {
    console.error("GET posts error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve posts." },
      { status: 500 }
    );
  }
}
