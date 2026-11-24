import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

/** What the UI may know about the caller. Admin identity is decided on the server only. */
export async function GET(request: Request) {
  const authz = await requireAuth(request);
  if (!authz.ok) return authz.response;
  return NextResponse.json(
    {
      // In demo mode the UI shows the admin screens; every write is still refused.
      isAdmin: authz.isAdmin || authz.isDemo,
      isDemo: authz.isDemo,
      // Only admins learn the owner's Discord ID (used to protect the owner row in the admin UI).
      ownerDiscordId: authz.isAdmin && !authz.isDemo ? ownerDiscordId() : null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

function ownerDiscordId(): string | null {
  return process.env.SUPER_ADMIN_DISCORD_ID || process.env.NEXT_PUBLIC_SUPER_ADMIN_ID || null;
}
