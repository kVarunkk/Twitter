"use client";

import { useState, useEffect, useContext } from "react";
import { BsTwitter } from "react-icons/bs";
import { useToast } from "@chakra-ui/toast";
import jwtDecode from "jwt-decode";
import { UrlContext } from "../context/urlContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Spinner } from "@chakra-ui/react";
import "../app/globals.css";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { showToast } from "./ToastComponent";

function HomeBody() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const url = useContext(UrlContext);
  const router = useRouter();
  // const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const user = jwtDecode(token);
      if ((user as any).exp > Date.now() / 1000) {
        router.push("/feed");
      } else {
        localStorage.removeItem("token");
      }
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${url}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // "x-access-token": localStorage.getItem("token") || "",
        },
        body: JSON.stringify({ username: userName, password }),
      });

      const data = await response.json();

      if (data.status === "ok" && data.token) {
        localStorage.setItem("token", data.token);
        // toast.success("Login successful");
        showToast({
          heading: "Success 🎉",
          message: "Login successful",
          type: "success",
        });

        setTimeout(() => router.push("/feed"), 600);
      } else {
        // toast.error(data.message || "Invalid login credentials");

        showToast({
          heading: "Error",
          message: data.message || "Invalid login credentials",
          type: "error",
        });
      }
    } catch (error) {
      // toast.error("Something went wrong");
      showToast({
        heading: "Error",
        message: "Something went wrong",
        type: "error",
      });
    } finally {
      setLoading(false);
      setUserName("");
      setPassword("");
    }
  };

  return (
    <div className=" m-auto">
      <div className="homeContainer">
        <div className="homeContainer-logo">
          <BsTwitter />
        </div>
        <div className="homeContainer-header">
          <h2>Sign in to Twitter</h2>
        </div>
        <form
          className="homeContainer-form flex flex-col gap-3 items-center"
          onSubmit={handleSubmit}
        >
          <input
            required
            className="homeContainer-input"
            type="text"
            placeholder="Enter Username"
            value={userName}
            onChange={(e) => setUserName(e.target.value.toLowerCase())}
          />
          <input
            required
            className="homeContainer-input"
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="homeContainer-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="animate-spin" color="white" />
            ) : (
              "Sign in"
            )}
          </button>
        </form>
        <div className="homeContainer-signup">
          Don't have an account? <Link href="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default HomeBody;
