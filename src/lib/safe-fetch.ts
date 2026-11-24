import dns from "dns";
import http from "http";
import https from "https";
import net from "net";

/**
 * SSRF guard for server-side fetching of user-supplied URLs.
 *
 *  - http/https only, no embedded credentials, restricted ports
 *  - every hostname is resolved and ALL addresses must be public
 *  - the check happens inside the socket's `lookup`, so the address we validate
 *    is the address we connect to (no DNS-rebinding gap)
 *  - redirects are followed manually (max MAX_REDIRECTS) and every hop is
 *    re-validated
 *  - response size and total runtime are capped
 */

export const MAX_REDIRECTS = 3;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
export const DEFAULT_TIMEOUT_MS = 8000;
const ALLOWED_PORTS = new Set(["", "80", "443", "8080", "8443"]);

export class UnsafeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsafeUrlError";
  }
}

const blocked = new net.BlockList();
// IPv4
for (const [net4, prefix] of [
  ["0.0.0.0", 8], // "this" network
  ["10.0.0.0", 8], // private
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, cloud metadata (169.254.169.254)
  ["172.16.0.0", 12], // private
  ["192.0.0.0", 24], // IETF protocol assignments
  ["192.0.2.0", 24], // TEST-NET-1
  ["192.168.0.0", 16], // private
  ["198.18.0.0", 15], // benchmarking
  ["198.51.100.0", 24], // TEST-NET-2
  ["203.0.113.0", 24], // TEST-NET-3
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reserved + broadcast
] as const) {
  blocked.addSubnet(net4, prefix, "ipv4");
}
// IPv6
for (const [net6, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["fc00::", 7], // unique local (incl. fd00:ec2::254 AWS metadata)
  ["fe80::", 10], // link-local
  ["fec0::", 10], // deprecated site-local
  ["ff00::", 8], // multicast
  ["2001:db8::", 32], // documentation
  ["100::", 64], // discard-only
] as const) {
  blocked.addSubnet(net6, prefix, "ipv6");
}

/** Extract an embedded IPv4 from IPv4-mapped (::ffff:a.b.c.d / ::ffff:aabb:ccdd) or NAT64 (64:ff9b::/96) forms. */
function embeddedIpv4(ip: string): string | null {
  const lower = ip.toLowerCase();
  const m = /^(?:::ffff:|64:ff9b::)(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
  if (m) return m[1];
  const hex = /^(?:::ffff:|64:ff9b::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(lower);
  if (hex) {
    const hi = parseInt(hex[1], 16);
    const lo = parseInt(hex[2], 16);
    return `${hi >> 8}.${hi & 255}.${lo >> 8}.${lo & 255}`;
  }
  return null;
}

export function isBlockedIp(ip: string): boolean {
  const version = net.isIP(ip);
  if (version === 0) return true; // not an IP: refuse
  if (version === 4) return blocked.check(ip, "ipv4");
  const v4 = embeddedIpv4(ip);
  if (v4) return blocked.check(v4, "ipv4");
  return blocked.check(ip, "ipv6");
}

/** Synchronous structural checks (scheme, credentials, port, literal IPs). Returns the parsed URL. */
export function parseSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("Invalid URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new UnsafeUrlError("Only http and https URLs are allowed.");
  }
  if (url.username || url.password) {
    throw new UnsafeUrlError("URLs with embedded credentials are not allowed.");
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    throw new UnsafeUrlError("Port not allowed.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host) && isBlockedIp(host)) {
    throw new UnsafeUrlError("Target address is not allowed.");
  }
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    throw new UnsafeUrlError("Target host is not allowed.");
  }
  return url;
}

/** Resolve a hostname and require every address to be public. Used to pre-check URLs handed to a browser. */
export async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.replace(/^\[|\]$/g, "");
  if (net.isIP(host)) {
    if (isBlockedIp(host)) throw new UnsafeUrlError("Target address is not allowed.");
    return;
  }
  const addrs = await dns.promises.lookup(host, { all: true, verbatim: true });
  if (addrs.length === 0 || addrs.some((a) => isBlockedIp(a.address))) {
    throw new UnsafeUrlError("Target resolves to a non-public address.");
  }
}

/** Full validation: structure + DNS. */
export async function assertSafeUrl(raw: string): Promise<URL> {
  const url = parseSafeUrl(raw);
  await assertPublicHost(url.hostname);
  return url;
}

/** `lookup` implementation that refuses non-public addresses at connect time. */
export const safeLookup: net.LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...options, all: true, verbatim: true }, (err, addresses) => {
    if (err) return callback(err, "", 0);
    const list = addresses as dns.LookupAddress[];
    if (list.length === 0 || list.some((a) => isBlockedIp(a.address))) {
      return callback(new UnsafeUrlError("Target resolves to a non-public address.") as NodeJS.ErrnoException, "", 0);
    }
    if (options && (options as dns.LookupOptions).all) {
      return (callback as unknown as (e: null, a: dns.LookupAddress[]) => void)(null, list);
    }
    callback(null, list[0].address, list[0].family);
  });
};

export interface SafeFetchResult {
  status: number;
  ok: boolean;
  headers: Headers;
  text: string;
  finalUrl: string;
  truncated: boolean;
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
}

function requestOnce(
  url: URL,
  deadline: number,
  maxBytes: number,
  userAgent: string
): Promise<{ status: number; headers: Headers; text: string; location?: string; truncated: boolean }> {
  return new Promise((resolve, reject) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) return reject(new Error("Request timed out."));

    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(
      url,
      {
        method: "GET",
        lookup: safeLookup,
        timeout: remaining,
        // Identity encoding so the byte cap applies to what we actually buffer.
        headers: { "User-Agent": userAgent, "Accept-Encoding": "identity", Accept: "text/html,*/*;q=0.8" },
      },
      (res) => {
        const headers = new Headers();
        for (const [k, v] of Object.entries(res.headers)) {
          if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
        }
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ status, headers, text: "", location: res.headers.location, truncated: false });
        }

        const chunks: Buffer[] = [];
        let size = 0;
        let truncated = false;
        const timer = setTimeout(() => req.destroy(new Error("Request timed out.")), Math.max(1, deadline - Date.now()));
        res.on("data", (chunk: Buffer) => {
          size += chunk.length;
          if (size > maxBytes) {
            truncated = true;
            chunks.push(chunk.subarray(0, chunk.length - (size - maxBytes)));
            clearTimeout(timer);
            res.destroy();
            return;
          }
          chunks.push(chunk);
        });
        const done = () => {
          clearTimeout(timer);
          resolve({ status, headers, text: Buffer.concat(chunks).toString("utf8"), truncated });
        };
        res.on("end", done);
        res.on("close", done);
        res.on("error", (e) => {
          clearTimeout(timer);
          reject(e);
        });
      }
    );
    req.on("timeout", () => req.destroy(new Error("Request timed out.")));
    req.on("error", reject);
    req.end();
  });
}

/** GET a user-supplied URL with SSRF protections, redirect limit, size cap and overall deadline. */
export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const deadline = Date.now() + (options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const maxBytes = options.maxBytes ?? MAX_RESPONSE_BYTES;
  const maxRedirects = options.maxRedirects ?? MAX_REDIRECTS;
  const userAgent =
    options.userAgent ??
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  let url = parseSafeUrl(rawUrl);
  for (let hop = 0; hop <= maxRedirects; hop++) {
    const r = await requestOnce(url, deadline, maxBytes, userAgent);
    if (r.location) {
      // Resolve relative redirects and re-validate the next hop's structure;
      // DNS is validated again by safeLookup when we connect.
      url = parseSafeUrl(new URL(r.location, url).href);
      continue;
    }
    return {
      status: r.status,
      ok: r.status >= 200 && r.status < 300,
      headers: r.headers,
      text: r.text,
      finalUrl: url.href,
      truncated: r.truncated,
    };
  }
  throw new UnsafeUrlError("Too many redirects.");
}
