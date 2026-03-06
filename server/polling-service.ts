import { F5Client } from './f5-client';
import { storage } from './storage';
import { getF5SettingsFromEnv } from './env-config';
import type { VIP } from '../client/src/lib/types';
import { log } from './index';

export class PollingService {
  private vipsCache: VIP[] = [];
  private isPolling: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  private f5Client: F5Client | null = null;
  private lastError: string | null = null;
  private lastPollTime: Date | null = null;

  async initialize() {
    let settings = await storage.getF5Settings();
    
    // If no settings in storage, try environment variables
    if (!settings) {
      const envSettings = getF5SettingsFromEnv();
      if (envSettings) {
        log('Loading F5 settings from environment variables', 'polling');
        settings = await storage.upsertF5Settings(envSettings);
      } else {
        log('No F5 settings configured. Waiting for configuration...', 'polling');
        return;
      }
    }

    this.f5Client = new F5Client(settings);
    await this.startPolling(settings.pollingInterval * 1000);
  }

  async startPolling(intervalMs: number = 10000) {
    if (this.isPolling) {
      log('Polling already running', 'polling');
      return;
    }

    this.isPolling = true;
    log(`Starting F5 polling every ${intervalMs / 1000}s`, 'polling');

    // Immediate first poll
    await this.poll();

    // Set up interval
    this.intervalId = setInterval(() => {
      this.poll().catch(err => {
        log(`Polling error: ${err.message}`, 'polling');
      });
    }, intervalMs);
  }

  async stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isPolling = false;
    log('Stopped F5 polling', 'polling');
  }

  async reconfigure() {
    await this.stopPolling();
    await this.initialize();
  }

  private async poll() {
    if (!this.f5Client) {
      log('F5 client not initialized', 'polling');
      return;
    }

    try {
      log('Fetching VIP data from F5...', 'polling');
      const vips = await this.f5Client.getVirtualServers();
      this.vipsCache = vips;
      this.lastError = null;
      this.lastPollTime = new Date();
      
      const criticalCount = vips.filter(v => v.riskLevel === 'critical').length;
      const highRiskCount = vips.filter(v => v.riskLevel === 'high').length;
      
      log(`Poll complete: ${vips.length} VIPs (${criticalCount} critical, ${highRiskCount} high risk)`, 'polling');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.lastError = errorMsg;
      log(`Poll failed: ${errorMsg}`, 'polling');
    }
  }

  getVIPs(): VIP[] {
    return this.vipsCache;
  }

  getVIPById(id: string): VIP | undefined {
    return this.vipsCache.find(v => v.id === id);
  }

  getStatus() {
    return {
      isPolling: this.isPolling,
      lastPollTime: this.lastPollTime,
      lastError: this.lastError,
      vipCount: this.vipsCache.length,
    };
  }
}

export const pollingService = new PollingService();
