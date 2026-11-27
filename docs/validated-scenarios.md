# Validated scenarios

Three attacker behaviours that ThreatLens was exercised against in a lab: a Windows 11 virtual machine with a
Wazuh agent, reporting to a Wazuh manager that forwards alerts to ThreatLens. Each one follows the same path:

```
behaviour on the endpoint -> Wazuh rule fires -> ThreatLens case (MITRE mapped) -> analyst response
```

> **Read this first.** These are lab simulations, not production incidents, and they depend on parts that live
> **outside this repository**: the Wazuh manager and its rules, Sysmon on the endpoint, and the
> active-response scripts on the agent. The repo contains the receiving side (webhook, cases, MITRE mapping,
> the buttons that send response commands) and one custom rule file. Where something is not in the repo it is
> marked **lab-only** below, so you know what you must provide to reproduce it.

## How a Wazuh alert becomes a case

1. The Wazuh manager's integration posts each alert of level 3 or higher to `POST /api/integrations/wazuh`
   (see [SIEM and Wazuh](siem-wazuh.md)).
2. ThreatLens stores the event in `endpoint_logs`.
3. For alerts of **level 7 or higher** it opens a **case** (`Open`), copies the rule id, level and log context
   into the description, writes the rule's **MITRE ATT&CK** technique and tactic into the case's
   *Threat mapping* tab, and links the agent's IP as an indicator.
4. The case appears on the dashboard in real time. The analyst can then use **Isolate Host** and the
   **Digital Forensics** actions (memory dump, triage, file quarantine), which ask the Wazuh manager to run an
   active response on that agent. Each action is recorded on the case timeline.

The technique ids come from the Wazuh rule that fired, so they are only as good as the ruleset you run.

## Summary

| # | Behaviour | Detected by | MITRE ATT&CK | Analyst response used |
|---|---|---|---|---|
| 1 | Windows Security log cleared (event 1102) | Rule `100010` in [`local_rules.xml`](../local_rules.xml) | T1070.001 Clear Windows Event Logs | Isolate Host, triage collection |
| 2 | EICAR test file downloaded with PowerShell | Wazuh file-integrity monitoring and antivirus integration (**lab-only**) | T1105 Ingress Tool Transfer | File quarantine by hash |
| 3 | LSASS memory dump with `comsvcs.dll` | Sysmon process-access event through Wazuh (**lab-only**) | T1003.001 LSASS Memory | Isolate Host, memory dump |

## 1. Security audit log cleared (event 1102)

**Why it matters.** Clearing the Security log is a common way to hide earlier activity. The act of clearing it
writes event 1102, so it is reliably visible even though it destroys the rest.

**What was run** (elevated prompt, on the lab VM):

```bat
wevtutil cl Security
```

**What fires.** Wazuh decodes the Windows event, and the custom rule in this repo raises it to level 15:

```xml
<rule id="100010" level="15">
  <if_sid>63103</if_sid>
  <description>CRITICAL: Windows Security Audit Log was cleared! (Suspicious Activity)</description>
</rule>
```

Install it from [`local_rules.xml`](../local_rules.xml) as described in [SIEM and Wazuh](siem-wazuh.md#sample-rules).
Level 15 is above the case threshold, so ThreatLens opens a **High or Critical** case.

**In ThreatLens.**
- A new case with the rule id and the event context in its description.
- *Threat mapping* shows **T1070.001** (Defense Evasion) when the Wazuh rule carries that technique.
- Optional: set the `event_id` rule from [Automation Rules](usage-guide.md#automation-rules-dashboardautomation)
  (`event_id` contains `1102`) to open a case from the Windows forwarder path as well.

**Response.** Isolate the host so an attacker cannot move on, then collect a triage snapshot (processes,
connections, recent files) before investigating.

## 2. EICAR malware download

**Why it matters.** EICAR is the standard harmless test file that antivirus products detect as malware, so it
safely exercises the "malware delivered to the host" path.

**What was run** (PowerShell, on the lab VM): a download of the EICAR test file from the official EICAR site to
disk.

**What fires.** Wazuh file-integrity monitoring noticed the new file and the antivirus integration flagged it.
This relies on your Wazuh configuration (an FIM-monitored folder and an AV or VirusTotal integration) and the
stock Wazuh ruleset; neither is part of this repo.

**In ThreatLens.** A case classified **Critical**, with **T1105 Ingress Tool Transfer** in *Threat mapping* when
the matching rule carries it. The file hash or path can be added as an indicator.

**Response.** Use **Digital Forensics, File quarantine** and supply the file hash or path. ThreatLens sends a
`forensics-quarantine` active response to the agent, which removes the matching file.

## 3. LSASS credential dumping

**Why it matters.** Dumping the memory of `lsass.exe` is a standard way to steal cached credentials for lateral
movement.

**What was run** (elevated, on the lab VM): the well-known `comsvcs.dll` `MiniDump` technique against the LSASS
process, using `rundll32.exe`.

**What fires.** A Sysmon **process access** event (Sysmon event 10, target `lsass.exe`) forwarded by the Wazuh
agent. This needs Sysmon installed with a configuration that logs process access, plus Wazuh rules for it
(**lab-only**; not shipped here).

**In ThreatLens.** A **Critical** case with **T1003.001 OS Credential Dumping: LSASS Memory** in *Threat mapping*
when the rule carries it.

**Response.** **Isolate Host** first to stop credential reuse elsewhere, then **Digital Forensics, Memory dump**
to capture volatile evidence for offline analysis.

## What you need to reproduce this

| Piece | In this repo? |
|---|---|
| Wazuh webhook receiver, case creation, MITRE mapping | Yes (`src/app/api/integrations/wazuh/route.ts`) |
| Case page, timeline, Isolate Host and Digital Forensics buttons | Yes |
| Wazuh API client for active response | Yes (`src/lib/wazuh/api.ts`) |
| Custom rules for event 1102, failed logins, brute force | Yes ([`local_rules.xml`](../local_rules.xml)) |
| Windows forwarder agent | Yes (`scripts/ThreatLens-Agent.ps1`) |
| Wazuh manager, FIM, antivirus integration, Sysmon config | **No**, you provide them |
| Active-response scripts on the agent (`isolate-host`, `forensics-memdump`, `forensics-triage`, `forensics-quarantine`) | **No**, you write and install them. Until they exist, the manager answers with an error and ThreatLens shows it. |

Only run these simulations on machines you own, in an isolated lab.

## Related

- [SIEM and Wazuh](siem-wazuh.md): connecting the manager, rules and active response.
- [Usage guide](usage-guide.md): where each page and tab lives.
