import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { pollingService } from "./polling-service";
import { insertF5SettingsSchema, insertAlertRuleSchema } from "@shared/schema";
import { log } from "./index";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // VIP Routes
  app.get("/api/vips", async (req, res) => {
    try {
      const vips = pollingService.getVIPs();
      res.json(vips);
    } catch (error) {
      log(`Error fetching VIPs: ${error}`, 'api');
      res.status(500).json({ message: "Failed to fetch VIPs" });
    }
  });

  app.get("/api/vips/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const vip = pollingService.getVIPById(id);
      
      if (!vip) {
        return res.status(404).json({ message: "VIP not found" });
      }
      
      res.json(vip);
    } catch (error) {
      log(`Error fetching VIP: ${error}`, 'api');
      res.status(500).json({ message: "Failed to fetch VIP details" });
    }
  });

  // Status Route
  app.get("/api/status", async (req, res) => {
    try {
      const status = pollingService.getStatus();
      res.json(status);
    } catch (error) {
      log(`Error fetching status: ${error}`, 'api');
      res.status(500).json({ message: "Failed to fetch status" });
    }
  });

  // Settings Routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getF5Settings();
      
      if (!settings) {
        return res.json(null);
      }
      
      // Don't send password to frontend
      const { password, ...safeSettings } = settings;
      res.json(safeSettings);
    } catch (error) {
      log(`Error fetching settings: ${error}`, 'api');
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validated = insertF5SettingsSchema.parse(req.body);
      const settings = await storage.upsertF5Settings(validated);
      
      // Reconfigure polling with new settings
      await pollingService.reconfigure();
      
      // Don't send password back
      const { password, ...safeSettings } = settings;
      res.json(safeSettings);
    } catch (error) {
      log(`Error saving settings: ${error}`, 'api');
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid settings data" });
      }
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  // Alert Rules Routes
  app.get("/api/alerts", async (req, res) => {
    try {
      const rules = await storage.getAlertRules();
      res.json(rules);
    } catch (error) {
      log(`Error fetching alert rules: ${error}`, 'api');
      res.status(500).json({ message: "Failed to fetch alert rules" });
    }
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const validated = insertAlertRuleSchema.parse(req.body);
      const rule = await storage.createAlertRule(validated);
      res.status(201).json(rule);
    } catch (error) {
      log(`Error creating alert rule: ${error}`, 'api');
      if (error instanceof Error && error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid alert rule data" });
      }
      res.status(500).json({ message: "Failed to create alert rule" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const rule = await storage.updateAlertRule(id, req.body);
      
      if (!rule) {
        return res.status(404).json({ message: "Alert rule not found" });
      }
      
      res.json(rule);
    } catch (error) {
      log(`Error updating alert rule: ${error}`, 'api');
      res.status(500).json({ message: "Failed to update alert rule" });
    }
  });

  app.delete("/api/alerts/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAlertRule(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Alert rule not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      log(`Error deleting alert rule: ${error}`, 'api');
      res.status(500).json({ message: "Failed to delete alert rule" });
    }
  });

  // Initialize polling service
  pollingService.initialize().catch(err => {
    log(`Failed to initialize polling service: ${err.message}`, 'polling');
  });

  return httpServer;
}
