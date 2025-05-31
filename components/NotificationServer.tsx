import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyJwt } from "lib/auth";
import { serializeObject } from "utils/utils";
import Error from "./Error";
import { connectToDatabase } from "lib/mongoose";
import { Notification, Tweet, User } from "utils/models/File";
import { IPopulatedNotification, IPopulatedTweet, ITweet } from "utils/types";
import NotificationComponent from "@/components/Notification";

export const dynamic = "force-dynamic"; // This will make sure the page is always revalidated on every request

export default async function NotificationServer() {
  try {
    await connectToDatabase();
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) redirect("/");

    const decoded = await verifyJwt(token);
    if (!decoded) redirect("/");

    const user = await User.findById(decoded.id);
    if (!user) redirect("/");

    const notifications = await Notification.find({
      recipient: user._id,
    })
      .populate("sender", "username avatar")
      .populate("tweet", "postedTweetTime")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean<IPopulatedNotification[]>();

    const hydratedNotifications = notifications.map((notif) => {
      const safeNotification: IPopulatedNotification = serializeObject(notif);

      return safeNotification;
    });

    return (
      <NotificationComponent
        initialNotifications={hydratedNotifications}
        activeUserProp={user.username}
        userIdProp={user._id.toString()}
      />
    );
  } catch (error) {
    return <Error />;
  }
}
