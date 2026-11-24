import { NextRequest, NextResponse } from "next/server";

// Basic regex for IOC extraction from text/HTML
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
// Stricter phone regex: Requires either a + prefix, or strict formatting like (XXX) XXX-XXXX or XXX-XXX-XXXX.
const STRICT_PHONE_REGEX = /(?:(?:\+\d{1,3}[\s.-]*)?\(?\d{3}\)?[\s.-]+\d{3}[\s.-]+\d{4})\b/g;
const TEL_LINK_REGEX = /href=["']?tel:([^"'>\s]+)["']?/gi;
const LINK_REGEX = /(?:href|src)=["']?([^"'>\s]+)["']?/gi;
const CRYPTO_REGEX = /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/g; // BTC mostly

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import dns from 'dns/promises';
import tls from 'tls';
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { rejectLargeBody, LIMITS } from "@/lib/limits";
import {
  UnsafeUrlError,
  assertPublicHost,
  assertSafeUrl,
  parseSafeUrl,
  safeFetch,
  safeLookup,
  MAX_RESPONSE_BYTES,
} from "@/lib/safe-fetch";

// Browser-side limits (Chromium makes its own requests, so we police them via request interception).
const MAX_BROWSER_REQUESTS = 150;
const SCRAPE_DEADLINE_MS = 6000;

const escapeXml = (v: string) =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const PROTECTED_BRANDS = ["microsoft", "google", "paypal", "apple", "chase", "amazon", "netflix", "facebook", "instagram", "twitter"];
const SUSPICIOUS_TLDS = [".xyz", ".top", ".cc", ".ru", ".cn", ".zip", ".tk", ".ml", ".ga", ".cf", ".gq"];

function levenshtein(s: string, t: string) {
  if (s === t) return 0;
  if (s.length === 0) return t.length;
  if (t.length === 0) return s.length;
  const v0 = new Array(t.length + 1);
  const v1 = new Array(t.length + 1);
  for (let i = 0; i < v0.length; i++) v0[i] = i;
  for (let i = 0; i < s.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < t.length; j++) {
      const cost = (s[i] === t[j]) ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j < v0.length; j++) v0[j] = v1[j];
  }
  return v1[t.length];
}

puppeteer.use(StealthPlugin());

export async function POST(req: NextRequest) {
  const authz = await requireAuth(req, { blockDemo: true });
  if (!authz.ok) return authz.response;
  const limited = await rateLimit(req, authz, ["forensics"]);
  if (limited) return limited;
  const tooBig = rejectLargeBody(req, LIMITS.body.small);
  if (tooBig) return tooBig;

  let browser: any = null;
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string" || url.length > LIMITS.urlLength) {
      return NextResponse.json({ success: false, error: "Valid HTTP/HTTPS URL required." }, { status: 400 });
    }

    // SSRF guard: http/https only, public addresses only (DNS resolved and checked).
    try {
      await assertSafeUrl(url);
    } catch (e) {
      if (e instanceof UnsafeUrlError) {
        return NextResponse.json({ success: false, error: e.message }, { status: 400 });
      }
      return NextResponse.json({ success: false, error: "Could not resolve the target host." }, { status: 400 });
    }

    let html = "";
    let screenshotBase64 = "";
    let securityHeaders = { hsts: false, csp: false, xFrameOptions: false, xContentTypeOptions: false };
    let forms: any[] = [];

    try {
      console.log("Launching Puppeteer for Visual Forensics on:", url);
      
      let scrapeCancelled = false;
      const scrapePromise = (async () => {
        // Chromium's sandbox stays ON by default. The Dockerfile does not install
        // Chromium (node:alpine), so the container currently uses the HTTP fallback
        // below. If you add Chromium to a container that cannot grant the sandbox its
        // user namespaces, set PUPPETEER_NO_SANDBOX=1 for that deployment only.
        const launchArgs: string[] = [];
        if (process.env.PUPPETEER_NO_SANDBOX === "1") {
          launchArgs.push("--no-sandbox", "--disable-setuid-sandbox");
        }
        browser = await puppeteer.launch({
          headless: true,
          timeout: 4000, // 4s timeout to prevent launch hangs
          args: launchArgs,
        });
        if (scrapeCancelled) {
          await browser.close().catch(() => {});
          browser = null;
          return;
        }
        const page = await browser.newPage();

        // Police every request Chromium makes (main navigation, redirects, subresources).
        let requestCount = 0;
        let receivedBytes = 0;
        await page.setRequestInterception(true);
        page.on('request', async (interceptedReq: any) => {
          try {
            const reqUrl: string = interceptedReq.url();
            if (reqUrl.startsWith('data:') || reqUrl === 'about:blank') return interceptedReq.continue();
            if (++requestCount > MAX_BROWSER_REQUESTS) return interceptedReq.abort('blockedbyclient');
            const parsed = parseSafeUrl(reqUrl);
            await assertPublicHost(parsed.hostname);
            return interceptedReq.continue();
          } catch {
            return interceptedReq.abort('blockedbyclient');
          }
        });
        page.on('response', (r: any) => {
          receivedBytes += Number(r.headers()['content-length'] || 0);
          if (receivedBytes > MAX_RESPONSE_BYTES * 5) {
            page.close().catch(() => {});
          }
        });
        
        // Set a common viewport for a realistic screenshot
        await page.setViewport({ width: 1280, height: 800 });
        
        // Increase timeout to 8s to not block API too long
        const response = await page.goto(url, { waitUntil: 'networkidle2', timeout: 8000 });
        
        if (!response) {
          throw new Error(`Failed to fetch website. No response received.`);
        }

        console.log("Puppeteer Response OK?", response.ok(), response.status());
        if (!response.ok() && response.status() >= 400 && response.status() !== 404 && response.status() !== 403) {
          throw new Error(`Failed to fetch website. HTTP Status: ${response.status}`);
        }

        // Capture the base64 screenshot
        screenshotBase64 = await page.screenshot({ encoding: 'base64', type: 'jpeg', quality: 60 }) as string;
        
        // Capture security headers
        const headers = response.headers();
        securityHeaders = {
          hsts: headers['strict-transport-security'] ? true : false,
          csp: headers['content-security-policy'] ? true : false,
          xFrameOptions: headers['x-frame-options'] ? true : false,
          xContentTypeOptions: headers['x-content-type-options'] ? true : false,
        };

        // Extract forms for phishing heuristics
        forms = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('form')).map(f => {
            const hasPassword = f.querySelector('input[type="password"]') !== null;
            return { action: f.getAttribute('action') || '', hasPassword };
          });
        });

        // Capture the fully rendered HTML (includes JS evaluated content)
        html = await page.content();
      });

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => { scrapeCancelled = true; reject(new Error("Visual Scraper timed out")); }, SCRAPE_DEADLINE_MS)
      );

      await Promise.race([scrapePromise(), timeoutPromise]);

    } catch (puppeteerError) {
      console.warn("Puppeteer failed or timed out, falling back to standard HTTP scraper:", puppeteerError);
      
      if (browser) {
        try { await browser.close(); } catch (e) {}
        browser = null;
      }

      // SSRF-safe fetch: validated lookup, max 3 redirects, 2 MB cap, 10s deadline.
      const res = await safeFetch(url, { timeoutMs: 10000 });
      
      if (!res.ok) {
        throw new Error(`Failed to fetch website. HTTP Status: ${res.status}`);
      }

      const rawHeaders = res.headers;
      securityHeaders = {
        hsts: rawHeaders.get('strict-transport-security') ? true : false,
        csp: rawHeaders.get('content-security-policy') ? true : false,
        xFrameOptions: rawHeaders.get('x-frame-options') ? true : false,
        xContentTypeOptions: rawHeaders.get('x-content-type-options') ? true : false,
      };

      html = res.text;

      // Extract basic form information via regex
      const formRegex = /<form[^>]*action=["']([^"']*)["'][^>]*>/gi;
      let match;
      while ((match = formRegex.exec(html)) !== null) {
        forms.push({ action: match[1], hasPassword: html.toLowerCase().includes('type="password"') });
      }

      // Generate a nice visual vector screenshot placeholder
      const svgPlaceholder = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
          <rect width="100%" height="100%" fill="#09090b"/>
          <circle cx="400" cy="300" r="120" fill="none" stroke="#6366f1" stroke-width="2" stroke-dasharray="10 5" opacity="0.3"/>
          <circle cx="400" cy="300" r="80" fill="none" stroke="#6366f1" stroke-width="3" opacity="0.5"/>
          <path d="M400 220 L400 380 M320 300 L480 300" stroke="#6366f1" stroke-width="2" opacity="0.5"/>
          <text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="20" fill="#a1a1aa">WEB FORENSICS ACTIVE</text>
          <text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="#6366f1">${escapeXml(url)}</text>
        </svg>
      `.trim();
      
      screenshotBase64 = Buffer.from(svgPlaceholder).toString('base64');
    }

    console.log("Rendered HTML length:", html.length);

    // Helper to extract IOCs
    const extractFromHtml = (rawHtml: string, sourcePath: string) => {
      const e = Array.from(new Set(rawHtml.match(EMAIL_REGEX) || [])).map(x => sourcePath === '/' ? x : `${x} (found on ${sourcePath})`);
      
      // Extract phones strictly (via text formatting + tel: links)
      const rawP: string[] = [];
      rawP.push(...(rawHtml.match(STRICT_PHONE_REGEX) || []));
      
      let telMatch;
      while ((telMatch = TEL_LINK_REGEX.exec(rawHtml)) !== null) {
        rawP.push(telMatch[1]);
      }
      
      const p = Array.from(new Set(rawP))
        .filter(num => num.replace(/\D/g, '').length >= 7 && num.replace(/\D/g, '').length <= 15) // Standard length check
        .map(x => sourcePath === '/' ? x : `${x} (found on ${sourcePath})`);
        
      const c = Array.from(new Set(rawHtml.match(CRYPTO_REGEX) || [])).map(x => sourcePath === '/' ? x : `${x} (found on ${sourcePath})`);
      
      const l: string[] = [];
      let match;
      while ((match = LINK_REGEX.exec(rawHtml)) !== null) {
        try {
          const absoluteUrl = new URL(match[1], url).href;
          l.push(absoluteUrl);
        } catch (err) {
          l.push(match[1]);
        }
      }
      return { e, p, c, l: Array.from(new Set(l)) };
    };

    const rootIocs = extractFromHtml(html, '/');
    let allEmails = [...rootIocs.e];
    let allPhones = [...rootIocs.p];
    let allCrypto = [...rootIocs.c];
    const uniqueLinks = rootIocs.l;

    // --- SHALLOW CRAWLING FOR SUBPAGES ---
    try {
      const rootUrlObj = new URL(url);
      const internalLinks = uniqueLinks.filter(l => {
        try { 
          // Exclude media/binary files from being crawled as HTML
          if (l.match(/\.(png|jpg|jpeg|gif|svg|ico|webp|mp4|webm|mp3|wav|pdf|zip|woff|woff2|ttf|eot)$/i)) return false;
          return new URL(l).hostname === rootUrlObj.hostname && l !== url; 
        } catch { return false; }
      });
      
      // Prioritize high-value pages
      const highValue = internalLinks.filter(l => l.toLowerCase().match(/contact|about|support|team|login/));
      const others = internalLinks.filter(l => !highValue.includes(l));
      
      // Take up to 3 high value, and fill rest up to 4 total
      const linksToCrawl = [...highValue.slice(0, 3), ...others].slice(0, 4);
      
      if (linksToCrawl.length > 0) {
        console.log("Deep scanning internal links:", linksToCrawl);
        const crawlPromises = linksToCrawl.map(async (crawlUrl) => {
          try {
            const subRes = await safeFetch(crawlUrl, { timeoutMs: 3000 });
            if (subRes.ok) {
              const subHtml = subRes.text;
              const pathName = new URL(crawlUrl).pathname;
              const subIocs = extractFromHtml(subHtml, pathName);
              allEmails.push(...subIocs.e);
              allPhones.push(...subIocs.p);
              allCrypto.push(...subIocs.c);
            }
          } catch (e) {
            // Ignore sub-page fetch failures
          }
        });
        
        await Promise.all(crawlPromises);
      }
    } catch (crawlErr) {
      console.error("Crawler error:", crawlErr);
    }
    // -------------------------------------

    // Remove duplicates from aggregated lists
    allEmails = Array.from(new Set(allEmails));
    allPhones = Array.from(new Set(allPhones));
    allCrypto = Array.from(new Set(allCrypto));

    // --- PHISHING HEURISTICS ---
    const heuristics = {
      typoSquatting: { failed: false, details: "" },
      suspiciousTld: { failed: false, details: "" },
      formHijacking: { failed: false, details: "" },
      templateLinks: { failed: false, details: "" }
    };

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const parts = hostname.split('.');
      const tld = "." + parts[parts.length - 1];
      const baseDomain = parts.length > 1 ? parts[parts.length - 2] : parts[0];

      // 1. Typo-Squatting
      for (const brand of PROTECTED_BRANDS) {
        if (baseDomain !== brand) {
          const dist = levenshtein(baseDomain, brand);
          if (dist <= 2 && dist > 0 && baseDomain.length > 3) {
            heuristics.typoSquatting.failed = true;
            heuristics.typoSquatting.details = `Domain '${baseDomain}' closely resembles protected brand '${brand}' (Distance: ${dist}).`;
            break;
          }
        }
      }

      // 2. Suspicious TLD
      if (SUSPICIOUS_TLDS.includes(tld)) {
        heuristics.suspiciousTld.failed = true;
        heuristics.suspiciousTld.details = `Uses historically high-abuse TLD: ${tld}`;
      }

      // 3. Form Hijacking
      const hijackedForms = forms.filter(f => {
        if (!f.hasPassword) return false;
        if (!f.action || f.action === '' || f.action.startsWith('#') || f.action.startsWith('/')) return false;
        try {
          const actionUrl = new URL(f.action, url);
          return actionUrl.hostname !== hostname;
        } catch(e) { return true; } // invalid cross-origin action
      });
      if (hijackedForms.length > 0) {
        heuristics.formHijacking.failed = true;
        heuristics.formHijacking.details = `Found ${hijackedForms.length} password form(s) submitting to an external domain.`;
      }

      // 4. Template Links
      const deadSocialLinks = uniqueLinks.filter(l => {
        return l.match(/facebook\.com\/?$/i) || 
               l.match(/twitter\.com\/?$/i) || 
               l.match(/instagram\.com\/?$/i) || 
               l.match(/linkedin\.com\/?$/i);
      });
      if (deadSocialLinks.length > 0) {
        heuristics.templateLinks.failed = true;
        heuristics.templateLinks.details = `Found ${deadSocialLinks.length} default template social media link(s).`;
      }
    } catch(e) { console.error("Heuristics Error:", e); }
    // ------------------------

    // --- DEEP EMAIL OSINT ---
    // Enrich emails with disposable status and breach data
    const enrichedEmails = await Promise.all(allEmails.map(async (emailString) => {
      // Extract just the email part if it has " (found on /path)"
      const justEmail = emailString.split(' ')[0];
      let isDisposable = false;
      let breachCount = 0;
      
      try {
        const dbRes = await fetch(`https://disposable.debounce.io/?email=${justEmail}`, { signal: AbortSignal.timeout(2000) });
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          if (dbData.disposable === "true") isDisposable = true;
        }
      } catch (e) { }

      try {
        const combRes = await fetch(`https://api.proxynova.com/comb?query=${justEmail}`, { signal: AbortSignal.timeout(3000) });
        if (combRes.ok) {
          const combData = await combRes.json();
          if (combData.count) breachCount = combData.count;
        }
      } catch (e) { }

      return {
        address: emailString,
        isDisposable,
        breachCount
      };
    }));
    // ------------------------

    // Combine all IOCs for the Threat Intel Backend
    const allIocs = [
      ...allEmails.map(e => e.split(' ')[0]),
      ...uniqueLinks.map(l => {
        try { return new URL(l).hostname; } catch { return l; }
      })
    ];
    const uniqueIocs = Array.from(new Set(allIocs));

    // --- DETERMINISTIC NETWORK FORENSICS (OSINT) ---
    const hostname = new URL(url).hostname;
    
    // 1. DNS Resolution
    const dnsRecords: any = { A: [], MX: [], TXT: [] };
    try {
      dnsRecords.A = await dns.resolve4(hostname).catch(() => []);
      dnsRecords.MX = (await dns.resolveMx(hostname).catch(() => [])).map(r => r.exchange);
      dnsRecords.TXT = (await dns.resolveTxt(hostname).catch(() => [])).flat();
    } catch (e) { }

    // 2. TLS/SSL Certificate
    let sslInfo: any = null;
    try {
      sslInfo = await new Promise((resolve) => {
        const socket = tls.connect({ host: hostname, port: 443, servername: hostname, rejectUnauthorized: false, lookup: safeLookup }, () => {
          const cert = socket.getPeerCertificate();
          socket.end();
          if (cert && cert.subject) {
            resolve({
              issuer: cert.issuer.O || cert.issuer.CN || 'Unknown',
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
            });
          } else {
            resolve(null);
          }
        });
        socket.on('error', () => resolve(null));
        setTimeout(() => { socket.destroy(); resolve(null); }, 3000); // 3 sec timeout
      });
    } catch (e) { }

    // 3. Domain Registration (RDAP)
    let registrationDate: string | null = null;
    try {
      // Find the root domain (basic heuristic: last two parts for .com/.net, ignoring advanced tlds for simplicity in this demo)
      const parts = hostname.split('.');
      const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : hostname;
      
      const rdapRes = await fetch(`https://rdap.org/domain/${rootDomain}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(3000)
      });
      if (rdapRes.ok) {
        const rdapData = await rdapRes.json();
        const events = rdapData.events || [];
        const regEvent = events.find((e: any) => e.eventAction === 'registration');
        if (regEvent && regEvent.eventDate) {
          registrationDate = regEvent.eventDate;
        }
      }
    } catch (e) { }

    // 4. AlienVault OTX (Reputation)
    let reputation: any = null;
    try {
      const rootDomain = hostname.split('.').length > 2 ? hostname.split('.').slice(-2).join('.') : hostname;
      const otxRes = await fetch(`https://otx.alienvault.com/api/v1/indicators/domain/${rootDomain}/general`, {
        signal: AbortSignal.timeout(3000)
      });
      if (otxRes.ok) {
        const otxData = await otxRes.json();
        
        let isWhitelisted = false;
        if (otxData.validation && Array.isArray(otxData.validation)) {
          isWhitelisted = otxData.validation.some((v: any) => v.source === 'whitelist' || v.name?.toLowerCase().includes('whitelist'));
        }

        reputation = {
          pulseCount: otxData.pulse_info?.count || 0,
          isWhitelisted
        };
      }
    } catch (e) { }
    // -----------------------------------------------

    return NextResponse.json({
      success: true,
      url,
      htmlLength: html.length,
      screenshotBase64,
      extracted: {
        emails: enrichedEmails,
        phones: allPhones,
        links: uniqueLinks,
        crypto: allCrypto
      },
      networkIntelligence: {
        dns: dnsRecords,
        ssl: sslInfo,
        securityHeaders,
        registrationDate,
        reputation
      },
      iocsForIntel: uniqueIocs,
      heuristics
    });

  } catch (error: any) {
    console.error("Website Forensics Error:", error);
    
    let errorMessage = String(error);
    if (errorMessage.includes("fetch failed") || error?.cause?.code === 'ENOTFOUND') {
      errorMessage = "Could not connect to the target website. The domain may be invalid, offline, or blocking our scanner.";
    }

    return NextResponse.json({ success: false, error: errorMessage }, { status: 200 });
  } finally {
    if (browser) {
      try { await browser.close(); } catch (e) { }
    }
  }
}
