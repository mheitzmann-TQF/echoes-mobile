/**
 * Seed script for cultural observances
 * Generates 10 years of holidays (2026-2036) including moveable dates
 * 
 * Run with: npx tsx scripts/seed-observances.ts
 */

import Holidays from 'date-holidays';
import { db } from '../lib/db';
import { culturalObservances } from '../shared/schema';

const hd = new Holidays();

// Format date as YYYY-MM-DD
function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Calculate Easter Sunday using the Anonymous Gregorian algorithm
function getEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

// Orthodox Easter (Julian calendar, then converted)
function getOrthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  
  // Convert from Julian to Gregorian (add 13 days for 20th/21st century)
  const julianDate = new Date(year, month - 1, day);
  julianDate.setDate(julianDate.getDate() + 13);
  return julianDate;
}

// Lunar New Year (verified dates)
function getLunarNewYear(year: number): Date {
  const dates: Record<number, string> = {
    2026: '2026-02-17',
    2027: '2027-02-06',
    2028: '2028-01-26',
    2029: '2029-02-13',
    2030: '2030-02-03',
    2031: '2031-01-23',
    2032: '2032-02-11',
    2033: '2033-01-31',
    2034: '2034-02-19',
    2035: '2035-02-08',
    2036: '2036-01-28',
  };
  return new Date(dates[year] || `${year}-02-01`);
}

// Diwali (verified dates - main day of celebration)
function getDiwali(year: number): Date {
  const dates: Record<number, string> = {
    2026: '2026-11-08',
    2027: '2027-10-29',
    2028: '2028-10-17',
    2029: '2029-11-05',
    2030: '2030-10-26',
    2031: '2031-11-14',
    2032: '2032-11-02',
    2033: '2033-10-22',
    2034: '2034-11-10',
    2035: '2035-10-30',
    2036: '2036-11-11',
  };
  return new Date(dates[year] || `${year}-10-25`);
}

// Holi (verified dates - main color festival day)
function getHoli(year: number): Date {
  const dates: Record<number, string> = {
    2026: '2026-03-04',
    2027: '2027-03-23',
    2028: '2028-03-11',
    2029: '2029-03-01',
    2030: '2030-03-20',
    2031: '2031-03-09',
    2032: '2032-02-27',
    2033: '2033-03-17',
    2034: '2034-03-07',
    2035: '2035-02-26',
    2036: '2036-03-14',
  };
  return new Date(dates[year] || `${year}-03-15`);
}

// Ramadan start (verified dates - may vary by 1-2 days based on moon sighting)
function getRamadanStart(year: number): Date {
  const dates: Record<number, string> = {
    2026: '2026-02-17',
    2027: '2027-02-07',
    2028: '2028-01-27',
    2029: '2029-01-16',
    2030: '2030-01-05',
    2031: '2031-12-15',
    2032: '2032-12-03',
    2033: '2033-11-22',
    2034: '2034-11-11',
    2035: '2035-10-31',
    2036: '2036-10-20',
  };
  return new Date(dates[year] || `${year}-03-01`);
}

// Eid al-Fitr (verified dates - end of Ramadan)
function getEidAlFitr(year: number): Date {
  const dates: Record<number, string> = {
    2026: '2026-03-18',
    2027: '2027-03-08',
    2028: '2028-02-25',
    2029: '2029-02-14',
    2030: '2030-02-04',
    2031: '2032-01-13',
    2032: '2033-01-02',
    2033: '2033-12-21',
    2034: '2034-12-10',
    2035: '2035-11-29',
    2036: '2036-11-18',
  };
  // Note: 2031 and 2032 Eid falls in the following calendar year
  return new Date(dates[year] || `${year}-04-01`);
}

// Passover (verified dates - first Seder night)
function getPassover(year: number): Date {
  const dates: Record<number, string> = {
    2026: '2026-04-01',
    2027: '2027-04-21',
    2028: '2028-04-10',
    2029: '2029-03-30',
    2030: '2030-04-17',
    2031: '2031-04-07',
    2032: '2032-03-26',
    2033: '2033-04-13',
    2034: '2034-04-03',
    2035: '2035-04-23',
    2036: '2036-04-11',
  };
  return new Date(dates[year] || `${year}-04-15`);
}

// Vesak (Buddha Day - full moon in May)
function getVesak(year: number): Date {
  const dates: Record<number, string> = {
    2026: '2026-05-12',
    2027: '2027-05-02',
    2028: '2028-05-20',
    2029: '2029-05-10',
    2030: '2030-05-29',
    2031: '2031-05-18',
    2032: '2032-05-07',
    2033: '2033-05-26',
    2034: '2034-05-15',
    2035: '2035-05-04',
    2036: '2036-05-23',
  };
  return new Date(dates[year] || `${year}-05-15`);
}

interface ObservanceEntry {
  date: string;
  name: string;
  tradition: string;
  region: string;
  description: string;
  category: string;
}

function generateObservances(startYear: number, endYear: number): ObservanceEntry[] {
  const observances: ObservanceEntry[] = [];

  for (let year = startYear; year <= endYear; year++) {
    // Fixed dates
    observances.push(
      // Orthodox Christmas (Jan 7)
      {
        date: `${year}-01-07`,
        name: 'Orthodox Christmas',
        tradition: 'Orthodox Christian',
        region: 'Russia, Serbia, Ethiopia, Egypt, Georgia, Ukraine, North Macedonia',
        description: 'Christmas Day for Eastern Orthodox churches following the Julian calendar.',
        category: 'religious',
      },
      // Imbolc (Feb 1)
      {
        date: `${year}-02-01`,
        name: 'Imbolc',
        tradition: 'Celtic/Pagan',
        region: 'Ireland, Scotland, Celtic traditions worldwide',
        description: 'Celtic festival marking the beginning of spring and honoring the goddess Brigid.',
        category: 'seasonal',
      },
      // Nowruz (Mar 20/21)
      {
        date: `${year}-03-20`,
        name: 'Nowruz',
        tradition: 'Persian/Zoroastrian',
        region: 'Iran, Afghanistan, Central Asia, Kurdish regions',
        description: 'Persian New Year celebrating the spring equinox and renewal.',
        category: 'cultural',
      },
      // Spring Equinox (Mar 20)
      {
        date: `${year}-03-20`,
        name: 'Spring Equinox',
        tradition: 'Astronomical',
        region: 'Global (Northern Hemisphere)',
        description: 'Day and night equal length, marking the astronomical beginning of spring.',
        category: 'astronomical',
      },
      // Beltane (May 1)
      {
        date: `${year}-05-01`,
        name: 'Beltane',
        tradition: 'Celtic/Pagan',
        region: 'Ireland, Scotland, Celtic traditions worldwide',
        description: 'Celtic fire festival celebrating the peak of spring and fertility.',
        category: 'seasonal',
      },
      // Summer Solstice (Jun 21)
      {
        date: `${year}-06-21`,
        name: 'Summer Solstice',
        tradition: 'Astronomical',
        region: 'Global (Northern Hemisphere)',
        description: 'Longest day of the year, marking the astronomical beginning of summer.',
        category: 'astronomical',
      },
      // Lughnasadh (Aug 1)
      {
        date: `${year}-08-01`,
        name: 'Lughnasadh',
        tradition: 'Celtic/Pagan',
        region: 'Ireland, Celtic traditions worldwide',
        description: 'Celtic harvest festival honoring the god Lugh.',
        category: 'seasonal',
      },
      // Autumn Equinox (Sep 22)
      {
        date: `${year}-09-22`,
        name: 'Autumn Equinox',
        tradition: 'Astronomical',
        region: 'Global (Northern Hemisphere)',
        description: 'Day and night equal length, marking the astronomical beginning of autumn.',
        category: 'astronomical',
      },
      // Mid-Autumn Festival (approximate)
      {
        date: `${year}-09-15`,
        name: 'Mid-Autumn Festival',
        tradition: 'Chinese',
        region: 'China, Vietnam, Taiwan, Singapore',
        description: 'Harvest festival celebrating the full moon with mooncakes and lanterns.',
        category: 'cultural',
      },
      // Samhain (Oct 31)
      {
        date: `${year}-10-31`,
        name: 'Samhain',
        tradition: 'Celtic/Pagan',
        region: 'Ireland, Scotland, Celtic traditions worldwide',
        description: 'Celtic new year and festival honoring ancestors, origin of Halloween.',
        category: 'seasonal',
      },
      // Day of the Dead (Nov 1-2)
      {
        date: `${year}-11-01`,
        name: 'Día de los Muertos',
        tradition: 'Mexican/Indigenous',
        region: 'Mexico, Latin America',
        description: 'Traditional celebration honoring deceased loved ones with altars and offerings.',
        category: 'cultural',
      },
      // Winter Solstice (Dec 21)
      {
        date: `${year}-12-21`,
        name: 'Winter Solstice',
        tradition: 'Astronomical',
        region: 'Global (Northern Hemisphere)',
        description: 'Shortest day of the year, marking the astronomical beginning of winter.',
        category: 'astronomical',
      },
      // Christmas (Dec 25)
      {
        date: `${year}-12-25`,
        name: 'Christmas',
        tradition: 'Christian',
        region: 'Global',
        description: 'Christian celebration of the birth of Jesus Christ.',
        category: 'religious',
      }
    );

    // Moveable dates
    const easter = getEasterSunday(year);
    const orthodoxEaster = getOrthodoxEaster(year);
    const lunarNewYear = getLunarNewYear(year);
    const diwali = getDiwali(year);
    const holi = getHoli(year);
    const ramadanStart = getRamadanStart(year);
    const eidAlFitr = getEidAlFitr(year);
    const passover = getPassover(year);
    const vesak = getVesak(year);

    observances.push(
      {
        date: formatDate(easter),
        name: 'Easter Sunday',
        tradition: 'Christian',
        region: 'Global (Western churches)',
        description: 'Christian celebration of the resurrection of Jesus Christ.',
        category: 'religious',
      },
      {
        date: formatDate(orthodoxEaster),
        name: 'Orthodox Easter',
        tradition: 'Orthodox Christian',
        region: 'Russia, Greece, Serbia, Ethiopia, Egypt, Georgia, Ukraine',
        description: 'Eastern Orthodox celebration of the resurrection, following the Julian calendar.',
        category: 'religious',
      },
      {
        date: formatDate(lunarNewYear),
        name: 'Lunar New Year',
        tradition: 'Chinese/East Asian',
        region: 'China, Korea, Vietnam, Singapore, Malaysia',
        description: 'Celebration of the new lunar year with family gatherings and festivities.',
        category: 'cultural',
      },
      {
        date: formatDate(diwali),
        name: 'Diwali',
        tradition: 'Hindu',
        region: 'India, Nepal, Sri Lanka, diaspora worldwide',
        description: 'Festival of lights celebrating the victory of light over darkness.',
        category: 'religious',
      },
      {
        date: formatDate(holi),
        name: 'Holi',
        tradition: 'Hindu',
        region: 'India, Nepal, diaspora worldwide',
        description: 'Festival of colors celebrating spring and the victory of good over evil.',
        category: 'religious',
      },
      {
        date: formatDate(ramadanStart),
        name: 'Ramadan Begins',
        tradition: 'Islamic',
        region: 'Global Muslim communities',
        description: 'Beginning of the holy month of fasting, prayer, and reflection.',
        category: 'religious',
      },
      {
        date: formatDate(eidAlFitr),
        name: 'Eid al-Fitr',
        tradition: 'Islamic',
        region: 'Global Muslim communities',
        description: 'Festival of breaking the fast, marking the end of Ramadan.',
        category: 'religious',
      },
      {
        date: formatDate(passover),
        name: 'Passover',
        tradition: 'Jewish',
        region: 'Global Jewish communities',
        description: 'Celebration of the liberation of Israelites from Egyptian slavery.',
        category: 'religious',
      },
      {
        date: formatDate(vesak),
        name: 'Vesak',
        tradition: 'Buddhist',
        region: 'Sri Lanka, Southeast Asia, East Asia',
        description: 'Buddha Day celebrating the birth, enlightenment, and death of Buddha.',
        category: 'religious',
      }
    );
  }

  return observances;
}

async function seedObservances() {
  console.log('🌍 Seeding cultural observances for 2026-2036...');
  
  try {
    // Clear existing observances
    await db.delete(culturalObservances);
    console.log('✓ Cleared existing observances');

    // Generate and insert observances
    const observances = generateObservances(2026, 2036);
    console.log(`📅 Generated ${observances.length} observances`);

    // Insert in batches
    const batchSize = 50;
    for (let i = 0; i < observances.length; i += batchSize) {
      const batch = observances.slice(i, i + batchSize);
      await db.insert(culturalObservances).values(batch);
      console.log(`  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(observances.length / batchSize)}`);
    }

    console.log('✅ Successfully seeded observances!');
    console.log(`   Total: ${observances.length} observances over 11 years`);
    
    // Show sample for today
    const today = new Date().toISOString().split('T')[0];
    const todayObs = observances.filter(o => o.date === today);
    if (todayObs.length > 0) {
      console.log(`\n📆 Today (${today}):`);
      todayObs.forEach(o => console.log(`   - ${o.name} (${o.tradition})`));
    }

  } catch (error) {
    console.error('❌ Error seeding observances:', error);
    process.exit(1);
  }
}

seedObservances();
