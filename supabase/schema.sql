-- ThreatLens database schema
--
-- Run this once in a NEW Supabase project (SQL Editor, or `supabase db push`).
-- It creates the tables the app uses, enables row-level security (RLS) on all of
-- them and ties every policy to the invite whitelist (public.iam_discord_invites),
-- so that being signed in is not enough to read or change data.
--
-- The column list was read from a working ThreatLens database. Constraints that the
-- source database does not expose (unique keys, ON DELETE actions, indexes, RLS
-- policies) are reasonable choices and are marked "inferred" below. Review before
-- using it for anything important, and test it on a scratch project first.


-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.api_findings (
  id uuid default gen_random_uuid(),
  endpoint text not null,
  vulnerability_type text not null,
  risk_score integer,
  proof_of_concept text,
  status text default 'Unpatched',
  created_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.audit_logs (
  id uuid default gen_random_uuid(),
  created_at timestamptz default now(),
  user_id uuid,
  action text not null,
  details text,
  ip_address text,
  primary key (id)
);

create table if not exists public.threat_actors (
  id uuid default gen_random_uuid(),
  name text not null,
  aliases text[],
  description text,
  origin_country text,
  mitre_id text,
  created_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.campaigns (
  id uuid default gen_random_uuid(),
  name text not null,
  start_date timestamptz,
  end_date timestamptz,
  target_sectors text[],
  threat_actor_id uuid,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (threat_actor_id) references public."threat_actors"(id) on delete set null
);

create table if not exists public."case" (
  id uuid default gen_random_uuid(),
  title text not null,
  description text default '',
  severity text not null,
  status text default 'Open',
  analyst_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.case_hex (
  id uuid default gen_random_uuid(),
  case_id uuid not null,
  created_at timestamptz default now(),
  offset_address text not null,
  hex_bytes text not null,
  decoded_ascii text not null,
  is_malicious boolean default false,
  primary key (id),
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.ioc (
  id uuid default gen_random_uuid(),
  value text not null,
  type text not null,
  risk_score integer default 0,
  status text default 'Active',
  reputation text default 'Unknown',
  first_seen timestamptz default now(),
  last_seen timestamptz default now(),
  intel_source text,
  intel_confidence integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.case_ioc (
  case_id uuid,
  ioc_id uuid,
  primary key (case_id, ioc_id),
  foreign key (case_id) references public."case"(id) on delete cascade,
  foreign key (ioc_id) references public."ioc"(id) on delete cascade
);

create table if not exists public.case_mitre (
  id uuid default gen_random_uuid(),
  case_id uuid not null,
  created_at timestamptz default now(),
  tactic_id text not null,
  tactic_name text not null,
  technique_id text not null,
  technique_name text not null,
  primary key (id),
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.case_note (
  id uuid default gen_random_uuid(),
  case_id uuid,
  content text not null,
  author text not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (id),
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.case_pcap (
  id uuid default gen_random_uuid(),
  case_id uuid not null,
  created_at timestamptz default now(),
  packet_time text not null,
  source_ip text not null,
  dest_ip text not null,
  protocol text not null,
  length integer not null,
  info text not null,
  is_malicious boolean default false,
  primary key (id),
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.detection_rules (
  id uuid default gen_random_uuid(),
  name text not null,
  description text,
  target_field text not null,
  match_pattern text not null,
  action_type text not null,
  severity text default 'High',
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  primary key (id)
);

create table if not exists public.endpoint_logs (
  id uuid default gen_random_uuid(),
  timestamp timestamptz not null,
  machine_name text not null,
  event_id integer not null,
  provider text,
  level text not null,
  message text,
  raw_data jsonb,
  created_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.evidence (
  id uuid default gen_random_uuid(),
  case_id uuid,
  file_url text,
  file_hash text,
  description text,
  uploaded_by uuid,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.feed (
  id uuid default gen_random_uuid(),
  name text not null,
  status text default 'Enabled' not null,
  last_sync text default 'Never' not null,
  indicators text default '0' not null,
  health text default 'Healthy' not null,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  endpoint_url text,
  auth_key text,
  polling_interval text default '5m',
  primary key (id)
);

create table if not exists public.forensic_artifacts (
  id uuid default gen_random_uuid(),
  case_id uuid,
  artifact_type text not null,
  artifact_data jsonb not null,
  is_malicious boolean default false,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.iam_discord_invites (
  discord_id text,
  invited_by uuid,
  created_at timestamptz default now(),
  valid_until timestamptz,
  allowed_pages text[],
  allowed_actions text[],
  disable_copy boolean default false,
  enforce_single_session boolean default true,
  read_only boolean default false,
  disable_screenshot boolean default false,
  super_admin boolean default false,
  role text default 'User',
  current_session_token text,
  primary key (discord_id)
);

create table if not exists public.investigations (
  id uuid default gen_random_uuid(),
  case_id uuid,
  timeline_event text not null,
  event_time timestamptz not null,
  analyst_id uuid,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.iocs (
  id uuid default gen_random_uuid(),
  value text not null,
  type text not null,
  severity text default 'Medium',
  confidence_score integer default 50,
  expiration_date timestamptz,
  campaign_id uuid,
  created_by uuid,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (campaign_id) references public."campaigns"(id) on delete set null
);

create table if not exists public.ioc_tags (
  ioc_id uuid,
  tag text,
  primary key (ioc_id, tag),
  foreign key (ioc_id) references public."iocs"(id) on delete cascade
);

create table if not exists public.malware_families (
  id uuid default gen_random_uuid(),
  name text not null,
  type text,
  description text,
  threat_actor_id uuid,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (threat_actor_id) references public."threat_actors"(id) on delete set null
);

create table if not exists public.note (
  id uuid default gen_random_uuid(),
  content text not null,
  author_id uuid,
  ioc_id uuid,
  case_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id),
  foreign key (ioc_id) references public."ioc"(id) on delete set null,
  foreign key (case_id) references public."case"(id) on delete cascade
);

create table if not exists public.profiles (
  id uuid,
  created_at timestamptz default now(),
  full_name text,
  role text default 'Analyst',
  clearance_level text default 'Level 1',
  location text default 'Global SOC',
  specializations text[],
  metrics_cases_resolved integer default 0,
  metrics_avg_ttr_hrs numeric default 0,
  metrics_iocs_hunted integer default 0,
  current_session_token text,
  primary key (id)
);

create table if not exists public.soar_playbooks (
  id uuid default gen_random_uuid(),
  name text not null,
  description text,
  nodes jsonb not null,
  edges jsonb not null,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.threatfeed (
  id uuid default gen_random_uuid(),
  name text not null,
  url text,
  status text default 'Enabled',
  last_sync timestamptz,
  total_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.threatlens_domains (
  id uuid default gen_random_uuid(),
  domain text not null,
  user_id uuid,
  last_scanned timestamptz,
  is_monitoring boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

create table if not exists public.threatlens_scans (
  id uuid default gen_random_uuid(),
  domain_id uuid,
  risk_score integer default 0,
  status text default 'Processing',
  dns_data jsonb,
  ssl_data jsonb,
  headers_data jsonb,
  tech_data jsonb,
  email_security_data jsonb,
  ai_executive_summary text,
  ai_technical_summary text,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (domain_id) references public."threatlens_domains"(id) on delete set null
);

create table if not exists public.threatlens_findings (
  id uuid default gen_random_uuid(),
  scan_id uuid,
  title text not null,
  severity text not null,
  description text,
  impact text,
  remediation text,
  created_at timestamptz default now(),
  primary key (id),
  foreign key (scan_id) references public."threatlens_scans"(id) on delete set null
);

-- inferred: the app treats a duplicate indicator as an error (Postgres code 23505)
create unique index if not exists ioc_value_key on public.ioc (value);

-- inferred: indexes for the lists and charts that sort or filter on these columns
create index if not exists case_created_at_idx on public."case" (created_at desc);
create index if not exists ioc_risk_score_idx on public.ioc (risk_score desc);
create index if not exists endpoint_logs_timestamp_idx on public.endpoint_logs ("timestamp" desc);
create index if not exists audit_logs_action_created_idx on public.audit_logs (action, created_at desc);

-- ---------------------------------------------------------------------------
-- Who is allowed in? (used by every policy below)
--
-- A signed-in user is authorized when an unexpired row in iam_discord_invites
-- matches their CONFIRMED email address or their linked Discord ID. This mirrors
-- the check the app performs in src/lib/authorization.ts.
-- ---------------------------------------------------------------------------

create or replace function public.my_invites()
returns setof public.iam_discord_invites
language sql stable security definer
set search_path = public, auth
as $$
  select i.*
  from public.iam_discord_invites i
  where (i.valid_until is null or i.valid_until > now())
    and (
      lower(i.discord_id) in (
        select lower(u.email) from auth.users u
        where u.id = auth.uid() and u.email_confirmed_at is not null
      )
      or i.discord_id in (
        select ident.provider_id from auth.identities ident
        where ident.user_id = auth.uid() and ident.provider = 'discord'
      )
    );
$$;

create or replace function public.is_authorized() returns boolean
language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.my_invites()); $$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.my_invites() i where i.super_admin); $$;

-- Writers: authorized and not marked read-only on every matching invite.
create or replace function public.can_write() returns boolean
language sql stable security definer set search_path = public, auth
as $$ select exists (select 1 from public.my_invites() i where not i.read_only); $$;

revoke all on function public.my_invites() from public, anon;
revoke all on function public.is_authorized() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.can_write() from public, anon;
grant execute on function public.my_invites(), public.is_authorized(), public.is_admin(), public.can_write() to authenticated;

-- ---------------------------------------------------------------------------
-- Guards: non-admins may not promote themselves
-- (the service role and the SQL editor have no auth.uid(), so they are not restricted)
-- ---------------------------------------------------------------------------

create or replace function public.guard_invite_update() returns trigger
language plpgsql security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  -- everyone else may only change their own session token
  if (new.discord_id, new.invited_by, new.valid_until, new.allowed_pages, new.allowed_actions,
      new.disable_copy, new.enforce_single_session, new.read_only, new.disable_screenshot,
      new.super_admin, new.role)
     is distinct from
     (old.discord_id, old.invited_by, old.valid_until, old.allowed_pages, old.allowed_actions,
      old.disable_copy, old.enforce_single_session, old.read_only, old.disable_screenshot,
      old.super_admin, old.role) then
    raise exception 'Only an administrator can change access settings' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_invite_update on public.iam_discord_invites;
create trigger guard_invite_update before update on public.iam_discord_invites
  for each row execute function public.guard_invite_update();

create or replace function public.guard_profile_write() returns trigger
language plpgsql security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null or public.is_admin() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.role is distinct from 'Analyst' or new.clearance_level is distinct from 'Level 1' then
      raise exception 'Only an administrator can set role or clearance' using errcode = '42501';
    end if;
  elsif (new.role, new.clearance_level, new.metrics_cases_resolved, new.metrics_avg_ttr_hrs, new.metrics_iocs_hunted)
        is distinct from
        (old.role, old.clearance_level, old.metrics_cases_resolved, old.metrics_avg_ttr_hrs, old.metrics_iocs_hunted) then
    raise exception 'Only an administrator can change role, clearance or metrics' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists guard_profile_write on public.profiles;
create trigger guard_profile_write before insert or update on public.profiles
  for each row execute function public.guard_profile_write();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon;
alter table public.api_findings enable row level security;
alter table public.audit_logs enable row level security;
alter table public.threat_actors enable row level security;
alter table public.campaigns enable row level security;
alter table public."case" enable row level security;
alter table public.case_hex enable row level security;
alter table public.ioc enable row level security;
alter table public.case_ioc enable row level security;
alter table public.case_mitre enable row level security;
alter table public.case_note enable row level security;
alter table public.case_pcap enable row level security;
alter table public.detection_rules enable row level security;
alter table public.endpoint_logs enable row level security;
alter table public.evidence enable row level security;
alter table public.feed enable row level security;
alter table public.forensic_artifacts enable row level security;
alter table public.iam_discord_invites enable row level security;
alter table public.investigations enable row level security;
alter table public.iocs enable row level security;
alter table public.ioc_tags enable row level security;
alter table public.malware_families enable row level security;
alter table public.note enable row level security;
alter table public.profiles enable row level security;
alter table public.soar_playbooks enable row level security;
alter table public.threatfeed enable row level security;
alter table public.threatlens_domains enable row level security;
alter table public.threatlens_scans enable row level security;
alter table public.threatlens_findings enable row level security;

-- Everything that is not special-cased below: authorized users read, writers write.
do $$
declare t text;
begin
  foreach t in array array['api_findings', 'threat_actors', 'campaigns', 'case', 'case_hex', 'ioc', 'case_ioc', 'case_mitre', 'case_note', 'case_pcap', 'detection_rules', 'endpoint_logs', 'evidence', 'feed', 'forensic_artifacts', 'investigations', 'iocs', 'ioc_tags', 'malware_families', 'note', 'soar_playbooks', 'threatfeed', 'threatlens_domains', 'threatlens_scans', 'threatlens_findings'] loop
    execute format('drop policy if exists "authorized read" on public.%I', t);
    execute format('drop policy if exists "writers insert" on public.%I', t);
    execute format('drop policy if exists "writers update" on public.%I', t);
    execute format('drop policy if exists "writers delete" on public.%I', t);
    execute format('create policy "authorized read" on public.%I for select to authenticated using (public.is_authorized())', t);
    execute format('create policy "writers insert" on public.%I for insert to authenticated with check (public.can_write())', t);
    execute format('create policy "writers update" on public.%I for update to authenticated using (public.can_write()) with check (public.can_write())', t);
    execute format('create policy "writers delete" on public.%I for delete to authenticated using (public.can_write())', t);
  end loop;
end $$;

-- iam_discord_invites: admins manage everyone; each person sees (and may refresh the
-- session token of) only their own row.
drop policy if exists "invites read" on public.iam_discord_invites;
drop policy if exists "invites insert" on public.iam_discord_invites;
drop policy if exists "invites update" on public.iam_discord_invites;
drop policy if exists "invites delete" on public.iam_discord_invites;
create policy "invites read" on public.iam_discord_invites for select to authenticated
  using (public.is_admin() or discord_id in (select i.discord_id from public.my_invites() i));
create policy "invites insert" on public.iam_discord_invites for insert to authenticated
  with check (public.is_admin());
create policy "invites update" on public.iam_discord_invites for update to authenticated
  using (public.is_admin() or discord_id in (select i.discord_id from public.my_invites() i))
  with check (public.is_admin() or discord_id in (select i.discord_id from public.my_invites() i));
create policy "invites delete" on public.iam_discord_invites for delete to authenticated
  using (public.is_admin());

-- profiles: teammates are visible to authorized users; you edit your own row.
drop policy if exists "profiles read" on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
drop policy if exists "profiles delete" on public.profiles;
create policy "profiles read" on public.profiles for select to authenticated using (public.is_authorized());
create policy "profiles insert" on public.profiles for insert to authenticated
  with check (public.is_authorized() and (id = auth.uid() or public.is_admin()));
create policy "profiles update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
create policy "profiles delete" on public.profiles for delete to authenticated using (public.is_admin());

-- audit_logs: you see your own events, admins see all. The app's server writes them with
-- the service role (which bypasses RLS), so there is no insert/update/delete policy.
drop policy if exists "audit read" on public.audit_logs;
create policy "audit read" on public.audit_logs for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ---------------------------------------------------------------------------
-- Realtime (the dashboard subscribes to these tables)
-- ---------------------------------------------------------------------------

do $$
declare t text;
begin
  foreach t in array array['ioc', 'case', 'feed', 'endpoint_logs', 'soar_playbooks', 'iam_discord_invites'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- After running this file: create YOUR admin invite (replace the email with the
-- Google account you will sign in with), then sign in once.
--
--   insert into public.iam_discord_invites (discord_id, role, super_admin, enforce_single_session)
--   values ('you@example.com', 'Super Admin', true, false);
--
-- Also set SUPER_ADMIN_EMAIL in the app's environment to the same address.
-- ---------------------------------------------------------------------------
