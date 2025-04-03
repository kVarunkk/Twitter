"use client";

import { useState, useEffect, useContext } from "react";
import { BsTwitter } from "react-icons/bs";
// import { useToast } from "@chakra-ui/toast";
import jwtDecode from "jwt-decode";
import { UrlContext } from "../context/urlContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
// import { Spinner } from "@chakra-ui/react";
import "../app/globals.css";
import toast from "react-hot-toast";
import { LoaderCircle } from "lucide-react";
import { showToast } from "./ToastComponent";
import {
  base64ToArrayBuffer,
  deriveKeyFromPassword,
} from "utils/cryptoHelpers";

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

  async function signin(
    encryptedPrivateKey: string,
    derivedKey: string,
    iv: string
  ) {
    try {
      // const saltBuffer = base64ToArrayBuffer(salt);
      // if (saltBuffer.byteLength !== 16) {
      //   throw new Error(
      //     `Invalid salt length: ${saltBuffer.byteLength}, expected 16 bytes`
      //   );
      // }

      // const derivedKey = await deriveKeyFromPassword(password, saltBuffer);

      const keyBuffer = base64ToArrayBuffer(derivedKey);
      const importedDerivedKey = await window.crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM", length: 256 },
        false,
        ["decrypt"]
      );
      const privateKey = await decryptPrivateKey(
        encryptedPrivateKey,
        importedDerivedKey,
        iv
      );

      localStorage.setItem("privateKey", privateKey);
    } catch (error) {
      throw error;
    }
  }

  async function decryptPrivateKey(
    encryptedPrivateKey: string,
    derivedKey: CryptoKey,
    iv: string
  ) {
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64ToArrayBuffer(iv) },
      derivedKey,
      base64ToArrayBuffer(encryptedPrivateKey)
    );
    return new TextDecoder().decode(decrypted);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${url}/api/signin`, {
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
        await signin(
          data.user.encryptedPrivateKey,
          data.user.derivedKey,
          data.user.iv
        );
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
      console.error("Error fetching user data:", error);
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
