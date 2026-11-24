import { NextResponse } from 'next/server';
import { requireAuth } from "@/lib/api-auth";
import { sendDiscordLog } from "@/lib/discord-log";
import { rejectLargeBody, LIMITS } from "@/lib/limits";

export async function POST(request: Request) {
  const authz = await requireAuth(request, { blockDemo: true });
  if (!authz.ok) return authz.response;
  const tooBig = rejectLargeBody(request, LIMITS.body.small);
  if (tooBig) return tooBig;

  try {
    const { action, user, metadata } = await request.json();
    await sendDiscordLog({ action, user, metadata });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Discord webhook failed:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
