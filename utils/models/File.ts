import mongoose, { Schema } from "mongoose";
import moment from "moment";

const messageSchema = new mongoose.Schema(
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

const chatSchema = new mongoose.Schema(
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
const userSchema = new mongoose.Schema(
  {
    avatar: { type: String },
    username: { type: String, required: true },
    bio: { type: String },
    banner: { type: String },
    password: { type: String, required: true },
    followers: { type: Array },
    followBtn: { type: String, default: "Follow" },
    tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tweet" }],
    chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
    publicKey: { type: String, required: true }, // Store public RSA key
    encryptedPrivateKey: { type: String, required: true }, // Store AES-GCM encrypted private key (base64)
    // salt: { type: String, required: true }, // Store salt for PBKDF2 (base64)
    iv: { type: String, required: true }, // Store IV for AES-GCM encryption (base64)
    derivedKey: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Tweet Schema
const tweetSchema = new mongoose.Schema(
  {
    content: { type: String },
    tag: { type: String },
    image: { type: String },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    postedTweetTime: {
      type: String,
      default: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
    likes: { type: Array },
    likeTweetBtn: { type: String, default: "black" },
    retweetBtn: { type: String, default: "black" },
    retweetedByUser: { type: String },
    isRetweeted: { type: Boolean, default: false },
    retweets: { type: Array, default: [] },
    isEdited: { type: Boolean, default: false },
    shares: { type: Number, default: 0 },
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
    retweetedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Tweet" },
  },
  { timestamps: true }
);

// Comment Schema
const commentSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    postedCommentTime: {
      type: String,
      default: moment().format("MMMM Do YYYY, h:mm:ss a"),
    },
    likes: { type: Array },
    likeCommentBtn: { type: String, default: "black" },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Models
export const Message =
  mongoose.models?.Message || mongoose.model("Message", messageSchema);
export const Chat = mongoose.models?.Chat || mongoose.model("Chat", chatSchema);
export const User = mongoose.models?.User || mongoose.model("User", userSchema);
export const Tweet =
  mongoose.models?.Tweet || mongoose.model("Tweet", tweetSchema);
export const Comment =
  mongoose.models?.Comment || mongoose.model("Comment", commentSchema);
