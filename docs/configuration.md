# Configuration

All configuration is through environment variables. Copy `.env.example` to `.env` for local use, or set the
same names in your host (Vercel, Docker and so on). **Never commit `.env`.**

Two rules to remember:

- Variables that start with `NEXT_PUBLIC_` are copied into the **browser bundle at build time**. They are
  public by design. Restart `npm run dev` or rebuild after changing one.
- Everything else is **server-only** and read at runtime. Keep it secret.

Legend: **Required** means the feature does not work without it in live mode. A blank value is fine for
anything marked optional; that feature just stays off.

## Core (Supabase)

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Live | Your project URL, `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Live | Publishable key (`sb_publishable_...`). Public. |
| `SUPABASE_SECRET_KEY` | Live | Secret key (`sb_secret_...`). **Server only.** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Legacy `anon` JWT, only if you have not moved to the new keys |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Legacy `service_role` JWT, same caveat |
| `NEXT_PUBLIC_APP_URL` | Recommended | Public address of the app. Used for sign-in redirects in production and shown as the Wazuh webhook URL. Example `https://threatlens.example.com` |
| `NEXT_PUBLIC_DEMO_MODE` | Optional | `true` forces [demo mode](getting-started.md#demo-mode) even when Supabase is configured |

Without both Supabase URL and a publishable key the app runs in demo mode.

## Access and admins

| Variable | Required | What it is |
|---|---|---|
| `SUPER_ADMIN_EMAIL` | Recommended | Email of the owner. Must be a **confirmed** email on the Google account. Treated as an admin. |
| `SUPER_ADMIN_DISCORD_ID` | Optional | Discord user ID of the owner (server-only). Alternative to the email. |
| `ACCESS_PREFILL_SECRET` | Optional | Secret used to sign the short-lived cookie that carries a verified name/email from Google to the access form. If unset it is derived from `SUPABASE_SECRET_KEY`. Set it explicitly (any long random string) if you rotate Supabase keys. |
| `DEMO_ACCOUNT_EMAIL` | Optional | Makes one account on a live deployment **read-only** (a showcase account) |
| `LEGAL_BASE_URL` | Optional | Where `/terms`, `/privacy`, `/cookies`, `/disclaimer`, `/security`, `/report`, `/contact` and `/legal` redirect. Default `https://surajv5.in`. Set it to your own site. |

> Admins also come from the database: any invite with `super_admin = true`. See
> [access control](access-control.md). Remember to add your own row too
> ([first admin](supabase-setup.md#8-create-the-first-admin)).

## Access-request form (Cloudflare Turnstile)

The public "request access" form is protected by a captcha.

| Variable | Required | What it is |
|---|---|---|
| `NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY` | Live | Turnstile **site key** (public). Shown in the form. |
| `CLOUDFLARE_SITE_TURNSTILE_KEY` | Optional | Server-side fallback for the site key, served by `/api/turnstile-key` |
| `CLOUDFLARE_SECRET_TURNSTILE_KEY` | **Production** | Turnstile **secret key**. In production the form refuses submissions without it. |
| `ACCESS_NOTIFY_DISCORD_ID` | Optional | Discord user ID pinged when someone requests access (needs `DISCORD_WEBHOOK`) |

Get both keys free at <https://dash.cloudflare.com>, Turnstile, Add widget. Add `localhost` as an allowed
hostname for local testing.

## SIEM and Wazuh

| Variable | Required | What it is |
|---|---|---|
| `SIEM_AGENT_API_KEY` | For ingest | Shared secret for `/api/siem/ingest` and `/api/integrations/wazuh`. Create with `openssl rand -hex 32`. If unset, those routes answer **500** and log a warning; there is **no default key**. |
| `WAZUH_API_URL` | Optional | Wazuh manager API, default `https://127.0.0.1:55000`. Used for host isolation and forensic actions. |
| `WAZUH_API_USER` | Optional | Wazuh API user |
| `WAZUH_API_PASSWORD` | Optional | Wazuh API password |
| `WAZUH_CA_CERT` | Optional | PEM contents of the manager's CA, so its certificate is verified |
| `WAZUH_TLS_INSECURE` | Optional | `true` skips certificate verification for **local labs only** |

Details in [SIEM and Wazuh](siem-wazuh.md).

## AI and threat-intelligence APIs

All optional. Each feature turns on when its key exists.

| Variable | Powers |
|---|---|
| `GEMINI_API_KEY` | AI log parsing, the Android malware verdict, AI case telemetry, domain-scan summaries |
| `VIRUSTOTAL_API_KEY` | File, URL, domain and IP reputation (OSINT engine, forensics, the VirusTotal lookup route) |
| `SHODAN_API_KEY` | Host and open-port lookups for IP addresses |
| `OTX_API_KEY` | AlienVault OTX reputation |
| `HIBP_API_KEY` | Have I Been Pwned breach lookups |
| `ABSTRACT_API_KEY`, `NUMVERIFY_API_KEY` | Phone and IP intelligence |
| `TRUECALLER_API_KEY`, `NPCI_API_KEY` | Caller and UPI lookups (India focused) |

People can also paste their **own** OSINT keys under **Account, Integrations**. Those stay in that person's
browser and are used for their scans instead of the server's. See [integrations](integrations.md).

## Discord

| Variable | What it does |
|---|---|
| `DISCORD_WEBHOOK` | Incoming-webhook URL for security events and new access requests |
| `DISCORD_BOT_TOKEN` | Lets admins look up a Discord user (name, avatar) when whitelisting someone |

Neither is used for sign-in.

## Rate limiting

| Variable | What it does |
|---|---|
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Shared store for limits. **Required on Vercel or any serverless host**, otherwise limits are per-instance and effectively not enforced. |
| `RATE_LIMIT_FAIL_OPEN` | `true` lets requests through if the store is unreachable. Default is to refuse (503). |

Defaults (all tunable; `0` means unlimited):

| Limit | Variable | Default |
|---|---|---|
| Any API route, per IP per minute | `RATE_LIMIT_API` | 60 |
| Agent routes (SIEM ingest, Wazuh), per IP per minute | `RATE_LIMIT_INGEST` | 120 |
| Access requests, per IP per hour | `RATE_LIMIT_ACCESS_REQUEST` | 3 |
| Access-status lookups, per IP per minute | `RATE_LIMIT_ACCESS_LOOKUP` | 15 |
| Access requests, per email per day | `RATE_LIMIT_ACCESS_EMAIL` | 1 |

Costly services use `RATE_LIMIT_<GROUP>_...` where `<GROUP>` is `FORENSICS`, `VIRUSTOTAL`, `SHODAN` or
`GEMINI`:

| Variable suffix | Forensics | VirusTotal | Shodan | Gemini |
|---|---|---|---|---|
| `_USER_PER_MIN` | 10 | 4 | 4 | 6 |
| `_IP_PER_MIN` | 20 | 8 | 8 | 12 |
| `_USER_PER_DAY` | 200 | 100 | 40 | 60 |
| `_DAILY_CAP` (all users) | 2000 | 400 | 150 | 300 |

The VirusTotal defaults stay under the free tier (4 per minute, 500 per day).

Request body size caps and input limits are fixed in `src/lib/limits.ts`.

## Website scanner

| Variable | What it does |
|---|---|
| `PUPPETEER_NO_SANDBOX` | Set to `1` **only** if your container cannot give Chromium its sandbox. Off by default. |

## Build and tooling

| Variable | What it does |
|---|---|
| `BUILD_STANDALONE` | `true` produces a self-contained server build (the Dockerfile sets it) |
| `NEXT_DIST_DIR` | Use a different build folder, handy for running a second dev server |
| `DEMO_SEED_CONFIRM` | `yes` allows `scripts/seed-demo.ts` to run |
| `POSTGRES_PASSWORD` | Not used by the app |

## A minimal live `.env`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPER_ADMIN_EMAIL=you@example.com
NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY=0x4AAAA...
CLOUDFLARE_SECRET_TURNSTILE_KEY=0x4AAAA...
SIEM_AGENT_API_KEY=paste-the-output-of-openssl-rand-hex-32
GEMINI_API_KEY=...
```
