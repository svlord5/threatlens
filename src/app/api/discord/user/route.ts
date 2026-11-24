import { NextResponse } from 'next/server';
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: Request) {
  const authz = await requireAuth(request, { blockDemo: true });
  if (!authz.ok) return authz.response;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  // Discord snowflake: digits only (it is interpolated into the API path).
  if (!id || !/^\d{5,25}$/.test(id)) {
    return NextResponse.json({ error: 'Missing or invalid Discord ID' }, { status: 400 });
  }

  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'Discord Bot Token not configured' }, { status: 500 });
  }

  try {
    const res = await fetch(`https://discord.com/api/v10/users/${id}`, {
      headers: {
        Authorization: `Bot ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 404) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw new Error(`Discord API responded with status ${res.status}`);
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Discord API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
