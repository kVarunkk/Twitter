"use client";

import React, { createContext, useContext } from "react";

export const UrlContext = createContext("");

export const UrlProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    // <UrlContext.Provider value="https://twitter-backend-ilpr.onrender.com">
    <UrlContext.Provider value="">{children}</UrlContext.Provider>
  );
};

export const useUrl = () => useContext(UrlContext);
