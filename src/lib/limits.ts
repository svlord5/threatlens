import { NextResponse } from "next/server";

/**
 * Hard input limits. Keep these small: every public or expensive endpoint
 * should reject oversized input before doing any work.
 */
export const LIMITS = {
  /** Max request body sizes in bytes. */
  body: {
    small: 16 * 1024, // log events, lookups, status changes
    form: 32 * 1024, // access-request form
    medium: 256 * 1024, // IOC lists, parsed logs, Wazuh alerts
    ingest: 1024 * 1024, // SIEM batch
    sample: 28 * 1024 * 1024, // base64 malware sample (20 MB decoded)
  },
  iocsPerRequest: 50,
  iocLength: 512,
  urlLength: 2048,
  ingestEventsPerBatch: 200,
  logTextLength: 100_000,
} as const;

/**
 * Reject a request whose declared Content-Length is missing or above `maxBytes`.
 * (HTTP framing guarantees the server never reads more than the declared length.)
 */
export function rejectLargeBody(request: Request, maxBytes: number): NextResponse | null {
  const raw = request.headers.get("content-length");
  if (raw === null) {
    return NextResponse.json({ error: "Content-Length required" }, { status: 411 });
  }
  const len = Number(raw);
  if (!Number.isFinite(len) || len < 0 || len > maxBytes) {
    return NextResponse.json({ error: "Request body too large" }, { status: 413 });
  }
  return null;
}

/** Truncate untrusted text and strip control characters. */
export function clip(value: unknown, max: number): string {
   
  return String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").slice(0, max);
}

export const tooManyItems = (what: string, max: number) =>
  NextResponse.json({ error: `Too many ${what} (max ${max})` }, { status: 413 });
