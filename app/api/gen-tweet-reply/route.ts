import { validateToken } from "lib/auth";
import { connectToDatabase } from "lib/mongoose";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { User } from "utils/models/File";
import { MONGODB_URI } from "utils/utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    if (!user) {
      return NextResponse.json(
        { status: "error", message: "User not found" },
        { status: 404 }
      );
    }

    const { tweet, prompt } = await req.json();

    const events = await openai.responses.create({
      model: "gpt-4.1-nano",
      instructions:
        "You are replying to a tweet. Based on the tweet and the user's prompt, generate a reply that is relevant and under 280 characters.",
      input: [
        {
          role: "system",
          content:
            "You are an assistant that crafts short, thoughtful tweet replies.",
        },
        {
          role: "user",
          content: `Tweet: "${tweet}"\nPrompt: ${prompt}`,
        },
      ],
      stream: true,
      max_output_tokens: 60,
      temperature: 0.5,
    });

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of events) {
            // Sending all events to the client
            const data = JSON.stringify({
              event: event.type,
              data: event,
            });
            // console.log("Sending event:", data);
            controller.enqueue(`data: ${data}\n\n`);
          }
          await User.findByIdAndUpdate(user._id, {
            $inc: { tweetReplyGenCount: 1 },
          });
          // End of stream
          controller.close();
        } catch (error) {
          console.error("Error in streaming loop:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Error in POST handler:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
