# Integrations

Every integration is **optional**. Each one switches on when its environment variable is set and stays off
otherwise, so you can start with none and add them one at a time. All variables are listed in
[configuration](configuration.md); this page explains what each does and how to get it.

In [demo mode](getting-started.md#demo-mode) every outbound integration is disabled by design.

## At a glance

| Integration | Needs | Unlocks | Cost |
|---|---|---|---|
| Google sign-in | Supabase + Google OAuth client | Sign-in, verified identity for access requests | Free |
| Cloudflare Turnstile | Site and secret key | Captcha on the access-request form | Free |
| Upstash Redis | REST URL and token | Rate limits that work on serverless | Free tier |
| Google Gemini | `GEMINI_API_KEY` | AI log parsing, malware verdicts, AI summaries | Free tier |
| VirusTotal | `VIRUSTOTAL_API_KEY` | File, URL, domain, IP reputation | Free tier |
| Shodan | `SHODAN_API_KEY` | Host and port intelligence for IPs | Paid / membership |
| OSINT keys | OTX, HIBP, Abstract, Numverify, Truecaller, NPCI | Extra lookups in the OSINT engine | Varies |
| Discord | Webhook and/or bot token | Notifications and admin lookups | Free |
| Wazuh | Manager API + agent key | Alerts in, host isolation out | Free (self-hosted) |
| CISA KEV | nothing | Exploited-vulnerability watchlist on the dashboard | Free, automatic |

## Cloudflare Turnstile

Protects the public access-request form from bots.

1. In <https://dash.cloudflare.com> open **Turnstile** and **Add widget**.
2. Add your domain (and `localhost` for local testing). Mode **Managed**.
3. Copy the **site key** to `NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY` and the **secret key** to
   `CLOUDFLARE_SECRET_TURNSTILE_KEY`.

The secret is **required in production**: without it the form refuses to accept requests. The check is
enforced on the server; a missing or invalid token is rejected.

## Upstash Redis (rate limits)

ThreatLens limits requests per IP, per user and per day (see [configuration](configuration.md#rate-limiting)).
On a normal server it can count in memory. On Vercel or any serverless host each request may hit a different
instance, so you need a shared store.

1. Create a free Redis database at <https://upstash.com> (the REST API is enabled by default).
2. Copy **REST URL** and **REST Token** to `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

If the store is unreachable the app **refuses** requests (503) rather than running without limits. Set
`RATE_LIMIT_FAIL_OPEN=true` to allow them instead.

## Google Gemini

Used for: parsing pasted logs into structured findings, the Android malware verdict and YARA suggestion,
extracting packet and hex artifacts from a raw log in a case, and the AI summaries in domain scans. The app
calls the `gemini-2.5-flash` model.

1. Create a key at <https://aistudio.google.com/apikey>.
2. Set `GEMINI_API_KEY`.

Per-user limits apply (6 per minute, 60 per day by default, 300 per day across everyone).
Without a key, AI features say so and the rest of each page still works; the malware page falls back to a
heuristic verdict instead of an AI one.

## VirusTotal

Used by the OSINT engine, the VirusTotal lookup route, and email forensics enrichment. Hash lookups accept
MD5, SHA-1 or SHA-256 only.

1. Create a free account at <https://www.virustotal.com> and copy your API key.
2. Set `VIRUSTOTAL_API_KEY`.

The default limits (4 per minute per person, 400 per day overall) stay under the free tier.

## Shodan

Adds open-port and service information for IP addresses in the OSINT engine and email forensics.

1. Get a key from <https://account.shodan.io>.
2. Set `SHODAN_API_KEY`.

## Other OSINT sources

| Variable | Source | Used for |
|---|---|---|
| `OTX_API_KEY` | AlienVault OTX | Reputation for hashes and domains |
| `HIBP_API_KEY` | Have I Been Pwned | Which breaches an email address appears in |
| `ABSTRACT_API_KEY` | Abstract API | IP geolocation and phone details |
| `NUMVERIFY_API_KEY` | Numverify | Phone number validation |
| `TRUECALLER_API_KEY` | Truecaller Business | Caller identification (enterprise API) |
| `NPCI_API_KEY` | NPCI | UPI address lookups |

Each person can also store **their own** keys in **Account, Integrations**. Those are kept only in that
browser's local storage, sent to the server only when that person runs a scan, and take priority over the
server's keys for their scans. Clear them on shared computers.

Free public sources need no key: DNS-over-HTTPS, Wayback Machine, certificate and WHOIS data, and RDAP.

## Discord

Two optional uses, neither for sign-in:

- **`DISCORD_WEBHOOK`**: post security events (denied access, session problems) and new access requests to
  a channel. Create it in Discord under **Channel settings, Integrations, Webhooks**. Treat the URL like a
  password. **Keep it in the environment, never in a playbook or in git.**
- **`DISCORD_BOT_TOKEN`**: lets admins see a person's Discord name and avatar when whitelisting them.
  Create a bot at <https://discord.com/developers/applications>. It needs no special permissions.
  Optionally set `ACCESS_NOTIFY_DISCORD_ID` to ping yourself on new access requests.

## Wazuh and Windows agents

Covered in its own guide: **[SIEM and Wazuh](siem-wazuh.md)**.

## CISA Known Exploited Vulnerabilities

The "Exploited vulnerability watchlist" on the dashboard shows the newest entries in
[CISA's KEV catalog](https://www.cisa.gov/known-exploited-vulnerabilities-catalog), each linking to its
NVD page. It needs no key. The server downloads the catalog (about 2 MB) at most every six hours. If CISA
cannot be reached, the card is simply not shown.

## Adding your own integration

New outbound calls should follow the existing rules, which keep the app safe:

- Never fetch a URL a user typed with plain `fetch`; use `safeFetch` from `src/lib/safe-fetch.ts`.
- Put a cost limit on it with `rateLimit` (routes) or `guardAction` (server actions).
- Require sign-in with `requireAuth` and decide whether demo users should be blocked (`blockDemo`).
- Add the new variable to `.env.example` and to [configuration](configuration.md).
