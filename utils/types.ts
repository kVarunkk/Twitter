import { Types } from "mongoose";

export interface IUser {
  _id: Types.ObjectId;
  avatar?: string;
  username: string;
  bio?: string;
  banner?: string;
  password: string;
  followers: string[];
  followBtn: string;
  tweets: Types.ObjectId[];
  chats: Types.ObjectId[];
  publicKey: string;
  encryptedPrivateKey: string;
  iv: string;
  derivedKey: string;
  tweetGenCount: number;
  tweetReplyGenCount: number;
  embedding: number[];
  embeddingUpdatedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
  pushSubscription?: {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  };
}

export interface ISerealizedUser extends Omit<IUser, "_id"> {
  _id: string;
}

export interface ITweet {
  _id: Types.ObjectId;
  content?: string;
  tag?: string;
  image?: string;
  postedBy: Types.ObjectId;
  postedTweetTime: string;
  likes: string[];
  likeTweetBtn: string;
  retweetBtn: string;
  retweetedByUser?: string;
  isRetweeted: boolean;
  retweets: string[];
  isEdited: boolean;
  shares: number;
  comments: Types.ObjectId[];
  retweetedFrom?: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPopulatedTweet
  extends Omit<ITweet, "_id" | "postedBy" | "retweetedFrom" | "comments"> {
  _id: string;
  postedBy: {
    username: string;
    avatar: string;
  };
  retweetedFrom?: {
    postedTweetTime: string;
  };
  comments: IPopulatedComment[];
}

export interface IComment {
  _id: Types.ObjectId;
  content: string;
  postedBy: Types.ObjectId;
  postedCommentTime: string;
  likes: string[];
  likeCommentBtn: string;
  isEdited: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPopulatedComment extends Omit<IComment, "_id" | "postedBy"> {
  _id: string;
  postedBy: {
    username: string;
    avatar: string;
  };
}

export interface IChat {
  _id: Types.ObjectId;
  users: Types.ObjectId[];
  lastMessage: {
    sender?: Types.ObjectId;
    content?: string;
    timestamp?: Date;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPopulatedChat extends Omit<IChat, "_id" | "users"> {
  _id: string;
  users: ISerealizedUser[];
}

export interface IMessage {
  _id: Types.ObjectId;
  chat: Types.ObjectId;
  sender: Types.ObjectId;
  encryptedAESKeyForSender: string;
  encryptedAESKeyForRecipient: string;
  encryptedMessage: string;
  iv: string;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
  isRead?: Boolean;
}

export interface IPopulatedMessage
  extends Omit<IMessage, "_id" | "chat" | "sender"> {
  _id: string;
  chat: IPopulatedChat;
  sender: ISerealizedUser;
}

// utils/types.ts

export type NotificationType = "like" | "retweet" | "comment" | "message";

export interface INotification {
  recipient: Types.ObjectId; // User receiving the notification
  sender: Types.ObjectId; // User who triggered it
  type: NotificationType;
  tweet?: Types.ObjectId; // if relevant
  comment?: Types.ObjectId; // if relevant
  message?: Types.ObjectId; // if relevant
  chat?: Types.ObjectId; // for messages
  isRead: boolean;
  createdAt?: Date;
}

export interface IPopulatedNotification
  extends Omit<INotification, "_id" | "tweet" | "sender"> {
  _id: string;
  sender: {
    username: string;
    avatar: string;
  };
  tweet?: {
    postedTweetTime: string;
  };
}
