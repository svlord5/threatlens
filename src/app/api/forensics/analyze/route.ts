import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { rejectLargeBody, LIMITS } from "@/lib/limits";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  const authz = await requireAuth(req, { blockDemo: true });
  if (!authz.ok) return authz.response;
  const limited = await rateLimit(req, authz, ["forensics", "gemini", "virustotal", "shodan"]);
  if (limited) return limited;
  const tooBig = rejectLargeBody(req, LIMITS.body.ingest);
  if (tooBig) return tooBig;

  try {
    const body = await req.json();
    const { type, contextData, screenshotBase64 } = body;
    // Only short strings, and at most LIMITS.iocsPerRequest of them.
    const iocs: string[] | undefined = Array.isArray(body.iocs)
      ? body.iocs.filter((i: unknown): i is string => typeof i === "string" && i.length > 0 && i.length <= LIMITS.iocLength).slice(0, LIMITS.iocsPerRequest)
      : undefined;

    // We will collect external threat intel reports here
    const intelReports: any = {
      vt: {},
      shodan: {},
    };

    // 1. Query VirusTotal for the first few critical IOCs (to avoid rate limits, we pick top 3)
    if (process.env.VIRUSTOTAL_API_KEY && iocs && Array.isArray(iocs)) {
      const topIocs = iocs.slice(0, 3);
      for (const ioc of topIocs) {
        let vtUrl = "";
        const isIp = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(ioc);
        const isHash = /^[a-fA-F0-9]{64}$/.test(ioc);

        if (isIp) {
          vtUrl = `https://www.virustotal.com/api/v3/ip_addresses/${ioc}`;
        } else if (isHash) {
          vtUrl = `https://www.virustotal.com/api/v3/files/${ioc}`;
        } else if (ioc.includes(".")) {
          // Assume domain
          vtUrl = `https://www.virustotal.com/api/v3/domains/${ioc}`;
        }

        if (vtUrl) {
          try {
            const vtRes = await fetch(vtUrl, {
              headers: { "x-apikey": process.env.VIRUSTOTAL_API_KEY }
            });
            if (vtRes.ok) {
              const vtData = await vtRes.json();
              if (vtData.data?.attributes?.last_analysis_stats) {
                intelReports.vt[ioc] = vtData.data.attributes.last_analysis_stats;
              }
            }
          } catch(e) {
            console.error("VT Error:", e);
          }
        }
      }
    }

    // 2. Query Shodan if there is an IP (e.g. sender IP)
    if (process.env.SHODAN_API_KEY && contextData?.senderIp) {
      try {
        const shodanRes = await fetch(`https://api.shodan.io/shodan/host/${contextData.senderIp}?key=${process.env.SHODAN_API_KEY}`);
        if (shodanRes.ok) {
          const shodanData = await shodanRes.json();
          intelReports.shodan[contextData.senderIp] = {
            org: shodanData.org,
            asn: shodanData.asn,
            ports: shodanData.ports,
            country: shodanData.country_name,
            tags: shodanData.tags || []
          };
        }
      } catch(e) {
        console.error("Shodan Error:", e);
      }
    }

    // 3. Gemini Evaluation
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `You are an expert Cybersecurity Threat Analyst. Analyze the following ${type} forensic data and provide a definitive threat verdict.

${screenshotBase64 ? "> VISUAL FORENSICS ATTACHED: The user has attached a screenshot of the target website UI. Carefully inspect the visual design. Does it look like a fake login page, brand spoofing (e.g. Microsoft/Google login clone), or a suspicious cryptocurrency drainer template? Let the visual evidence heavily influence your final score." : ""}

CONTEXT DATA:
${JSON.stringify(contextData, null, 2)}

External Threat Intelligence Results:
${JSON.stringify(intelReports, null, 2)}

Task:
Evaluate the evidence. Provide your assessment in EXACTLY the following JSON format:
{
  "verdict": "MALICIOUS" | "SUSPICIOUS" | "SAFE",
  "score": <number between 0 and 100>,
  "justification": "<A 2-3 sentence explanation of WHY you reached this verdict, referencing the specific IPs, domains, VT scores, or email context. Be concise and professional.>"
}
    `;

    const requestContent: any[] = [prompt];
    
    // Add visual screenshot to the prompt if provided
    if (screenshotBase64) {
      requestContent.push({
        inlineData: {
          data: screenshotBase64,
          mimeType: "image/png"
        }
      });
    }

    const result = await model.generateContent(requestContent);
    const responseText = result.response.text();
    
    // Extract JSON from markdown
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse Gemini response as JSON");
    }

    const aiVerdict = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      verdict: aiVerdict.verdict,
      score: aiVerdict.score,
      justification: aiVerdict.justification,
      intel: intelReports
    });

  } catch (error) {
    console.error("API Analyze Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 200 });
  }
}
