"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabaseSecretKey } from "@/utils/supabase/keys";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { gatherWaybackArchives, gatherSubdomains, gatherIpIntelligence, generateDorks, queryVirusTotal, queryShodan, queryHaveIBeenPwned, querySslCertificate, queryAlienVault } from "@/lib/scanner/osint";
import { gatherWhois, gatherDnsIntelligence } from "@/lib/scanner/dns";
import { guardAction, blockInDemo } from "@/lib/action-guard";
import { LIMITS } from "@/lib/limits";

export type ActionState = {
  success: boolean;
  error?: string;
  id?: string;
};

function classifyIndicator(indicator: string): 'email' | 'hash' | 'ip' | 'url' | 'domain' | 'mobile' | 'upi' {
  const cleanInd = indicator.trim().replace(/\s/g, '');
  if (/^(?:\+91|91)?[6-9]\d{9}$/.test(cleanInd)) return 'mobile';
  
  if (indicator.includes('@')) {
    const parts = indicator.split('@');
    if (parts.length === 2 && !parts[1].includes('.')) return 'upi';
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(indicator)) return 'email';
  }

  if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(indicator)) return 'ip';
  if (/^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/.test(indicator)) return 'hash';
  if (/^https?:\/\//.test(indicator)) return 'url';
  return 'domain';
}

export async function runOsintScan(indicator: string, apiKeys?: any): Promise<{ success: boolean; data?: any; error?: string }> {
  if (typeof indicator !== "string" || indicator.length === 0 || indicator.length > LIMITS.urlLength) {
    return { success: false, error: "Indicator is empty or too long." };
  }
  const denied = await guardAction(["shodan", "virustotal", "gemini"]);
  if (denied) return { success: false, error: denied };
  try {
    const type = classifyIndicator(indicator);
    const { dorks, pivots } = generateDorks(indicator, type);
    
    const resolvedKeys = {
      abstractKey: apiKeys?.abstractKey || process.env.ABSTRACT_API_KEY || "",
      numverifyKey: apiKeys?.numverifyKey || process.env.NUMVERIFY_API_KEY || "",
      truecallerKey: apiKeys?.truecallerKey || process.env.TRUECALLER_API_KEY || "",
      npciKey: apiKeys?.npciKey || process.env.NPCI_API_KEY || "",
      hibpKey: apiKeys?.hibpKey || process.env.HIBP_API_KEY || "",
      otxKey: apiKeys?.otxKey || process.env.OTX_API_KEY || ""
    };

    let archives: string[] = [];
    let subdomains: string[] = [];
    let ipInfo: any = null;
    let vtInfo: any = null;
    let shodanInfo: any = null;
    const whoisData: string | null = null;
    const dnsInfo: any = null;
    let mobileInfo: any = null;
    const upiInfo: any = null;

    if (type === 'mobile') {
      if (resolvedKeys.truecallerKey) {
        return { success: false, error: "Truecaller Business API requires additional backend Enterprise configuration." };
      }

      let abstractData = null;
      let numverifyData = null;

      if (resolvedKeys.abstractKey) {
        try {
          const res = await fetch(`https://phonevalidation.abstractapi.com/v1/?api_key=${resolvedKeys.abstractKey}&phone=${indicator}`);
          if (res.ok) {
            const data = await res.json();
            if (!data.error) abstractData = data;
          }
        } catch(e) {}
      }

      if (resolvedKeys.numverifyKey) {
        try {
          const res = await fetch(`http://apilayer.net/api/validate?access_key=${resolvedKeys.numverifyKey}&number=${indicator}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success !== false) numverifyData = data;
          }
        } catch(e) {}
      }

      if (!abstractData && !numverifyData) {
         if (!resolvedKeys.abstractKey && !resolvedKeys.numverifyKey) {
           return { success: false, error: "Integration Pending: Abstract or Numverify API keys are missing. Please configure them in Account Settings to enable lookups." };
         }
         return { success: false, error: "Failed to resolve data from configured Mobile OSINT providers (Keys may be invalid or quota reached)." };
      }

      const providers = [];
      if (abstractData?.carrier) providers.push(abstractData.carrier);
      if (numverifyData?.carrier && numverifyData.carrier !== abstractData?.carrier) providers.push(numverifyData.carrier);
      const providerStr = providers.length > 0 ? providers.join(" / ") : "Unknown Provider";

      const regions = [];
      if (abstractData?.location || abstractData?.country_name) regions.push(abstractData.location || abstractData.country_name);
      if (numverifyData?.location && numverifyData.location !== (abstractData?.location || abstractData?.country_name)) regions.push(numverifyData.location);
      const regionStr = regions.length > 0 ? regions.join(" / ") : "Unknown Region";

      const isValid = (abstractData && abstractData.valid) || (numverifyData && numverifyData.valid);
      const validStr = isValid ? `Valid (${abstractData?.line_type || numverifyData?.line_type || 'Unknown Type'})` : "Invalid Number Format";

      mobileInfo = {
        number: indicator,
        provider: providerStr,
        circle: regionStr,
        truecaller_name: "Unavailable (Requires Truecaller)",
        spam_score: 0,
        ncrp_reports: 0,
        status: validStr,
        sources: [abstractData ? "Abstract" : null, numverifyData ? "Numverify" : null].filter(Boolean).join(" & ")
      };
    } else if (type === 'upi') {
      if (resolvedKeys.npciKey) {
        return { success: false, error: "NPCI API integration requires Level-4 KYC hardware tokens which are not present." };
      }
      return { success: false, error: "Integration Pending: NPCI API keys are missing. Please configure them in Account Settings to enable UPI intelligence lookups." };
    } else if (type === 'ip') {
      const [ipRes, vtRes, shodanRes] = await Promise.all([
        gatherIpIntelligence(indicator, resolvedKeys),
        queryVirusTotal(indicator, type),
        queryShodan(indicator)
      ]);
      ipInfo = ipRes;
      vtInfo = vtRes;
      shodanInfo = shodanRes;
    } else if (type === 'email') {
      const [hibpRes] = await Promise.all([
        queryHaveIBeenPwned(indicator, resolvedKeys.hibpKey)
      ]);
      return {
        success: true,
        data: {
          indicator,
          type,
          dorks,
          pivots,
          archives,
          subdomains,
          hibpInfo: hibpRes
        }
      };
    } else if (type === 'hash') {
      const vtInfo = await queryVirusTotal(indicator, type);
      const otxRes = await queryAlienVault(indicator, 'hash', resolvedKeys.otxKey);
      return {
        success: true,
        data: {
          indicator,
          type,
          dorks,
          pivots,
          vtInfo,
          otxInfo: otxRes
        }
      };
    } else {
      let targetDomain = indicator;
      if (type === 'url') targetDomain = indicator.replace(/^https?:\/\//, '').split('/')[0];
      
      const [a, s, vtRes, dnsRes, whoisRes, sslRes, otxRes] = await Promise.all([
        gatherWaybackArchives(targetDomain),
        gatherSubdomains(targetDomain),
        queryVirusTotal(targetDomain, 'domain'),
        gatherDnsIntelligence(targetDomain),
        gatherWhois(targetDomain),
        querySslCertificate(targetDomain),
        queryAlienVault(targetDomain, 'domain', resolvedKeys.otxKey)
      ]);
      archives = a;
      
      const combinedSubdomains = new Set([
        ...s, 
        ...(dnsRes.subdomains ? dnsRes.subdomains.map((sub: any) => sub.host) : [])
      ]);
      subdomains = Array.from(combinedSubdomains).sort() as string[];
      
      const whoisData = whoisRes;
      const vtInfo = vtRes;
      
      if (dnsRes.a_records && dnsRes.a_records.length > 0) {
        shodanInfo = await queryShodan(dnsRes.a_records[0]);
      }
      
      const dnsInfo = dnsRes;
      
      return {
        success: true,
        data: {
          type,
          indicator,
          dorks,
          pivots,
          archives,
          subdomains,
          dnsInfo,
          vtInfo,
          whoisData,
          sslInfo: sslRes,
          otxInfo: otxRes
        }
      };
    }

    return {
      success: true,
      data: { type, indicator, archives, subdomains, ipInfo, dorks, pivots, vtInfo, shodanInfo, whoisData, dnsInfo, mobileInfo, upiInfo },
    };
  } catch (error) {
    console.error("OSINT scan failed:", error);
    return { success: false, error: "Failed to perform OSINT scan." };
  }
}

export async function createCase(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const title = formData.get("title") as string;
    const severity = formData.get("severity") as string;
    const status = formData.get("status") as string || "Open";
    const description = formData.get("description") as string || "";
    
    if (!title || title.trim().length === 0) {
      return { error: "Title is required", success: false };
    }

    if (!severity) {
      return { error: "Severity is required", success: false };
    }

    if (title.length > 200 || description.length > 10000) {
      return { error: "Title (200) or description (10,000 characters) is too long", success: false };
    }

    const supabase = await createClient();
    
    const { data: newCase, error: dbError } = await supabase.from('case').insert({
      title: title.trim(),
      severity: severity,
      status: status,
      description: description.trim(),
    }).select().single();

    if (dbError || !newCase) {
      console.error("Supabase insert error:", dbError);
      return { error: "Failed to create case due to a database error.", success: false };
    }

    revalidatePath("/dashboard/cases");
    return { success: true, id: newCase.id };

  } catch (error) {
    console.error("Failed to create case:", error);
    return { error: "Failed to create case due to a database error.", success: false };
  }
}

export async function updateCaseField(caseId: string, field: string, value: string | null): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    
    const allowedFields = ['description', 'status', 'analyst_id'];
    if (!allowedFields.includes(field)) {
      return { error: "Invalid field.", success: false };
    }

    let updateValue = value;
    if (field === 'analyst_id' && value === 'Analyst (Me)') {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: "Not logged in", success: false };
      updateValue = user.id;
    }

    const { error: dbError } = await supabase
      .from('case')
      .update({ [field]: updateValue })
      .eq('id', caseId);

    if (dbError) {
      console.error("Supabase update error:", dbError);
      return { error: "Failed to update case.", success: false };
    }

    revalidatePath(`/dashboard/cases/${caseId}`);
    revalidatePath("/dashboard/cases");
    return { success: true };

  } catch (error) {
    console.error("Failed to update case field:", error);
    return { error: "Failed to update due to server error.", success: false };
  }
}

export async function deleteCase(caseId: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  const supabase = await createClient();
  const { error } = await supabase.from("case").delete().eq("id", caseId);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/dashboard/cases");
  return { success: true };
}

export async function generateMockTelemetry(caseId: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  const denied = await guardAction(["gemini"]);
  if (denied) return { success: false, error: denied };
  const supabase = await createClient(); // Normal client for fetching public stuff
  
  // Admin client to bypass RLS for inserting telemetry
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    getSupabaseSecretKey()
  );

  try {
    const { data: dbCase } = await supabase.from('case').select('title, description, created_at').eq('id', caseId).single();
    if (!dbCase) return { success: false, error: "Case not found" };

    // Try to find the RAW SIEM log associated with this case (within 10 seconds)
    let rawLogData = "";
    try {
      const caseTime = new Date(dbCase.created_at).getTime();
      const tenSecBefore = new Date(caseTime - 10000).toISOString();
      const tenSecAfter = new Date(caseTime + 10000).toISOString();
      
      const { data: endpointLog } = await supabaseAdmin
        .from("endpoint_logs")
        .select("raw_data")
        .gte("created_at", tenSecBefore)
        .lte("created_at", tenSecAfter)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();
        
      if (endpointLog && endpointLog.raw_data) {
        rawLogData = JSON.stringify(endpointLog.raw_data, null, 2);
      }
    } catch (e) {
      console.warn("Could not find raw log data for extraction.");
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
You are a senior Cyber Threat Intelligence data extraction engine.
Analyze the following security incident case and the RAW SIEM LOG PAYLOAD to extract REAL telemetry data.

Case Title: ${dbCase.title}
Case Description: ${dbCase.description}

RAW SIEM LOG PAYLOAD:
${rawLogData || "No raw log available. Infer context from description."}

INSTRUCTIONS:
1. DO NOT HALLUCINATE OR MOCK DATA. You must extract actual indicators from the RAW LOG PAYLOAD or Case Description.
2. If you find actual IP addresses, ports, or network protocols in the log, extract them into the \`pcap\` array as realistically as possible. If there is NO network data in the log, leave the pcap array empty.
3. If you find file hashes (SHA256, MD5), file paths, command executions, or memory artifacts in the log, extract them into the \`hex\` array as memory dumps or string artifacts. If there is NO malware/file data, leave the hex array empty.
4. If there is no Raw Log Payload and no useful data in the description, return empty arrays.

Return ONLY a valid JSON object matching this schema exactly:
{
  "pcap": [
    { "packet_time": "10:15:23", "source_ip": "1.2.3.4", "dest_ip": "5.6.7.8", "protocol": "TCP", "length": 1450, "info": "HTTP GET /...", "is_malicious": true }
  ],
  "hex": [
    { "offset_address": "0x00401000", "hex_bytes": "4D 5A 90 00 03 00 00 00", "decoded_ascii": "MZ......", "is_malicious": true }
  ]
}
`;
    
    // Helper to retry network failures (ECONNRESET, fetch failed)
    const withRetry = async (operation: () => Promise<any>, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          return await operation();
        } catch (error: any) {
          if (i === retries - 1) throw error;
          if (error.message?.includes("fetch failed") || error.message?.includes("ECONNRESET") || error.message?.includes("Error fetching from")) {
            await new Promise(res => setTimeout(res, 1500 * (i + 1))); // exponential backoff
          } else {
            throw error; // Not a network error, throw immediately
          }
        }
      }
    };

    const result = await withRetry(() => model.generateContent(prompt));
    const responseText = result.response.text();
    const generated = JSON.parse(responseText.trim());

    if ((!generated.pcap || generated.pcap.length === 0) && (!generated.hex || generated.hex.length === 0)) {
      return { success: false, error: "AI Analysis Complete: No network (PCAP) or memory (Hex) artifacts were found in this incident's logs." };
    }

    if (generated.pcap && generated.pcap.length > 0) {
      const pcapRows = generated.pcap.map((p: any) => ({ ...p, case_id: caseId }));
      const { error: pcapErr } = await withRetry(async () => await supabaseAdmin.from("case_pcap").insert(pcapRows));
      if (pcapErr) throw new Error("PCAP Insert Error: " + pcapErr.message);
    }

    if (generated.hex && generated.hex.length > 0) {
      const hexRows = generated.hex.map((h: any) => ({ ...h, case_id: caseId }));
      const { error: hexErr } = await withRetry(async () => await supabaseAdmin.from("case_hex").insert(hexRows));
      if (hexErr) throw new Error("Hex Insert Error: " + hexErr.message);
    }

    await supabaseAdmin.from("investigations").insert({
      case_id: caseId,
      event_time: new Date().toISOString(),
      description: "AI Artifact Extraction Complete.",
      action_taken: "Analyzed raw SIEM log payload and successfully extracted true artifacts into telemetry."
    });

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function addCaseNote(caseId: string, content: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    
    if (!content || content.trim() === '') {
      return { error: "Note content cannot be empty.", success: false };
    }
    if (content.length > 10000) {
      return { error: "Note is too long (10,000 characters maximum).", success: false };
    }

    const { data: newNote, error: dbError } = await supabase
      .from('case_note')
      .insert({
        case_id: caseId,
        content: content.trim(),
        author: "Analyst 1", // Mock logged in user
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase insert note error:", dbError);
      return { error: "Failed to add note.", success: false };
    }

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true, id: newNote.id };

  } catch (error) {
    console.error("Failed to add case note:", error);
    return { error: "Server error.", success: false };
  }
}

export async function createIoc(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const value = formData.get("value") as string;
    const type = formData.get("type") as string;
    const riskScore = parseInt(formData.get("riskScore") as string) || 0;
    
    if (!value || value.trim().length === 0) {
      return { error: "Indicator value is required", success: false };
    }

    if (!type) {
      return { error: "Indicator type is required", success: false };
    }

    if (value.length > LIMITS.urlLength) {
      return { error: "Indicator value is too long", success: false };
    }

    const supabase = await createClient();

    const { data: newIoc, error: dbError } = await supabase.from('ioc').insert({
      value: value.trim(),
      type: type,
      risk_score: riskScore,
      status: "Active",
      reputation: riskScore >= 80 ? "Malicious" : riskScore >= 50 ? "Suspicious" : "Unknown"
    }).select().single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      if (dbError.code === '23505') { // Unique violation in Postgres
        return { error: "This Indicator already exists in the database.", success: false };
      }
      return { error: "Failed to save IOC.", success: false };
    }

    revalidatePath("/dashboard/iocs");
    return { success: true, id: newIoc.id };

  } catch (error: any) {
    console.error("Failed to add IOC:", error);
    if (error.code === 'P2002') {
        return { error: "This IOC already exists in the database.", success: false };
    }
    return { error: "Failed to add IOC due to a database error.", success: false };
  }
}

export async function createBulkIocs(iocs: any[]): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    if (!iocs || iocs.length === 0) return { error: "No IOCs provided", success: false };
    if (iocs.length > 500) return { error: "At most 500 IOCs per import", success: false };
    const supabase = await createClient();
    
    const records = iocs.map(ioc => ({
      value: String(ioc.value || ioc.Indicator || "").trim(),
      type: ioc.type || ioc.Type || "Domain",
      risk_score: parseInt(ioc.riskScore || ioc.RiskScore || "50", 10),
      status: "Active",
      reputation: parseInt(ioc.riskScore || ioc.RiskScore || "50", 10) >= 80 ? "Malicious" : parseInt(ioc.riskScore || ioc.RiskScore || "50", 10) >= 50 ? "Suspicious" : "Unknown"
    })).filter(r => r.value.length > 0);

    if (records.length === 0) return { error: "No valid IOCs found in data.", success: false };

    // Supabase insert array ignores duplicates if we use ON CONFLICT but for simplicity let's just insert.
    // If there's a unique constraint violation, it fails the whole batch. 
    // To be safe, we'll try inserting row by row or just let the user know.
    const { error: dbError } = await supabase.from('ioc').insert(records);

    if (dbError) {
      console.error("Supabase bulk insert error:", dbError);
      return { error: "Failed to save IOCs. Some might already exist.", success: false };
    }

    revalidatePath("/dashboard/iocs");
    return { success: true };

  } catch (error: any) {
    console.error("Failed to add bulk IOCs:", error);
    return { error: "Failed to add IOCs due to a database error.", success: false };
  }
}

export async function createFeed(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const name = formData.get("name") as string;
    const health = formData.get("health") as string || "Healthy";
    const status = formData.get("status") as string || "Enabled";
    
    if (!name || name.trim().length === 0) {
      return { error: "Feed name is required", success: false };
    }

    const supabase = await createClient();

    // Generate a secure 32-character authentication key
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    const authKey = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

    const { data: newFeed, error: dbError } = await supabase.from('feed').insert({
      name: name.trim(),
      health: health,
      status: status,
      indicators: "0",
      last_sync: "Never",
      endpoint_url: "",
      auth_key: authKey,
      polling_interval: "5m"
    }).select().single();

    if (dbError) {
      console.error("Supabase insert error:", dbError);
      return { error: "Failed to add Feed. Ensure the 'feed' table exists in Supabase.", success: false };
    }

    revalidatePath("/dashboard/feeds");
    return { success: true, id: newFeed.id };

  } catch (error) {
    console.error("Failed to add Feed:", error);
    return { error: "Failed to add Feed due to a database error.", success: false };
  }
}

export async function linkIocToCase(caseId: string, value: string, type: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();

    if (!value || value.trim().length === 0) {
      return { error: "Indicator value is required", success: false };
    }

    // 1. Check if IOC already exists
    let iocId;
    const { data: existingIoc } = await supabase.from('ioc').select('id').eq('value', value.trim()).single();
    
    if (existingIoc) {
      iocId = existingIoc.id;
    } else {
      // 2. Insert new IOC if it doesn't exist
      const { data: newIoc, error: insertError } = await supabase.from('ioc').insert({
        value: value.trim(),
        type: type,
        risk_score: 50,
        status: "Active",
        reputation: "Unknown"
      }).select().single();

      if (insertError) {
        console.error("Failed to insert IOC:", insertError);
        return { error: "Failed to create the new IOC.", success: false };
      }
      iocId = newIoc.id;
    }

    // 3. Link IOC to Case in junction table
    const { error: linkError } = await supabase.from('case_ioc').insert({
      case_id: caseId,
      ioc_id: iocId
    });

    // Ignore unique constraint violation if it's already linked
    if (linkError && linkError.code !== '23505') {
      console.error("Failed to link IOC:", linkError);
      return { error: "Failed to link IOC to the case.", success: false };
    }

    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };

  } catch (error) {
    console.error("Failed to link IOC to case:", error);
    return { error: "Server error.", success: false };
  }
}

export async function toggleFeedStatus(feedId: string, currentStatus: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const newStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';
    
    const { error } = await supabase.from('feed').update({ status: newStatus }).eq('id', feedId);
    
    if (error) {
      console.error("Failed to toggle feed:", error);
      return { error: "Failed to update feed status.", success: false };
    }
    
    revalidatePath("/dashboard/feeds");
    return { success: true };
  } catch (error) {
    console.error("Toggle feed error:", error);
    return { error: "Server error.", success: false };
  }
}

export async function forceSyncAllFeeds(): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    
    // Fetch all enabled feeds
    const { data: enabledFeeds, error: fetchError } = await supabase.from('feed').select('id, indicators').eq('status', 'Enabled');
    
    if (fetchError || !enabledFeeds) {
      return { error: "Failed to fetch active feeds.", success: false };
    }
    
    // Simulate syncing: update last_sync and increment indicators
    const timestamp = new Date().toISOString().split('T')[1].substring(0, 8) + " UTC";
    
    for (const feed of enabledFeeds) {
      const currentCount = parseInt(feed.indicators || "0", 10);
      const added = Math.floor(Math.random() * 50) + 10; // add 10-60 indicators
      
      await supabase.from('feed').update({ 
        last_sync: timestamp,
        indicators: (currentCount + added).toString() 
      }).eq('id', feed.id);
    }
    
    revalidatePath("/dashboard/feeds");
    return { success: true };
  } catch (error) {
    console.error("Force sync error:", error);
    return { error: "Server error.", success: false };
  }
}

export async function updateFeedConfig(feedId: string, endpointUrl: string, authKey: string, pollingInterval: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    
    if (!endpointUrl || endpointUrl.trim().length === 0) {
      return { error: "Endpoint URL is required.", success: false };
    }
    
    if (!authKey || authKey.trim().length === 0) {
      return { error: "Authentication Key is required.", success: false };
    }

    const { error } = await supabase.from('feed').update({ 
      endpoint_url: endpointUrl.trim(),
      auth_key: authKey.trim(),
      polling_interval: pollingInterval
    }).eq('id', feedId);
    
    if (error) {
      console.error("Failed to update feed configuration:", error);
      return { error: "Failed to update configuration in database.", success: false };
    }
    
    revalidatePath("/dashboard/feeds");
    return { success: true };
  } catch (error) {
    console.error("Update feed config error:", error);
    return { error: "Server error.", success: false };
  }
}

export async function deleteFeed(feedId: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('feed').delete().eq('id', feedId);
    
    if (error) {
      console.error("Failed to delete feed:", error);
      return { error: "Failed to delete feed.", success: false };
    }
    
    revalidatePath("/dashboard/feeds");
    return { success: true };
  } catch (error) {
    console.error("Delete feed error:", error);
    return { error: "Server error.", success: false };
  }
}

export async function editFeedName(feedId: string, newName: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    if (!newName || newName.trim().length === 0) {
      return { error: "Feed name is required.", success: false };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('feed').update({ name: newName.trim() }).eq('id', feedId);
    
    if (error) {
      console.error("Failed to edit feed name:", error);
      return { error: "Failed to update feed name.", success: false };
    }
    
    revalidatePath("/dashboard/feeds");
    return { success: true };
  } catch (error) {
    console.error("Edit feed name error:", error);
    return { error: "Server error.", success: false };
  }
}

// ----------------------------------------------------------------------
// DFIR TELEMETRY ACTIONS
// ----------------------------------------------------------------------

export async function addCasePcap(caseId: string, packetTime: string, sourceIp: string, destIp: string, protocol: string, length: number, info: string, isMalicious: boolean): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('case_pcap').insert({
      case_id: caseId,
      packet_time: packetTime,
      source_ip: sourceIp,
      dest_ip: destIp,
      protocol,
      length,
      info,
      is_malicious: isMalicious
    });
    
    if (error) return { error: "Failed to add packet capture.", success: false };
    
    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };
  } catch (error) {
    return { error: "Server error.", success: false };
  }
}

export async function deleteCasePcap(id: string, caseId: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('case_pcap').delete().eq('id', id);
    if (error) return { error: "Failed to delete packet.", success: false };
    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };
  } catch (error) {
    return { error: "Server error.", success: false };
  }
}

export async function addCaseHex(caseId: string, offset: string, hexBytes: string, decodedAscii: string, isMalicious: boolean): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('case_hex').insert({
      case_id: caseId,
      offset_address: offset,
      hex_bytes: hexBytes,
      decoded_ascii: decodedAscii,
      is_malicious: isMalicious
    });
    
    if (error) return { error: "Failed to add hex dump.", success: false };
    
    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };
  } catch (error) {
    return { error: "Server error.", success: false };
  }
}

export async function deleteCaseHex(id: string, caseId: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('case_hex').delete().eq('id', id);
    if (error) return { error: "Failed to delete hex dump.", success: false };
    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };
  } catch (error) {
    return { error: "Server error.", success: false };
  }
}

export async function addCaseMitre(caseId: string, tacticId: string, tacticName: string, techniqueId: string, techniqueName: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('case_mitre').insert({
      case_id: caseId,
      tactic_id: tacticId,
      tactic_name: tacticName,
      technique_id: techniqueId,
      technique_name: techniqueName
    });
    
    if (error) return { error: "Failed to add MITRE mapping.", success: false };
    
    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };
  } catch (error) {
    return { error: "Server error.", success: false };
  }
}

export async function deleteCaseMitre(id: string, caseId: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('case_mitre').delete().eq('id', id);
    if (error) return { error: "Failed to delete MITRE mapping.", success: false };
    revalidatePath(`/dashboard/cases/${caseId}`);
    return { success: true };
  } catch (error) {
    return { error: "Server error.", success: false };
  }
}

// ----------------------------------------------------------------------
// WAZUH ACTIVE RESPONSE ACTIONS
// ----------------------------------------------------------------------

import { triggerActiveResponse } from "@/lib/wazuh/api";

export async function isolateHostAction(machineName: string): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    // We attempt to trigger the Wazuh "isolate-network" active response
    // or whatever custom script is configured on the Wazuh manager.
    // By default, Wazuh has "firewall-drop", but isolation usually requires a custom script.
    // For this demonstration, we use a generic "isolate-host" command name.
    const result = await triggerActiveResponse(machineName, "isolate-host", ["-"]);
    
    if (!result.success) {
      return { success: false, error: result.message };
    }

    return { success: true, id: result.message };
  } catch (error: any) {
    console.error("Isolate Host Action Error:", error);
    return { success: false, error: "Server error during host isolation." };
  }
}

export async function triggerForensicsAction(
  machineName: string, 
  actionType: "memdump" | "triage" | "quarantine", 
  payload: string = "",
  caseId?: string
): Promise<ActionState> {
  const demo = await blockInDemo();
  if (demo) return { success: false, error: demo };
  try {
    // 1. Send the command to Wazuh
    let command = "forensics-triage";
    let args: string[] = [];
    
    if (actionType === "memdump") {
      command = "forensics-memdump";
    } else if (actionType === "quarantine") {
      command = "forensics-quarantine";
      args = [payload];
    }
    
    const result = await triggerActiveResponse(machineName, command, args);
    
    if (!result.success) {
      return { success: false, error: result.message };
    }

    // 2. If a caseId was provided, log this to the Timeline / Investigations tab
    if (caseId) {
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        getSupabaseSecretKey()
      );
      
      let actionText = "";
      if (actionType === "memdump") actionText = "Full Memory Dump (RAM Acquisition) requested.";
      else if (actionType === "triage") actionText = "Live Triage Collection (processes, netstat, files) requested.";
      else if (actionType === "quarantine") actionText = `Targeted File Quarantine requested for payload: ${payload}`;

      await supabaseAdmin.from("investigations").insert({
        case_id: caseId,
        event_time: new Date().toISOString(),
        description: `Forensic Action Triggered on ${machineName}`,
        action_taken: actionText
      });
      
      revalidatePath(`/dashboard/cases/${caseId}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Forensics Action Error:", error);
    return { success: false, error: "Server error executing forensic script." };
  }
}


