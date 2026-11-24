/* eslint-disable @typescript-eslint/no-explicit-any */
import { DEMO_USER, createDemoDb, type Db, type Row } from "./data";

/**
 * A small in-memory stand-in for the parts of the Supabase client this app uses
 * (query builder, auth, realtime channels). It is only used in demo mode.
 * Changes live in memory and are lost on reload/restart.
 */

type Result = { data: any; error: any; count?: number | null };

// Embedded resources: select("*, ioc_tags(tag)") and friends.
const RELATIONS: Record<string, Record<string, { table: string; fk: string; kind: "many" | "one" }>> = {
  iocs: { ioc_tags: { table: "ioc_tags", fk: "ioc_id", kind: "many" } },
  threatlens_domains: { threatlens_scans: { table: "threatlens_scans", fk: "domain_id", kind: "many" } },
  threatlens_scans: {
    threatlens_domains: { table: "threatlens_domains", fk: "domain_id", kind: "one" },
    threatlens_findings: { table: "threatlens_findings", fk: "scan_id", kind: "many" },
  },
  campaigns: { threat_actors: { table: "threat_actors", fk: "threat_actor_id", kind: "one" } },
  malware_families: { threat_actors: { table: "threat_actors", fk: "threat_actor_id", kind: "one" } },
};

const ANALYST = { id: DEMO_USER.id, raw_user_meta_data: { full_name: "Demo Analyst" } };

interface Embed {
  alias: string;
  name: string;
  cols: string;
}

/** Split "*, a(b, c), d:e.f(g)" into plain columns and embeds. */
function parseSelect(sel: string): { cols: string[]; embeds: Embed[] } {
  const parts: string[] = [];
  let depth = 0;
  let cur = "";
  for (const ch of sel) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  if (cur.trim()) parts.push(cur.trim());
  const cols: string[] = [];
  const embeds: Embed[] = [];
  for (const p of parts) {
    const m = /^(?:([\w]+):)?([\w.]+)\s*\(([\s\S]*)\)$/.exec(p);
    if (m) embeds.push({ alias: m[1] || m[2], name: m[2], cols: m[3].trim() });
    else if (p) cols.push(p);
  }
  return { cols, embeds };
}

const pick = (row: Row, cols: string) => {
  if (cols.trim() === "*" || cols.trim() === "") return { ...row };
  const out: Row = {};
  for (const c of cols.split(",").map((s) => s.trim()).filter(Boolean)) out[c] = row[c];
  return out;
};

function likeToRegex(pattern: string, ci: boolean) {
  const esc = pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${esc}$`, ci ? "i" : "");
}

let counter = 1000;
const newId = () => `demo-${Date.now().toString(36)}-${counter++}`;

class Builder implements PromiseLike<Result> {
  private op: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private filters: Array<(r: Row) => boolean> = [];
  private payload: any = null;
  private orders: Array<{ col: string; asc: boolean }> = [];
  private lim: number | null = null;
  private offset = 0;
  private singleMode: "single" | "maybe" | null = null;
  private cols = "*";
  private wantsReturn = false;
  private countMode = false;
  private head = false;
  private conflict = "id";

  constructor(private db: Db, private table: string) {}

  select(cols = "*", opts?: { count?: string; head?: boolean }) {
    this.cols = cols;
    this.wantsReturn = true;
    if (opts?.count) this.countMode = true;
    if (opts?.head) this.head = true;
    return this;
  }
  insert(rows: Row | Row[]) { this.op = "insert"; this.payload = rows; return this; }
  update(values: Row) { this.op = "update"; this.payload = values; return this; }
  upsert(rows: Row | Row[], opts?: { onConflict?: string }) { this.op = "upsert"; this.payload = rows; if (opts?.onConflict) this.conflict = opts.onConflict; return this; }
  delete() { this.op = "delete"; return this; }

  eq(c: string, v: any) { this.filters.push((r) => r[c] === v); return this; }
  neq(c: string, v: any) { this.filters.push((r) => r[c] !== v); return this; }
  gt(c: string, v: any) { this.filters.push((r) => r[c] > v); return this; }
  gte(c: string, v: any) { this.filters.push((r) => r[c] >= v); return this; }
  lt(c: string, v: any) { this.filters.push((r) => r[c] < v); return this; }
  lte(c: string, v: any) { this.filters.push((r) => r[c] <= v); return this; }
  in(c: string, vs: any[]) { this.filters.push((r) => vs.includes(r[c])); return this; }
  is(c: string, v: any) { this.filters.push((r) => (v === null ? r[c] == null : r[c] === v)); return this; }
  like(c: string, p: string) { const re = likeToRegex(p, false); this.filters.push((r) => re.test(String(r[c] ?? ""))); return this; }
  ilike(c: string, p: string) { const re = likeToRegex(p, true); this.filters.push((r) => re.test(String(r[c] ?? ""))); return this; }
  match(o: Row) { for (const [k, v] of Object.entries(o)) this.eq(k, v); return this; }
  not(c: string, op: string, v: any) {
    this.filters.push((r) => (op === "is" ? !(v === null ? r[c] == null : r[c] === v) : op === "eq" ? r[c] !== v : true));
    return this;
  }
  or(expr: string) {
    const conds = expr.split(",").map((part) => {
      const [col, op, ...rest] = part.split(".");
      const val = rest.join(".");
      return (r: Row) => (op === "eq" ? String(r[col]) === val : op === "neq" ? String(r[col]) !== val : op === "ilike" || op === "like" ? likeToRegex(val, true).test(String(r[col] ?? "")) : false);
    });
    this.filters.push((r) => conds.some((c) => c(r)));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) { this.orders.push({ col, asc: opts?.ascending !== false }); return this; }
  limit(n: number) { this.lim = n; return this; }
  range(from: number, to: number) { this.offset = from; this.lim = to - from + 1; return this; }
  single() { this.singleMode = "single"; return this; }
  maybeSingle() { this.singleMode = "maybe"; return this; }

  private rows() {
    return (this.db[this.table] ??= []);
  }

  private project(row: Row): Row {
    const { cols, embeds } = parseSelect(this.cols);
    const base = cols.length === 0 ? (embeds.length ? {} : { ...row }) : cols.includes("*") ? { ...row } : pick(row, cols.join(","));
    if (cols.includes("*") && embeds.length === 0) return base;
    for (const e of embeds) {
      const rel = RELATIONS[this.table]?.[e.name];
      if (e.name === "auth.users") {
        base[e.alias] = ANALYST;
      } else if (!rel) {
        base[e.alias] = null;
      } else if (rel.kind === "many") {
        base[e.alias] = (this.db[rel.table] ?? []).filter((r) => r[rel.fk] === row.id).map((r) => pick(r, e.cols));
      } else {
        const target = (this.db[rel.table] ?? []).find((r) => r.id === row[rel.fk]);
        base[e.alias] = target ? pick(target, e.cols) : null;
      }
    }
    return base;
  }

  private run(): Result {
    const rows = this.rows();
    const matches = () => rows.filter((r) => this.filters.every((f) => f(r)));

    if (this.op === "insert" || this.op === "upsert") {
      const incoming: Row[] = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((r: Row) => ({
        id: newId(),
        created_at: new Date().toISOString(),
        ...r,
      }));
      const written: Row[] = [];
      for (const r of incoming) {
        const existing = this.op === "upsert" ? rows.find((x) => x[this.conflict] === r[this.conflict]) : undefined;
        if (existing) {
          Object.assign(existing, { ...r, id: existing.id });
          written.push(existing);
        } else {
          rows.push(r);
          written.push(r);
        }
      }
      return this.finish(written.map((r) => this.project(r)));
    }

    if (this.op === "update") {
      const hit = matches();
      hit.forEach((r) => Object.assign(r, this.payload, { updated_at: new Date().toISOString() }));
      return this.finish(hit.map((r) => this.project(r)));
    }

    if (this.op === "delete") {
      const hit = new Set(matches());
      this.db[this.table] = rows.filter((r) => !hit.has(r));
      return this.finish([...hit].map((r) => this.project(r)));
    }

    // select
    let out = matches();
    const total = out.length;
    for (const { col, asc } of [...this.orders].reverse()) {
      out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
    }
    if (this.offset) out = out.slice(this.offset);
    if (this.lim !== null) out = out.slice(0, this.lim);
    const result = this.finish(out.map((r) => this.project(r)));
    if (this.countMode) result.count = total;
    if (this.head) result.data = null;
    return result;
  }

  private finish(data: Row[]): Result {
    const isWrite = this.op !== "select";
    if (isWrite && !this.wantsReturn) return { data: null, error: null };
    if (this.singleMode === "single") {
      return data.length === 1 ? { data: data[0], error: null } : { data: null, error: { message: "JSON object requested, multiple (or no) rows returned", code: "PGRST116" } };
    }
    if (this.singleMode === "maybe") return { data: data[0] ?? null, error: null };
    return { data, error: null };
  }

  then<R1 = Result, R2 = never>(
    onfulfilled?: ((value: Result) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2> {
    let result: Result;
    try {
      result = this.run();
    } catch (e: any) {
      result = { data: null, error: { message: String(e?.message ?? e) } };
    }
    return Promise.resolve(result).then(onfulfilled, onrejected);
  }
}

function channel() {
  const ch: any = {
    on: () => ch,
    subscribe: (cb?: (status: string) => void) => {
      cb?.("SUBSCRIBED");
      return ch;
    },
    unsubscribe: async () => "ok",
  };
  return ch;
}

export function createMockSupabase(db: Db = createDemoDb()): any {
  const ok = async () => ({ data: {}, error: null });
  const goToDashboard = async () => {
    if (typeof window !== "undefined") window.location.href = "/dashboard";
    return { data: {}, error: null };
  };
  return {
    from: (table: string) => new Builder(db, table),
    rpc: async () => ({ data: null, error: null }),
    channel,
    removeChannel: async () => "ok",
    auth: {
      getUser: async () => ({ data: { user: DEMO_USER }, error: null }),
      getSession: async () => ({ data: { session: { user: DEMO_USER, access_token: "demo", refresh_token: "demo" } }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      // Any credentials work in the demo; nothing is checked or stored.
      signInWithPassword: async () => ({ data: { user: DEMO_USER, session: { user: DEMO_USER } }, error: null }),
      signInWithOAuth: goToDashboard,
      exchangeCodeForSession: ok,
      updateUser: ok,
      resend: ok,
      resetPasswordForEmail: ok,
      linkIdentity: ok,
      unlinkIdentity: ok,
    },
  };
}

// Browser: one shared store per page load. Server: one per process (read-only in practice,
// because every server action refuses writes in demo mode).
let shared: any = null;
export function getSharedMockSupabase(): any {
  return (shared ??= createMockSupabase());
}
