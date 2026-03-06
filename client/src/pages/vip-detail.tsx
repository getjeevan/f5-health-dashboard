import { useRoute, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { VIP } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronLeft, RefreshCw, Activity, Server, Clock, Network } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function VIPDetail() {
  const [, params] = useRoute("/vip/:id");
  const id = params?.id;

  const { data: vip, isLoading, error } = useQuery({
    queryKey: ["vip", id],
    queryFn: async () => {
      const response = await fetch(`/api/vips/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch VIP details');
      }
      return response.json() as Promise<VIP>;
    },
    enabled: !!id
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center text-muted-foreground">Loading details...</div>;
  }

  if (!vip) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">VIP Not Found</h2>
        <Link href="/">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
            {vip.name}
            <StatusBadge status={vip.availability} />
          </h1>
          <p className="text-muted-foreground text-sm font-mono mt-1 flex items-center gap-2">
            <Network className="h-3 w-3" /> {vip.ip}:{vip.port}
            <span className="text-muted-foreground/30">|</span>
            Partition: {vip.partition}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-3 w-3 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              Pool Status
            </CardTitle>
            <CardDescription>
               Pool: <span className="font-mono text-foreground font-medium">{vip.pool.name}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Active Members</div>
                  <div className="text-3xl font-bold font-mono text-foreground">
                    {vip.pool.membersUp}
                    <span className="text-sm text-muted-foreground font-sans ml-2">/ {vip.pool.membersTotal}</span>
                  </div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Risk Level</div>
                  <div><StatusBadge risk={vip.riskLevel} /></div>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg border">
                  <div className="text-sm text-muted-foreground mb-1">Pool Availability</div>
                  <div><StatusBadge status={vip.pool.availability} /></div>
                </div>
             </div>

             <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Member Name</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Health Monitor</TableHead>
                    <TableHead className="text-right">Last Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vip.pool.members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground text-xs">
                        {member.ip}:{member.port}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={member.availability} showIcon={true} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={member.monitorStatus}>
                        {member.monitorStatus}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground font-mono">
                        {formatDistanceToNow(new Date(member.lastChanged), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Live Health Check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Response Time</span>
                  <span className="font-mono text-success">12ms</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Connections</span>
                  <span className="font-mono">1,240</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Throughput</span>
                  <span className="font-mono">45 MB/s</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Health History (1h)</div>
                  <div className="h-10 flex items-end gap-1">
                     {Array.from({length: 20}).map((_, i) => (
                        <div 
                          key={i} 
                          className={`w-full rounded-t-sm ${Math.random() > 0.9 ? 'bg-destructive h-full' : 'bg-success/50 h-[80%]'}`}
                          style={{ height: `${Math.random() * 60 + 40}%` }}
                        />
                     ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start">
                     <div className="h-2 w-2 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
                     <div className="space-y-1">
                        <p className="text-xs text-foreground">Pool member health check passed.</p>
                        <p className="text-[10px] text-muted-foreground font-mono">2 mins ago</p>
                     </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
