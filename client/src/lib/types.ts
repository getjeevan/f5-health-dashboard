export type Status = 'up' | 'down' | 'unknown' | 'disabled';
export type RiskLevel = 'critical' | 'high' | 'warning' | 'ok';

export interface PoolMember {
  id: string;
  name: string;
  ip: string;
  port: number;
  state: 'enabled' | 'disabled';
  availability: Status;
  monitorStatus: string;
  lastChanged: string;
}

export interface Pool {
  id: string;
  name: string;
  availability: Status;
  members: PoolMember[];
  membersUp: number;
  membersTotal: number;
}

export interface VIP {
  id: string;
  name: string;
  ip: string;
  port: number;
  availability: Status;
  pool: Pool;
  activeMembers: number;
  totalMembers: number;
  riskLevel: RiskLevel;
  lastUpdated: string;
  partition: string;
}

export interface AlertRule {
  id: string;
  name: string;
  threshold: number;
  enabled: boolean;
}
