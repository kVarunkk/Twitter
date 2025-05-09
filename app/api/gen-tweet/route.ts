import { validateToken } from "lib/auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import mongoose from "mongoose";
import { MONGODB_URI } from "utils/utils";
const { User } = require("utils/models/File");

const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

if (!global.mongoose) {
  global.mongoose = mongoose.connect(MONGODB_URI).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
  });
}

export async function POST(req: NextRequest) {
  try {
    // Validate the token
    const validationResponse = await validateToken(req);
    if (validationResponse.status !== "ok") {
      return NextResponse.json(
        { status: "error", message: validationResponse.message },
        { status: 401 }
      );
    }

    const user = validationResponse.user;

    const { prompt } = await req.json();

    const events = await openai.responses.create({
      model: "gpt-4.1-nano",
      instructions:
        "Generate a small tweet based on the following prompt. Make sure it does not have more than 280 characters.",
      input: [
        {
          role: "user",
          content: prompt,
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
            $inc: { tweetGenCount: 1 },
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
