"use client";

import React, { createContext, useContext } from "react";

export const UrlContext = createContext("");

export const UrlProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <UrlContext.Provider value="http://localhost:5000">
      {children}
    </UrlContext.Provider>
  );
};

export const useUrl = () => useContext(UrlContext);
