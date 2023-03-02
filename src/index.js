import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Home from "./routes/home";
import Profile from "./routes/profile";
import SignUp from "./routes/signUp";
import { ChakraProvider } from "@chakra-ui/react";
import { HashRouter } from "react-router-dom";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <ChakraProvider>
    <HashRouter>
      <Routes>
        <Route
          path="http://kVarunkk.github.io/Twitter-Frontend/"
          element={<Home />}
        />
        <Route
          path="http://kVarunkk.github.io/Twitter-Frontend/feed"
          element={<App />}
        />
        <Route
          path="http://kVarunkk.github.io/Twitter-Frontend/signup"
          element={<SignUp />}
        />
        <Route
          path="http://kVarunkk.github.io/Twitter-Frontend/profile"
          element={<Profile />}
        />
        <Route
          path="http://kVarunkk.github.io/Twitter-Frontend/profile/:userName"
          element={<Profile />}
        />
      </Routes>
    </HashRouter>
  </ChakraProvider>
);
