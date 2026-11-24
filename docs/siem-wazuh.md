# SIEM and Wazuh

ThreatLens can receive security events from two kinds of senders, store them, show them live, and turn the
important ones into cases. It can also send commands back (isolate a host, collect forensics) through Wazuh.

```
Windows event logs ──► ThreatLens-Agent.ps1 ──► POST /api/siem/ingest ─────┐
                                                                            ▼
Wazuh manager ──► custom-webhook.py ──► POST /api/integrations/wazuh ──► endpoint_logs ──► SIEM page (live)
                                                                            │
                                                          detection rules / severity ──► cases, IOCs, MITRE
```

Both endpoints are **machine-to-machine** and accept only the shared secret, not a user session.

## 1. Create the shared key

Generate a long random value and put it in your environment:

```bash
openssl rand -hex 32
```

```bash
SIEM_AGENT_API_KEY=<the value you just generated>
```

Every sender must send `Authorization: Bearer <that value>`. If the variable is unset, both endpoints answer
**500** and log a warning, so you notice the misconfiguration. There is no default key. The key is compared in
constant time.

Rotate it any time by changing the variable and updating each sender.

## 2. Windows forwarder (`/api/siem/ingest`)

`scripts/ThreatLens-Agent.ps1` reads the Windows **Security** and **System** event logs and forwards them.

1. Copy the script to the Windows machine (a VM is fine).
2. Set where to send and the key, then run it in PowerShell:

   ```powershell
   $env:THREATLENS_INGEST_URL = "https://your-threatlens/api/siem/ingest"
   $env:SIEM_AGENT_API_KEY    = "<your key>"
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   .\ThreatLens-Agent.ps1
   ```

   Or pass them as parameters: `.\ThreatLens-Agent.ps1 -ApiUrl https://... -ApiKey <key>`.
3. Other parameters: `-BatchSize` (default 10) and `-SleepSeconds` (default 5).
4. Watch **SIEM and Endpoints** in the dashboard; events appear within seconds.

Isolation helpers on the same script (run on the endpoint, as administrator):

- `-Isolate` adds Windows Firewall rules that block inbound and outbound traffic except to your management
  address.
- `-Recover` removes them.

### The event format

`/api/siem/ingest` takes a JSON **array** (or a single object) of Windows-style events:

```json
[
  {
    "TimeCreated": "2026-01-01T12:00:00Z",
    "MachineName": "WIN-LAB-01",
    "Id": 1102,
    "ProviderName": "Microsoft-Windows-Eventlog",
    "LevelDisplayName": "Critical",
    "Message": "The audit log was cleared."
  }
]
```

Limits: at most **200 events** per request and **1 MB** of JSON. Larger batches get a 413.

### Try it without an agent

```bash
curl -X POST http://localhost:3000/api/siem/ingest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SIEM_AGENT_API_KEY" \
  -d '[{"TimeCreated":"2026-01-01T12:00:00Z","MachineName":"TEST-HOST","Id":4625,"ProviderName":"Microsoft-Windows-Security-Auditing","LevelDisplayName":"Warning","Message":"An account failed to log on."}]'
```

A successful call answers `{"success":true,"count":1}` and the event shows up on the SIEM page.

## 3. Wazuh (`/api/integrations/wazuh`)

Wazuh alerts have their own JSON shape (`rule`, `agent`, `data`), so they go to a different endpoint.

### Install the bridge script

On the Wazuh manager:

```bash
sudo cp custom-webhook.py /var/ossec/integrations/custom-threatlens
sudo chmod 750 /var/ossec/integrations/custom-threatlens
sudo chown root:wazuh /var/ossec/integrations/custom-threatlens
```

### Tell Wazuh to use it

Add this to `/var/ossec/etc/ossec.conf` inside `<ossec_config>`:

```xml
<integration>
  <name>custom-threatlens</name>
  <hook_url>https://your-threatlens/api/integrations/wazuh</hook_url>
  <api_key>YOUR_SIEM_AGENT_API_KEY</api_key>
  <level>3</level>
  <alert_format>json</alert_format>
</integration>
```

Then restart:

```bash
sudo systemctl restart wazuh-manager
```

`<level>3</level>` forwards alerts of level 3 and above. The script sends the key as the bearer token.

### What happens to each alert

| Wazuh rule level | Severity in ThreatLens | Result |
|---|---|---|
| 0 to 3 | Low | Stored as a log line |
| 4 to 6 | Medium | Stored as a log line |
| 7 to 11 | High | Stored **and an automatic case is opened** |
| 12 and up | Critical | Stored **and an automatic case is opened** |

An automatic case is titled `[Wazuh] <rule description>` and contains the agent name and IP, rule ID and
level, the MITRE ATT&CK technique, the log location and the event fields. The webhook also fills in the
case's **Threat mapping** (MITRE), **IOCs** (the agent's IP) and **Timeline** tabs.

### Sample rules

`local_rules.xml` has three Windows rules you can copy into `/var/ossec/etc/rules/local_rules.xml`:

| Rule | Level | Triggers on |
|---|---|---|
| 100010 | 15 | The Windows Security audit log was cleared (event 1102) |
| 100011 | 7 | A failed Windows logon (event 4625) |
| 100012 | 12 | Three failed logons from one source within two minutes (brute force) |

Restart the manager after editing rules.

## 4. Detection rules (inside ThreatLens)

Events from the Windows forwarder are checked against the rules under **Automation Rules** before being
stored. A rule has a **target field**, a **pattern** (a "contains" match, case-insensitive) and an **action**:

| Action | What it does |
|---|---|
| Drop log | Discards the event so it is never stored. Good for noise. |
| Create case | Stores the event and opens a case titled `[SOAR Alert] <rule> on <machine>` |
| Flag IOC | Stores the event and adds a high-risk indicator entry named `SOAR-FLAG-<machine>-<time>` |
| Isolate host | Stores the event and opens a case titled `[EDR ISOLATED] ...` |

Target fields you can match on: `message`, `machine_name`, `event_id`, `provider`, `level`.

Example: to open a case whenever PowerShell runs an encoded command, create a rule with target `message`,
pattern `-enc`, action **Create case**, severity **High**.

> The **Isolate host** rule action records the case; it does not by itself contact the endpoint. To actually
> isolate a machine use the case's **Isolate Host** button (below).

> **Playbooks** (the drag-and-drop builder) are saved definitions in this version. Automatic execution on
> ingest is done by the rules above.

## 5. Active response (isolate and collect)

From a case you can send commands to the endpoint through the Wazuh manager API:

- **Isolate Host** asks Wazuh to run an `isolate-host` active response on the agent.
- **Digital Forensics** offers memory dump (`forensics-memdump`), live triage (`forensics-triage`) and file
  quarantine (`forensics-quarantine`).

Wazuh does not ship these scripts. You must install matching active-response commands on the agents; until
then the manager answers with an error and ThreatLens shows it. Configure the API connection:

```bash
WAZUH_API_URL=https://wazuh-manager:55000
WAZUH_API_USER=your-api-user
WAZUH_API_PASSWORD=your-api-password
WAZUH_CA_CERT="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
```

The manager's certificate is **verified** by default. If it is self-signed, pin it with `WAZUH_CA_CERT`. For a
disposable lab you can set `WAZUH_TLS_INSECURE=true`, but never do that in production.

## Limits and safety

- Agent routes allow 120 requests per IP per minute by default (`RATE_LIMIT_INGEST`).
- Request bodies are capped (1 MB for ingest, 256 KB for Wazuh alerts).
- Only the bearer token is accepted; user sessions cannot call these endpoints.
- Put the app behind HTTPS if the manager or agents are on another network.

## Troubleshooting

| Symptom | Check |
|---|---|
| `500` from the endpoint | `SIEM_AGENT_API_KEY` is not set on the server |
| `401` | The sender's key differs from the server's, or the header is missing |
| `403 ... demo mode` | The deployment is in demo mode (Supabase not configured) |
| `413` | Too many events (over 200) or the body is over the size cap |
| `429` | The sender is too chatty; lower its rate or raise `RATE_LIMIT_INGEST` |
| Events arrive but no cases | The Wazuh rule level is below 7, or no detection rule matches |
| Isolate or forensics buttons fail | Wazuh API settings are wrong, or the active-response command is not installed on the agent |
