"use client";

import { useEffect, useState } from "react";

export interface Me {
  isAdmin: boolean;
  isDemo: boolean;
  ownerDiscordId: string | null;
}

const NOBODY: Me = { isAdmin: false, isDemo: false, ownerDiscordId: null };
let pending: Promise<Me> | null = null;

/** Fetch (once per page load) what the server says about the current user. Fails closed. */
export function fetchMe(): Promise<Me> {
  if (!pending) {
    pending = fetch("/api/me", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Me>) : NOBODY))
      .catch(() => NOBODY);
  }
  return pending;
}

export function useMe(): Me {
  const [me, setMe] = useState<Me>(NOBODY);
  useEffect(() => {
    let alive = true;
    fetchMe().then((m) => alive && setMe(m));
    return () => {
      alive = false;
    };
  }, []);
  return me;
}
