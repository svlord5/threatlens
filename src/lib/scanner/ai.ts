import { GoogleGenerativeAI } from '@google/generative-ai';

export async function generateAIReports(domain: string, scanData: any, findings: any[]) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      executiveSummary: "AI Reporting is currently unavailable. Please configure your GEMINI_API_KEY.",
      technicalSummary: "AI Reporting is currently unavailable. Please configure your GEMINI_API_KEY."
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
    You are a Senior Cybersecurity Analyst generating a ThreatLens Security Report for the domain: ${domain}.
    
    Below is the raw JSON data containing the scan results and specific findings:
    SCAN DATA:
    ${JSON.stringify(scanData, null, 2)}
    
    FINDINGS:
    ${JSON.stringify(findings, null, 2)}
    
    Please provide the output in two distinct sections separated by exactly "===REPORT_SPLIT===".
    
    SECTION 1: EXECUTIVE SUMMARY
    Write a concise, non-technical overview suitable for a CEO or Board Member. Explain the overall security posture, key risks, and high-level recommendations without using overly complex jargon. Format in clean Markdown.

    ===REPORT_SPLIT===
    
    SECTION 2: TECHNICAL SUMMARY
    Write a detailed, technical analysis of the findings for a security engineer. Group the issues logically, provide deep context on the misconfigurations, and outline specific remediation commands or code changes required. Format in clean Markdown.
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    const parts = text.split("===REPORT_SPLIT===");
    if (parts.length === 2) {
      return {
        executiveSummary: parts[0].trim(),
        technicalSummary: parts[1].trim()
      };
    }
    
    return {
      executiveSummary: "Error parsing AI response format.",
      technicalSummary: text
    };
  } catch (error) {
    console.error("Gemini AI Generation failed:", error);
    return {
      executiveSummary: "An error occurred while generating the AI report.",
      technicalSummary: "An error occurred while generating the AI report."
    };
  }
}
