# Getting started

ThreatLens has two modes. You can try it in a minute in **demo mode**, then move to **live mode** when you
want your own data.

## Requirements

| Needed for | What |
|---|---|
| Everything | [Node.js](https://nodejs.org) **20 or newer** and npm |
| Live mode | A free [Supabase](https://supabase.com) project |
| Google sign-in | A Google Cloud project (free) to create an OAuth client |
| Optional | API keys for Gemini, VirusTotal, Shodan and others (see [integrations](integrations.md)) |

## Demo mode

Demo mode needs no configuration at all.

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The login page shows a demo notice with a link straight to the dashboard.
Any email and password also "sign in".

What demo mode does:

- Shows **synthetic data**: cases, indicators, logs, feeds, rules and so on. Every IP is from a reserved
  documentation range and every domain is `example.*`.
- Needs **no sign-in** and **no database**.
- Keeps edits **in memory only**. Reloading the page resets them.
- **Disables** anything that would touch the outside world or change real state: log ingest, Wazuh, host
  isolation, VirusTotal, Shodan, Gemini, Discord, website scans, file uploads and access requests.

You are in demo mode when either of these is true:

- `NEXT_PUBLIC_SUPABASE_URL` and a Supabase publishable key are not both set, or
- `NEXT_PUBLIC_DEMO_MODE=true` (forces demo mode even if Supabase is configured).

A banner across the top of every page tells you which mode you are in.

> **Heads up.** A production deployment that is missing its Supabase variables will quietly run as a demo
> and log a warning. That is safe (the data is fake and no real data is exposed) but it is not what you want
> for a real deployment.

## Live mode

Live mode uses your own Supabase project for data and sign-in.

1. **Create the database.** Follow [Supabase setup](supabase-setup.md): create a project, run
   `supabase/schema.sql`, enable Google sign-in and set the redirect URLs.
2. **Configure the app.** Copy the template and fill it in:

   ```bash
   cp .env.example .env
   ```

   At minimum set these (details in [configuration](configuration.md)):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   SUPABASE_SECRET_KEY=sb_secret_...
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   SUPER_ADMIN_EMAIL=you@example.com
   SIEM_AGENT_API_KEY=paste-the-output-of-openssl-rand-hex-32
   ```

3. **Add yourself as the first admin** by running this once in the Supabase SQL editor (use the Google
   account you will sign in with):

   ```sql
   insert into public.iam_discord_invites (discord_id, role, super_admin, enforce_single_session)
   values ('you@example.com', 'Super Admin', true, false);
   ```

4. **Start the app** and sign in:

   ```bash
   npm run dev
   ```

   Open <http://localhost:3000/login> and choose **Login with Google**.

5. **Add integrations** you want (Gemini for AI features, VirusTotal and Shodan for enrichment, and so on).
   Each one switches on as soon as its key is present; missing keys simply leave that feature off.

6. **Invite your team** from **Admin, Users**. See [access control](access-control.md).

### First sign-in checklist

If something is off after your first sign-in, check these in order:

- The banner says **Demo mode**: a Supabase variable is missing or misspelled. Restart after editing `.env`.
- You land back on the login page: the Google redirect URL is not allow-listed in Supabase
  ([URL configuration](supabase-setup.md#4-urls)).
- You get in but every list is empty: you are missing the admin row from step 3, so the database refuses to
  show you data. See [troubleshooting](troubleshooting.md#every-page-is-empty-after-signing-in).

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload on port 3000 |
| `npm run build` | Create a production build |
| `npm start` | Serve the production build (run `npm run build` first) |
| `npm run lint` | Run ESLint |
| `DEMO_SEED_CONFIRM=yes npx tsx scripts/seed-demo.ts` | Load synthetic rows into a **dedicated** Supabase project |

`NEXT_PUBLIC_*` variables are baked into the browser bundle at **build time**. After changing one, restart
`npm run dev` or rebuild.

## Next steps

- Take the [usage guide](usage-guide.md) tour of every page.
- Connect your logs with [SIEM and Wazuh](siem-wazuh.md).
- Read the [deployment guide](deployment.md) before exposing the app to the internet.
