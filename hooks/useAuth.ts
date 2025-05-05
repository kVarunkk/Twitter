"use client";

import { UrlContext } from "context/urlContext";
import { useContext, useEffect, useState } from "react";

export function useAuth() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const url = useContext(UrlContext);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch(url + "/api/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
