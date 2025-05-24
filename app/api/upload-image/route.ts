import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";

export const config = {
  api: {
    bodyParser: false,
  },
};

const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AWS_REGION!,
  credentials: {
    accessKeyId:
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!
        : process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey:
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!
        : process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const type = formData.get("type") as string;
  const id = formData.get("id") as string;
  const contentType = formData.get("contentType") as string;

  const extension = contentType.split("/")[1];
  const key =
    type === "avatar"
      ? `avatars/${id}.${extension}`
      : `tweets/${id}/${uuidv4()}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Body: Buffer.from(arrayBuffer),
  });

  await s3.send(command);

  return NextResponse.json({ key });
}
