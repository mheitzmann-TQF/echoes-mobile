import { randomUUID } from "crypto";

export interface User {
  id: string;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface UserSettings {
  id: string;
  userId: string;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  language?: string | null;
  theme?: string | null;
}

export interface InsertUserSettings {
  userId: string;
  location?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  language?: string | null;
  theme?: string | null;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private settings: Map<string, UserSettings>;

  constructor() {
    this.users = new Map();
    this.settings = new Map();
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
}

export const storage = new MemStorage();
