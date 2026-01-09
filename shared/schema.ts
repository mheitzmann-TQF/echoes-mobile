import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  location: text("location"),
  latitude: text("latitude"),
  longitude: text("longitude"),
  language: text("language").default("en"),
  theme: text("theme").default("dark"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// Cultural observances table for holidays and cultural events
export const culturalObservances = pgTable("cultural_observances", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // Format: YYYY-MM-DD
  name: text("name").notNull(),
  tradition: text("tradition").notNull(), // e.g., "Orthodox Christian", "Hindu", "Celtic"
  region: text("region").notNull(), // e.g., "Russia, Serbia, Ethiopia" or "Global"
  description: text("description"),
  category: text("category").default("cultural"), // cultural, religious, astronomical, seasonal
});

export const insertObservanceSchema = createInsertSchema(culturalObservances).omit({
  id: true,
});

export type InsertObservance = z.infer<typeof insertObservanceSchema>;
export type Observance = typeof culturalObservances.$inferSelect;

export const entitlementRecords = pgTable("entitlement_records", {
  id: serial("id").primaryKey(),
  installId: varchar("install_id", { length: 64 }).notNull().unique(),
  entitlement: text("entitlement").notNull().default("free"),
  platform: text("platform"),
  sku: text("sku"),
  purchaseToken: text("purchase_token"),
  transactionId: text("transaction_id"),
  expiresAt: timestamp("expires_at"),
  lastVerifiedAt: timestamp("last_verified_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertEntitlementSchema = createInsertSchema(entitlementRecords).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEntitlement = z.infer<typeof insertEntitlementSchema>;
export type EntitlementRecord = typeof entitlementRecords.$inferSelect;

// Daily cookies table for caching AI-generated wisdom per language
export const dailyCookies = pgTable("daily_cookies", {
  id: serial("id").primaryKey(),
  date: date("date").notNull(), // Format: YYYY-MM-DD
  language: varchar("language", { length: 5 }).notNull(), // en, es, fr, de, pt, it
  cookie: text("cookie").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertDailyCookieSchema = createInsertSchema(dailyCookies).omit({
  id: true,
  createdAt: true,
});

export type InsertDailyCookie = z.infer<typeof insertDailyCookieSchema>;
export type DailyCookie = typeof dailyCookies.$inferSelect;
