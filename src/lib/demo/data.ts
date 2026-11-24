/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Synthetic demo data. NOTHING here is real: IPs come from the RFC 5737
 * documentation ranges, domains are example.*, hashes are made up, people are
 * invented. Used when no Supabase project is configured (or NEXT_PUBLIC_DEMO_MODE=true).
 */

export type Row = Record<string, any>;
export type Db = Record<string, Row[]>;

export const DEMO_USER = {
  id: "demo-user",
  email: "demo@example.com",
  email_confirmed_at: "2026-01-01T00:00:00.000Z",
  created_at: "2026-01-01T09:00:00.000Z",
  last_sign_in_at: new Date().toISOString(),
  identities: [] as any[],
  app_metadata: { provider: "email" },
  user_metadata: { full_name: "Demo Analyst", name: "Demo Analyst" },
};

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
const id = (prefix: string, n: number) => `${prefix}-${String(n).padStart(4, "0")}`;

export function createDemoDb(): Db {
  const cases: Row[] = [
    { id: id("case", 1), title: "Suspicious PowerShell on WIN-FIN-01", severity: "High", status: "Investigating", description: "Encoded PowerShell launched from an Office process, beaconing to 198.51.100.23 (documentation IP).\n\n**Next:** collect memory, review parent process tree.", created_at: iso(60 * 5) },
    { id: id("case", 2), title: "Credential phishing report: payroll lure", severity: "Medium", status: "Open", description: "User reported a lookalike sign-in page at login-portal.example.org. Email headers show a spoofed sender.", created_at: iso(60 * 20) },
    { id: id("case", 3), title: "Repeated failed logons on SRV-DB-02", severity: "Low", status: "Closed", description: "Password-spray noise from 203.0.113.77, blocked at the perimeter. No successful logon.", created_at: iso(60 * 72) },
    { id: id("case", 4), title: "Possible ransomware staging on FILE-SRV-03", severity: "Critical", status: "Contained", description: "Mass file renames and a shadow-copy deletion command. Host isolated; restoring from backup.", created_at: iso(60 * 30) },
    { id: id("case", 5), title: "Unusual outbound DNS volume from LNX-WEB-04", severity: "Medium", status: "Open", description: "High-entropy subdomains queried against update-check.example.net (possible DNS tunnelling).", created_at: iso(60 * 8) },
  ];

  const iocValues: Array<[string, string, number]> = [
    ["198.51.100.23", "IP", 92], ["203.0.113.77", "IP", 74], ["192.0.2.88", "IP", 55],
    ["update-check.example.net", "DOMAIN", 88], ["login-portal.example.org", "DOMAIN", 81], ["cdn-sync.example.com", "DOMAIN", 47],
    ["http://198.51.100.23/payload.bin", "URL", 95], ["https://login-portal.example.org/verify", "URL", 79],
    ["d41d8cd98f00b204e9800998ecf8427e", "MD5", 35], ["da39a3ee5e6b4b0d3255bfef95601890afd80709", "SHA1", 41],
    ["0000000000000000000000000000000000000000000000000000000000demo01", "SHA256", 97],
    ["0000000000000000000000000000000000000000000000000000000000demo02", "SHA256", 90],
    ["billing@payroll-update.example.org", "EMAIL", 66], ["HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater", "REGISTRY", 72],
  ];
  const ioc: Row[] = iocValues.map(([value, type, risk_score], i) => ({
    id: id("ioc", i + 1), value, type, risk_score, status: "Active",
    reputation: risk_score >= 80 ? "Malicious" : risk_score >= 50 ? "Suspicious" : "Unknown",
    created_at: iso(30 + i * 97),
  }));
  const iocs: Row[] = iocValues.map(([value, type, score], i) => ({
    id: id("iocs", i + 1), value, type,
    severity: score >= 90 ? "Critical" : score >= 75 ? "High" : score >= 50 ? "Medium" : "Low",
    confidence_score: score, expiration_date: null, campaign_id: i % 3 === 0 ? id("camp", 1) : null, created_by: DEMO_USER.id,
    created_at: iso(45 + i * 83),
  }));
  const ioc_tags: Row[] = iocs.slice(0, 8).flatMap((r, i) => [
    { ioc_id: r.id, tag: i % 2 ? "phishing" : "c2" },
    { ioc_id: r.id, tag: "demo" },
  ]);

  const machines = ["WIN-FIN-01", "SRV-DB-02", "FILE-SRV-03", "LNX-WEB-04", "WIN-HR-05"];
  const samples: Array<[string, string, string, string]> = [
    ["4688", "Microsoft-Windows-Security-Auditing", "Information", "A new process was created: powershell.exe -enc SQBFAFgA... (synthetic)"],
    ["3", "Microsoft-Windows-Sysmon", "Warning", "Network connection: powershell.exe to 198.51.100.23:443 (synthetic)"],
    ["4625", "Microsoft-Windows-Security-Auditing", "Warning", "An account failed to log on. Source 203.0.113.77 (synthetic)"],
    ["4624", "Microsoft-Windows-Security-Auditing", "Information", "An account was successfully logged on (synthetic)"],
    ["1102", "Microsoft-Windows-Eventlog", "Critical", "The audit log was cleared (synthetic)"],
    ["7045", "Service Control Manager", "Warning", "A service was installed in the system: UpdaterSvc (synthetic)"],
  ];
  const endpoint_logs: Row[] = Array.from({ length: 60 }, (_, i) => {
    const [event_id, provider, level, message] = samples[i % samples.length];
    const machine_name = machines[i % machines.length];
    const ts = iso(i * 6 + 2);
    return { id: id("log", i + 1), timestamp: ts, created_at: ts, machine_name, event_id, provider, level, message, raw_data: { synthetic: true, MachineName: machine_name, Id: Number(event_id), Message: message } };
  });

  return {
    case: cases,
    ioc,
    iocs,
    ioc_tags,
    case_ioc: [
      { case_id: id("case", 1), ioc_id: id("ioc", 1) }, { case_id: id("case", 1), ioc_id: id("ioc", 7) },
      { case_id: id("case", 2), ioc_id: id("ioc", 5) }, { case_id: id("case", 2), ioc_id: id("ioc", 13) },
    ],
    case_note: [
      { id: id("note", 1), case_id: id("case", 1), content: "Parent process is WINWORD.EXE; macro enabled document from a phishing email.", author: "Demo Analyst", created_at: iso(60 * 4) },
      { id: id("note", 2), case_id: id("case", 1), content: "Blocked 198.51.100.23 at the proxy. Awaiting memory image.", author: "Demo Analyst", created_at: iso(60 * 3) },
    ],
    case_mitre: [
      { id: id("mitre", 1), case_id: id("case", 1), tactic_id: "TA0002", tactic_name: "Execution", technique_id: "T1059.001", technique_name: "PowerShell", created_at: iso(60 * 4) },
      { id: id("mitre", 2), case_id: id("case", 1), tactic_id: "TA0011", tactic_name: "Command and Control", technique_id: "T1071.001", technique_name: "Web Protocols", created_at: iso(60 * 4) },
    ],
    case_pcap: [
      { id: id("pcap", 1), case_id: id("case", 1), packet_time: "00:00:01.120", source_ip: "10.0.5.18", dest_ip: "198.51.100.23", protocol: "TLS", length: 517, info: "Client Hello (SNI update-check.example.net)", is_malicious: true, created_at: iso(60 * 4) },
      { id: id("pcap", 2), case_id: id("case", 1), packet_time: "00:00:03.480", source_ip: "198.51.100.23", dest_ip: "10.0.5.18", protocol: "TCP", length: 1460, info: "Application Data (beacon response)", is_malicious: true, created_at: iso(60 * 4) },
      { id: id("pcap", 3), case_id: id("case", 1), packet_time: "00:00:05.002", source_ip: "10.0.5.18", dest_ip: "192.0.2.53", protocol: "DNS", length: 74, info: "Standard query A cdn-sync.example.com", is_malicious: false, created_at: iso(60 * 4) },
    ],
    case_hex: [
      { id: id("hex", 1), case_id: id("case", 1), offset_address: "0x0000", hex_bytes: "4D 5A 90 00 03 00 00 00", decoded_ascii: "MZ......", is_malicious: false, created_at: iso(60 * 4) },
      { id: id("hex", 2), case_id: id("case", 1), offset_address: "0x0040", hex_bytes: "68 74 74 70 3A 2F 2F 31", decoded_ascii: "http://1", is_malicious: true, created_at: iso(60 * 4) },
    ],
    investigations: [
      { id: id("inv", 1), case_id: id("case", 1), event_time: iso(60 * 5), timeline_event: "Alert fired: encoded PowerShell child of WINWORD.EXE. Host triaged.", analyst_id: DEMO_USER.id, created_at: iso(60 * 5) },
      { id: id("inv", 2), case_id: id("case", 1), event_time: iso(60 * 4), timeline_event: "Outbound beacon identified to 198.51.100.23. Blocked at the proxy.", analyst_id: DEMO_USER.id, created_at: iso(60 * 4) },
    ],
    evidence: [
      { id: id("ev", 1), case_id: id("case", 1), file_url: null, file_hash: "0000000000000000000000000000000000000000000000000000000000demo01", description: "Dropped payload (synthetic hash)", uploaded_by: DEMO_USER.id, created_at: iso(60 * 3) },
    ],
    feed: [
      { id: id("feed", 1), name: "Demo Threat Feed (IP blocklist)", health: "Healthy", status: "Enabled", indicators: "1284", last_sync: "10:02:11 UTC", endpoint_url: "https://feeds.example.com/blocklist.txt", auth_key: "", polling_interval: "1 hour", created_at: iso(60 * 200) },
      { id: id("feed", 2), name: "Demo Phishing Domains", health: "Healthy", status: "Enabled", indicators: "342", last_sync: "09:41:55 UTC", endpoint_url: "https://feeds.example.com/phish.json", auth_key: "", polling_interval: "30 minutes", created_at: iso(60 * 180) },
      { id: id("feed", 3), name: "Demo Malware Hashes", health: "Degraded", status: "Enabled", indicators: "9870", last_sync: "03:15:00 UTC", endpoint_url: "https://feeds.example.com/hashes.csv", auth_key: "", polling_interval: "6 hours", created_at: iso(60 * 150) },
      { id: id("feed", 4), name: "Windows 11 Lab Agent (SIEM)", health: "Healthy", status: "Enabled", indicators: "0", last_sync: "Real-time", endpoint_url: "https://your-host.example.com/api/siem/ingest", auth_key: "", polling_interval: "Real-time", created_at: iso(60 * 100) },
    ],
    endpoint_logs,
    detection_rules: [
      { id: id("rule", 1), name: "Encoded PowerShell", description: "Flags -enc / -EncodedCommand usage", target_field: "message", match_pattern: "-enc", action_type: "create_case", severity: "High", is_active: true, created_at: iso(60 * 90) },
      { id: id("rule", 2), name: "Audit log cleared", description: "Event 1102", target_field: "event_id", match_pattern: "1102", action_type: "create_case", severity: "Critical", is_active: true, created_at: iso(60 * 80) },
      { id: id("rule", 3), name: "Noisy health checks", description: "Drop heartbeat noise", target_field: "message", match_pattern: "heartbeat", action_type: "drop_log", severity: "Low", is_active: false, created_at: iso(60 * 70) },
    ],
    soar_playbooks: [
      { id: id("pb", 1), name: "Phishing triage", description: "Enrich sender, detonate URL, notify analyst", is_active: true, nodes: [
          { id: "n1", position: { x: 40, y: 60 }, data: { label: "Trigger: reported email" } },
          { id: "n2", position: { x: 300, y: 60 }, data: { label: "Enrich URL reputation" } },
          { id: "n3", position: { x: 560, y: 60 }, data: { label: "Open case" } },
        ], edges: [{ id: "e1", source: "n1", target: "n2" }, { id: "e2", source: "n2", target: "n3" }], created_at: iso(60 * 60), updated_at: iso(60 * 10) },
    ],
    audit_logs: [
      { id: id("audit", 1), action: "ACCESS_REQUEST", user_id: null, ip_address: "203.0.113.10", details: JSON.stringify({ fullName: "Alex Example", email: "alex@example.com", organization: "Example SOC", purpose: "Evaluate the platform", status: "PENDING" }), created_at: iso(60 * 6) },
      { id: id("audit", 2), action: "LOGIN", user_id: DEMO_USER.id, ip_address: "203.0.113.11", details: "{}", created_at: iso(60 * 2) },
    ],
    iam_discord_invites: [
      { discord_id: "100000000000000001", role: "Analyst", valid_until: null, super_admin: false, read_only: false, disable_copy: false, enforce_single_session: false, allowed_pages: null, current_session_token: null, created_at: iso(60 * 300) },
      { discord_id: "analyst@example.com", role: "Analyst", valid_until: null, super_admin: false, read_only: true, disable_copy: true, enforce_single_session: false, allowed_pages: ["/dashboard", "/dashboard/iocs"], current_session_token: null, created_at: iso(60 * 250) },
      { discord_id: "100000000000000099", role: "Super Admin", valid_until: null, super_admin: true, read_only: false, disable_copy: false, enforce_single_session: false, allowed_pages: null, current_session_token: null, created_at: iso(60 * 400) },
    ],
    profiles: [
      { id: DEMO_USER.id, full_name: "Demo Analyst", role: "Analyst", location: "Remote", specializations: ["Threat hunting", "Incident response"], created_at: iso(60 * 300) },
      { id: "profile-0002", full_name: "Sam Sample", role: "Analyst", created_at: iso(60 * 200) },
    ],
    threat_actors: [
      { id: id("actor", 1), name: "Demo Group Alpha", aliases: ["DG-A", "Blue Heron"], description: "Fictional financially motivated group used for demonstration.", origin_country: null, mitre_id: "G9001", created_at: iso(60 * 500) },
      { id: id("actor", 2), name: "Demo Group Bravo", aliases: ["DG-B"], description: "Fictional espionage-themed group used for demonstration.", origin_country: null, mitre_id: "G9002", created_at: iso(60 * 480) },
    ],
    malware_families: [
      { id: id("mal", 1), name: "DemoLoader", type: "Loader", description: "Synthetic loader family.", threat_actor_id: id("actor", 1), created_at: iso(60 * 450) },
      { id: id("mal", 2), name: "DemoRAT", type: "RAT", description: "Synthetic remote access trojan family.", threat_actor_id: id("actor", 2), created_at: iso(60 * 440) },
    ],
    campaigns: [
      { id: id("camp", 1), name: "Operation Paper Lantern (fictional)", start_date: "2026-03-01", end_date: null, target_sectors: ["Finance", "Healthcare"], threat_actor_id: id("actor", 1), created_at: iso(60 * 420) },
    ],
    threatlens_domains: [
      { id: id("dom", 1), domain: "example.com", user_id: DEMO_USER.id, last_scanned: iso(60 * 3), created_at: iso(60 * 20) },
      { id: id("dom", 2), domain: "login-portal.example.org", user_id: DEMO_USER.id, last_scanned: iso(60 * 6), created_at: iso(60 * 40) },
    ],
    threatlens_scans: [
      { id: id("scan", 1), domain_id: id("dom", 1), risk_score: 18, status: "Completed", dns_data: { A: ["192.0.2.10"], MX: ["mail.example.com"] }, ssl_data: { issuer: "Demo CA", valid_to: "2027-01-01" }, headers_data: { "strict-transport-security": "max-age=31536000" }, tech_data: ["Nginx"], ai_executive_summary: "Synthetic summary: low risk, standard hardening in place.", ai_technical_summary: "Synthetic technical notes. HSTS present, TLS valid.", created_at: iso(60 * 3) },
      { id: id("scan", 2), domain_id: id("dom", 2), risk_score: 82, status: "Completed", dns_data: { A: ["198.51.100.23"], MX: [] }, ssl_data: { issuer: "Demo CA", valid_to: "2026-12-01" }, headers_data: {}, tech_data: ["PHP"], ai_executive_summary: "Synthetic summary: lookalike sign-in page with credential form.", ai_technical_summary: "Synthetic technical notes. Missing security headers, recently registered.", created_at: iso(60 * 6) },
    ],
    threatlens_findings: [
      { id: id("find", 1), scan_id: id("scan", 2), title: "Credential form on recently registered domain", severity: "High", description: "A password field posts to an external host (synthetic).", impact: "Credentials could be harvested.", remediation: "Take the page down and report it to the registrar.", created_at: iso(60 * 6) },
      { id: id("find", 2), scan_id: id("scan", 2), title: "No Content-Security-Policy header", severity: "Low", description: "Synthetic finding.", impact: "Weaker protection against injection.", remediation: "Add a Content-Security-Policy header.", created_at: iso(60 * 6) },
    ],
    api_findings: [
      { id: id("api", 1), endpoint: "/api/v1/users/{id}", vulnerability_type: "BOLA / IDOR", risk_score: 88, proof_of_concept: "GET /api/v1/users/1002 as user 1001 returns the other profile (synthetic).", status: "Open", created_at: iso(60 * 40) },
      { id: id("api", 2), endpoint: "/api/v1/export", vulnerability_type: "Excessive data exposure", risk_score: 61, proof_of_concept: "Response includes internal flags (synthetic).", status: "In Review", created_at: iso(60 * 30) },
    ],
  };
}
