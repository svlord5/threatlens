import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    siteKey: process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY || process.env.CLOUDFLARE_SITE_TURNSTILE_KEY
  });
}
