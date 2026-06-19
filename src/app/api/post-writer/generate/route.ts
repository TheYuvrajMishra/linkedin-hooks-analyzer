import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateAndHumanizePost } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic,
      angle,
      audience,
      length,
      hookFormula,
      anecdotes,
      specificNumbers,
      namedEntity,
      firstPersonDetail,
      vulnerability,
      pastPosts: passedPosts
    } = body;

    // Check mandatory fields
    if (!topic || !angle || !audience || !length || !hookFormula) {
      return NextResponse.json(
        { error: "topic, angle, audience, length, and hookFormula are required parameters." },
        { status: 400 }
      );
    }

    // Retrieve past posts for context awareness (always load from DB to get rich scraped text if available)
    let pastPosts = passedPosts || [];
    try {
      const allPosts = await db.getPosts();
      const analyzedDbPosts = allPosts.filter((p: any) => p.analyzed && (p.postText || p.hook));
      if (analyzedDbPosts.length > 0) {
        pastPosts = analyzedDbPosts;
      }
    } catch (dbError) {
      console.warn("Could not load past posts from database, using client context:", dbError);
    }

    // Invoke the AI generator & humanizer pipeline
    const result = await generateAndHumanizePost({
      topic,
      angle,
      audience,
      length,
      hookFormula,
      anecdotes,
      specificNumbers,
      namedEntity,
      firstPersonDetail,
      vulnerability,
      pastPosts
    });

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error("Post writer generation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate post." },
      { status: 500 }
    );
  }
}
