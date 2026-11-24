# ThreatLens

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-149eca?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-blue)

ThreatLens is an open-source **SOC and threat-intelligence workspace**: an IOC database, incident
case management, SIEM log ingestion (Wazuh and Windows agents), digital-forensics helpers, OSINT
lookups and a rule engine that turns suspicious events into cases.

It runs in two modes, chosen by your environment:

| Mode | When | What you get |
|---|---|---|
| **Demo** | No Supabase project configured | The full UI on synthetic data. No database, no sign-in, nothing is saved. |
| **Live** | Supabase values are set | Your own database, Google sign-in, invite-only access, and each integration switches on when its key is set. |

## Quick start (demo, no setup)

You need [Node.js](https://nodejs.org) 20 or newer.

```bash
git clone https://github.com/svlord5/threatlens.git
cd threatlens
npm install
npm run dev
```

Open <http://localhost:3000>, then **Open the demo dashboard**. Everything you see is fake data (RFC 5737
documentation IPs, `example.*` domains, invented people). Changes reset when you reload.

## Going live

1. Create a Supabase project and run [`supabase/schema.sql`](supabase/schema.sql).
2. Turn on Google sign-in in Supabase.
3. Copy `.env.example` to `.env` and fill in the Supabase keys and your admin email.
4. Add yourself as the first admin (one SQL statement).
5. Restart, sign in, and add API keys for the integrations you want.

The step-by-step version is in **[docs/supabase-setup.md](docs/supabase-setup.md)**.

## Documentation

| Guide | What is in it |
|---|---|
| [Getting started](docs/getting-started.md) | Demo mode, live mode, running locally, first sign-in |
| [Supabase setup](docs/supabase-setup.md) | Database, Google and Discord sign-in, URLs, first admin, realtime |
| [Configuration](docs/configuration.md) | Every environment variable, what it does and where to get it |
| [Access control](docs/access-control.md) | Invites, roles, access requests, demo account, how it is enforced |
| [Integrations](docs/integrations.md) | Gemini, VirusTotal, Shodan, OSINT keys, Discord, Turnstile, Upstash |
| [SIEM and Wazuh](docs/siem-wazuh.md) | Sending logs in, detection rules, the Windows agent, active response |
| [Usage guide](docs/usage-guide.md) | A tour of every page and how to use it |
| [Deployment](docs/deployment.md) | Vercel, Docker, other hosts, production checklist |
| [Architecture](docs/architecture.md) | How the pieces fit together and the security model |
| [Troubleshooting](docs/troubleshooting.md) | Fixes for the problems people hit most |
| [Contributing](CONTRIBUTING.md) | Dev workflow and code layout |

## Features

- **Executive overview.** Live KPI cards, a world map and 3D globe of high-risk indicators, a recent-cases
  table, SIEM volume over the last 24 hours, and a watchlist of vulnerabilities CISA reports as exploited.
- **Incident cases.** Open cases, work them through a status flow, and keep evidence, a timeline, MITRE ATT&CK
  mapping, packet and hex artifacts and notes together in one place.
- **IOC database and hunting.** Store indicators with severity, confidence and tags, and correlate them
  against ingested logs.
- **SIEM ingestion.** An authenticated API takes events from Wazuh or a Windows forwarder, stores them,
  and streams them to the dashboard in real time.
- **Rule engine.** Detection rules can drop noisy logs, open a case, flag an indicator or mark a host isolated.
- **Forensics.** Guided artifact collection, AI-assisted log parsing, email header analysis, website
  forensics (screenshot, headers, forms, DNS, TLS, registration) and an Android malware dissector.
- **OSINT engine.** Look up IPs, domains, URLs, hashes, email addresses and phone numbers across public sources.
- **Domain monitoring.** Scan domains for DNS, TLS and header weaknesses and get a scored report.
- **Invite-only access.** Google sign-in plus an invite list, with per-person roles: read-only, time-limited,
  page allow-lists, single-session and anti-copy options.
- **Safe by default.** Server-side authorization, row-level security, rate limits, request size caps and an
  SSRF guard on every server-side fetch of a user-supplied URL.

## Tech stack

Next.js 16 (App Router, Turbopack) · React 19 · TypeScript · Tailwind CSS 4 · shadcn/ui and Kibo UI ·
Supabase (Postgres, Auth, Realtime) · Recharts · d3-geo and react-globe.gl · Puppeteer · Google Gemini ·
Upstash Redis (rate limits).

## Project layout

```
src/
  app/                 pages, API routes and server actions (App Router)
    dashboard/         the signed-in application
    api/               REST endpoints (auth, SIEM ingest, forensics, avatars ...)
    auth/callback/     OAuth return point
  components/          UI (ui/ = shadcn, kibo-ui/, dashboard/ = feature components)
  lib/                 auth, authorization, rate limiting, SSRF guard, scanners, demo data
  utils/supabase/      browser, server and proxy Supabase helpers
supabase/schema.sql    database tables, row-level security and realtime
scripts/               Windows SIEM agent, demo-data seeder
docs/                  the guides listed above
```

## Security

Read [SECURITY.md](SECURITY.md) before deploying publicly, and the checklist in
[docs/deployment.md](docs/deployment.md). Never commit a `.env` file.

## License

Released under the MIT License. See [LICENSE](LICENSE).

Built by [Suraj Vishwanath](https://surajv5.in).
