"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

const ScrollToTop = () => {
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const handleScroll = () => {
    if (window.scrollY > 300) {
      setShowScrollToTop(true);
    } else {
      setShowScrollToTop(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    showScrollToTop && (
      <button
        onClick={scrollToTop}
        className="hidden sm:block cursor-pointer text-xl fixed bottom-10 right-10 text-[#1DA1F2] !p-4 rounded-full shadow-lg border-2 border-[#1DA1F2] transition"
        aria-label="Scroll to Top"
      >
        <ArrowUp strokeWidth={3} />
      </button>
    )
  );
};

export default ScrollToTop;
