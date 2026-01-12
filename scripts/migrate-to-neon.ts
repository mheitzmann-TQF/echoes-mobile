import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

const sourceUrl = process.env.DATABASE_URL!;
const targetUrl = process.env.NEW_DATABASE_URL!;

if (!sourceUrl || !targetUrl) {
  console.error("Missing DATABASE_URL or NEW_DATABASE_URL");
  process.exit(1);
}

const sourceDb = neon(sourceUrl);
const targetDb = neon(targetUrl);

async function migrate() {
  console.log("Starting migration to new Neon database...\n");

  // Create tables on target database
  console.log("1. Creating tables...");
  
  await targetDb`
    CREATE TABLE IF NOT EXISTS cultural_observances (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      name TEXT NOT NULL,
      tradition TEXT NOT NULL,
      region TEXT NOT NULL,
      description TEXT,
      category TEXT DEFAULT 'cultural'
    )
  `;
  
  await targetDb`
    CREATE TABLE IF NOT EXISTS daily_cookies (
      id SERIAL PRIMARY KEY,
      date DATE NOT NULL,
      language VARCHAR(5) NOT NULL,
      cookie TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  
  console.log("   Tables created.\n");

  // Export cultural_observances
  console.log("2. Migrating cultural_observances...");
  const observances = await sourceDb`SELECT * FROM cultural_observances`;
  console.log(`   Found ${observances.length} records`);
  
  if (observances.length > 0) {
    // Clear existing data first
    await targetDb`TRUNCATE cultural_observances RESTART IDENTITY`;
    
    // Insert in batches of 100
    const batchSize = 100;
    for (let i = 0; i < observances.length; i += batchSize) {
      const batch = observances.slice(i, i + batchSize);
      for (const obs of batch) {
        await targetDb`
          INSERT INTO cultural_observances (date, name, tradition, region, description, category)
          VALUES (${obs.date}, ${obs.name}, ${obs.tradition}, ${obs.region}, ${obs.description}, ${obs.category})
        `;
      }
      console.log(`   Inserted ${Math.min(i + batchSize, observances.length)}/${observances.length}`);
    }
  }
  console.log("   Done.\n");

  // Export daily_cookies
  console.log("3. Migrating daily_cookies...");
  const cookies = await sourceDb`SELECT * FROM daily_cookies`;
  console.log(`   Found ${cookies.length} records`);
  
  if (cookies.length > 0) {
    await targetDb`TRUNCATE daily_cookies RESTART IDENTITY`;
    
    for (const cookie of cookies) {
      await targetDb`
        INSERT INTO daily_cookies (date, language, cookie, created_at)
        VALUES (${cookie.date}, ${cookie.language}, ${cookie.cookie}, ${cookie.created_at})
      `;
    }
  }
  console.log("   Done.\n");

  console.log("Migration complete!");
}

migrate().catch(console.error);
