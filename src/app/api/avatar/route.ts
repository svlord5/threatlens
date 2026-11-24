import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

/**
 * Same-origin avatar proxy.
 *
 * Browsers load profile pictures from Google/Discord/other sites unreliably (hotlink and
 * Referer rules, rate limits, Cross-Origin-Resource-Policy). Fetching them here avoids all of
 * that, lets the browser cache them, and keeps visitors' IPs from those hosts.
 *
 * Only an exact allow-list of HTTPS hosts is fetched, with no redirects, only raster image
 * types (no SVG) and a small size cap, so this cannot be used as an open proxy.
 */

const MAX_BYTES = 1024 * 1024;
const ALLOWED_HOSTS = [/^lh[0-9]\.googleusercontent\.com$/, /^cdn\.discordapp\.com$/, /^surajv5\.in$/];
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"]);

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("u");
  let target: URL;
  try {
    target = new URL(raw ?? "");
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  if (target.protocol !== "https:" || target.port || target.username || target.password || !ALLOWED_HOSTS.some((re) => re.test(target.hostname))) {
    return new NextResponse("Forbidden host", { status: 403 });
  }

  // The owner's public site icon (used on public blog pages) needs no login; user pictures do.
  const isPublicIcon = target.hostname === "surajv5.in" && target.pathname.startsWith("/icons/");
  if (!isPublicIcon) {
    const authz = await requireAuth(request);
    if (!authz.ok) return authz.response;
  }

  try {
    const upstream = await fetch(target, {
      redirect: "error",
      signal: AbortSignal.timeout(5000),
      headers: { Accept: "image/*", "User-Agent": "ThreatLens-AvatarProxy/1.0" },
      referrerPolicy: "no-referrer",
      cache: "no-store",
    });
    const type = (upstream.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (!upstream.ok || !ALLOWED_TYPES.has(type)) return new NextResponse("Not an image", { status: 404 });

    const reader = upstream.body?.getReader();
    if (!reader) return new NextResponse("Empty", { status: 502 });
    const chunks: Uint8Array[] = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return new NextResponse("Too large", { status: 413 });
      }
      chunks.push(value);
    }
    return new NextResponse(Buffer.concat(chunks), {
      headers: {
        "Content-Type": type,
        "Content-Length": String(size),
        "Cache-Control": isPublicIcon ? "public, max-age=86400" : "private, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    return new NextResponse("Upstream error", { status: 502 });
  }
}
