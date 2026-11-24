# Troubleshooting

Find your symptom, then follow the fix. If nothing here helps, open an issue and include the exact error
message, what you were doing, and your Node version (`node -v`). **Never paste keys or `.env` contents.**

## Install and run

### `npm install` or the build fails

- Use Node **20 or newer** (`node -v`).
- Delete `node_modules` and `.next`, then run `npm install` again.
- On Apple Silicon or Linux, a failed `puppeteer` download is harmless for demo use. The website scanner
  falls back automatically.

### Port 3000 is already in use

Another dev server is running. Stop it, or start this one elsewhere: `npm run dev -- -p 3001`.

### "Another next dev server is already running"

Next allows one dev server per project folder. Close the other terminal, or use a second copy of the folder.

## It looks broken in the browser

### Cards or rows are missing their spacing (cramped layout)

Your dev server's stylesheet is out of date, or the browser is showing a cached copy.

1. Stop `npm run dev`.
2. Run `rm -rf .next && npm run dev`.
3. Hard-refresh the page (Cmd+Shift+R, or Ctrl+Shift+R) or open it in a private window.

This happens most after pulling changes or switching branches while the dev server is running.

### The page says "Demo mode" but I configured Supabase

The variables were not seen. Check:

- The names are spelled exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- The file is called `.env` and sits in the project root, next to `package.json`.
- You restarted `npm run dev` (or rebuilt) after editing it. `NEXT_PUBLIC_*` values are read at build time.
- On Docker or Vercel, the values were available at **build** time ([deployment](deployment.md)).

### The map or globe is blank

The globe loads its earth textures from `unpkg.com`. A strict firewall or ad blocker can block that. The
flat map works offline. A harmless console message about a blocked "WebAssembly data URL" can come from the
globe library and can be ignored.

## Signing in

### Google sign-in returns me to the login page

Almost always a redirect-URL problem.

- In Supabase, **Authentication, URL Configuration, Redirect URLs** must include
  `http://localhost:3000/auth/callback` (and your production address).
- In Google Cloud, the OAuth client's **Authorized redirect URI** must be exactly
  `https://YOUR-PROJECT.supabase.co/auth/v1/callback`.
- Google error `redirect_uri_mismatch` means the second one is wrong.
- Google error `access_denied` while testing means your account is not under **Test users** on the consent
  screen.

### "PKCE code verifier not found"

The sign-in was started in one browser and finished in another, or the callback URL was opened twice. Start
again from the login page in a single browser. One such message in the log followed by a successful sign-in
is normal.

### I get sent to "request access" even though I am the owner

The database does not recognize you. Make sure:

- `SUPER_ADMIN_EMAIL` is the exact Google address, and that address is **confirmed**.
- You ran the first-admin `insert` ([guide](supabase-setup.md#8-create-the-first-admin)).
- The invite has not expired (`valid_until`).

### Every page is empty after signing in

You are signed in and allowed by the app, but the **database** does not know you, so row-level security
returns zero rows. The fix is the invite row for your account:

```sql
insert into public.iam_discord_invites (discord_id, role, super_admin, enforce_single_session)
values ('you@example.com', 'Super Admin', true, false);
```

### Applicants cannot request access ("sign-ups not allowed")

In Supabase, **Authentication, Sign In / Providers, Allow new users to sign up** must be **on**. Applicants
verify with Google first, which creates their account; they still get no access without an invite
([why](supabase-setup.md#7-other-sign-in-settings)).

### The access form says "Access requests are temporarily unavailable" (503)

In production the form needs `CLOUDFLARE_SECRET_TURNSTILE_KEY`. Set it and redeploy.

### "Please verify your name and email with Google first"

Name and email come only from the Google step. Click **Continue with Google** on the form. The verified
cookie lasts 30 minutes.

## API and rate limits

| Status | Meaning | Fix |
|---|---|---|
| 401 | No session or wrong agent key | Sign in, or check the `Authorization: Bearer` key |
| 403 | Signed in but not allowed, or a demo restriction | Check your invite; demo users cannot call this |
| 411 / 413 | Missing or too-large request body | Send a `Content-Length`; keep within the size caps |
| 429 | Rate limit hit | Wait a minute, or raise the limit ([configuration](configuration.md#rate-limiting)) |
| 500 on `/api/siem/ingest` | `SIEM_AGENT_API_KEY` not set on the server | Set it ([SIEM](siem-wazuh.md#1-create-the-shared-key)) |
| 503 "Rate limiter unavailable" | The Upstash store is unreachable | Check `UPSTASH_REDIS_REST_*`, or set `RATE_LIMIT_FAIL_OPEN=true` |

On Vercel, if limits seem to do nothing, you have not configured Upstash.

## Integrations

### AI features say a key is missing or return nothing

Set `GEMINI_API_KEY` and restart. Per-user daily limits also apply (60 by default).

### VirusTotal says "not configured" or rate limited

Set `VIRUSTOTAL_API_KEY`. The free tier allows 4 requests a minute; the app's default is the same.

### Discord user lookups fail with 401 or 500

`DISCORD_BOT_TOKEN` is missing, reset or wrong. Regenerate it in the Discord developer portal and update the
variable. The same applies to a webhook URL that was deleted.

### The website scanner has no screenshot

Chromium could not start (normal on serverless hosts and in the stock Docker image). The scanner continues
with a plain fetch. See [deployment](deployment.md#vercel).

### WHOIS results are missing

The server needs the `whois` command. Install it (`apt install whois`, `brew install whois`, or
`apk add whois`).

### Wazuh actions fail with a TLS error

The manager's certificate is not trusted. Pin its CA with `WAZUH_CA_CERT`. For a disposable lab only, set
`WAZUH_TLS_INSECURE=true`.

### Wazuh active response says the command is not found

Isolation and forensics call custom active-response commands (`isolate-host`, `forensics-memdump`,
`forensics-triage`, `forensics-quarantine`) that you must install on the agents. See
[SIEM and Wazuh](siem-wazuh.md#5-active-response-isolate-and-collect).

## Data

### Counts differ between the dashboard and the IOC Database

They read two different tables (`ioc` and `iocs`). See [architecture](architecture.md#data-model).

### "Force sync" changes the numbers but nothing real arrives

It is a simulation. See [usage guide](usage-guide.md#threat-feeds-dashboardfeeds).

### I changed the schema and the app errors

Keep `supabase/schema.sql` and your database in step. Columns the app writes (for example `case_mitre` uses
`tactic_name`, and `investigations` uses `timeline_event`) must exist exactly as in that file.

## Still stuck?

1. Look at the terminal running `npm run dev`; server errors print there.
2. Open the browser console (Network and Console tabs).
3. Try [demo mode](getting-started.md#demo-mode). If that works, the issue is configuration, not code.
