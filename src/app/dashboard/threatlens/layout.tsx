import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ThreatLens - Attack Surface Management",
  description: "Advanced Domain Intelligence, Risk Scoring, and Security Posture Assessment platform.",
};

export default function ThreatLensLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-full">
      {children}
    </div>
  );
}
