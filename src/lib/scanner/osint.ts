export async function gatherWaybackArchives(domain: string) {
  // Strip paths and protocols to ensure we query exactly the host
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
  const url = `https://web.archive.org/cdx/search/cdx?url=*.${cleanDomain}/*&output=json&collapse=urlkey&limit=50`;

  const archiveUrls: string[] = [];

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ThreatLens-Scanner/1.0' },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 1) {
        for (let i = 1; i < data.length; i++) {
          const originalUrl = data[i][2];
          if (originalUrl) {
            archiveUrls.push(originalUrl);
          }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("[Timeout] Wayback API timed out for %s", cleanDomain);
    } else {
      console.error("Wayback API failed for %s:", cleanDomain, error.message || error);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  return archiveUrls;
}

export async function gatherSubdomains(domain: string) {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
  const url = `https://crt.sh/?q=%.${cleanDomain}&output=json`;
  
  const subdomains = new Set<string>();

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ThreatLens-Scanner/1.0' },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        for (const entry of data) {
          if (entry.name_value) {
            const names = entry.name_value.split('\n');
            for (const name of names) {
              const cleanName = name.trim().toLowerCase();
              if (!cleanName.startsWith('*.')) {
                subdomains.add(cleanName);
              }
            }
          }
        }
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("[Timeout] Subdomain API (crt.sh) timed out for %s", cleanDomain);
    } else {
      console.error("Subdomain API failed for %s:", cleanDomain, error.message || error);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }

  return Array.from(subdomains).sort();
}

export async function gatherIpIntelligence(ip: string, apiKeys?: any) {
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ThreatLens-Scanner/1.0' },
      cache: 'no-store'
    });
    
    let abstractSecurity = null;
    if (apiKeys?.abstractKey) {
       try {
          const abRes = await fetch(`https://ipgeolocation.abstractapi.com/v1/?api_key=${apiKeys.abstractKey}&ip_address=${ip}`, { cache: 'no-store' });
          if (abRes.ok) {
            const abData = await abRes.json();
            if (abData.security) {
              abstractSecurity = abData.security;
            }
          }
       } catch (e) {
          console.error("Abstract API IP Geolocation failed", e);
       }
    }
    
    if (res.ok) {
      const data = await res.json();
      if (!data.error) {
        return {
          ip: data.ip,
          network: data.network,
          version: data.version,
          city: data.city,
          region: data.region,
          postal: data.postal,
          country: data.country_name,
          timezone: data.timezone,
          asn: data.asn,
          org: data.org,
          latitude: data.latitude,
          longitude: data.longitude,
          security: abstractSecurity
        };
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("[Timeout] IP Intelligence API timed out for %s", ip);
    } else {
      console.error("IP Intelligence failed for %s:", ip, error.message || error);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return null;
}

export function generateDorks(indicator: string, type: 'email' | 'hash' | 'domain' | 'ip' | 'url' | 'mobile' | 'upi') {
  const dorks = [];
  const pivots = [];

  if (type === 'hash') {
    pivots.push({ name: 'VirusTotal', url: `https://www.virustotal.com/gui/search/${indicator}` });
    pivots.push({ name: 'AlienVault OTX', url: `https://otx.alienvault.com/browse/global/pulses?q=${indicator}` });
    pivots.push({ name: 'Hybrid Analysis', url: `https://www.hybrid-analysis.com/search?query=${indicator}` });
    
    dorks.push({ name: 'Google Search', url: `https://www.google.com/search?q="${indicator}"` });
    dorks.push({ name: 'Pastebin Dork', url: `https://www.google.com/search?q=site:pastebin.com "${indicator}"` });
  } 
  else if (type === 'email') {
    pivots.push({ name: 'HaveIBeenPwned (Google Search)', url: `https://www.google.com/search?q=site:haveibeenpwned.com "${indicator}"` });
    pivots.push({ name: 'Hunter.io', url: `https://hunter.io/search/${indicator.split('@')[1]}` });
    
    dorks.push({ name: 'Google Exact Match', url: `https://www.google.com/search?q="${indicator}"` });
    dorks.push({ name: 'Find associated PDFs', url: `https://www.google.com/search?q="${indicator}" filetype:pdf` });
    dorks.push({ name: 'Find associated Excel/CSV', url: `https://www.google.com/search?q="${indicator}" (filetype:xls OR filetype:csv)` });
  }
  else if (type === 'ip') {
    pivots.push({ name: 'VirusTotal', url: `https://www.virustotal.com/gui/ip-address/${indicator}` });
    pivots.push({ name: 'Shodan Search', url: `https://www.shodan.io/search?query=${indicator}` });
    pivots.push({ name: 'Censys', url: `https://search.censys.io/hosts/${indicator}` });
    
    dorks.push({ name: 'Google Exact Match', url: `https://www.google.com/search?q="${indicator}"` });
  }

  return { dorks, pivots };
}

export async function queryVirusTotal(indicator: string, type: 'ip' | 'hash' | 'domain' | 'url') {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return { error: "VIRUSTOTAL_API_KEY not configured." };

  let endpoint = '';
  if (type === 'ip') endpoint = `ip_addresses/${encodeURIComponent(indicator)}`;
  else if (type === 'domain') endpoint = `domains/${encodeURIComponent(indicator)}`;
  else if (type === 'hash') endpoint = `files/${encodeURIComponent(indicator)}`;
  else return null;

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://www.virustotal.com/api/v3/${endpoint}`, {
      signal: controller.signal,
      headers: { 'x-apikey': apiKey },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      const stats = data.data?.attributes?.last_analysis_stats;
      if (stats) {
        return {
          malicious: stats.malicious || 0,
          suspicious: stats.suspicious || 0,
          harmless: stats.harmless || 0,
          undetected: stats.undetected || 0,
          total: (stats.malicious || 0) + (stats.suspicious || 0) + (stats.harmless || 0) + (stats.undetected || 0)
        };
      }
    } else if (res.status === 404) {
       return { error: "Not found in VirusTotal database." };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("[Timeout] VirusTotal API timed out for %s", indicator);
    } else {
      console.error("VT API failed for %s:", indicator, error.message || error);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return { error: "Failed to retrieve VirusTotal data." };
}

export async function queryShodan(ip: string) {
  const apiKey = process.env.SHODAN_API_KEY;
  if (!apiKey) return { error: "SHODAN_API_KEY not configured." };

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://api.shodan.io/shodan/host/${ip}?key=${apiKey}`, {
      signal: controller.signal,
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      return {
        ports: data.ports || [],
        vulns: data.vulns || [],
        os: data.os || 'Unknown',
        hostnames: data.hostnames || []
      };
    } else if (res.status === 404) {
       return { error: "No open ports found on Shodan." };
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn("[Timeout] Shodan API timed out for %s", ip);
    } else {
      console.error("Shodan API failed for %s:", ip, error.message || error);
    }
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return { error: "Failed to retrieve Shodan data." };
}

export async function queryHaveIBeenPwned(email: string, apiKey?: string) {
  if (!apiKey) return { error: "Integration Pending: HaveIBeenPwned API key is missing." };

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`, {
      signal: controller.signal,
      headers: { 
        'hibp-api-key': apiKey,
        'user-agent': 'ThreatLens-Scanner/1.0'
      },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      return { breaches: data };
    } else if (res.status === 404) {
      return { breaches: [] }; // No breaches found
    } else if (res.status === 401) {
      return { error: "Invalid HaveIBeenPwned API key." };
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') console.error("HIBP API failed for %s:", email, error.message);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return { error: "Failed to retrieve HaveIBeenPwned data." };
}

export async function querySslCertificate(domain: string) {
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0];
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://networkcalc.com/api/security/certificate/${encodeURIComponent(cleanDomain)}`, {
      signal: controller.signal,
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      if (data.status === 'OK' && data.certificate) {
        return {
          issuer: data.certificate.issuer,
          valid_from: data.certificate.valid_from,
          valid_to: data.certificate.valid_to,
          subject: data.certificate.subject,
          expired: new Date(data.certificate.valid_to) < new Date()
        };
      }
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') console.error("SSL API failed for %s:", cleanDomain, error.message);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return { error: "Failed to retrieve SSL/TLS Certificate data." };
}

export async function queryAlienVault(indicator: string, type: 'hash' | 'ip' | 'domain', apiKey?: string) {
  if (!apiKey) return { error: "Integration Pending: AlienVault OTX API key is missing." };

  let endpointType = '';
  if (type === 'hash') endpointType = 'file';
  else if (type === 'ip') endpointType = 'IPv4';
  else if (type === 'domain') endpointType = 'domain';

  let timeoutId: NodeJS.Timeout | undefined;
  try {
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(`https://otx.alienvault.com/api/v1/indicators/${endpointType}/${encodeURIComponent(indicator)}/general`, {
      signal: controller.signal,
      headers: { 'X-OTX-API-KEY': apiKey },
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      return {
        pulse_info: data.pulse_info,
        reputation: data.reputation
      };
    } else if (res.status === 404) {
      return { error: "Indicator not found in AlienVault OTX." };
    } else if (res.status === 403) {
      return { error: "Invalid AlienVault OTX API key." };
    }
  } catch (error: any) {
    if (error.name !== 'AbortError') console.error("OTX API failed for %s:", indicator, error.message);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
  return { error: "Failed to retrieve AlienVault OTX data." };
}
