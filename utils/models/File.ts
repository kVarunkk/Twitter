import mongoose, { Model, Schema } from "mongoose";
import moment from "moment";
import { IChat, IComment, IMessage, ITweet, IUser } from "utils/types";

export interface IUserDocument extends IUser, Document {}
export interface IChatDocument extends IChat, Document {}
export interface IMessageDocument extends IMessage, Document {}
export interface ITweetDocument extends ITweet, Document {}
export interface ICommentDocument extends IComment, Document {}

const messageSchema = new mongoose.Schema<IMessageDocument>(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Encrypted Fields for E2EE
    encryptedAESKeyForSender: { type: String, required: true },
    encryptedAESKeyForRecipient: { type: String, required: true },
    encryptedMessage: { type: String, required: true },
    iv: { type: String, required: true }, // Initialization Vector (IV) for AES-GCM

    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const chatSchema = new mongoose.Schema<IChatDocument>(
  {
    users: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      content: { type: String },
      timestamp: { type: Date },
    },
  },
  { timestamps: true }
);

// User Schema
const userSchema = new mongoose.Schema<IUserDocument>(
  {
    avatar: { type: String },
    username: { type: String, required: true },
    bio: { type: String },
    banner: { type: String },
    password: { type: String, required: true },
    followers: [{ type: String }],
    followBtn: { type: String, default: "Follow" },
    tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tweet" }],
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    publicKey: { type: String, required: true }, // Store public RSA key
    encryptedPrivateKey: { type: String, required: true }, // Store AES-GCM encrypted private key (base64)
    iv: { type: String, required: true }, // Store IV for AES-GCM encryption (base64)
    derivedKey: { type: String, required: true },
    tweetGenCount: { type: Number, default: 0 },
    tweetReplyGenCount: { type: Number, default: 0 },
    embedding: {
      type: [Number],
    },
    embeddingUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Tweet Schema
const tweetSchema = new mongoose.Schema<ITweetDocument>(
  {
    content: { type: String },
    tag: { type: String },
    image: { type: String },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    postedTweetTime: {
      type: String,
      default: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
    likes: [{ type: String }],
    likeTweetBtn: { type: String, default: "black" },
    retweetBtn: { type: String, default: "black" },
    retweetedByUser: { type: String },
    isRetweeted: { type: Boolean, default: false },
    retweets: [{ type: String, default: [] }],
    isEdited: { type: Boolean, default: false },
    shares: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    retweetedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Tweet" },
  },
  { timestamps: true }
);

// Comment Schema
const commentSchema = new mongoose.Schema<ICommentDocument>(
  {
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    postedCommentTime: {
      type: String,
      default: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
    likes: [{ type: String }],
    likeCommentBtn: { type: String, default: "black" },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Models
export const Message: Model<IMessageDocument> =
  mongoose.models?.Message ||
  mongoose.model<IMessageDocument>("Message", messageSchema);
export const Chat: Model<IChatDocument> =
  mongoose.models?.Chat || mongoose.model<IChatDocument>("Chat", chatSchema);
export const User: Model<IUserDocument> =
  mongoose.models?.User || mongoose.model<IUserDocument>("User", userSchema);
export const Tweet: Model<ITweetDocument> =
  mongoose.models?.Tweet ||
  mongoose.model<ITweetDocument>("Tweet", tweetSchema);
export const Comment: Model<ICommentDocument> =
  mongoose.models?.Comment ||
  mongoose.model<ICommentDocument>("Comment", commentSchema);
