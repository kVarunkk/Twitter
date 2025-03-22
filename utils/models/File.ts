import mongoose, { Schema } from "mongoose";
import moment from "moment";
import { MONGODB_URI } from "utils/utils";

// User Schema
const userSchema = new mongoose.Schema({
  avatar: { type: String },
  username: { type: String, required: true },
  bio: { type: String },
  banner: { type: String },
  password: { type: String, required: true },
  followers: { type: Array },
  followBtn: { type: String, default: "Follow" },
  tweets: [{ type: mongoose.Schema.Types.ObjectId, ref: "Tweet" }],
});

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
export const User = mongoose.models?.User || mongoose.model("User", userSchema);
export const Tweet =
  mongoose.models?.Tweet || mongoose.model("Tweet", tweetSchema);
export const Comment =
  mongoose.models?.Comment || mongoose.model("Comment", commentSchema);
