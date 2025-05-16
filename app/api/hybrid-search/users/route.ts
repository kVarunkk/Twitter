import { NextRequest, NextResponse } from "next/server";
import { validateToken } from "lib/auth";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
import { getAggregatePipeline } from "lib/aggregatePipelines";
const { User } = require("utils/models/File");

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function POST(req: NextRequest) {
  try {
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    const { query, queryEmbedding } = await req.json();

    if (!query || !queryEmbedding) {
      return NextResponse.json(
        { status: "error", message: "Missing query or queryEmbedding" },
        { status: 400 }
      );
    }
    const pipeline = getAggregatePipeline("users", query, queryEmbedding);

    const results = await User.aggregate(pipeline);
    return NextResponse.json({ status: "ok", results, user });
  } catch (err) {
    console.error("Hybrid search error:", err);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 }
    );
  }
}
