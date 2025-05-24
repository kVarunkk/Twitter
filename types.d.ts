// types.d.ts or global.d.ts
import mongoose from "mongoose";

declare global {
  var mongoose: Promise<typeof mongoose> | undefined;
}

export {};
