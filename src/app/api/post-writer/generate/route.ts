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

    // Retrieve past posts for context awareness (if not passed in request body)
    let pastPosts = passedPosts;
    if (!pastPosts || !Array.isArray(pastPosts)) {
      try {
        const allPosts = await db.getPosts();
        pastPosts = allPosts.filter((p: any) => p.analyzed);
      } catch (dbError) {
        console.warn("Could not load past posts from database, using empty context:", dbError);
        pastPosts = [];
      }
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
