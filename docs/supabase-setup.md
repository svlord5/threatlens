# Supabase setup

ThreatLens uses Supabase for three things: the **Postgres database**, **sign-in** (Google, and optionally
Discord for linking an ID) and **realtime** updates. This guide takes you from nothing to a working live
install. It takes about 15 minutes, most of it clicking through Google Cloud.

> You can skip all of this and use [demo mode](getting-started.md#demo-mode) to look around first.

## 1. Create the project

1. Sign in at <https://supabase.com> and choose **New project**.
2. Pick a name and the region closest to you, and set a database password (save it somewhere safe).
3. Wait for the project to finish provisioning.

Use a **dedicated project** for ThreatLens. The schema enables row-level security on its own tables and you
do not want it mixed with other apps.

## 2. Create the tables

1. In the dashboard open **SQL Editor, New query**.
2. Paste the whole contents of [`supabase/schema.sql`](../supabase/schema.sql) and press **Run**.
3. Open **Table Editor**. You should see 28 tables (`case`, `ioc`, `endpoint_logs`, `iam_discord_invites`
   and so on), each marked as having RLS enabled.

The file is safe to run again; it uses `create ... if not exists` and replaces its own policies.

What it sets up:

- All tables the app reads and writes.
- **Row-level security on every table.** A signed-in user can only read data if they are on the invite list
  (see [access control](access-control.md)). Being signed in is not enough.
- Helper functions (`is_authorized`, `is_admin`, `can_write`) that the policies use.
- Guards so people cannot promote themselves to admin or change their own role.
- Realtime publication for the tables the dashboard watches live.

> **Review before relying on it.** The column list was read from a working ThreatLens database. A few things
> the source database did not expose (unique indexes, `ON DELETE` actions, extra indexes, the RLS policies)
> are reasonable choices, marked "inferred" in the file. Try it on a scratch project first.

## 3. Get your keys

Open **Project Settings, API Keys**.

| Value | Goes in | Notes |
|---|---|---|
| Project URL (`https://xxxx.supabase.co`) | `NEXT_PUBLIC_SUPABASE_URL` | Public |
| Publishable key (`sb_publishable_...`) | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public, safe in the browser |
| Secret key (`sb_secret_...`) | `SUPABASE_SECRET_KEY` | **Server only. Never expose it.** |

Older projects still show the legacy `anon` and `service_role` JWT keys (they start with `eyJ`). The app
accepts them through `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`, but prefer the new
keys. If both are present the app ignores a legacy JWT in favor of the new key.

## 4. URLs

Open **Authentication, URL Configuration**.

- **Site URL**: the public address of your app, for example `https://threatlens.example.com`, or
  `http://localhost:3000` while developing.
- **Redirect URLs**: add every address people sign in from, with the `/auth/callback` path:

  ```
  http://localhost:3000/auth/callback
  https://threatlens.example.com/auth/callback
  ```

  A wildcard such as `http://localhost:3000/**` also works while developing.

If this is wrong, signing in sends you back to the login page. See
[troubleshooting](troubleshooting.md#google-sign-in-returns-me-to-the-login-page).

## 5. Google sign-in

Google is how people prove who they are. The app reads their **name** and **verified email** from it.

**In Google Cloud Console** (<https://console.cloud.google.com>):

1. Create a project (or choose one), then open **APIs and Services, OAuth consent screen**. Choose
   **External**, fill in the app name and your email, and save. While testing, add your own Google account
   under **Test users**.
2. Open **Credentials, Create credentials, OAuth client ID**, application type **Web application**.
3. Under **Authorized redirect URIs** add Supabase's callback address:

   ```
   https://YOUR-PROJECT.supabase.co/auth/v1/callback
   ```

   (Supabase shows the exact value on the Google provider page, labelled "Callback URL".)
4. Create it, then copy the **Client ID** and **Client secret**.

**In Supabase**: open **Authentication, Sign In / Providers, Google**, switch it on and paste the Client ID and
secret. Save.

## 6. Discord (optional)

Discord is **not** used to sign in. It is only used to **link a Discord ID** to an account, so an invite
keyed by Discord ID can match (and so the access-request form can capture it).

1. At <https://discord.com/developers/applications> create an application.
2. Under **OAuth2, Redirects** add the same Supabase callback address as above.
3. Copy the Client ID and secret into **Authentication, Sign In / Providers, Discord** in Supabase.

If you only invite people by email you can skip this entirely.

## 7. Other sign-in settings

Open **Authentication, Sign In / Providers**:

- **Email provider: turn it off.** ThreatLens is Google-only; this removes password sign-in as an attack
  surface.
- **Allow new users to sign up: leave it ON.** This surprises people, so here is why. Someone who asks for
  access first signs in with Google on the access-request page so the app can verify their name and email.
  That creates a Supabase user. If sign-ups were disabled, that step would fail and nobody could apply. It is
  safe because **a user who is not on the invite list gets nothing**: the app's proxy, its API routes and the
  database's row-level security all refuse them.

Optional hardening under **Authentication, Sessions**: set a **time-box** (for example 8 hours) and an
inactivity timeout so sessions do not live forever.

## 8. Create the first admin

The app lets `SUPER_ADMIN_EMAIL` (or `SUPER_ADMIN_DISCORD_ID`) in on its own, but the **database** only shows
data to people on the invite list. So the first admin needs a row. Run this once in the SQL editor, using
the Google account you will sign in with:

```sql
insert into public.iam_discord_invites (discord_id, role, super_admin, enforce_single_session)
values ('you@example.com', 'Super Admin', true, false);
```

Then set the same address in your environment:

```bash
SUPER_ADMIN_EMAIL=you@example.com
```

> The column is called `discord_id` for historical reasons. It holds either an **email address** or a
> **Discord user ID**.

## 9. Check realtime

`schema.sql` adds the live tables to the `supabase_realtime` publication. Confirm under **Database,
Publications** that `ioc`, `case`, `feed`, `endpoint_logs`, `soar_playbooks` and `iam_discord_invites` are
listed. Without it the dashboard still works but does not update on its own.

## 10. Try it

1. Put the keys in `.env` (see [configuration](configuration.md)) and run `npm run dev`.
2. Open <http://localhost:3000/login> and choose **Login with Google**.
3. You should land on the dashboard with zero everything, and no "Demo mode" banner.

Optional: fill a **dedicated** project with synthetic rows so the pages are not empty:

```bash
DEMO_SEED_CONFIRM=yes npx tsx --env-file=.env scripts/seed-demo.ts
```

The seeder refuses to run without `DEMO_SEED_CONFIRM=yes`, and removes only its own earlier rows.

## What the database enforces

| Who | Reads | Writes |
|---|---|---|
| Not on the invite list, or invite expired | nothing | nothing |
| On the invite list, `read_only` | everything | nothing |
| On the invite list | everything | everything except access settings |
| Admin (`super_admin`) | everything | everything, including invites |

- An invite matches a signed-in user by **confirmed email** or by **linked Discord ID**. An unconfirmed email
  never matches.
- Non-admins cannot change an invite's flags, their own role or clearance, or other people's profiles.
- The app's server uses the secret key for a few things (audit log writes, authorization checks); that key
  bypasses RLS by design, which is why it must never reach the browser.

More detail in [access control](access-control.md).

## Backups and changes

- Turn on backups in **Database, Backups** (point-in-time recovery needs a paid plan).
- If you change the schema, change `supabase/schema.sql` too so a fresh install matches yours.
