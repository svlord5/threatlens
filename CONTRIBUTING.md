# Contributing to ThreatLens

Thanks for helping. This page gets you from a fresh clone to a pull request.

## Set up

```bash
git clone https://github.com/svlord5/threatlens.git
cd threatlens
npm install
npm run dev
```

With no `.env` the app starts in **demo mode** on synthetic data, which is enough for most UI work. To work on
sign-in, the database or the integrations, follow [Supabase setup](docs/supabase-setup.md) and use a
**separate project** for development.

Requirements: Node 20 or newer.

## Where things are

```
src/app/dashboard/      pages (server components) and their data loading
src/app/api/            REST routes
src/app/actions*.ts     server actions
src/components/ui/      shadcn/ui primitives (base-nova style)
src/components/kibo-ui/ Kibo UI components
src/components/dashboard/ feature components
src/lib/                security, limits, scanners, demo data
supabase/schema.sql     the database, including row-level security
```

Read [docs/architecture.md](docs/architecture.md) first; it explains the security model you must not weaken.

## Ground rules

These keep the project safe. Pull requests that break them will be asked to change.

1. **Every API route calls `requireAuth`.** Public routes are the exception and must say why in a comment.
2. **Every server action** that mutates data calls `blockInDemo()`; every one that calls an outside service
   uses `guardAction([...])`.
3. **Never `fetch` a URL a user provided.** Use `safeFetch` (`src/lib/safe-fetch.ts`).
4. **Costly calls are rate limited** (`rateLimit`) and **request bodies are size-capped**
   (`rejectLargeBody`). Validate and clip all input.
5. **Never trust user-editable data for access decisions** (profile metadata, form fields, query strings).
6. **Secrets stay server-side.** Nothing secret in a `NEXT_PUBLIC_` variable, a client component, a log
   line or a commit.
7. **New tables get row-level security** and the standard policies in `supabase/schema.sql`.
8. **No fake data pretending to be real.** If a feature has no real data source, show an empty state or label
   it "Demo" or "Sample".
9. **No shell commands built from user input.** Use `execFile` with validated arguments.

## Workflow

1. Create a branch: `git checkout -b my-change`.
2. Make the change, and check it in **demo mode** (`npm run dev`).
3. Run the checks:

   ```bash
   npx tsc --noEmit      # types must pass
   npm run build         # must succeed
   npm run lint          # must have no errors (warnings are the old backlog, see below)
   ```

4. Commit with a clear message ("fix(cases): ..." or "feat(siem): ..." is welcome, not required).
5. Open a pull request and describe **what changed, how you tested it, and what you could not test**.

### About lint

`npm run lint` passes with **no errors**. It still prints warnings, mostly `@typescript-eslint/no-explicit-any`
(about 270) from older code that passes untyped Supabase rows around, plus some unused variables. That rule is
a warning rather than an error on purpose, so the backlog does not block you.

Please do **not** add new `any`: give new and changed code real types. Replacing existing ones, file by file,
is a welcome contribution. A handful of `react-hooks/set-state-in-effect` exceptions are annotated in place
with the reason (loading data or reading the URL once on mount).

### There is no automated test suite yet

Adding one (for example Vitest for `src/lib/*` and Playwright for the main flows) would be very valuable. The
security helpers in `src/lib` (`safe-fetch.ts`, `rate-limit.ts`, `authorization.ts`, `prefill.ts`) are
self-contained and a good place to start.

## Changing the database

Edit `supabase/schema.sql` so a fresh install matches yours. Keep it re-runnable (`if not exists`,
`drop policy if exists` before `create policy`). Test it on a scratch Supabase project, then try these as
different users: an uninvited account, a read-only invite, a normal invite and an admin.

## Good first contributions

- Unify the two indicator tables (`ioc` and `iocs`) so the dashboard and IOC Database agree.
- Make **Force sync** really pull from a configured feed instead of simulating it.
- Execute saved **playbooks** when matching events arrive.
- Add a bulk **IOC import** (CSV) to the IOC page; the server action `createBulkIocs` already exists.
- Make Log Hunter search live `endpoint_logs` rather than the bundled sample file.
- Add real GeoIP to the threat map instead of illustrative placement.
- Add automated tests and a CI workflow.
- Replace the remaining `any` types (the lint warnings) with real types, starting with Supabase rows.

## Reporting security problems

Please do **not** open a public issue. See [SECURITY.md](SECURITY.md).

## License

By contributing you agree that your contributions are licensed under the MIT License.
