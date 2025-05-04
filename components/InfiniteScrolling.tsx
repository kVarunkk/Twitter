"use client";

import { useEffect, useRef } from "react";
import AppLoader from "./AppLoader";

export default function InfiniteScrolling({
  addTweets,
}: {
  addTweets(): Promise<void>;
}) {
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // function to populate the tweets
          // this function will be called when the loader is in view
          addTweets();
        }
      },
      {
        root: null,
        rootMargin: "0px",
        threshold: 1.0,
      }
    );

    const currentRef = loaderRef.current;
    if (currentRef) observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [addTweets]);

  return (
    <div className="w-full text-center !mb-10">
      <AppLoader ref={loaderRef} size="md" color="blue" />
    </div>
  );
}
