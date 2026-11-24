# Access control

ThreatLens is **invite-only**. Signing in proves who you are; it does **not** let you in. You get access
only if an administrator has invited you.

## The model in one picture

```
Google sign-in ──► who are you?  (verified name and email)
                         │
                         ▼
          Is there an unexpired invite for you?
          (matched by confirmed email, or by a linked Discord ID)
                         │
            yes ─────────┴───────── no
             │                       │
   dashboard, API, database      nothing: redirected to the
   (limited by your invite)      access-request page
```

The same rule is enforced in **three** places, so no single mistake opens the app up:

1. **The proxy** (`src/proxy.ts`) checks every dashboard page and every server action.
2. **The API routes** check every request (`src/lib/api-auth.ts`).
3. **The database** checks every query through row-level security (`supabase/schema.sql`).

## Invites

An invite is a row in `public.iam_discord_invites`. You manage them in the app under
**Admin, Users** (admins only), or with SQL.

| Field | Meaning |
|---|---|
| `discord_id` | The person's **email address** or **Discord user ID**. (Historical name; either works.) |
| `role` | A label shown in the UI (Analyst, Viewer, and so on) |
| `super_admin` | Full access, including managing invites |
| `read_only` | Can look at everything but cannot change anything |
| `valid_until` | Optional expiry. After this moment the invite stops working. |
| `allowed_pages` | Optional list of dashboard pages this person may open |
| `enforce_single_session` | Signing in on a second device ends the first session |
| `disable_copy` | Blocks copy and paste in the interface |
| `disable_screenshot` | Shows a black overlay when screenshot shortcuts are used |

> **Be honest about the limits.** `disable_copy` and `disable_screenshot` are deterrents implemented in the
> browser. They stop casual copying, not a determined person. The things that are truly enforced on the
> server and in the database are **who is allowed in**, **read-only**, **expiry** and **admin-only actions**.

### How a person is matched

- By **email**: only if that email is **confirmed** on their Google account. An unconfirmed email never
  matches.
- By **Discord ID**: only if they have linked Discord to their account (Account, Security, Connect). The ID
  comes from Discord itself, never from a field the user can edit.

Anything a user can edit about themselves (their profile "metadata") is **never** trusted for access.

### Roles

| Who | Can do |
|---|---|
| Not invited, or invite expired | Nothing. Sees the access-request page. |
| Invited, `read_only` | View every page their invite allows |
| Invited | View and change data (cases, indicators, rules...) |
| Admin | Everything, plus invites, access requests and the Admin pages |

The owner is an admin through `SUPER_ADMIN_EMAIL` or `SUPER_ADMIN_DISCORD_ID`. Make sure the owner also has
an invite row with `super_admin = true`, otherwise the database will show them empty pages
([why](troubleshooting.md#every-page-is-empty-after-signing-in)).

## Adding people

### In the app

1. Sign in as an admin and open **Admin, Users**.
2. Choose **Whitelist Analyst**, enter their **email** (or Discord ID), pick a role and any restrictions, and
   save.

### With SQL

```sql
-- a normal analyst, access until the end of the year
insert into public.iam_discord_invites (discord_id, role, valid_until)
values ('analyst@example.com', 'Analyst', '2026-12-31');

-- a read-only viewer
insert into public.iam_discord_invites (discord_id, role, read_only)
values ('viewer@example.com', 'Viewer', true);
```

To remove someone, delete their row (or set `valid_until` to a past date).

## Access requests

People who are not invited can ask for access from the **Create account** page.

1. They choose **Continue with Google**. The app records the verified name and email (and, if they link it,
   their Discord ID) in a short-lived signed cookie. **These fields are then read-only** and the server uses
   the cookie, not anything typed into the form.
2. They fill in organization, optional website, and the purpose of their request, pass the Turnstile check,
   and submit.
3. The request is stored in `audit_logs` and, if `DISCORD_WEBHOOK` is set, announced in your Discord channel
   (pinging `ACCESS_NOTIFY_DISCORD_ID` if set).
4. An admin reviews it under **Admin, Users** and **Approve** or **Reject**. Approving creates the invite
   (you choose role, expiry and restrictions).
5. The applicant can check their status on the same page.

Protections on that form: a captcha enforced on the server, three requests per IP per hour, one request per
email per day, strict input limits, and no way to change the name, email or Discord ID after verification.

## The demo account

`DEMO_ACCOUNT_EMAIL=demo@example.com` makes **one account on a live deployment read-only**. It is for
showing the product to someone without risk. It can look around, and cannot change data, use outbound
integrations, or open admin pages. This is separate from [demo mode](getting-started.md#demo-mode), which
replaces the whole app with fake data.

## What protects the data

| Layer | Stops |
|---|---|
| Proxy | Strangers and unconfirmed users reaching pages or server actions |
| API routes | The same, for REST calls, and unauthenticated bots |
| Row-level security | Anyone using the public Supabase key directly from a browser or script |
| Rate limits | Floods, scraping and quota burn on paid APIs |
| Size and input caps | Oversized or malformed requests |

If you read only one thing before going public, read the [deployment checklist](deployment.md#production-checklist).

## Troubleshooting access

| Symptom | Likely cause |
|---|---|
| Sent to "request access" after signing in | No unexpired invite matches your **confirmed** email or linked Discord ID |
| Signed in but lists are empty | The database does not recognize you (missing invite row) |
| A teammate sees pages you did not expect | Their `allowed_pages` is empty, which means "all pages" |
| An admin cannot manage invites | Their invite lacks `super_admin = true` |
