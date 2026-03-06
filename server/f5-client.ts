import https from 'https';
import type { F5Settings } from '@shared/schema';
import type { VIP, Pool, PoolMember, Status, RiskLevel } from '../client/src/lib/types';

interface F5AuthResponse {
  token: {
    token: string;
    expirationMicros: number;
  };
}

interface F5VirtualServer {
  name: string;
  fullPath: string;
  destination: string;
  enabled: boolean;
  pool?: string;
  availabilityState?: string;
  enabledState?: string;
}

interface F5Pool {
  name: string;
  fullPath: string;
  membersReference?: {
    link: string;
    items?: F5PoolMember[];
  };
  availabilityState?: string;
  enabledState?: string;
}

interface F5PoolMember {
  name: string;
  fullPath: string;
  address: string;
  state: string;
  session: string;
  monitor?: string;
}

export class F5Client {
  private baseUrl: string;
  private username: string;
  private password: string;
  private verifyTls: boolean;
  private partition: string;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(settings: F5Settings) {
    this.baseUrl = `https://${settings.host}:${settings.port}`;
    this.username = settings.username;
    this.password = settings.password;
    this.verifyTls = settings.verifyTls;
    this.partition = settings.partition || 'Common';
  }

  private async ensureAuthenticated(): Promise<void> {
    const now = Date.now();
    if (this.token && this.tokenExpiry > now + 60000) {
      return;
    }

    try {
      const authPayload = {
        username: this.username,
        password: this.password,
        loginProviderName: 'tmos'
      };

      const response = await this.makeRequest<F5AuthResponse>(
        '/mgmt/shared/authn/login',
        'POST',
        authPayload,
        false
      );

      this.token = response.token.token;
      this.tokenExpiry = Math.floor(response.token.expirationMicros / 1000);
    } catch (error) {
      throw new Error(`F5 authentication failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async makeRequest<T>(
    path: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any,
    useAuth: boolean = true
  ): Promise<T> {
    if (useAuth) {
      await this.ensureAuthenticated();
    }

    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options: https.RequestOptions = {
        hostname: url.hostname,
        port: url.port || 443,
        path: url.pathname + url.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(useAuth && this.token ? { 'X-F5-Auth-Token': this.token } : {}),
        },
        rejectUnauthorized: this.verifyTls,
        timeout: 30000,
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error(`Failed to parse response: ${e}`));
            }
          } else {
            reject(new Error(`Request failed with status ${res.statusCode}: ${data.substring(0, 500)}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`Network error: ${error.message}`));
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      if (body) {
        req.write(JSON.stringify(body));
      }

      req.end();
    });
  }

  private mapStatus(availState?: string, enabledState?: string): Status {
    if (enabledState === 'disabled' || enabledState === 'user-disabled') return 'disabled';
    if (availState === 'available' || availState === 'up') return 'up';
    if (availState === 'offline' || availState === 'down' || availState === 'unavailable') return 'down';
    return 'unknown';
  }

  private calculateRisk(activeMembers: number, totalMembers: number): RiskLevel {
    if (activeMembers === 0) return 'critical';
    if (activeMembers === 1) return 'high';
    if (activeMembers === 2 && totalMembers > 2) return 'warning';
    return 'ok';
  }

  private parseDestination(destination: string): { ip: string; port: number } {
    // Handle various destination formats:
    // /Common/10.1.1.1:443
    // /partition/ip%port (URL encoded)
    // /partition/name:port
    let cleaned = destination;
    
    // Remove partition prefix
    const lastSlash = cleaned.lastIndexOf('/');
    if (lastSlash !== -1) {
      cleaned = cleaned.substring(lastSlash + 1);
    }
    
    // Handle URL-encoded colons
    cleaned = decodeURIComponent(cleaned);
    
    // Split IP and port
    const colonIndex = cleaned.lastIndexOf(':');
    if (colonIndex !== -1) {
      return {
        ip: cleaned.substring(0, colonIndex),
        port: parseInt(cleaned.substring(colonIndex + 1), 10) || 0,
      };
    }
    
    return { ip: cleaned, port: 0 };
  }

  async getVirtualServers(): Promise<VIP[]> {
    // Fetch all virtual servers for the partition
    const vsResponse = await this.makeRequest<{ items?: F5VirtualServer[] }>(
      `/mgmt/tm/ltm/virtual?$filter=partition+eq+${this.partition}`
    );

    const vips: VIP[] = [];
    const items = vsResponse.items || [];

    for (const vs of items) {
      try {
        const { ip, port } = this.parseDestination(vs.destination);

        let pool: Pool | undefined;
        let activeMembers = 0;
        let totalMembers = 0;

        if (vs.pool) {
          const poolName = vs.pool.split('/').pop() || vs.pool;
          try {
            pool = await this.getPool(poolName);
            activeMembers = pool.membersUp;
            totalMembers = pool.membersTotal;
          } catch (poolError) {
            console.error(`Error fetching pool ${poolName}:`, poolError);
          }
        }

        const availability = this.mapStatus(vs.availabilityState, vs.enabledState);
        const riskLevel = this.calculateRisk(activeMembers, totalMembers);

        vips.push({
          id: `${this.partition}-${vs.name}`,
          name: vs.name,
          ip,
          port,
          availability,
          partition: this.partition,
          pool: pool || {
            id: 'none',
            name: 'No Pool',
            availability: 'unknown',
            members: [],
            membersUp: 0,
            membersTotal: 0,
          },
          activeMembers,
          totalMembers,
          riskLevel,
          lastUpdated: new Date().toISOString(),
        });
      } catch (error) {
        console.error(`Error processing VIP ${vs.name}:`, error);
      }
    }

    return vips;
  }

  async getPool(poolName: string): Promise<Pool> {
    // Use expandSubcollections to get members inline
    const poolResponse = await this.makeRequest<F5Pool>(
      `/mgmt/tm/ltm/pool/~${this.partition}~${poolName}?expandSubcollections=true`
    );

    const members: PoolMember[] = [];
    let membersUp = 0;

    // Members can be inline or require separate fetch
    let poolMembers: F5PoolMember[] = [];
    
    if (poolResponse.membersReference?.items) {
      poolMembers = poolResponse.membersReference.items;
    } else if (poolResponse.membersReference?.link) {
      // Fetch members separately if not expanded
      try {
        const membersUrl = poolResponse.membersReference.link
          .replace(/^https?:\/\/[^/]+/, ''); // Remove host, keep path
        const membersResponse = await this.makeRequest<{ items?: F5PoolMember[] }>(membersUrl);
        poolMembers = membersResponse.items || [];
      } catch (error) {
        console.error(`Error fetching members for pool ${poolName}:`, error);
      }
    }

    for (const member of poolMembers) {
      // Parse member name (format: "ip:port" or "name:port")
      const nameParts = member.name.split(':');
      const memberIp = member.address || nameParts[0];
      const memberPort = parseInt(nameParts[1] || '0', 10);
      
      const availability = this.mapStatus(
        member.state === 'up' ? 'available' : 'offline',
        member.session
      );

      if (availability === 'up') {
        membersUp++;
      }

      members.push({
        id: `${poolName}-${member.name}`,
        name: member.address || member.name,
        ip: memberIp,
        port: memberPort,
        state: member.session === 'user-disabled' ? 'disabled' : 'enabled',
        availability,
        monitorStatus: member.monitor || 'No monitor configured',
        lastChanged: new Date().toISOString(),
      });
    }

    const poolAvailability = this.mapStatus(poolResponse.availabilityState, poolResponse.enabledState);

    return {
      id: `${this.partition}-${poolName}`,
      name: poolName,
      availability: poolAvailability,
      members,
      membersUp,
      membersTotal: members.length,
    };
  }
}
