import { type F5Settings, type InsertF5Settings, type AlertRule, type InsertAlertRule } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // F5 Settings
  getF5Settings(): Promise<F5Settings | undefined>;
  upsertF5Settings(settings: InsertF5Settings): Promise<F5Settings>;
  
  // Alert Rules
  getAlertRules(): Promise<AlertRule[]>;
  createAlertRule(rule: InsertAlertRule): Promise<AlertRule>;
  updateAlertRule(id: string, rule: Partial<InsertAlertRule>): Promise<AlertRule | undefined>;
  deleteAlertRule(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private f5Settings: F5Settings | undefined;
  private alertRules: Map<string, AlertRule>;

  constructor() {
    this.alertRules = new Map();
    // Initialize with default settings (will be overridden by env vars)
    this.f5Settings = undefined;
  }

  async getF5Settings(): Promise<F5Settings | undefined> {
    return this.f5Settings;
  }

  async upsertF5Settings(settings: InsertF5Settings): Promise<F5Settings> {
    const now = new Date();
    this.f5Settings = {
      id: this.f5Settings?.id || randomUUID(),
      host: settings.host,
      port: settings.port ?? 443,
      username: settings.username,
      password: settings.password,
      verifyTls: settings.verifyTls ?? true,
      partition: settings.partition ?? 'Common',
      pollingInterval: settings.pollingInterval ?? 10,
      updatedAt: now,
    };
    return this.f5Settings;
  }

  async getAlertRules(): Promise<AlertRule[]> {
    return Array.from(this.alertRules.values());
  }

  async createAlertRule(rule: InsertAlertRule): Promise<AlertRule> {
    const id = randomUUID();
    const alertRule: AlertRule = {
      id,
      name: rule.name,
      threshold: rule.threshold,
      enabled: rule.enabled ?? true,
      createdAt: new Date(),
    };
    this.alertRules.set(id, alertRule);
    return alertRule;
  }

  async updateAlertRule(id: string, updates: Partial<InsertAlertRule>): Promise<AlertRule | undefined> {
    const existing = this.alertRules.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates };
    this.alertRules.set(id, updated);
    return updated;
  }

  async deleteAlertRule(id: string): Promise<boolean> {
    return this.alertRules.delete(id);
  }
}

export const storage = new MemStorage();
