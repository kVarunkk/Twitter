"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { AiFillCamera } from "react-icons/ai";
import jwtDecode from "jwt-decode";
import axios from "axios";
import { UrlContext } from "../context/urlContext";
import AppLoader from "./AppLoader";
import Tweet from "./Tweet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { showToast } from "./ToastComponent";
import { encryptPrivateKey, formatContentWithLinks } from "utils/utils";
import ChatWrapper from "./ChatWrapper";
import InfiniteScrolling from "./InfiniteScrolling";
import { useAuth } from "hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Link, X } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import Avatar from "./Avatar";

function ProfileBody({ userName, profileData }) {
  const {
    initialTweets,
    activeUserProp,
    userIdProp,
    followBtnProp,
    bioProp,
    avatarProp,
    followersProp,
    bannerProp,
  } = profileData;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [tweets, setTweets] = useState(initialTweets || []);
  const [activeUser, setActiveUser] = useState(activeUserProp || "");
  const [followers, setFollowers] = useState(followersProp || 0);
  const [followBtn, setFollowBtn] = useState(followBtnProp || "");
  const [banner, setBanner] = useState(bannerProp || "");
  const [bio, setBio] = useState(bioProp || "");
  const [avatar, setAvatar] = useState(
    avatarProp ||
      `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/avatars/initial-avatar.png`
  );
  const url = useContext(UrlContext);
  const isActiveUser = userName === activeUserProp;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isFetching = useRef(false);
  const [hasMoreTweets, setHasMoreTweets] = useState(true);
  const [saveAvatarLoading, setSaveAvatarLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState(userIdProp || "");

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  // Fetch user data and tweets
  const populateUserData = async () => {
    setLoading(true);
    setError(false);

    try {
      const req = await fetch(`${url}/api/profile/${userName}`, {
        headers: {
          //"x-access-token": localStorage.getItem("token"),
        },
      });

      const data = await req.json();

      if (data.status === "ok") {
        // const updatedTweets = data.tweets.map((tweet) => ({
        //   ...tweet,
        //   likeTweetBtn: tweet.likeTweetBtn || "black",
        //   retweetBtn: tweet.retweetBtn || "black",
        // }));

        setTweets(data.tweets.filter((_) => _.postedBy));
        setActiveUser(data.activeUser);
        setUserId(data.activeUserId);
        setBio(data.bio);
        setBanner(data.banner);
        setFollowers(data.followers);
        setFollowBtn(data.followBtn);
        setAvatar(data.avatar);
      } else {
        console.error("Error fetching profile data:", data.message);
        setError(true);
        showToast({
          heading: "Error",
          message: data.message || "Failed to fetch profile data.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
      setError(true);
      showToast({
        heading: "Error",
        message: "Something went wrong while fetching profile data.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const showMoreTweets = async () => {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const req = await fetch(
        `${url}/api/profile/${userName}?t=${tweets.length}`,
        {
          headers: {
            //"x-access-token": localStorage.getItem("token"),
          },
        }
      );

      const data = await req.json();

      if (data.status === "ok") {
        const updatedTweets = data.tweets.map((tweet) => ({
          ...tweet,
          likeTweetBtn: tweet.likeTweetBtn || "black",
          retweetBtn: tweet.retweetBtn || "black",
        }));

        if (updatedTweets.length < 20) {
          setHasMoreTweets(false);
        }

        // Append only new tweets to avoid duplicates
        setTweets((prevTweets) => [
          ...prevTweets,
          ...updatedTweets.filter(
            (newTweet) =>
              !prevTweets.some((tweet) => tweet._id === newTweet._id)
          ),
        ]);
      } else {
        console.error("Error fetching more tweets:", data.message);
        showToast({
          heading: "Error",
          message: data.message || "Failed to fetch more tweets.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching more tweets:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong while fetching more tweets.",
        type: "error",
      });
    } finally {
      isFetching.current = false;
    }
  };

  // Retry fetching profile data
  const retryFetch = () => {
    setLoading(true);
    populateUserData();
  };

  // Handle follow/unfollow
  const handleFollow = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(
        `${url}/api/user/${activeUser}/follow/${userName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            //"x-access-token": localStorage.getItem("token") || "",
          },
        }
      );

      const data = await response.json();
      if (data.status === "ok") {
        setFollowers(data.followers);
        setFollowBtn(data.followBtn);
      } else {
        showToast({
          heading: "Error",
          message: data.message || "Failed to update follow status.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating follow status:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong while updating follow status.",
        type: "error",
      });
    }
  };

  // Handle avatar selection
  const handleSubmitAvatar = async (e: React.MouseEvent<HTMLImageElement>) => {
    try {
      const avatarSrc = e.currentTarget.src;
      const response = await axios.post(`${url}/api/avatar/${activeUser}`, {
        avatar: avatarSrc,
      });

      if (response.data.status === "ok") {
        setAvatar(response.data.avatar);
        showToast({
          heading: "Success 🎉",
          message: "Avatar updated successfully.",
          type: "success",
        });
      } else {
        showToast({
          heading: "Error",
          message: response.data.message || "Failed to update avatar.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong while updating avatar.",
        type: "error",
      });
    }
  };

  const handleProfileUpdate = async (field, value) => {
    try {
      const response = await axios.post(
        `${url}/api/update-profile/${activeUser}`,
        {
          field: field,
          value: value,
        },
        {
          headers: {
            //"x-access-token": localStorage.getItem("token") || "", // Pass the token from localStorage
          },
        }
      );

      if (response.data.status === "ok") {
        // if (field === "banner") setBanner(value);
        // if (field === "bio") setBio(value);

        populateUserData();

        showToast({
          heading: "Success 🎉",
          message: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } updated successfully.`,
          type: "success",
        });
      } else {
        response.data.message !==
          "Field and value are required for profile update." &&
          showToast({
            heading: "Error",
            message: response.data.message || `Failed to update ${field}.`,
            type: "error",
          });
      }
    } catch (error) {
      // console.error(`Error updating ${field}:`, error);
      error.response.data.message !==
        "Field and value are required for profile update." &&
        showToast({
          heading: "Error",
          message: `Something went wrong while updating ${field}.`,
          type: "error",
        });
    }
  };

  // const { user, loading: load } = useAuth();

  // useEffect(() => {
  //   if (!load && user) {
  //     populateUserData();
  //   }
  // }, [user, load]);

  const saveUploadedAvatar = async () => {
    if (!file) return;

    setSaveAvatarLoading(true);

    const tempId = uuidv4();

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");
      formData.append("id", tempId);
      formData.append("contentType", file.type);

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      const { key } = await res.json();

      const imageUrl = `https://${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_REGION}.amazonaws.com/${key}`;

      const response = await axios.post(`${url}/api/avatar/${activeUser}`, {
        avatar: imageUrl,
      });

      if (response.data.status === "ok") {
        setAvatar(response.data.avatar);
        showToast({
          heading: "Success 🎉",
          message: "Avatar updated successfully.",
          type: "success",
        });
      } else {
        showToast({
          heading: "Error",
          message: response.data.message || "Failed to update avatar.",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error uploading avatar:", error);
      showToast({
        heading: "Error",
        message: "Something went wrong while uploading avatar.",
        type: "error",
      });
    } finally {
      setFile(null); // Reset the file state after upload
      setSaveAvatarLoading(false);
    }
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto"; // reset height
      textarea.style.height = `${textarea.scrollHeight}px`; // set to scrollHeight
    }
  };

  return (
    <div className="container">
      {banner?.trim()?.length > 0 && (
        <div className="relative !w-full !h-48 overflow-hidden  bg-gray-100">
          <img
            className="!w-full !h-full !object-cover"
            src={banner}
            alt="Banner"
          />
        </div>
      )}
      <div className="!p-4 flex-avatar justify-between !w-full border-b border-border !mb-4">
        <div className="flex items-center gap-4">
          {/* <img className="profile-avatar" src={avatar} alt="Avatar" /> */}
          <Avatar src={avatar} alt="Avatar" size="lg" />
          <div className="flex flex-col gap-1">
            <div className="flex items-center">
              <div className="!px-4 userName">{userName}</div>

              <Link
                className="cursor-pointer"
                onClick={async () => {
                  await navigator.clipboard.writeText(
                    `${window.location.origin}/profile/${userName}`
                  );
                  showToast({
                    heading: "Copied",
                    message: `Profile link copied to clipboard`,
                    type: "success",
                  });
                }}
              ></Link>
            </div>
            <div className="!px-4 text-lg">{formatContentWithLinks(bio)}</div>
            <div className="!px-4 followFollowing">
              <div>
                <b>{followers}</b> Followers
              </div>
            </div>
          </div>
        </div>
        {isActiveUser && (
          <Dialog>
            <DialogTrigger asChild>
              <button className="tweetBtn">Edit Profile</button>
            </DialogTrigger>
            <DialogContent className="!p-4  overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
              </DialogHeader>
              <div className="!pt-4 edit-profile-container flex flex-col gap-4">
                {/* Avatar Section */}
                <div className="flex flex-col gap-2 mb-4">
                  <span className="text-gray-700">Click to change avatar</span>
                  <img
                    className="profile-avatar cursor-pointer"
                    src={avatar}
                    alt="Avatar"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.getElementById("avatar-dialog-trigger")?.click();
                    }}
                  />
                </div>

                {/* Banner Input */}
                <div className="mb-4">
                  <label className="text-gray-700 block  font-medium mb-2">
                    Banner Image URL
                  </label>
                  <input
                    autoFocus={false}
                    type="text"
                    className="!text-base !w-full !border-b !border-border !p-2"
                    placeholder="Enter banner image URL"
                    defaultValue={banner}
                    onBlur={(e) =>
                      handleProfileUpdate("banner", e.target.value)
                    } // Dynamic field update
                  />
                </div>

                {/* Bio Input */}
                <div className="!mb-4">
                  <label className="text-gray-700 block font-medium !mb-2">
                    Bio
                  </label>
                  <textarea
                    autoFocus={false}
                    ref={textareaRef}
                    onInput={autoResize}
                    className="w-full !border-b !border-border !p-2"
                    placeholder="Enter your bio"
                    rows={4}
                    defaultValue={bio}
                    onBlur={(e) => handleProfileUpdate("bio", e.target.value)} // Dynamic field update
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        {followBtn && !isActiveUser && (
          <div className="followBtn-div">
            <form className="follow-form" onSubmit={handleFollow}>
              <button className="followBtn" type="submit">
                {followBtn}
              </button>
            </form>
          </div>
        )}
      </div>

      <div className="userTweets">
        <div className="text-xl font-bold !mb-4 !ml-4">Tweets</div>
        <div className="tweets">
          <ul className="tweet-list">
            {loading ? (
              <div className="h-screen">
                <AppLoader size="md" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-screen">
                <p className="text-gray-500 text-lg !mb-4">
                  Failed to fetch profile data. Please try again.
                </p>
                <button className="tweetBtn" onClick={retryFetch}>
                  Retry
                </button>
              </div>
            ) : (
              tweets.map((tweet) => (
                <Tweet
                  key={tweet._id}
                  user={activeUser}
                  body={tweet}
                  setTweets={setTweets}
                  userId={userId}
                />
              ))
            )}
          </ul>
        </div>
      </div>

      {!loading && !error && tweets.length > 0 && hasMoreTweets && (
        <InfiniteScrolling addTweets={showMoreTweets} />
      )}
      {/* Avatar Selection Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <button id="avatar-dialog-trigger" className="hidden"></button>
        </DialogTrigger>
        <DialogContent className="!p-4 h-3/4 grid-rows-[auto_1fr] ">
          <DialogHeader className="">
            <DialogTitle>Choose Avatar</DialogTitle>
          </DialogHeader>
          <Tabs
            className="overflow-y-auto h-full !mt-0 !mb-auto"
            defaultValue="avatars"
          >
            <TabsList>
              <TabsTrigger value="avatars">Avatars</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>
            <TabsContent value="avatars">
              <div className="choose-avatar-container ">
                {[...Array(15)].map((_, index) => (
                  <img
                    key={index + 1}
                    id={`${index + 1}`}
                    className="choose-profile-avatar"
                    src={`https://${
                      process.env.NEXT_PUBLIC_S3_BUCKET_NAME
                    }.s3.${
                      process.env.NEXT_PUBLIC_AWS_REGION
                    }.amazonaws.com/avatars/Avatar-${index + 1}.png`}
                    onClick={handleSubmitAvatar}
                    alt={`Avatar ${index + 1}`}
                  />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="upload">
              <div className="flex justify-center !mt-4">
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <label
                  htmlFor="file-upload"
                  className="block cursor-pointer border-2 border-dashed border-gray-400 w-[300px] rounded-lg !px-6 !py-3 text-center text-gray-600 hover:bg-gray-100 transition"
                >
                  <span className="block text-sm">Click here to upload</span>
                  <span className="text-xs text-gray-400">
                    (Only images allowed)
                  </span>
                </label>
              </div>
              {file && (
                <div className="relative">
                  <button
                    onClick={() => setFile(null)}
                    className="cursor-pointer absolute -top-2 right-2 !p-3 rounded-full bg-white shadow-lg"
                  >
                    <X />
                  </button>
                  <img
                    src={URL.createObjectURL(file)}
                    className="choose-profile-avatar !mx-auto !mt-10"
                  />
                </div>
              )}

              <div className="flex justify-end !mt-10">
                <button
                  disabled={!file || saveAvatarLoading}
                  onClick={saveUploadedAvatar}
                  className={`flex items-center ${
                    !file || saveAvatarLoading ? "disabled" : "tweetBtn"
                  }`}
                >
                  Save
                  {saveAvatarLoading && (
                    <div className="!ml-2">
                      <AppLoader size="sm" color="white" />
                    </div>
                  )}
                </button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <ChatWrapper
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
    </div>
  );
}

export default ProfileBody;
