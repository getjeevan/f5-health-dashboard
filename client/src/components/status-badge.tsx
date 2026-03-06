import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Status, RiskLevel } from "@/lib/types";
import { AlertCircle, CheckCircle2, AlertTriangle, XCircle, Ban } from "lucide-react";

interface StatusBadgeProps {
  status?: Status;
  risk?: RiskLevel;
  className?: string;
  showIcon?: boolean;
}

export function StatusBadge({ status, risk, className, showIcon = true }: StatusBadgeProps) {
  if (risk) {
    const riskConfig = {
      critical: { color: "bg-destructive/15 text-destructive border-destructive/20", icon: XCircle, label: "Critical" },
      high: { color: "bg-orange-500/15 text-orange-500 border-orange-500/20", icon: AlertTriangle, label: "High Risk" },
      warning: { color: "bg-warning/15 text-warning border-warning/20", icon: AlertTriangle, label: "Warning" },
      ok: { color: "bg-success/15 text-success border-success/20", icon: CheckCircle2, label: "Healthy" },
    };

    const config = riskConfig[risk];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn("gap-1.5 font-mono uppercase text-[10px] tracking-wider", config.color, className)}>
        {showIcon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  }

  if (status) {
    const statusConfig = {
      up: { color: "bg-success/15 text-success border-success/20", icon: CheckCircle2, label: "Available" },
      down: { color: "bg-destructive/15 text-destructive border-destructive/20", icon: AlertCircle, label: "Down" },
      unknown: { color: "bg-muted text-muted-foreground border-border", icon: AlertCircle, label: "Unknown" },
      disabled: { color: "bg-muted text-muted-foreground border-border opacity-70", icon: Ban, label: "Disabled" },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={cn("gap-1.5 font-mono uppercase text-[10px] tracking-wider", config.color, className)}>
        {showIcon && <Icon className="h-3 w-3" />}
        {config.label}
      </Badge>
    );
  }

  return null;
}
