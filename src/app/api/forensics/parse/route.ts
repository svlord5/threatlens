import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { rejectLargeBody, LIMITS } from "@/lib/limits";

export async function POST(req: Request) {
  const authz = await requireAuth(req, { blockDemo: true });
  if (!authz.ok) return authz.response;
  const limited = await rateLimit(req, authz, ["forensics", "gemini"]);
  if (limited) return limited;
  const tooBig = rejectLargeBody(req, LIMITS.body.medium);
  if (tooBig) return tooBig;

  try {
    const { moduleId, os, logs } = await req.json();

    if (!logs || typeof logs !== "string") {
      return NextResponse.json({ error: "No logs provided." }, { status: 400 });
    }
    if (logs.length > LIMITS.logTextLength || String(moduleId ?? "").length > 64 || String(os ?? "").length > 32) {
      return NextResponse.json({ error: "Input too large." }, { status: 413 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is missing." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    let instructions = "";
    if (moduleId === "network-connections") {
      instructions = `
        Parse the following ${os} raw network connection output (e.g. netstat/ss/lsof).
        Return a JSON array of objects with the following schema:
        [
          { "protocol": "TCP", "local_address": "192.168.1.5:443", "foreign_address": "1.2.3.4:80", "state": "ESTABLISHED", "pid_program": "1234/chrome", "explanation": "Google Chrome browser connection", "is_suspicious": false }
        ]
        Flag 'is_suspicious' as true ONLY if the foreign address looks like a known malicious port (e.g. 4444, 1337) or if the program name is suspicious (e.g. powershell, cmd, bash making external connections).
      `;
    } else if (moduleId === "scheduled-tasks") {
      instructions = `
        Parse the following ${os} scheduled tasks output.
        Return a JSON array of objects with the following schema:
        [
          { "task_name": "UpdateTask", "state": "Ready", "action_or_path": "C:\\temp\\malware.exe", "explanation": "Suspicious executable in Temp folder", "is_suspicious": true }
        ]
        Flag 'is_suspicious' as true if the path points to temporary directories (Appdata, Temp, /tmp), uses obfuscation, or runs powershell/cmd with encoded payloads.
      `;
    } else if (moduleId === "auth-logs") {
      instructions = `
        Parse the following ${os} authentication/security logs.
        Return a JSON array of objects with the following schema:
        [
          { "timestamp": "Oct 12 10:00:00", "event_type": "Failed Login", "user": "root", "source_ip": "5.5.5.5", "explanation": "SSH brute force attempt", "is_suspicious": true }
        ]
        Flag 'is_suspicious' as true if there are repeated failed logins (brute force) or logins for disabled/default accounts (root, administrator).
      `;
    } else if (moduleId === "process-list") {
      instructions = `
        Parse the following ${os} process list output.
        Return a JSON array of objects with the following schema:
        [
          { "pid": "1234", "process_name": "powershell.exe", "command_line": "powershell -enc JABz...", "explanation": "Obfuscated powershell execution", "is_suspicious": true }
        ]
        Flag 'is_suspicious' as true if the command line contains obfuscation (base64, -enc), network download cradles (Invoke-WebRequest, curl, wget), or execution from temporary folders.
      `;
    } else {
      instructions = `
        Parse the following raw text logs.
        Identify the key columns and extract them into a clean JSON array of objects.
        Determine if any row contains suspicious artifacts and add a boolean 'is_suspicious' flag to the object.
      `;
    }

    const prompt = `
      You are an expert Digital Forensics and Incident Response (DFIR) AI.
      ${instructions}

      CRITICAL INSTRUCTION: 
      Your primary goal is to act as a LOG PARSER. You must structure the messy terminal output into a clean, human-readable JSON table.
      Do NOT drop benign entries. Return the entries exactly as they appear, but formatted into JSON objects.
      Add an 'explanation' string field to EVERY object, explaining in 3-6 words what this specific process or connection is doing (e.g. 'Browser process', 'System idle task', 'Reverse shell beacon').
      Add an 'is_suspicious' boolean flag to each object.
      To ensure the request doesn't timeout, limit your output to a MAXIMUM of 100 entries (prioritize keeping any suspicious ones if you must truncate).

      Extract the valid entries into a valid JSON array. Ignore header rows or formatting artifacts.
      If there is NO data, return an empty array [].

      RAW LOGS:
      ${logs.substring(0, 15000)} // Truncate to avoid context limits if extremely large
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const parsed = JSON.parse(responseText.trim());

    return NextResponse.json({ success: true, parsed });
  } catch (error: any) {
    console.error("Forensics parsing failed:", error);
    return NextResponse.json({ error: error.message || "Failed to analyze logs." }, { status: 500 });
  }
}
