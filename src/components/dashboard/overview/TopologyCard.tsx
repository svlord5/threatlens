import { Network } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NetworkTopologyWidget from "@/components/dashboard/widgets/NetworkTopologyWidget";

/**
 * Demo mode: the animated sample topology, clearly labelled.
 * Live mode: there is no asset or network inventory feeding this app, so it says so
 * instead of drawing an invented network.
 */
export function TopologyCard({ demo }: { demo: boolean }) {
  if (demo) {
    return (
      <div className="relative h-full">
        <Badge variant="outline" className="absolute right-4 top-4 z-10 bg-background/80 font-normal text-muted-foreground">
          Demo data
        </Badge>
        <NetworkTopologyWidget />
      </div>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="size-4 text-muted-foreground" />
          Network topology &amp; blast radius
        </CardTitle>
        <CardDescription>How assets connect and what a compromise could reach</CardDescription>
      </CardHeader>
      <CardContent className="flex min-h-[220px] flex-col items-center justify-center gap-2 text-center">
        <Network className="size-8 text-muted-foreground/50" />
        <p className="text-sm font-medium">No data available</p>
        <p className="max-w-sm text-xs text-muted-foreground">
          No network or asset inventory is connected, so there is nothing to draw yet.
        </p>
      </CardContent>
    </Card>
  );
}
