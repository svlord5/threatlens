# Deployment

ThreatLens is a standard Next.js 16 app. This guide covers Vercel, Docker and other hosts, and ends with a
**production checklist** you should walk through before exposing it to the internet.

Before anything else: [set up Supabase](supabase-setup.md) and decide your public address, for example
`https://threatlens.example.com`. That address goes in `NEXT_PUBLIC_APP_URL`, in Supabase's **Site URL** and
**Redirect URLs**, and in your Turnstile widget's allowed domains.

## Remember: `NEXT_PUBLIC_*` is a build-time setting

Variables beginning `NEXT_PUBLIC_` are compiled into the browser code when you build. If they are missing at
build time, the finished app runs in **demo mode**, no matter what you set later at runtime. On every
platform, set them in the **build** environment. This is the most common deployment mistake.

The ones that matter: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`,
`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY`.

## Vercel

1. Push your fork to GitHub and **Import** it at <https://vercel.com/new>. The framework is detected
   automatically.
2. Add environment variables under **Settings, Environment Variables** for the Production environment. Use
   [configuration](configuration.md) as the list. At minimum:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   SUPABASE_SECRET_KEY
   NEXT_PUBLIC_APP_URL
   SUPER_ADMIN_EMAIL
   NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY
   CLOUDFLARE_SECRET_TURNSTILE_KEY
   UPSTASH_REDIS_REST_URL
   UPSTASH_REDIS_REST_TOKEN
   SIEM_AGENT_API_KEY
   ```

3. **Redeploy** after adding variables so the `NEXT_PUBLIC_*` ones are baked in.
4. Update Supabase **Site URL** and **Redirect URLs** to your Vercel domain.

Notes for Vercel:

- **Upstash is required.** Serverless instances do not share memory, so without a shared store the rate
  limits do not hold.
- The **website scanner** tries to launch Chromium through Puppeteer. On Vercel's serverless runtime that
  usually is not possible, and the scanner automatically falls back to a plain HTTP fetch (no screenshot).
  Everything else on the page still works.
- **WHOIS** uses the `whois` command, which Vercel's runtime does not provide. WHOIS results are skipped
  there; DNS, RDAP and the rest still work.

## Docker

The included `Dockerfile` builds a small standalone image (Node 20, non-root user).

Because of the build-time rule above, pass the public values as **build arguments**:

```bash
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx \
  --build-arg NEXT_PUBLIC_APP_URL=https://threatlens.example.com \
  --build-arg NEXT_PUBLIC_CLOUDFLARE_SITE_TURNSTILE_KEY=0x4AAAA... \
  -t threatlens .
```

Pass the secret values at **run** time (never bake secrets into an image):

```bash
docker run -d --name threatlens -p 3000:3000 \
  -e SUPABASE_SECRET_KEY=sb_secret_xxx \
  -e SUPER_ADMIN_EMAIL=you@example.com \
  -e CLOUDFLARE_SECRET_TURNSTILE_KEY=0x4AAAA... \
  -e SIEM_AGENT_API_KEY=... \
  -e GEMINI_API_KEY=... \
  threatlens
```

Or put them in a file kept outside the repo and use `--env-file /path/to/threatlens.env`.

Container notes:

- The image is Alpine-based. WHOIS needs `whois`; add `RUN apk add --no-cache whois` to the runner stage if
  you want it.
- The image does **not** include Chromium, so the website scanner uses its HTTP fallback. If you add
  Chromium to the image and the container cannot grant it a sandbox, set `PUPPETEER_NO_SANDBOX=1` (only
  then).
- Without Upstash the limits are per container, which is fine for a single container.

## Other hosts and reverse proxies

Run `npm run build` then `npm start` (or the Docker image) behind a reverse proxy such as Caddy or nginx.

- Terminate **HTTPS** at the proxy. The app sets HSTS.
- Make the proxy set `X-Forwarded-For` to the real client address **and overwrite any value sent by the
  client**. The app trusts the first address in that header for per-IP rate limits. On Vercel this is done for
  you.
- Allow request bodies of at least 28 MB on `/api/forensics/app` if you want malware uploads (20 MB files);
  the app enforces its own caps.

## Security headers

`next.config.ts` sends: HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options`, a strict
`Referrer-Policy`, a `Permissions-Policy` that disables camera, microphone and location, and a
Content-Security-Policy. If you add a script or image host, add it to the policy there.

## Production checklist

Work down this list before you announce anything.

**Accounts and keys**

- [ ] Use a **dedicated Supabase project**, and run `supabase/schema.sql` ([guide](supabase-setup.md)).
- [ ] Add yourself as the first admin in `iam_discord_invites` **and** set `SUPER_ADMIN_EMAIL`.
- [ ] Generate a fresh `SIEM_AGENT_API_KEY` with `openssl rand -hex 32`. Never reuse a key from a doc or a
      test.
- [ ] Keep `SUPABASE_SECRET_KEY` only in server environment variables. Never put it in a `NEXT_PUBLIC_`
      variable, a client file or a screenshot.
- [ ] Set `CLOUDFLARE_SECRET_TURNSTILE_KEY` (the access form refuses to work without it in production).
- [ ] Keep the Discord webhook URL in the environment, not in a playbook or the database.

**Supabase settings**

- [ ] **Email provider is off**; Google is on ([why](supabase-setup.md#7-other-sign-in-settings)).
- [ ] Redirect URLs list only your real domains.
- [ ] Session time-box set (for example 8 hours).
- [ ] Backups enabled.
- [ ] Confirm RLS is on for every table (`select tablename, rowsecurity from pg_tables where schemaname='public'`).

**The app**

- [ ] `NEXT_PUBLIC_APP_URL` matches your real address, and the build ran with it set.
- [ ] Upstash configured (required on serverless).
- [ ] The top of every page does **not** say "Demo mode".
- [ ] `SECURITY.md` has a real contact address.
- [ ] `LEGAL_BASE_URL` points at your own terms and privacy pages.

**Verify it works**

- [ ] A stranger's Google account that is not on the invite list lands on the access-request page and
      **cannot** open `/dashboard` or call `/api/me`.
- [ ] Anonymous `POST /api/virustotal` and `POST /api/siem/ingest` (no session, no key) are refused with 401.
- [ ] An invited, `read_only` account can look but not change anything.
- [ ] Your Wazuh or Windows sender gets a 200 with the right key and a 401 with a wrong one.

**Housekeeping**

- [ ] `.env` is not committed (`git ls-files | grep -i '\.env'` should list only `.env.example`).
- [ ] Rotate any key that was ever pasted into a chat, ticket or screenshot.
- [ ] Update dependencies regularly: `npm audit` and `npm outdated`.
