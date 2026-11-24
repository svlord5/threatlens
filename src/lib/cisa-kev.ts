/**
 * CISA Known Exploited Vulnerabilities (KEV) catalog: vulnerabilities with confirmed
 * exploitation in the wild. Public, no API key. https://www.cisa.gov/known-exploited-vulnerabilities-catalog
 *
 * The URL is fixed (never user input). The catalog is ~1.9 MB, so it is cached in memory
 * (not in the Next data cache, which has a 2 MB item limit) and refreshed every 6 hours.
 */

const FEED_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const TTL_MS = 6 * 60 * 60 * 1000;
const CVE_RE = /^CVE-\d{4}-\d{4,8}$/;

export interface KevEntry {
  cve: string;
  vendor: string;
  product: string;
  name: string;
  description: string;
  dateAdded: string;
  dueDate: string | null;
  ransomware: boolean;
  nvdUrl: string;
}

export interface KevSnapshot {
  entries: KevEntry[];
  total: number;
  released: string | null;
  catalogUrl: string;
}

const clip = (v: unknown, max: number) =>
  String(v ?? "")
     
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, max);

let cache: { at: number; snapshot: KevSnapshot } | null = null;

export async function getKevSnapshot(limit = 6): Promise<KevSnapshot | null> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    try {
      const res = await fetch(FEED_URL, {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
        headers: { Accept: "application/json", "User-Agent": "ThreatLens/1.0 (+https://surajv5.in)" },
      });
      if (!res.ok) throw new Error(`CISA responded ${res.status}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = (await res.json()) as { vulnerabilities?: any[]; count?: number; dateReleased?: string };
      if (!Array.isArray(data.vulnerabilities)) throw new Error("Unexpected KEV format");

      const entries: KevEntry[] = data.vulnerabilities
        .filter((v) => typeof v?.cveID === "string" && CVE_RE.test(v.cveID))
        .sort((a, b) => String(b.dateAdded).localeCompare(String(a.dateAdded)))
        .slice(0, 30)
        .map((v) => ({
          cve: v.cveID,
          vendor: clip(v.vendorProject, 80),
          product: clip(v.product, 80),
          name: clip(v.vulnerabilityName, 160),
          description: clip(v.shortDescription, 320),
          dateAdded: clip(v.dateAdded, 10),
          dueDate: v.dueDate ? clip(v.dueDate, 10) : null,
          ransomware: String(v.knownRansomwareCampaignUse).toLowerCase() === "known",
          nvdUrl: `https://nvd.nist.gov/vuln/detail/${v.cveID}`,
        }));

      cache = {
        at: Date.now(),
        snapshot: {
          entries,
          total: typeof data.count === "number" ? data.count : data.vulnerabilities.length,
          released: data.dateReleased ? clip(data.dateReleased, 30) : null,
          catalogUrl: "https://www.cisa.gov/known-exploited-vulnerabilities-catalog",
        },
      };
    } catch (err) {
      console.warn("[kev] could not load the CISA catalog:", err instanceof Error ? err.message : err);
      // Serve the last good copy if we have one; otherwise show nothing.
      if (!cache) return null;
    }
  }
  return { ...cache!.snapshot, entries: cache!.snapshot.entries.slice(0, limit) };
}
