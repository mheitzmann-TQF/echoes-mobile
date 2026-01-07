import { type User, type InsertUser, type UserSettings, type InsertUserSettings, type Observance, type InsertObservance } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
  // Observance methods
  getObservancesByDate(date: string): Promise<Observance[]>;
  getObservancesByDateRange(startDate: string, endDate: string): Promise<Observance[]>;
  createObservance(observance: InsertObservance): Promise<Observance>;
  createObservances(observances: InsertObservance[]): Promise<Observance[]>;
  clearObservances(): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private settings: Map<string, UserSettings>;
  private observances: Map<number, Observance>;
  private nextObservanceId: number;

  constructor() {
    this.users = new Map();
    this.settings = new Map();
    this.observances = new Map();
    this.nextObservanceId = 1;
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const entries = Array.from(this.settings.values());
    return entries.find((s) => s.userId === userId);
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    const id = existing?.id || randomUUID();
    const updated: UserSettings = {
      id,
      userId,
      location: settings.location ?? existing?.location,
      latitude: settings.latitude ?? existing?.latitude,
      longitude: settings.longitude ?? existing?.longitude,
      language: settings.language ?? existing?.language ?? "en",
      theme: settings.theme ?? existing?.theme ?? "dark",
    };
    this.settings.set(id, updated);
    return updated;
  }

  async getObservancesByDate(date: string): Promise<Observance[]> {
    return Array.from(this.observances.values()).filter(o => o.date === date);
  }

  async getObservancesByDateRange(startDate: string, endDate: string): Promise<Observance[]> {
    return Array.from(this.observances.values()).filter(o => 
      o.date >= startDate && o.date <= endDate
    ).sort((a, b) => a.date.localeCompare(b.date));
  }

  async createObservance(observance: InsertObservance): Promise<Observance> {
    const id = this.nextObservanceId++;
    const newObservance: Observance = { 
      id, 
      ...observance,
      category: observance.category ?? 'cultural'
    };
    this.observances.set(id, newObservance);
    return newObservance;
  }

  async createObservances(observances: InsertObservance[]): Promise<Observance[]> {
    const created: Observance[] = [];
    for (const obs of observances) {
      created.push(await this.createObservance(obs));
    }
    return created;
  }

  async clearObservances(): Promise<void> {
    this.observances.clear();
    this.nextObservanceId = 1;
  }
}

export const storage = new MemStorage();
