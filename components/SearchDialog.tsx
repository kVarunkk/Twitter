"use client";

import { useContext, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { UrlContext } from "context/urlContext";
import { showToast } from "./ToastComponent";
import Usercard from "./Usercard";
import AppLoader from "./AppLoader";
import { ISerealizedUser, IUser } from "utils/types";

type SearchDialogProps = {
  open: boolean;
  onClose: () => void;
  onUserSelect: (user: ISerealizedUser) => void;
  activeUser: ISerealizedUser | null;
};

export default function SearchDialog({
  open,
  onClose,
  onUserSelect,
  activeUser,
}: SearchDialogProps) {
  const [searchText, setSearchText] = useState("");
  const [users, setUsers] = useState<ISerealizedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const url = useContext(UrlContext);

  const handleSearch = async () => {
    if (searchText.trim().length === 0) return;
    if (!activeUser) return;

    setLoading(true);

    try {
      const req = await fetch(
        `${url}/api/search/${searchText}?skip=0&limit=0`,
        {
          headers: {
            //"x-access-token": localStorage.getItem("token"),
          },
        }
      );

      const data = await req.json();

      if (data.status === "ok") {
        setUsers(
          data.users.filter(
            (user: ISerealizedUser) => user._id !== activeUser._id
          )
        );
      } else {
        throw new Error(data.error || "Unknown error occurred");
      }
    } catch (error) {
      console.error(error);
      showToast({
        heading: "Error",
        message: "Some error occurred, please try again later",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="!p-4">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
        </DialogHeader>
        <div className="">
          <input
            type="text"
            placeholder="Search users..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="!w-full !border-b !border-border  !p-2 !mb-4"
          />
          <div className="flex items-center justify-between">
            <button
              disabled={searchText.trim().length === 0}
              onClick={handleSearch}
              className={`tweetBtn ${
                searchText.trim().length === 0
                  ? "opacity-50 !cursor-default"
                  : ""
              } `}
            >
              Search
            </button>
            {users.length > 0 && (
              <p className="text-gray-500 text-sm ">
                {users.length} users found
              </p>
            )}
          </div>
          <div className="!mt-4 max-h-[400px] overflow-y-auto">
            {users.length === 0 &&
            searchText.trim().length !== 0 &&
            !loading ? (
              <p className="text-gray-500 text-center">No results found</p>
            ) : loading ? (
              <div className="!mt-5 text-center">
                <AppLoader />
              </div>
            ) : (
              users.map((user) => (
                <div key={user._id} onClick={() => onUserSelect(user)}>
                  <Usercard
                    noLink
                    avatar={user.avatar}
                    username={user.username}
                    followers={user.followers}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
