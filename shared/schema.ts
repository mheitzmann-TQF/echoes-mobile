import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, date } from "drizzle-orm/pg-core";
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
