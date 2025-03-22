"use client";

import React, { useState, useContext, useCallback, useEffect } from "react";
import { BsTwitter } from "react-icons/bs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle } from "lucide-react";
import { showToast } from "./ToastComponent";
import { UrlContext } from "../context/urlContext";
import jwtDecode from "jwt-decode";

function SignupBody() {
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ username: string; password: string }>({
    username: "",
    password: "",
  }); // State for validation errors
  const url = useContext(UrlContext);
  const router = useRouter();

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

  const handleChangeUserName = (e) => {
    setUserName(e.target.value.toLowerCase());
    setErrors((prev) => ({ ...prev, username: "" })); // Clear username error on input change
  };

  const handleChangePassword = (e) => {
    setPassword(e.target.value);
    setErrors((prev) => ({ ...prev, password: "" })); // Clear password error on input change
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrors({ username: "", password: "" }); // Clear previous errors

      try {
        const response = await fetch(`${url}/api/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: userName, password }),
        });

        const data = await response.json();

        if (data.status === "ok") {
          showToast({
            heading: "Success 🎉",
            message: "Successfully registered, please login",
            type: "success",
          });
          setTimeout(() => router.push("/"), 600);
          setUserName("");
          setPassword("");
        } else if (data.errors) {
          // Handle validation errors
          const validationErrors: { username: string; password: string } = {
            username: "",
            password: "",
          };
          data.errors.forEach((error) => {
            if (error.path === "username") {
              validationErrors.username = error.msg;
            }
            if (error.path === "password") {
              validationErrors.password = error.msg;
            }
          });
          setErrors(validationErrors);
        } else if (data.error) {
          // Handle other errors (e.g., username already taken)
          showToast({
            heading: "Error",
            message: data.error,
            type: "error",
          });
        }
      } catch (error) {
        showToast({
          heading: "Error",
          message: "An error occurred. Please try again.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    },
    [userName, password, url, router]
  );

  return (
    <div className="m-auto">
      <div className="homeContainer">
        <div className="homeContainer-logo">
          <BsTwitter />
        </div>
        <div className="homeContainer-header">
          <h2>Join Twitter today</h2>
        </div>
        <form
          className="homeContainer-form flex flex-col gap-3 items-center"
          onSubmit={handleSubmit}
        >
          <div className="w-full">
            <input
              required
              className="homeContainer-input"
              type="text"
              placeholder="Enter Username"
              value={userName}
              onChange={handleChangeUserName}
            />
            {errors.username && (
              <p className="!w-[80%] !mx-auto text-red-500 text-sm mt-1">
                {errors.username}
              </p>
            )}
          </div>
          <div className="w-full">
            <input
              required
              className="homeContainer-input"
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={handleChangePassword}
            />
            {errors.password && (
              <p className="!w-[80%] !mx-auto text-red-500 text-sm mt-1">
                {errors.password}
              </p>
            )}
          </div>
          <button
            className="homeContainer-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="animate-spin" color="white" />
            ) : (
              "Sign up"
            )}
          </button>
        </form>
        <div className="homeContainer-signup">
          Already have an account? <Link href="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default SignupBody;
