import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { requireAuth } from "@/lib/api-auth";
import { rateLimit } from "@/lib/rate-limit";
import { rejectLargeBody, LIMITS } from "@/lib/limits";

export async function POST(req: NextRequest) {
  const authz = await requireAuth(req);
  if (!authz.ok) return authz.response;
  const limited = await rateLimit(req, authz, ["forensics"]);
  if (limited) return limited;
  const tooBig = rejectLargeBody(req, LIMITS.body.medium);
  if (tooBig) return tooBig;

  try {
    const { iocs } = await req.json();

    if (!iocs || !Array.isArray(iocs) || iocs.length === 0) {
      return NextResponse.json({ success: false, error: "Please provide a list of IOCs." }, { status: 400 });
    }

    if (iocs.length > LIMITS.iocsPerRequest || iocs.some((i: unknown) => typeof i !== "string" || i.length > LIMITS.iocLength)) {
      return NextResponse.json(
        { success: false, error: `At most ${LIMITS.iocsPerRequest} IOCs of ${LIMITS.iocLength} characters each.` },
        { status: 413 }
      );
    }

    // Clean up the IOC list
    const cleanIocs = iocs.map((ioc: string) => ioc.trim().toLowerCase()).filter(Boolean);

    // Read the mock logs database
    const dbPath = path.join(process.cwd(), "src", "lib", "mock_logs.json");
    let logs = [];
    if (fs.existsSync(dbPath)) {
      const fileContent = fs.readFileSync(dbPath, "utf-8");
      logs = JSON.parse(fileContent);
    } else {
      return NextResponse.json({ success: false, error: "Log database not found." }, { status: 500 });
    }

    // Perform the "Hunt"
    const matchedLogs = logs.filter((log: any) => {
      const rawLower = log.raw.toLowerCase();
      // If ANY of the provided IOCs are found in the raw log string, it's a match!
      return cleanIocs.some((ioc) => rawLower.includes(ioc));
    });

    // Identify uniquely impacted hosts
    const impactedHosts = Array.from(new Set(matchedLogs.map((log: any) => log.host)));

    return NextResponse.json({
      success: true,
      matchesFound: matchedLogs.length,
      impactedHosts,
      logs: matchedLogs,
    });

  } catch (error: any) {
    console.error("Log Hunt Error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
