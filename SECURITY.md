# Security Policy

## Reporting a vulnerability

Please report security issues privately. Do **not** open a public issue.

- Email: **hello@surajv5.in** (use the subject line "ThreatLens security").
- Or, if this repository has it enabled, use GitHub's **Report a vulnerability** button under the Security tab, which keeps the report private.
- Include: affected component or route, steps to reproduce, impact, and any proof of concept.
- You can expect an acknowledgement within a few days. Please allow reasonable time for a fix before public disclosure.

## Supported versions

Only the latest commit on `main` is supported.

## Scope notes

ThreatLens fetches user-supplied URLs (website forensics) and calls third-party APIs with server-side keys. Reports about SSRF bypasses, authentication or authorization gaps, rate-limit bypasses, and secret exposure are especially welcome.

## Deploying safely

Work through the [production checklist](docs/deployment.md#production-checklist) before exposing an instance. The short version:

- Set `SIEM_AGENT_API_KEY` to a long random value; agent routes fail closed without it.
- Configure Upstash Redis for rate limiting on serverless hosts.
- Never commit `.env` files; rotate any key that has ever been committed.
- Keep **Allow new users to sign up** on and the **Email** provider off in Supabase; access is controlled by the invite list, enforced in the app and by row-level security ([details](docs/supabase-setup.md#7-other-sign-in-settings)).
- Treat the Supabase **secret key** and any Discord webhook URL like passwords: server environment only.

How access control works is described in [docs/access-control.md](docs/access-control.md) and [docs/architecture.md](docs/architecture.md).
