import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Scan - ThreatLens",
  description: "Initialize a new security scan against a target domain.",
};

export default function ThreatLensScanLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
