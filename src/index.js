import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import Home from "./routes/home";
import Profile from "./routes/profile";
import SignUp from "./routes/signUp";
import { ChakraProvider } from "@chakra-ui/react";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  // <ChakraProvider>
  <HashRouter basename="/">
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="feed" element={<App />} />
      <Route path="signup" element={<SignUp />} />
      <Route path="profile" element={<Profile />} />
      <Route path="/profile/:userName" element={<Profile />} />
    </Routes>
  </HashRouter>
  // </ChakraProvider>
);
