import { NextResponse } from 'next/server';
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { rejectLargeBody, LIMITS } from "@/lib/limits";

export async function POST(req: Request) {
  const authz = await requireAuth(req, { blockDemo: true });
  if (!authz.ok) return authz.response;
  const limited = await rateLimit(req, authz, ["virustotal"]);
  if (limited) return limited;
  const tooBig = rejectLargeBody(req, LIMITS.body.small);
  if (tooBig) return tooBig;

  try {
    const { hash } = await req.json();

    // Must be a bare MD5/SHA-1/SHA-256: it is interpolated into the VirusTotal URL path.
    if (typeof hash !== 'string' || !/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(hash)) {
      return NextResponse.json({ error: 'A valid MD5, SHA-1 or SHA-256 hash is required' }, { status: 400 });
    }

    const vtApiKey = process.env.VIRUSTOTAL_API_KEY;
    
    if (!vtApiKey) {
      return NextResponse.json({ error: 'VirusTotal API Key is not configured' }, { status: 500 });
    }

    // Call VirusTotal API
    const vtResponse = await fetch(`https://www.virustotal.com/api/v3/files/${hash}`, {
      method: 'GET',
      headers: {
        'x-apikey': vtApiKey,
        'Accept': 'application/json'
      }
    });

    const data = await vtResponse.json();

    if (!vtResponse.ok) {
      return NextResponse.json(
        { error: data.error?.message || 'Failed to fetch from VirusTotal' }, 
        { status: vtResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('VirusTotal API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
