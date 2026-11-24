import WebsiteAnalyzerClient from "./WebsiteAnalyzerClient";

export default function WebsiteForensicsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-wide">Website Forensics</h1>
        <p className="text-muted-foreground mt-1">
          Scan a live URL to scrape the page, extract hidden IOCs, and run Threat Intelligence.
        </p>
      </div>
      
      <WebsiteAnalyzerClient />
    </div>
  );
}
