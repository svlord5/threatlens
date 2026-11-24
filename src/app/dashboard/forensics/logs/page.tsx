import LogHunterClient from "./LogHunterClient";

export default function LogHunterPage() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Log Hunter (SIEM)</h1>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Cross-reference Indicators of Compromise (IOCs) against enterprise logs to identify impacted hosts and trace the attack lifecycle.
        </p>
      </div>
      <LogHunterClient />
    </div>
  );
}
