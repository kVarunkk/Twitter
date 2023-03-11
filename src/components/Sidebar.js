import React, { useState } from "react";
import { Link } from "react-router-dom";
import { BsTwitter } from "react-icons/bs";
import { BiHome } from "react-icons/bi";
import { CgProfile } from "react-icons/cg";
import { AiFillCamera } from "react-icons/ai";
import { AiOutlineSearch } from "react-icons/ai";
import { GrLogout } from "react-icons/gr";
import { useToast } from "@chakra-ui/toast";
import Popup from "reactjs-popup";
import "reactjs-popup/dist/index.css";
import moment from "moment";
import axios from "axios";

import jwtDecode from "jwt-decode";

function Sidebar() {
  const [activeUser, setActiveUser] = useState("");
  const [input, setInput] = useState("");
  const toast = useToast();
  const [img, setImg] = useState("");
  const [isImageSelected, setIsImageSelected] = useState(false);

  const checkInput = input || img;

  const successToast = () => {
    toast({
      title: `Tweet sent`,
      description: `${(<Link to={"/Twitter-Frontend/"}>View</Link>)}`,
      position: "top",
      isClosable: true,
    });
  };

  async function populateUser() {
    const req = await fetch("https://drab-hare-zipper.cyclic.app/feed", {
      headers: {
        "x-access-token": localStorage.getItem("token"),
      },
    });

    const data = await req.json();
    if (data.status === "ok") {
      setActiveUser(data.activeUser.username);
    } else {
      alert(data.error);
    }
  }

  populateUser();

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  const logout = (e) => {
    localStorage.removeItem("token");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const tweet = {
      content: input,
      postedBy: {
        username: activeUser,
      },
      image: "",
      likes: [],
      retweets: [],
      comments: [],
      likeTweetBtn: "black",
      postedTweetTime: moment().format("MMMM Do YYYY, h:mm:ss a"),
      tweetId: moment(),
    };

    const data = { tweet: JSON.stringify(tweet), image: img };
    const action = e.target.action;

    axios
      .post(`${action}`, data)
      .then(setInput(""))
      .then(setImg(""))
      .then(setIsImageSelected(false))
      .then(successToast())
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div className="sidebar">
      <ul className="sidebar-menu">
        <li className="sidebar-menu-items">
          <div className="title">
            <Link to="/Twitter-Frontend/feed">
              <BsTwitter />
            </Link>
          </div>
        </li>
        <li className="sidebar-menu-items">
          <Link to="/Twitter-Frontend/feed">
            <BiHome />
            <div>Home</div>
          </Link>
        </li>
        <li className="sidebar-menu-items">
          <Link to={`/Twitter-Frontend/profile/${activeUser}`}>
            <CgProfile />
            <div>Profile</div>
          </Link>
        </li>
        <li className="sidebar-menu-items">
          <Link to={`/Twitter-Frontend/search`}>
            <AiOutlineSearch />
            <div>Search</div>
          </Link>
        </li>
        <li onClick={logout} className="sidebar-menu-items">
          <Link to="/Twitter-Frontend/">
            <GrLogout />
            <div>Logout</div>
          </Link>
        </li>
        <li className="sidebar-menu-items tweet-list-item">
          <Popup
            trigger={
              <button className="tweetBtn sidebar-menu-tweetBtn">Tweet</button>
            }
            modal
            position="center"
          >
            {(close) => (
              <form
                onSubmit={(e) => {
                  handleSubmit(e);
                  close();
                }}
                method="post"
                encType="multipart/form-data"
                action="https://drab-hare-zipper.cyclic.app/feed"
                className="tweet-form"
                id="form1"
              >
                <input
                  autoFocus
                  placeholder="What's good?"
                  type="text"
                  value={input}
                  onChange={handleChange}
                ></input>
                <div className="tweet-flex">
                  <div>
                    <AiFillCamera
                      style={{
                        color: "#1DA1F2",
                        fontSize: "1.5rem",
                      }}
                    />
                  </div>

                  <input
                    className="image-input"
                    type="text"
                    placeholder="Enter an image url here"
                    value={img}
                    onChange={(e) => setImg(e.target.value)}
                  ></input>
                  <button
                    className={checkInput ? "tweetBtn" : "disabled"}
                    disabled={!checkInput}
                    type="submit"
                  >
                    {" "}
                    Tweet
                  </button>
                </div>
                <img className="tweet-preview" src={img} alt="" />
              </form>
            )}
          </Popup>
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
