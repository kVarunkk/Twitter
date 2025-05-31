"use client";

import React, { useState, useContext, useRef, useCallback } from "react";
import Tweet from "./Tweet";
import "reactjs-popup/dist/index.css";
import { UrlContext } from "../context/urlContext";
import "../app/globals.css";
import ScrollToTop from "./ScrollToTop";
import AppLoader from "./AppLoader";
import { showToast } from "./ToastComponent";
import ChatWrapper from "./ChatWrapper";
import InfiniteScrolling from "./InfiniteScrolling";
import { IPopulatedNotification, IPopulatedTweet } from "utils/types";
import NotificationCard from "./NotificationCard";
import { ActiveUserContext } from "context/activeUserContext";

type NotificationProps = {
  initialNotifications: IPopulatedNotification[];
  activeUserProp: string;
  userIdProp: string;
};

function Notification({
  initialNotifications,
  activeUserProp,
  userIdProp,
}: NotificationProps) {
  const [error, setError] = useState(false);
  const [notifications, setNotifications] = useState(
    initialNotifications || []
  );
  const [loading, setLoading] = useState(false);
  const [activeUser, setActiveUser] = useState(activeUserProp || "");
  const [notificationCount, setNotificationCount] = useState("20");
  const url = useContext(UrlContext);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isFetching = useRef(false);
  const [hasMoreNotifications, setHasMoreNotifications] = useState(true);
  const [userId, setUserId] = useState(userIdProp || "");
  const value = useContext(ActiveUserContext);

  async function populateNotifications() {
    try {
      const req = await fetch(`${url}/api/notification`);

      const data = await req.json();

      if (data.status === "ok") {
        const updatedNotifications = data.notifications.map(
          (notification: IPopulatedNotification) => ({
            ...notification,
          })
        );

        setNotifications(updatedNotifications);
        setActiveUser(data.activeUser || ""); // Ensure activeUser is set correctly
        setUserId(data.activeUserId || "");
        setLoading(false);
        setError(false); // Reset error state on success
      } else {
        console.error("Error fetching notifications:", data.message);
        setError(true); // Set error state
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError(true);
      showToast({
        heading: "Error",
        type: "error",
        message: "Failed to fetch notifications. Please try again.",
      });
      // Set error state
    } finally {
      setLoading(false);
    }
  }

  async function addNotifications() {
    if (isFetching.current) return;
    isFetching.current = true;

    try {
      const req = await fetch(`${url}/api/notification?t=${notificationCount}`);

      const data = await req.json();
      if (data.status === "ok") {
        const updatedNotifications: IPopulatedNotification[] =
          data.notifications;

        setNotifications((prevNotifications) => {
          const notificationMap = new Map();

          // Add old notifications
          prevNotifications.forEach((notification) =>
            notificationMap.set(notification._id, notification)
          );

          // Add new notifications (overwrites duplicates with latest version)
          updatedNotifications.forEach((notification) =>
            notificationMap.set(notification._id, notification)
          );

          return Array.from(notificationMap.values());
        });

        if (updatedNotifications.length < 20) {
          setHasMoreNotifications(false);
        }
        setNotificationCount((prevValue) =>
          (parseInt(prevValue) + 20).toString()
        );
      } else {
        // toast.error(data.message || "Failed to fetch more notifications");
        showToast({
          heading: "Error",
          type: "error",
          message: "Failed to fetch notifications. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error adding notifications:", error);
    } finally {
      isFetching.current = false;
    }
  }

  const openChatDrawer = useCallback(() => {
    setIsDrawerOpen(true);
  }, []);

  const updateNotificationState = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification._id === id
          ? { ...notification, isRead: true }
          : notification
      )
    );
    value && value.setUnreadNotificationCount(0);
  }, []);

  return (
    <div>
      <div className="notifications !mb-10">
        <ul className="notification-list">
          {loading ? (
            <div className="h-screen">
              <AppLoader size="md" color="blue" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-screen">
              <p className="text-gray-500 text-lg !mb-4">
                Failed to fetch notifications. Please try again.
              </p>
              <button
                className="notificationBtn"
                onClick={() => {
                  populateNotifications();
                }} // Retry fetching notifications
              >
                Retry
              </button>
            </div>
          ) : (
            notifications.map(function (notification) {
              return (
                <div key={notification._id}>
                  <NotificationCard
                    updateLoading={setLoading}
                    user={activeUser}
                    body={notification}
                    setNotifications={setNotifications}
                    userId={userId}
                    openChatDrawer={openChatDrawer}
                    updateNotificationState={updateNotificationState}
                  />
                </div>
              );
            })
          )}
        </ul>
      </div>
      {!loading &&
        !error &&
        notifications.length > 0 &&
        hasMoreNotifications && (
          <InfiniteScrolling addTweets={addNotifications} />
        )}
      <ScrollToTop />

      <ChatWrapper
        isDrawerOpen={isDrawerOpen}
        setIsDrawerOpen={setIsDrawerOpen}
      />
    </div>
  );
}

export default Notification;
