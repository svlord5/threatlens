import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface CaseRow {
  id: string;
  title: string;
  severity: string | null;
  status: string | null;
  created_at: string;
}

const SEVERITY: Record<string, string> = {
  Critical: "border-red-500/30 bg-red-500/10 text-red-500",
  High: "border-orange-500/30 bg-orange-500/10 text-orange-500",
  Medium: "border-amber-500/30 bg-amber-500/10 text-amber-500",
  Low: "border-sky-500/30 bg-sky-500/10 text-sky-500",
};

const STATUS_DOT: Record<string, string> = {
  Open: "bg-amber-500",
  Investigating: "bg-sky-500",
  Contained: "bg-violet-500",
  Closed: "bg-emerald-500",
};

export function RecentCases({ cases }: { cases: CaseRow[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Recent cases</CardTitle>
        <CardDescription>Latest incidents across the SOC</CardDescription>
        <CardAction>
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/dashboard/cases" />}>
            View all <ArrowUpRight className="size-3.5" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        {cases.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No cases yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Case</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right">Opened</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="max-w-[220px]">
                    <Link href={`/dashboard/cases/${c.id}`} className="block truncate font-medium hover:underline">
                      {c.title}
                    </Link>
                    <span className="font-mono text-[11px] text-muted-foreground">CASE-{c.id.slice(-4).toUpperCase()}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={SEVERITY[c.severity ?? ""] ?? ""}>
                      {c.severity ?? "n/a"}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <span className={`size-2 rounded-full ${STATUS_DOT[c.status ?? ""] ?? "bg-muted-foreground"}`} />
                      {c.status ?? "n/a"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {formatDistanceToNowStrict(new Date(c.created_at), { addSuffix: true })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
