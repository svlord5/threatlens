import { safeFetch, parseSafeUrl, UnsafeUrlError } from "@/lib/safe-fetch";

// The scanned domain is user input: only a bare hostname may become part of the URL.
const HOST_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;
const cleanHost = (domain: string) => {
  const h = domain.trim().replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
  return HOST_RE.test(h) ? h.toLowerCase() : null;
};

export async function checkExposedFiles(rawDomain: string) {
  const domain = cleanHost(rawDomain);
  if (!domain) return [];
  const targetUrl = `https://${domain}`;
  const filesToCheck = [
    { path: '/.env', signature: 'APP_' },
    { path: '/.git/config', signature: '[core]' },
    { path: '/robots.txt', signature: 'User-agent' },
    { path: '/sitemap.xml', signature: '<urlset' },
  ];

  const exposed: string[] = [];

  await Promise.all(filesToCheck.map(async (file) => {
    try {
      // SSRF-safe: validated DNS, <=3 redirects, small body cap, hard deadline.
      const res = await safeFetch(`${targetUrl}${file.path}`, {
        timeoutMs: 3000,
        maxBytes: 128 * 1024,
        userAgent: 'ThreatLens-Scanner/1.0',
      });

      if (res.status === 200) {
        const text = res.text;
        if (text.toLowerCase().includes(file.signature.toLowerCase())) {
          exposed.push(file.path);
        }
      }
    } catch (e) {
      // Ignore fetch errors for dead endpoints
    }
  }));

  return exposed;
}

export async function gatherHttpIntelligence(rawDomain: string) {
  const domain = cleanHost(rawDomain) ?? "";
  const targetUrl = `https://${domain}`;
  
  const result = {
    is_up: false,
    status_code: 0,
    headers: {} as Record<string, string>,
    technologies: [] as string[],
    tls_enforced: false,
    exposed_files: [] as string[],
  };

  try {
    if (!domain) throw new UnsafeUrlError("Invalid domain.");
    parseSafeUrl(targetUrl);

    // SSRF-safe: validated DNS on every hop, <=3 redirects, 2 MB cap, 10s deadline.
    const res = await safeFetch(targetUrl, { timeoutMs: 10000, userAgent: 'ThreatLens-Scanner/1.0' });

    result.is_up = true;
    result.status_code = res.status;
    result.tls_enforced = res.finalUrl.startsWith('https://');

    // Extract headers
    res.headers.forEach((value, key) => {
      result.headers[key.toLowerCase()] = value;
    });

    // Tech detection (Basic signatures based on headers)
    const headersStr = JSON.stringify(result.headers).toLowerCase();
    
    if (headersStr.includes('x-nextjs-page') || headersStr.includes('__next')) result.technologies.push('Next.js');
    if (headersStr.includes('x-vercel-id') || headersStr.includes('vercel')) result.technologies.push('Vercel');
    if (headersStr.includes('cf-ray') || result.headers['server']?.includes('cloudflare')) result.technologies.push('Cloudflare');
    if (result.headers['x-powered-by']?.toLowerCase().includes('php')) result.technologies.push('PHP');
    if (result.headers['server']?.toLowerCase().includes('nginx')) result.technologies.push('Nginx');
    if (result.headers['server']?.toLowerCase().includes('apache')) result.technologies.push('Apache');

    // Advanced HTML Tech Fingerprinting
    let htmlBody = "";
    if (res.status === 200) {
      htmlBody = res.text;
    }
    
    const htmlLower = htmlBody.toLowerCase();
    if (htmlLower.includes('wp-content/') || htmlLower.includes('wp-includes/')) result.technologies.push('WordPress');
    if (htmlLower.includes('id="__next"')) result.technologies.push('Next.js');
    if (htmlLower.includes('data-reactroot') || htmlLower.includes('react')) result.technologies.push('React');
    if (htmlLower.includes('data-v-')) result.technologies.push('Vue.js');
    if (htmlLower.includes('nuxt')) result.technologies.push('Nuxt.js');
    if (htmlLower.includes('ng-version') || htmlLower.includes('ng-app')) result.technologies.push('Angular');
    if (htmlLower.includes('svelte')) result.technologies.push('Svelte');
    if (htmlLower.includes('tailwindcss') || (htmlLower.includes('flex') && htmlLower.includes('text-'))) result.technologies.push('Tailwind CSS');
    if (htmlLower.includes('cdn.shopify.com')) result.technologies.push('Shopify');
    if (htmlLower.includes('ghost-blog')) result.technologies.push('Ghost CMS');
    if (htmlLower.includes('google-analytics.com') || htmlLower.includes('gtag')) result.technologies.push('Google Analytics');

    // Deduplicate technologies array
    result.technologies = Array.from(new Set(result.technologies));

    // Gather exposed files in parallel
    result.exposed_files = await checkExposedFiles(domain);

  } catch (error) {
    console.error("HTTP check failed for %s:", domain, error);
  }

  return result;
}
