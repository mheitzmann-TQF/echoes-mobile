import { db } from './db';
import { culturalObservances } from '../shared/schema';
import { eq, and } from 'drizzle-orm';

interface HebcalHoliday {
  title: string;
  date: string;
  category: string;
  subcat?: string;
  memo?: string;
  hebrew?: string;
}

interface HebcalResponse {
  items: HebcalHoliday[];
}

const HOLIDAY_DESCRIPTIONS: Record<string, string> = {
  "Rosh Hashana": "Jewish New Year, a time of reflection and renewal",
  "Yom Kippur": "Day of Atonement, the holiest day in the Jewish calendar",
  "Sukkot": "Festival of Tabernacles, celebrating the harvest and divine protection",
  "Shmini Atzeret": "Eighth day of assembly, conclusion of Sukkot",
  "Simchat Torah": "Celebration of completing the annual Torah reading cycle",
  "Chanukah": "Festival of Lights, commemorating the rededication of the Temple",
  "Tu BiShvat": "New Year for Trees, celebrating nature and renewal",
  "Purim": "Festival celebrating deliverance from ancient persecution",
  "Pesach": "Passover, commemorating the Exodus from Egypt",
  "Shavuot": "Festival of Weeks, celebrating the giving of the Torah",
  "Tish'a B'Av": "Day of mourning for the destruction of the Temples",
  "Tu B'Av": "Day of love and matchmaking in Jewish tradition",
  "Lag BaOmer": "33rd day of the Omer, a day of celebration during the counting period",
  "Rosh Chodesh": "New Moon, marking the beginning of a Hebrew month",
};

function getDescription(title: string): string {
  for (const [key, desc] of Object.entries(HOLIDAY_DESCRIPTIONS)) {
    if (title.includes(key)) return desc;
  }
  return "Jewish observance";
}

function mapCategory(hebcalCategory: string): string {
  switch (hebcalCategory) {
    case 'holiday':
    case 'major':
      return 'religious';
    case 'minor':
    case 'modern':
      return 'cultural';
    case 'roshchodesh':
      return 'astronomical';
    default:
      return 'cultural';
  }
}

export async function fetchAndSeedJewishHolidays(year: number): Promise<{ inserted: number; skipped: number }> {
  const url = `https://www.hebcal.com/hebcal?v=1&cfg=json&year=${year}&maj=on&min=on&mod=on&nx=on&ss=on&s=off`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Hebcal API error: ${response.status}`);
  }
  
  const data: HebcalResponse = await response.json();
  
  let inserted = 0;
  let skipped = 0;
  
  for (const item of data.items) {
    if (!item.date || !item.title) continue;
    
    const dateStr = item.date.split('T')[0];
    
    const existing = await db.select()
      .from(culturalObservances)
      .where(and(
        eq(culturalObservances.date, dateStr),
        eq(culturalObservances.name, item.title),
        eq(culturalObservances.tradition, 'Jewish')
      ))
      .limit(1);
    
    if (existing.length > 0) {
      skipped++;
      continue;
    }
    
    await db.insert(culturalObservances).values({
      date: dateStr,
      name: item.title,
      tradition: 'Jewish',
      region: 'Global',
      description: getDescription(item.title),
      category: mapCategory(item.category),
    });
    
    inserted++;
  }
  
  return { inserted, skipped };
}

export async function seedMultipleYears(years: number[]): Promise<{ total: number; byYear: Record<number, { inserted: number; skipped: number }> }> {
  const results: Record<number, { inserted: number; skipped: number }> = {};
  let total = 0;
  
  for (const year of years) {
    const result = await fetchAndSeedJewishHolidays(year);
    results[year] = result;
    total += result.inserted;
  }
  
  return { total, byYear: results };
}
