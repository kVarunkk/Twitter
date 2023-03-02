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
  <ChakraProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/Twitter-Frontend/" element={<Home />} />
        <Route path="/Twitter-Frontend/feed" element={<App />} />
        <Route path="/Twitter-Frontend/signup" element={<SignUp />} />
        <Route path="/Twitter-Frontend/profile" element={<Profile />} />
        <Route
          path="/Twitter-Frontend/profile/:userName"
          element={<Profile />}
        />
      </Routes>
    </BrowserRouter>
  </ChakraProvider>
);
