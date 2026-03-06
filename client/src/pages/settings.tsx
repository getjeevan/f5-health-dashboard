import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Save, Shield, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface F5Settings {
  id?: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  verifyTls: boolean;
  partition: string;
  pollingInterval: number;
}

interface PollingStatus {
  isPolling: boolean;
  lastPollTime: string | null;
  lastError: string | null;
  vipCount: number;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [host, setHost] = useState("");
  const [port, setPort] = useState("443");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [verifyTls, setVerifyTls] = useState(true);
  const [partition, setPartition] = useState("Common");
  const [pollingInterval, setPollingInterval] = useState("10");

  // Fetch existing settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      const data = await response.json();
      if (data) {
        setHost(data.host || "");
        setPort(String(data.port || 443));
        setUsername(data.username || "");
        setVerifyTls(data.verifyTls ?? true);
        setPartition(data.partition || "Common");
        setPollingInterval(String(data.pollingInterval || 10));
      }
      return data as F5Settings | null;
    }
  });

  // Fetch polling status
  const { data: status } = useQuery({
    queryKey: ["status"],
    queryFn: async () => {
      const response = await fetch('/api/status');
      if (!response.ok) throw new Error('Failed to fetch status');
      return response.json() as Promise<PollingStatus>;
    },
    refetchInterval: 5000,
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async (data: Omit<F5Settings, 'id'>) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save settings');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      queryClient.invalidateQueries({ queryKey: ["status"] });
      queryClient.invalidateQueries({ queryKey: ["vips"] });
      toast({
        title: "Settings saved",
        description: "F5 connection configured. Polling will start shortly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!host || !username || !password) {
      toast({
        title: "Missing required fields",
        description: "Please fill in Host, Username, and Password.",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      host,
      port: parseInt(port, 10),
      username,
      password,
      verifyTls,
      partition,
      pollingInterval: parseInt(pollingInterval, 10),
    });
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Settings</h2>
        <p className="text-muted-foreground mt-2">Configure F5 connection and dashboard preferences.</p>
      </div>

      {/* Connection Status */}
      <Card className={status?.isPolling ? "border-success/50" : "border-warning/50"}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {status?.isPolling ? (
              <CheckCircle2 className="h-4 w-4 text-success" />
            ) : (
              <AlertCircle className="h-4 w-4 text-warning" />
            )}
            Connection Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium">{status?.isPolling ? "Connected" : "Not Connected"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">VIPs Found:</span>
              <p className="font-medium font-mono">{status?.vipCount ?? 0}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Last Poll:</span>
              <p className="font-medium">
                {status?.lastPollTime 
                  ? new Date(status.lastPollTime).toLocaleTimeString() 
                  : "Never"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">Error:</span>
              <p className="font-medium text-destructive truncate" title={status?.lastError || undefined}>
                {status?.lastError || "None"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              F5 BIG-IP Connection
            </CardTitle>
            <CardDescription>
              Enter the credentials for your F5 BIG-IP device. A read-only user is recommended.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Hostname / IP *</Label>
                <Input 
                  id="host" 
                  placeholder="10.1.1.5 or bigip.example.com"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  data-testid="input-host"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input 
                  id="port" 
                  placeholder="443"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  data-testid="input-port"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username *</Label>
                <Input 
                  id="username" 
                  placeholder="admin or readonly-user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  data-testid="input-username"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-testid="input-password"
                />
                {settings && !password && (
                  <p className="text-xs text-muted-foreground">Leave blank to keep existing password</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partition">Partition</Label>
                <Input 
                  id="partition" 
                  placeholder="Common"
                  value={partition}
                  onChange={(e) => setPartition(e.target.value)}
                  data-testid="input-partition"
                />
              </div>
              <div className="space-y-2">
                <Label>Polling Interval</Label>
                <Select value={pollingInterval} onValueChange={setPollingInterval}>
                  <SelectTrigger data-testid="select-interval">
                    <SelectValue placeholder="Select interval" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Every 5 seconds</SelectItem>
                    <SelectItem value="10">Every 10 seconds</SelectItem>
                    <SelectItem value="30">Every 30 seconds</SelectItem>
                    <SelectItem value="60">Every minute</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch 
                id="verify-tls" 
                checked={verifyTls}
                onCheckedChange={setVerifyTls}
                data-testid="switch-verify-tls"
              />
              <Label htmlFor="verify-tls">Verify TLS Certificate</Label>
              <span className="text-xs text-muted-foreground">(Disable for self-signed certs)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Thresholds</CardTitle>
            <CardDescription>
              These thresholds determine how VIPs are classified based on active pool members.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 border p-4 rounded-md bg-muted/20">
              <div className="flex items-center justify-between">
                <Label className="flex flex-col">
                  <span className="text-destructive font-medium">Critical Risk</span>
                  <span className="font-normal text-xs text-muted-foreground">0 active members - Service DOWN</span>
                </Label>
                <Switch checked disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="flex flex-col">
                  <span className="text-orange-500 font-medium">High Risk</span>
                  <span className="font-normal text-xs text-muted-foreground">1 active member - Single Point of Failure</span>
                </Label>
                <Switch checked disabled />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label className="flex flex-col">
                  <span className="text-warning font-medium">Warning</span>
                  <span className="font-normal text-xs text-muted-foreground">2 active members - Limited redundancy</span>
                </Label>
                <Switch checked disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button 
            type="submit" 
            size="lg" 
            disabled={saveMutation.isPending}
            data-testid="button-save"
          >
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save & Connect
          </Button>
        </div>
      </form>
    </div>
  );
}
