import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// F5 Connection Settings Table
export const f5Settings = pgTable("f5_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  host: text("host").notNull(),
  port: integer("port").notNull().default(443),
  username: text("username").notNull(),
  password: text("password").notNull(),
  verifyTls: boolean("verify_tls").notNull().default(true),
  partition: text("partition").default("Common"),
  pollingInterval: integer("polling_interval").notNull().default(10),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const insertF5SettingsSchema = createInsertSchema(f5Settings).omit({
  id: true,
  updatedAt: true,
});

export type InsertF5Settings = z.infer<typeof insertF5SettingsSchema>;
export type F5Settings = typeof f5Settings.$inferSelect;

// Alert Rules Table
export const alertRules = pgTable("alert_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  threshold: integer("threshold").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertAlertRuleSchema = createInsertSchema(alertRules).omit({
  id: true,
  createdAt: true,
});

export type InsertAlertRule = z.infer<typeof insertAlertRuleSchema>;
export type AlertRule = typeof alertRules.$inferSelect;
