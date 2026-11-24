# Usage guide

A tour of every page, in the order of the sidebar. Try each one in [demo mode](getting-started.md#demo-mode)
first; it needs no setup. Items marked **needs a key** work once the matching integration is configured (see
[integrations](integrations.md)).

> In demo mode, anything that would contact the outside world or change real state is disabled, and edits are
> not saved.

## Executive Summary (`/dashboard`)

Your at-a-glance picture of the SOC.

- **KPI cards**: indicators tracked, high-risk indicators (risk 80 and above), active cases (Open or
  Investigating) and healthy threat feeds. The counts update live.
- **Global threat map**: a real world map with arcs from your highest-risk indicators to the protected
  network, or switch to **Globe** for a 3D earth you can drag and zoom. Placement is **illustrative**: the app
  does not look up where an IP really is, so each indicator is placed on a city by a fixed rule.
- **Recent cases**: the newest incidents with severity and status. Click one to open it.
- **SIEM events, last 24 hours**: hourly volume from your ingested logs, with warnings and errors split out.
- **Indicator reputation**: how many indicators are malicious, suspicious or unknown.
- **Network topology**: a sample diagram in demo mode. In live mode it shows "No data available" because no
  asset inventory feeds it.
- **Exploited vulnerability watchlist**: the newest entries from CISA's Known Exploited Vulnerabilities
  catalog, each linking to NVD.

## Active Cases (`/dashboard/cases`)

Where incidents are worked.

- **List**: search and filter, **Export CSV**, and **New Case** (title, severity, status, description).
  Cases opened automatically by SIEM rules or Wazuh appear here too.
- **Open a case** to reach the workspace. Tabs:
  - **Briefing**: the description (editable, supports Markdown) and key facts.
  - **IOCs**: indicators linked to the case.
  - **Network analysis**: packet records (time, source, destination, protocol, info) with malicious ones
    flagged.
  - **Memory forensics**: hex and ASCII artifact views.
  - **Threat mapping**: MITRE ATT&CK tactics and techniques you attach.
  - **Timeline**: dated investigation events.
  - **Documents**, **Evidence vault**, **Raw telemetry**: notes, evidence records (hash, description) and the
    original log.
  - **AI autopilot**: AI help on the case.
- **Actions**: change the status (Open, Investigating, Contained, Closed), **Assign to me**, **Isolate Host**
  and **Digital Forensics** (both go through Wazuh, see [SIEM and Wazuh](siem-wazuh.md#5-active-response-isolate-and-collect)),
  and **delete**. A **mock data** button uses Gemini to extract packet and hex artifacts from a raw log
  (**needs a key**).

## Threat Feeds (`/dashboard/feeds`)

A register of your intelligence and telemetry sources: name, endpoint, polling interval, status and health.
You can add, enable or disable, edit and delete feeds.

> **Important.** In this version the feed list is a registry and status board. **Force sync is a
> simulation**: it updates the "last sync" time and adds a random number to each feed's indicator count. It
> does not download indicators from the internet. Real data enters through the SIEM endpoints, the IOC
> database and the OSINT engine.

## IOC Database (`/dashboard/iocs`)

Your indicators of compromise.

- **Add IOC** (stored in the `iocs` table; the dashboard's "Indicators tracked" counter reads a separate `ioc` table, see [architecture](architecture.md#data-model)): value, type (IP, domain, URL, hash, email...), severity, confidence (0 to 100), optional
  expiration and comma-separated tags. Duplicate values are rejected.
- Search and sort the table, edit or remove entries.
- **Hunting engine** (`/dashboard/iocs/hunting`): correlates your non-expired indicators against your most
  recent **5,000** ingested log lines (message, provider and machine name) and lists the matches.

## ThreatLens Search (`/dashboard/threatlens`)

Domain intelligence and attack-surface monitoring, in four tabs:

- **Domains**: monitored domains with their latest score, as a list or a graph. **New Scan** runs a full
  scan: DNS records, HTTP details and technology fingerprinting, exposed files, TLS, security headers, a
  posture score, and AI summaries (**needs a key** for the summaries). Open a result for the report, which
  can be printed or exported.
- **Actors**, **Campaigns**, **Malware**: reference tables you maintain.

Scans fetch the target safely: only public addresses are allowed, redirects are limited and responses are
size-capped.

## OSINT Engine (`/dashboard/osint`)

Type or paste an indicator and the engine works out what it is and runs the matching lookups.

| You enter | It recognises | Lookups (when keys are present) |
|---|---|---|
| `203.0.113.5` | IP address | geolocation, VirusTotal, Shodan |
| `example.com` | Domain | DNS, WHOIS, certificate, subdomains, Wayback archives, VirusTotal, OTX |
| `https://example.com/x` | URL | VirusTotal and the domain lookups |
| 32, 40 or 64 hex characters | File hash | VirusTotal, OTX |
| `name@example.com` | Email | Have I Been Pwned, domain checks |
| An Indian mobile number | Phone | phone intelligence |
| `name@bank` | UPI address | UPI lookup |

It also builds ready-made search "dorks" and pivot links. Free sources need no key; richer results need the
keys in [integrations](integrations.md). WHOIS uses the `whois` command on the server.

## Forensics Library (`/dashboard/forensics`)

Guided artifact collection for investigators: pick an operating system (Windows, Linux, macOS), choose an
artifact, and get the exact command to run. Paste the output into the **analyze** page for AI-assisted
parsing into findings and indicators (**needs a key**).

## App Malware Hunter (`/dashboard/forensics/app`)

An Android malware dissector. Open the built-in sample dossier, or **upload an APK or binary (up to 20 MB)**.
It reports hashes, entropy, ZIP anomalies, requested permissions, signing details, extracted endpoints and
tokens, MITRE ATT&CK mapping and a YARA rule. An AI verdict is added when Gemini is configured; otherwise
you get a heuristic result and a clear note. Uploads are disabled in demo mode.

## SIEM and Endpoints (`/dashboard/siem`)

The live log stream from your agents: filter by level, watch events arrive in real time, see volume and
severity charts and top talkers, and export or reset the log table. Feed it with
[SIEM and Wazuh](siem-wazuh.md).

## Log Hunter (`/dashboard/forensics/logs`)

Paste a list of indicators (up to 50) and search them across the **bundled sample log database**
(`src/lib/mock_logs.json`) to practise hunting. It does not search your live logs; use the hunting engine on
the IOC page for that.

## Email Forensics (`/dashboard/forensics/email`)

Paste or upload an email (`.eml` or raw headers). The page parses the headers in your browser and shows the
delivery path, sender authentication (SPF, DKIM, DMARC), links, addresses, attachments and indicators. An
optional enrichment step checks indicators against VirusTotal and Shodan and summarizes with Gemini
(**needs keys**). Try it with the included `public/sample.eml`.

## Website Forensics (`/dashboard/forensics/website`)

Scan a suspicious URL without visiting it yourself. You get a screenshot, security headers, forms (and
whether a password field is present), DNS records, TLS certificate, domain registration date, emails, phone
numbers and crypto addresses found on the site, outbound links, and phishing heuristics (look-alike brand
names, risky TLDs). Only http and https URLs to **public** hosts are allowed; anything pointing at private or
internal addresses is refused.

## Integrations Hub (`/dashboard/integrations`)

A reference page for connecting data sources: log ingestion and alerts (including the Wazuh webhook URL to
copy), threat-intelligence keys and OSINT reconnaissance.

## Automation Rules (`/dashboard/automation`)

Detection rules that run on incoming Windows-forwarder events: choose a target field, a "contains" pattern
and an action (drop the log, open a case, flag an indicator, mark a host isolated), then enable or disable
each rule. Details and an example are in [SIEM and Wazuh](siem-wazuh.md#4-detection-rules-inside-threatlens).

## Playbook Library and Builder (`/dashboard/automation/playbooks`)

Design response workflows on a canvas: drag trigger, condition and action nodes, connect them, name and save.
The library lists saved playbooks. In this version playbooks are **saved definitions** for planning and
documentation; the automatic actions on incoming events come from Automation Rules.

## API Security (`/dashboard/api-security`)

A findings tracker for API testing: log an endpoint, the vulnerability type (for example broken object-level
authorization), a risk score, proof of concept and status, then track it to closure. Totals and average risk
are shown at the top.

## CTF Toolkit (`/dashboard/ctf`)

Handy tools for capture-the-flag work: identify a file's true type from its magic number (any format),
extract EXIF metadata from images, and look for data hidden in the least significant bits.

## Platform Guide (`/dashboard/guide`) and Blog (`/blog`)

Step-by-step internal guides for common SOC projects, and a threat-intelligence blog.

## Admin, Users (`/dashboard/admin/users`)

Admins only. Review **access requests** (approve or reject), **whitelist** people by email or Discord ID, and
set each person's restrictions (read-only, expiry, allowed pages, single session, anti-copy). See
[access control](access-control.md).

## Account (`/dashboard/account`)

- **Overview**: your profile (name, location, specializations) and workspace counts.
- **Activity**: events recorded for your account and the cases list.
- **Security**: connect or disconnect Google and Discord, this browser's session details, and a password form
  only if your account has a password login.
- **Integrations**: personal OSINT API keys, stored in this browser only.

## Keyboard and small things

- Press **Cmd or Ctrl + K** for the quick-search palette.
- The theme button in the top bar switches light and dark.
- Your role and any restrictions are shown in the top bar.
