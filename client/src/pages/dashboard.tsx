import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { VIP, RiskLevel } from "@/lib/types";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/status-badge";
import { Search, Filter, RefreshCw, ArrowUpDown, ArrowUp, ArrowDown, Server, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskLevel | "all">("all");
  const [sortConfig, setSortConfig] = useState<{ key: keyof VIP; direction: 'asc' | 'desc' } | null>(null);

  const { data: vips, isLoading, error } = useQuery({
    queryKey: ["vips"],
    queryFn: async () => {
      const response = await fetch('/api/vips');
      if (!response.ok) {
        throw new Error('Failed to fetch VIPs');
      }
      return response.json() as Promise<VIP[]>;
    }
  });

  const filteredVips = vips?.filter((vip) => {
    const matchesSearch = 
      vip.name.toLowerCase().includes(search.toLowerCase()) ||
      vip.ip.includes(search) ||
      vip.pool.name.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === "all" || vip.riskLevel === riskFilter;

    return matchesSearch && matchesRisk;
  }) ?? [];

  const sortedVips = [...filteredVips].sort((a, b) => {
    if (!sortConfig) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (key: keyof VIP) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const stats = {
    total: vips?.length ?? 0,
    critical: vips?.filter(v => v.riskLevel === 'critical').length ?? 0,
    high: vips?.filter(v => v.riskLevel === 'high').length ?? 0,
    active: vips?.filter(v => v.availability === 'up').length ?? 0,
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Overview</h2>
        <p className="text-muted-foreground mt-2">Real-time status of Virtual Servers and Pools.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total VIPs</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Monitored objects</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-destructive bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Risk</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-destructive">{stats.critical}</div>
            <p className="text-xs text-muted-foreground">0 active members</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-orange-500">{stats.high}</div>
            <p className="text-xs text-muted-foreground">Single point of failure</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-success bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-success">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Passing health checks</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
          <div className="flex w-full sm:w-auto items-center space-x-2 relative">
            <Search className="h-4 w-4 absolute left-3 text-muted-foreground" />
            <Input
              placeholder="Search VIPs, Pools, IPs..."
              className="pl-9 w-full sm:w-[300px] bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={riskFilter} onValueChange={(v: any) => setRiskFilter(v)}>
              <SelectTrigger className="w-[180px] bg-background">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="Risk Level" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risks</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High Risk</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="ok">Healthy</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" className="shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <div className="rounded-md border bg-card">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[250px] cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">
                      VIP Name
                      {sortConfig?.key === 'name' && (
                        sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="w-[150px]">Destination</TableHead>
                  <TableHead>Pool Status</TableHead>
                  <TableHead className="text-right cursor-pointer hover:text-foreground transition-colors" onClick={() => handleSort('activeMembers')}>
                    <div className="flex items-center justify-end gap-2">
                      Active / Total
                      {sortConfig?.key === 'activeMembers' && (
                        sortConfig.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                    </div>
                  </TableHead>
                  <TableHead className="text-right w-[150px]">Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Loading VIP data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : sortedVips.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No VIPs found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedVips.map((vip) => (
                    <TableRow key={vip.id} className="group hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <Link href={`/vip/${vip.id}`}>
                          <div className="flex flex-col cursor-pointer">
                            <span className="text-primary group-hover:underline decoration-primary/50 underline-offset-4">{vip.name}</span>
                            <span className="text-xs text-muted-foreground font-mono mt-0.5">{vip.pool.name}</span>
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {vip.ip}:{vip.port}
                      </TableCell>
                      <TableCell>
                         <StatusBadge status={vip.availability} />
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        <span className={cn(
                          vip.activeMembers === 0 ? "text-destructive font-bold" : 
                          vip.activeMembers === 1 ? "text-orange-500 font-bold" : "text-foreground"
                        )}>
                          {vip.activeMembers}
                        </span>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-muted-foreground">{vip.totalMembers}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end">
                          <StatusBadge risk={vip.riskLevel} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t bg-muted/20 text-xs text-muted-foreground flex justify-between items-center">
             <span>Showing {sortedVips.length} of {vips?.length} VIPs</span>
             <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
