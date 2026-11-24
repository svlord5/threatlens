import { NextResponse } from "next/server";
import { readPrefill } from "@/lib/prefill";
import { isDemoMode } from "@/lib/demo";

/** What the access-request form may show read-only (from the signed cookie, if present). */
export async function GET(request: Request) {
  // Demo mode: show a fake verified identity so the form can be explored (submitting is disabled).
  if (isDemoMode()) {
    return NextResponse.json({ fullName: "Demo Analyst", email: "demo@example.com", discordId: "100000000000000001", discordName: "demo_analyst" });
  }
  const p = readPrefill(request);
  return NextResponse.json(
    {
      fullName: p?.fullName ?? null,
      email: p?.email ?? null,
      discordId: p?.discordId ?? null,
      discordName: p?.discordName ?? null,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
