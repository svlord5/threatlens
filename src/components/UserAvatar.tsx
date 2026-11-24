"use client";
/* eslint-disable @typescript-eslint/no-explicit-any -- provider payloads and GeoJSON are loosely typed */

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/** Pull a picture URL out of a Supabase user (provider-set metadata or identity data). */
export function getAvatarSource(user: any): string | undefined {
  const meta = user?.user_metadata ?? {};
  const fromIdentity = (user?.identities ?? [])
    .map((i: any) => i?.identity_data?.avatar_url || i?.identity_data?.picture)
    .find(Boolean);
  return meta.avatar_url || meta.picture || fromIdentity || undefined;
}

export function getInitials(name?: string | null, email?: string | null): string {
  const base = (name || email || "?").trim();
  const parts = base.split(/[\s@._-]+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
  return letters.toUpperCase();
}

interface UserAvatarProps {
  user?: any;
  src?: string;
  name?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}

/**
 * Avatar that loads through /api/avatar (so Google/Discord pictures actually show) and falls
 * back to initials whenever the image is missing or fails to load.
 */
export function UserAvatar({ user, src, name, size = "default", className }: UserAvatarProps) {
  const raw = src ?? getAvatarSource(user);
  const displayName =
    name ?? user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? user?.user_metadata?.custom_claims?.global_name;
  const proxied = raw ? `/api/avatar?u=${encodeURIComponent(raw)}` : undefined;
  return (
    <Avatar size={size} className={cn(className)}>
      {proxied && <AvatarImage src={proxied} alt={displayName ? `${displayName}'s avatar` : "Avatar"} referrerPolicy="no-referrer" />}
      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
        {getInitials(displayName, user?.email)}
      </AvatarFallback>
    </Avatar>
  );
}
