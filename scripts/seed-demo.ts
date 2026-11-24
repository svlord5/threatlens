/**
 * Seeds SYNTHETIC demo data into the Supabase project in your env.
 * All indicators use reserved/documentation ranges (RFC 5737 IPs, example.* domains,
 * made-up hashes); nothing here is real telemetry.
 *
 *   DEMO_SEED_CONFIRM=yes npx tsx scripts/seed-demo.ts
 *
 * Idempotent: removes its own previous rows (title "[DEMO] ...", machines "DEMO-*",
 * the IOC values below) before inserting. Point it at a dedicated demo project.
 */
import { createClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey } from "../src/utils/supabase/keys";

if (process.env.DEMO_SEED_CONFIRM !== "yes") {
  console.error("Refusing to run: set DEMO_SEED_CONFIRM=yes (and point at a demo Supabase project).");
  process.exit(1);
}
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error("NEXT_PUBLIC_SUPABASE_URL is not set.");
  process.exit(1);
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, getSupabaseSecretKey(), {
  auth: { persistSession: false },
});

const iocs = [
  { value: "198.51.100.23", type: "IP", risk_score: 92 },
  { value: "203.0.113.77", type: "IP", risk_score: 74 },
  { value: "update-check.example.net", type: "DOMAIN", risk_score: 88 },
  { value: "login-portal.example.org", type: "DOMAIN", risk_score: 81 },
  { value: "http://198.51.100.23/payload.bin", type: "URL", risk_score: 95 },
  { value: "d41d8cd98f00b204e9800998ecf8427e", type: "HASH", risk_score: 60 },
  { value: "0000000000000000000000000000000000000000000000000000000000demo01", type: "HASH", risk_score: 97 },
].map((i) => ({
  ...i,
  status: "Active",
  reputation: i.risk_score >= 80 ? "Malicious" : i.risk_score >= 50 ? "Suspicious" : "Unknown",
}));

const cases = [
  { title: "[DEMO] Suspicious PowerShell on DEMO-WIN-01", severity: "High", status: "Open", description: "Synthetic case: encoded PowerShell spawned by an Office process. Beacon to 198.51.100.23 (documentation IP)." },
  { title: "[DEMO] Credential phishing report", severity: "Medium", status: "In Progress", description: "Synthetic case: user reported a lookalike login page at login-portal.example.org." },
  { title: "[DEMO] Repeated failed logons on DEMO-SRV-02", severity: "Low", status: "Closed", description: "Synthetic case: brute-force noise from 203.0.113.77, blocked at the perimeter." },
];

const now = Date.now();
const logs = [
  ["DEMO-WIN-01", "4688", "Microsoft-Windows-Security-Auditing", "Information", "A new process was created: powershell.exe -enc SQBFAFgA... (synthetic)"],
  ["DEMO-WIN-01", "3", "Microsoft-Windows-Sysmon", "Warning", "Network connection: powershell.exe -> 198.51.100.23:443 (synthetic)"],
  ["DEMO-SRV-02", "4625", "Microsoft-Windows-Security-Auditing", "Warning", "An account failed to log on. Source 203.0.113.77 (synthetic)"],
  ["DEMO-SRV-02", "4625", "Microsoft-Windows-Security-Auditing", "Warning", "An account failed to log on. Source 203.0.113.77 (synthetic)"],
  ["DEMO-LNX-03", "1", "sshd", "Information", "Accepted publickey for demo-user from 192.0.2.15 (synthetic)"],
].map(([machine_name, event_id, provider, level, message], i) => ({
  timestamp: new Date(now - i * 7 * 60 * 1000).toISOString(),
  machine_name,
  event_id,
  provider,
  level,
  message,
  raw_data: { synthetic: true, MachineName: machine_name, Id: event_id, Message: message },
}));

async function main() {
  await supabase.from("endpoint_logs").delete().like("machine_name", "DEMO-%");
  await supabase.from("case").delete().like("title", "[DEMO] %");
  await supabase.from("ioc").delete().in("value", iocs.map((i) => i.value));

  const results = await Promise.all([
    supabase.from("ioc").insert(iocs),
    supabase.from("case").insert(cases),
    supabase.from("endpoint_logs").insert(logs),
  ]);
  const failed = results.filter((r) => r.error);
  if (failed.length) {
    failed.forEach((r) => console.error("Seed error:", r.error?.message));
    process.exit(1);
  }
  console.log(`Seeded ${iocs.length} IOCs, ${cases.length} cases, ${logs.length} log events.`);
}
main();
