import { execFile } from "child_process";

// RFC-1123-ish hostname: labels of letters/digits/hyphen, at least one dot, max 253 chars.
const HOSTNAME_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

export async function resolveDNS(domain: string, type: string) {
  // Use Google DNS-over-HTTPS (DoH) API
  // Record types mapping to Google DoH types:
  const types: Record<string, number> = {
    A: 1,
    AAAA: 28,
    MX: 15,
    TXT: 16
  };
  
  const recordType = types[type.toUpperCase()] || 1;
  const url = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=${recordType}`;
  
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!data.Answer) return [];
    
    return data.Answer.map((ans: any) => ans.data);
  } catch (error) {
    console.error(`DNS resolution failed for ${domain} (${type}):`, error);
    return [];
  }
}

async function gatherSubdomains(domain: string) {
  try {
    const res = await fetch(`https://api.hackertarget.com/hostsearch/?q=${encodeURIComponent(domain)}`, { cache: 'no-store' });
    const text = await res.text();
    if (text.includes("error")) return [];
    
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines.map(line => {
      const [host, ip] = line.split(',');
      return { host, ip };
    });
  } catch (err) {
    console.error(`Subdomain enumeration failed for ${domain}:`, err);
    return [];
  }
}

async function gatherGeolocation(ip: string) {
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}`, { cache: 'no-store' });
    return await res.json();
  } catch (err) {
    console.error(`Geolocation failed for ${ip}:`, err);
    return null;
  }
}

export async function gatherWhois(domain: string): Promise<string | null> {
  return new Promise((resolve) => {
    // Strip scheme, path, port and credentials; then only accept a plain hostname.
    const cleanDomain = domain.replace(/^https?:\/\//i, '').split(/[/?#]/)[0].split('@').pop()!.split(':')[0].toLowerCase();
    if (!HOSTNAME_RE.test(cleanDomain)) {
      resolve(null);
      return;
    }

    // execFile (no shell) with "--" so the hostname can never be parsed as an option or command.
    execFile('whois', ['--', cleanDomain], { timeout: 8000, maxBuffer: 256 * 1024 }, (error, stdout) => {
      if (error) {
        console.error(`WHOIS failed for ${cleanDomain}:`, error.message);
        resolve(null);
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

function parseWhois(raw: string | null) {
  if (!raw) return null;
  const parsed: any = {};
  
  const creationMatch = raw.match(/(?:Creation Date|Created on|Registration Date):\s*(.+)/i);
  const expiryMatch = raw.match(/(?:Registry Expiry Date|Expires on|Expiration Date):\s*(.+)/i);
  const registrarMatch = raw.match(/Registrar:\s*(.+)/i);
  const statusMatch = raw.match(/Domain Status:\s*(.+)/i);
  const updatedMatch = raw.match(/(?:Updated Date|Last Updated):\s*(.+)/i);
  
  if (creationMatch) parsed.creationDate = creationMatch[1].trim();
  if (expiryMatch) parsed.expiryDate = expiryMatch[1].trim();
  if (registrarMatch) parsed.registrar = registrarMatch[1].trim();
  if (updatedMatch) parsed.updatedDate = updatedMatch[1].trim();
  if (statusMatch) {
     parsed.status = statusMatch[1].trim().split(' ')[0];
  }
  
  return Object.keys(parsed).length > 0 ? parsed : null;
}

export async function gatherDnsIntelligence(domain: string) {
  const [aRecords, aaaaRecords, mxRecords, txtRecords, whoisRaw] = await Promise.all([
    resolveDNS(domain, "A"),
    resolveDNS(domain, "AAAA"),
    resolveDNS(domain, "MX"),
    resolveDNS(domain, "TXT"),
    gatherWhois(domain)
  ]);

  // Extract specific TXT records
  const spfRecord = txtRecords.find((txt: string) => txt.toLowerCase().includes("v=spf1")) || null;
  const dmarcRecord = txtRecords.find((txt: string) => txt.toLowerCase().includes("v=dmarc1")) || null;

  // New OSINT Features
  let geolocation = null;
  if (aRecords.length > 0) {
    geolocation = await gatherGeolocation(aRecords[0]);
  }

  const subdomains = await gatherSubdomains(domain);

  return {
    a_records: aRecords,
    aaaa_records: aaaaRecords,
    mx_records: mxRecords,
    txt_records: txtRecords,
    spf_record: spfRecord,
    dmarc_record: dmarcRecord,
    geolocation,
    subdomains,
    whois_raw: whoisRaw,
    whois_parsed: parseWhois(whoisRaw)
  };
}
