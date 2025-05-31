import { ISerealizedUser } from "utils/types";
import webpush from "web-push";

let vapidInitialized = false;

export async function sendPush(
  user: ISerealizedUser,
  payload: { title: string; body: string; url: string }
) {
  if (!vapidInitialized) {
    webpush.setVapidDetails(
      "mailto:varunkumawatleap2@gmail.com",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.NODE_ENV === "development"
        ? process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY!
        : process.env.VAPID_PRIVATE_KEY!
    );
    vapidInitialized = true;
  }

  if (!user.pushSubscription) return;

  try {
    await webpush.sendNotification(
      user.pushSubscription,
      JSON.stringify(payload)
    );
  } catch (err) {
    console.error("Push failed", err);
    throw err;
  }
}
