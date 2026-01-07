/**
 * Comprehensive seed script for cultural observances
 * Uses date-holidays library + manual verified moveable dates
 * Generates 11 years of holidays (2026-2036)
 * 
 * Run with: npx tsx scripts/seed-observances-comprehensive.ts
 */

import Holidays from 'date-holidays';
import { db } from '../lib/db';
import { culturalObservances } from '../shared/schema';

const hd = new Holidays();

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

// ============================================
// VERIFIED MOVEABLE DATES (manually verified)
// ============================================

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

function getOrthodoxEaster(year: number): Date {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31);
  const day = ((d + e + 114) % 31) + 1;
  const julianDate = new Date(year, month - 1, day);
  julianDate.setDate(julianDate.getDate() + 13);
  return julianDate;
}

// Verified lunar calendar dates
const LUNAR_NEW_YEAR: Record<number, string> = {
  2026: '2026-02-17', 2027: '2027-02-06', 2028: '2028-01-26', 2029: '2029-02-13',
  2030: '2030-02-03', 2031: '2031-01-23', 2032: '2032-02-11', 2033: '2033-01-31',
  2034: '2034-02-19', 2035: '2035-02-08', 2036: '2036-01-28',
};

const DIWALI: Record<number, string> = {
  2026: '2026-11-08', 2027: '2027-10-29', 2028: '2028-10-17', 2029: '2029-11-05',
  2030: '2030-10-26', 2031: '2031-11-14', 2032: '2032-11-02', 2033: '2033-10-22',
  2034: '2034-11-10', 2035: '2035-10-30', 2036: '2036-11-11',
};

const HOLI: Record<number, string> = {
  2026: '2026-03-04', 2027: '2027-03-23', 2028: '2028-03-11', 2029: '2029-03-01',
  2030: '2030-03-20', 2031: '2031-03-09', 2032: '2032-02-27', 2033: '2033-03-17',
  2034: '2034-03-07', 2035: '2035-02-26', 2036: '2036-03-14',
};

const RAMADAN_START: Record<number, string> = {
  2026: '2026-02-17', 2027: '2027-02-07', 2028: '2028-01-27', 2029: '2029-01-16',
  2030: '2030-01-05', 2031: '2031-12-15', 2032: '2032-12-03', 2033: '2033-11-22',
  2034: '2034-11-11', 2035: '2035-10-31', 2036: '2036-10-20',
};

const EID_AL_FITR: Record<number, string> = {
  2026: '2026-03-18', 2027: '2027-03-08', 2028: '2028-02-25', 2029: '2029-02-14',
  2030: '2030-02-04', 2031: '2032-01-13', 2032: '2033-01-02', 2033: '2033-12-21',
  2034: '2034-12-10', 2035: '2035-11-29', 2036: '2036-11-18',
};

const PASSOVER: Record<number, string> = {
  2026: '2026-04-01', 2027: '2027-04-21', 2028: '2028-04-10', 2029: '2029-03-30',
  2030: '2030-04-17', 2031: '2031-04-07', 2032: '2032-03-26', 2033: '2033-04-13',
  2034: '2034-04-03', 2035: '2035-04-23', 2036: '2036-04-11',
};

const VESAK: Record<number, string> = {
  2026: '2026-05-12', 2027: '2027-05-02', 2028: '2028-05-20', 2029: '2029-05-10',
  2030: '2030-05-29', 2031: '2031-05-18', 2032: '2032-05-07', 2033: '2033-05-26',
  2034: '2034-05-15', 2035: '2035-05-04', 2036: '2036-05-23',
};

const ISRA_MIRAJ: Record<number, string> = {
  2026: '2026-01-16', 2027: '2027-01-06', 2028: '2027-12-26', 2029: '2029-12-15',
  2030: '2030-12-04', 2031: '2031-11-23', 2032: '2032-11-12', 2033: '2033-11-01',
  2034: '2034-10-21', 2035: '2035-10-11', 2036: '2036-09-29',
};

// ============================================
// OBSERVANCE ENTRY TYPE
// ============================================

interface ObservanceEntry {
  date: string;
  name: string;
  tradition: string;
  region: string;
  description: string;
  category: string;
}

// ============================================
// CURATED HOLIDAYS FROM date-holidays LIBRARY
// These are culturally significant holidays from diverse regions
// ============================================

const CURATED_HOLIDAYS: Array<{
  country: string;
  holidays: Array<{
    name: string;  // Name to match from library
    displayName?: string;  // Display name override
    tradition: string;
    region: string;
    description: string;
    category: string;
  }>;
}> = [
  {
    country: 'JP',
    holidays: [
      { name: 'Foundation Day', tradition: 'National', region: 'Japan', description: 'Commemorates the legendary founding of Japan and the imperial line.', category: 'national' },
      { name: "Emperor's Birthday", tradition: 'National', region: 'Japan', description: 'Celebrates the birthday of the current Emperor of Japan.', category: 'national' },
      { name: 'Spring Equinox Day', tradition: 'National/Shinto', region: 'Japan', description: 'Day to honor ancestors and nature, also known as Shunbun no Hi.', category: 'seasonal' },
      { name: 'Shōwa Day', tradition: 'National', region: 'Japan', description: 'Honors Emperor Shōwa and reflects on the turbulent years of his reign.', category: 'national' },
      { name: 'Constitution Memorial Day', tradition: 'National', region: 'Japan', description: 'Commemorates the enactment of Japan\'s postwar constitution.', category: 'national' },
      { name: 'Children\'s Day', tradition: 'Cultural', region: 'Japan', description: 'Day celebrating the happiness and welfare of children.', category: 'cultural' },
      { name: 'Marine Day', tradition: 'National', region: 'Japan', description: 'Day of gratitude for the ocean and its bounty.', category: 'national' },
      { name: 'Mountain Day', tradition: 'National', region: 'Japan', description: 'Appreciation for mountains and nature.', category: 'national' },
      { name: 'Autumn Equinox Day', tradition: 'National/Shinto', region: 'Japan', description: 'Day to honor ancestors, also known as Shūbun no Hi.', category: 'seasonal' },
      { name: 'Culture Day', tradition: 'National', region: 'Japan', description: 'Promotes culture, the arts, and academic endeavor.', category: 'cultural' },
      { name: 'Labour Thanksgiving Day', tradition: 'National', region: 'Japan', description: 'Day of thanksgiving for labor and production.', category: 'national' },
    ],
  },
  {
    country: 'KR',
    holidays: [
      { name: 'Independence Movement Day', tradition: 'National', region: 'Korea', description: 'Commemorates the March 1st Movement of 1919 against Japanese occupation.', category: 'national' },
      { name: "Buddha's Birthday", displayName: 'Seokga Tansinil', tradition: 'Buddhist', region: 'Korea', description: 'Celebrates the birth of Buddha with lantern festivals.', category: 'religious' },
      { name: 'Memorial Day', tradition: 'National', region: 'Korea', description: 'Honors military personnel who died in service.', category: 'national' },
      { name: 'Liberation Day', tradition: 'National', region: 'Korea', description: 'Celebrates independence from Japanese rule in 1945.', category: 'national' },
      { name: 'Chuseok', tradition: 'Cultural', region: 'Korea', description: 'Korean harvest festival honoring ancestors with food and gratitude.', category: 'cultural' },
      { name: 'National Foundation Day', tradition: 'National', region: 'Korea', description: 'Celebrates the legendary founding of the first Korean kingdom.', category: 'national' },
      { name: 'Hangul Day', tradition: 'Cultural', region: 'Korea', description: 'Celebrates the Korean alphabet invented by King Sejong.', category: 'cultural' },
    ],
  },
  {
    country: 'TH',
    holidays: [
      { name: 'Makha Bucha', tradition: 'Buddhist', region: 'Thailand', description: 'Commemorates Buddha\'s teachings to 1,250 monks gathered spontaneously.', category: 'religious' },
      { name: 'Chakri Memorial Day', tradition: 'National', region: 'Thailand', description: 'Honors King Rama I and the Chakri Dynasty founding.', category: 'national' },
      { name: 'Songkran', tradition: 'Buddhist/Cultural', region: 'Thailand', description: 'Thai New Year festival celebrated with water splashing.', category: 'cultural' },
      { name: 'Visakha Bucha', tradition: 'Buddhist', region: 'Thailand', description: 'Most important Buddhist holiday marking Buddha\'s birth, enlightenment, and death.', category: 'religious' },
      { name: 'Asalha Bucha', tradition: 'Buddhist', region: 'Thailand', description: 'Commemorates Buddha\'s first sermon after enlightenment.', category: 'religious' },
      { name: 'Khao Phansa', tradition: 'Buddhist', region: 'Thailand', description: 'Beginning of Buddhist Lent and the rainy season retreat.', category: 'religious' },
      { name: 'Loy Krathong', displayName: 'Loi Krathong', tradition: 'Cultural', region: 'Thailand', description: 'Festival of lights with floating offerings on water.', category: 'cultural' },
    ],
  },
  {
    country: 'ID',
    holidays: [
      { name: 'Nyepi', tradition: 'Hindu/Balinese', region: 'Indonesia (Bali)', description: 'Balinese Day of Silence marking the Saka New Year.', category: 'religious' },
      { name: 'Waisak', displayName: 'Vesak', tradition: 'Buddhist', region: 'Indonesia', description: 'Celebration of Buddha\'s life at Borobudur temple.', category: 'religious' },
    ],
  },
  {
    country: 'IL',
    holidays: [
      { name: 'Tu Bishvat', displayName: 'Tu BiShvat', tradition: 'Jewish', region: 'Israel, Jewish communities worldwide', description: 'New Year for Trees, celebrating nature and renewal.', category: 'religious' },
      { name: 'Purim', tradition: 'Jewish', region: 'Israel, Jewish communities worldwide', description: 'Celebration of Jewish survival with costumes and festivities.', category: 'religious' },
      { name: 'Shavuot', tradition: 'Jewish', region: 'Israel, Jewish communities worldwide', description: 'Festival of Weeks celebrating the giving of the Torah.', category: 'religious' },
      { name: 'Rosh Hashanah', tradition: 'Jewish', region: 'Israel, Jewish communities worldwide', description: 'Jewish New Year, beginning of the High Holy Days.', category: 'religious' },
      { name: 'Yom Kippur', tradition: 'Jewish', region: 'Israel, Jewish communities worldwide', description: 'Day of Atonement, holiest day in Judaism.', category: 'religious' },
      { name: 'Sukkot', tradition: 'Jewish', region: 'Israel, Jewish communities worldwide', description: 'Feast of Tabernacles celebrating the harvest and divine protection.', category: 'religious' },
      { name: 'Hanukkah', displayName: 'Hanukkah', tradition: 'Jewish', region: 'Israel, Jewish communities worldwide', description: 'Festival of Lights commemorating the rededication of the Temple.', category: 'religious' },
    ],
  },
  {
    country: 'IR',
    holidays: [
      { name: 'Nowruz', tradition: 'Persian/Zoroastrian', region: 'Iran, Afghanistan, Central Asia', description: 'Persian New Year celebrating the spring equinox.', category: 'cultural' },
      { name: 'Sizdah Bedar', tradition: 'Persian', region: 'Iran', description: 'Nature\'s Day, ending the Nowruz celebrations outdoors.', category: 'cultural' },
    ],
  },
  {
    country: 'ET',
    holidays: [
      { name: 'Victory at Adwa Day', displayName: 'Victory of Adwa', tradition: 'National', region: 'Ethiopia', description: 'Celebrates Ethiopian victory over Italy in 1896.', category: 'national' },
      { name: 'Meskel', tradition: 'Ethiopian Orthodox', region: 'Ethiopia', description: 'Finding of the True Cross festival with bonfires.', category: 'religious' },
      { name: 'Enkutatash', tradition: 'Ethiopian', region: 'Ethiopia', description: 'Ethiopian New Year marking end of rainy season.', category: 'cultural' },
      { name: 'Timkat', displayName: 'Timkat (Epiphany)', tradition: 'Ethiopian Orthodox', region: 'Ethiopia', description: 'Ethiopian Epiphany with colorful processions.', category: 'religious' },
    ],
  },
  {
    country: 'MX',
    holidays: [
      { name: "Benito Juárez's birthday", displayName: 'Benito Juárez Day', tradition: 'National', region: 'Mexico', description: 'Honors Benito Juárez, indigenous president who fought for reform.', category: 'national' },
      { name: 'Revolution Day', tradition: 'National', region: 'Mexico', description: 'Commemorates the Mexican Revolution of 1910.', category: 'national' },
    ],
  },
  {
    country: 'AR',
    holidays: [
      { name: 'Day of Remembrance for Truth and Justice', tradition: 'National', region: 'Argentina', description: 'Commemorates victims of the 1976-1983 military dictatorship.', category: 'national' },
    ],
  },
  {
    country: 'BR',
    holidays: [
      { name: 'Tiradentes Day', tradition: 'National', region: 'Brazil', description: 'Honors Tiradentes, martyr of Brazilian independence.', category: 'national' },
      { name: 'Black Consciousness Day', tradition: 'Cultural', region: 'Brazil', description: 'Celebrates African-Brazilian culture and heritage.', category: 'cultural' },
    ],
  },
  {
    country: 'ZA',
    holidays: [
      { name: 'Human Rights Day', tradition: 'National', region: 'South Africa', description: 'Commemorates the Sharpeville Massacre of 1960.', category: 'national' },
      { name: 'Freedom Day', tradition: 'National', region: 'South Africa', description: 'Celebrates the first democratic elections in 1994.', category: 'national' },
      { name: 'Youth Day', tradition: 'National', region: 'South Africa', description: 'Commemorates the Soweto Uprising of 1976.', category: 'national' },
      { name: 'Heritage Day', tradition: 'Cultural', region: 'South Africa', description: 'Celebrates South African cultural diversity.', category: 'cultural' },
      { name: 'Day of Reconciliation', tradition: 'National', region: 'South Africa', description: 'Promotes reconciliation and national unity.', category: 'national' },
    ],
  },
  {
    country: 'IE',
    holidays: [
      { name: "St. Patrick's Day", tradition: 'Irish/Christian', region: 'Ireland, diaspora worldwide', description: 'Celebrates the patron saint of Ireland with parades and green.', category: 'cultural' },
    ],
  },
  {
    country: 'GR',
    holidays: [
      { name: 'Clean Monday', displayName: 'Clean Monday (Kathara Deftera)', tradition: 'Orthodox Christian', region: 'Greece, Cyprus', description: 'First day of Lent with kite-flying and feasting.', category: 'religious' },
      { name: 'Ohi Day', tradition: 'National', region: 'Greece, Cyprus', description: 'Commemorates Greek rejection of Italian ultimatum in 1940.', category: 'national' },
    ],
  },
  {
    country: 'SE',
    holidays: [
      { name: 'Midsummer Eve', tradition: 'Nordic', region: 'Sweden, Finland, Nordic countries', description: 'Celebration of the summer solstice with maypoles and dancing.', category: 'seasonal' },
      { name: 'Saint Lucia Day', displayName: 'Santa Lucia', tradition: 'Nordic/Christian', region: 'Sweden, Norway, Denmark', description: 'Festival of light with candlelit processions.', category: 'cultural' },
    ],
  },
  {
    country: 'NO',
    holidays: [
      { name: 'Day of the Sami people', displayName: 'Sami National Day', tradition: 'Indigenous', region: 'Norway, Sweden, Finland, Russia', description: 'Celebrates the indigenous Sami people of Scandinavia.', category: 'cultural' },
      { name: 'Constitution Day', tradition: 'National', region: 'Norway', description: 'Celebrates the signing of the Norwegian Constitution in 1814.', category: 'national' },
    ],
  },
  {
    country: 'TT',
    holidays: [
      { name: 'Spiritual Baptist Liberation Day', displayName: 'Shouter Baptist Liberation Day', tradition: 'Afro-Caribbean', region: 'Trinidad and Tobago', description: 'Celebrates the end of persecution of Spiritual Baptists.', category: 'religious' },
      { name: 'Indian Arrival Day', tradition: 'Cultural', region: 'Trinidad and Tobago', description: 'Commemorates the arrival of Indian indentured laborers.', category: 'cultural' },
      { name: 'Emancipation Day', tradition: 'National', region: 'Trinidad and Tobago, Caribbean', description: 'Celebrates the end of slavery in the British Empire.', category: 'national' },
    ],
  },
];

// ============================================
// GENERATE OBSERVANCES
// ============================================

function generateObservances(startYear: number, endYear: number): ObservanceEntry[] {
  const observances: ObservanceEntry[] = [];
  const addedKeys = new Set<string>();

  function addObservance(entry: ObservanceEntry) {
    const key = `${entry.date}|${entry.name}`;
    if (!addedKeys.has(key)) {
      addedKeys.add(key);
      observances.push(entry);
    }
  }

  for (let year = startYear; year <= endYear; year++) {
    // ========== FIXED DATES ==========
    
    // Orthodox Christmas (Jan 7)
    addObservance({
      date: `${year}-01-07`,
      name: 'Orthodox Christmas',
      tradition: 'Orthodox Christian',
      region: 'Russia, Serbia, Ethiopia, Egypt, Georgia, Ukraine, North Macedonia',
      description: 'Christmas Day for Eastern Orthodox churches following the Julian calendar.',
      category: 'religious',
    });

    // Vodoun Festival (Jan 10)
    addObservance({
      date: `${year}-01-10`,
      name: 'Vodoun Festival',
      tradition: 'West African Vodoun',
      region: 'Benin, Togo, West Africa',
      description: 'National celebration honoring traditional Vodoun spirituality and ancestors.',
      category: 'religious',
    });

    // Amazigh New Year (Jan 12)
    addObservance({
      date: `${year}-01-12`,
      name: 'Amazigh New Year (Yennayer)',
      tradition: 'Berber/Amazigh',
      region: 'Algeria, Morocco, Libya, Tunisia',
      description: 'Traditional Berber New Year marking the beginning of the agrarian calendar.',
      category: 'cultural',
    });

    // Republic Day India (Jan 26)
    addObservance({
      date: `${year}-01-26`,
      name: 'Republic Day',
      tradition: 'National',
      region: 'India',
      description: 'Commemorates the adoption of the Constitution of India in 1950.',
      category: 'national',
    });

    // Australia Day (Jan 26)
    addObservance({
      date: `${year}-01-26`,
      name: 'Australia Day',
      tradition: 'National',
      region: 'Australia',
      description: 'National day commemorating the arrival of the First Fleet in 1788.',
      category: 'national',
    });

    // Imbolc / St. Brigid's Day (Feb 1)
    addObservance({
      date: `${year}-02-01`,
      name: "Imbolc / St. Brigid's Day",
      tradition: 'Celtic/Irish',
      region: 'Ireland, Scotland, Celtic traditions worldwide',
      description: 'Celtic festival marking the beginning of spring, now also a public holiday in Ireland.',
      category: 'seasonal',
    });

    // Waitangi Day (Feb 6)
    addObservance({
      date: `${year}-02-06`,
      name: 'Waitangi Day',
      tradition: 'National',
      region: 'New Zealand',
      description: 'National day commemorating the signing of the Treaty of Waitangi between Māori and the British Crown.',
      category: 'national',
    });

    // Nowruz (Mar 20/21)
    addObservance({
      date: `${year}-03-20`,
      name: 'Nowruz',
      tradition: 'Persian/Zoroastrian',
      region: 'Iran, Afghanistan, Central Asia, Kurdish regions',
      description: 'Persian New Year celebrating the spring equinox and renewal.',
      category: 'cultural',
    });

    // Astronomical dates
    addObservance({ date: `${year}-03-20`, name: 'Spring Equinox', tradition: 'Astronomical', region: 'Global (Northern Hemisphere)', description: 'Day and night equal length, marking the astronomical beginning of spring.', category: 'astronomical' });
    addObservance({ date: `${year}-06-21`, name: 'Summer Solstice', tradition: 'Astronomical', region: 'Global (Northern Hemisphere)', description: 'Longest day of the year, marking the astronomical beginning of summer.', category: 'astronomical' });
    addObservance({ date: `${year}-09-22`, name: 'Autumn Equinox', tradition: 'Astronomical', region: 'Global (Northern Hemisphere)', description: 'Day and night equal length, marking the astronomical beginning of autumn.', category: 'astronomical' });
    addObservance({ date: `${year}-12-21`, name: 'Winter Solstice', tradition: 'Astronomical', region: 'Global (Northern Hemisphere)', description: 'Shortest day of the year, marking the astronomical beginning of winter.', category: 'astronomical' });

    // Celtic festivals
    addObservance({ date: `${year}-05-01`, name: 'Beltane', tradition: 'Celtic/Pagan', region: 'Ireland, Scotland, Celtic traditions worldwide', description: 'Celtic fire festival celebrating the peak of spring and fertility.', category: 'seasonal' });
    addObservance({ date: `${year}-08-01`, name: 'Lughnasadh', tradition: 'Celtic/Pagan', region: 'Ireland, Celtic traditions worldwide', description: 'Celtic harvest festival honoring the god Lugh.', category: 'seasonal' });
    addObservance({ date: `${year}-10-31`, name: 'Samhain', tradition: 'Celtic/Pagan', region: 'Ireland, Scotland, Celtic traditions worldwide', description: 'Celtic new year and festival honoring ancestors, origin of Halloween.', category: 'seasonal' });

    // Day of the Dead
    addObservance({ date: `${year}-11-01`, name: 'Día de los Muertos', tradition: 'Mexican/Indigenous', region: 'Mexico, Latin America', description: 'Traditional celebration honoring deceased loved ones with altars and offerings.', category: 'cultural' });

    // Christmas
    addObservance({ date: `${year}-12-25`, name: 'Christmas', tradition: 'Christian', region: 'Global', description: 'Christian celebration of the birth of Jesus Christ.', category: 'religious' });

    // ========== UNIQUE & FASCINATING OBSERVANCES ==========

    // World observances with interesting histories
    addObservance({ date: `${year}-02-14`, name: 'World Sound Healing Day', tradition: 'New Age/Holistic', region: 'Global', description: 'Day for using voice and sound for personal and planetary healing at 12 noon local time.', category: 'cultural' });
    addObservance({ date: `${year}-03-03`, name: 'World Wildlife Day', tradition: 'UN Observance', region: 'Global', description: 'Celebrating wild animals and plants and their importance to human wellbeing.', category: 'environmental' });
    addObservance({ date: `${year}-04-22`, name: 'Earth Day', tradition: 'Environmental', region: 'Global', description: 'Annual event supporting environmental protection, begun in 1970.', category: 'environmental' });
    addObservance({ date: `${year}-06-05`, name: 'World Environment Day', tradition: 'UN Observance', region: 'Global', description: 'UN day for encouraging awareness and action for protection of the environment.', category: 'environmental' });
    addObservance({ date: `${year}-09-21`, name: 'International Day of Peace', tradition: 'UN Observance', region: 'Global', description: 'Day devoted to strengthening ideals of peace through 24 hours of non-violence and cease-fire.', category: 'cultural' });

    // Unique regional celebrations
    addObservance({ date: `${year}-02-08`, name: 'Prešeren Day', tradition: 'National/Literary', region: 'Slovenia', description: 'Slovenian cultural holiday honoring the poet France Prešeren, a day of Slovenian culture.', category: 'cultural' });
    addObservance({ date: `${year}-03-08`, name: 'International Women\'s Day', tradition: 'Social Movement', region: 'Global', description: 'Celebrating women\'s achievements and advocating for gender equality worldwide.', category: 'cultural' });
    addObservance({ date: `${year}-04-13`, name: 'Songkran (Water Festival)', tradition: 'Buddhist/Thai', region: 'Thailand, Laos, Cambodia, Myanmar', description: 'Traditional New Year festival with water splashing symbolizing purification and renewal.', category: 'cultural' });
    addObservance({ date: `${year}-05-05`, name: 'Cinco de Mayo', tradition: 'Mexican/Cultural', region: 'Mexico, United States', description: 'Commemorates the Mexican Army\'s victory over France at the Battle of Puebla in 1862.', category: 'cultural' });
    addObservance({ date: `${year}-06-24`, name: 'Inti Raymi', tradition: 'Incan/Andean', region: 'Peru, Ecuador, Bolivia, Andean communities', description: 'Festival of the Sun honoring Inti, the Incan sun god, at the winter solstice.', category: 'cultural' });
    addObservance({ date: `${year}-07-26`, name: 'Day Out of Time', tradition: 'Maya/New Age', region: 'Global (Maya traditions)', description: 'Day between the end of the galactic year and Mayan New Year, for reflection and celebration.', category: 'cultural' });
    addObservance({ date: `${year}-08-08`, name: 'Lion\'s Gate Portal', tradition: 'Astrological/New Age', region: 'Global', description: 'Annual alignment when the Sun in Leo aligns with Sirius, believed to open a cosmic gateway.', category: 'astronomical' });
    addObservance({ date: `${year}-09-09`, name: 'Chrysanthemum Festival', tradition: 'Japanese/Chinese', region: 'Japan, China, East Asia', description: 'Day honoring the chrysanthemum flower, symbol of longevity and rejuvenation.', category: 'cultural' });
    addObservance({ date: `${year}-11-11`, name: '11:11 Portal Day', tradition: 'Numerological/New Age', region: 'Global', description: 'Day associated with spiritual awakening and synchronicity in numerology traditions.', category: 'cultural' });

    // Indigenous and traditional celebrations
    addObservance({ date: `${year}-06-21`, name: 'National Indigenous Peoples Day', tradition: 'Indigenous', region: 'Canada', description: 'Day to recognize and celebrate the cultures and contributions of First Nations, Inuit, and Métis peoples.', category: 'cultural' });
    addObservance({ date: `${year}-08-09`, name: 'International Day of the World\'s Indigenous Peoples', tradition: 'UN/Indigenous', region: 'Global', description: 'Day to promote and protect the rights of indigenous peoples worldwide.', category: 'cultural' });
    addObservance({ date: `${year}-10-12`, name: 'Día de la Raza / Indigenous Peoples\' Day', tradition: 'Indigenous/National', region: 'Latin America, United States', description: 'Day honoring indigenous peoples and their cultural heritage.', category: 'cultural' });

    // Lunar and cosmic observances
    addObservance({ date: `${year}-07-28`, name: 'Delta Aquariid Meteor Shower Peak', tradition: 'Astronomical', region: 'Global', description: 'Annual meteor shower visible from both hemispheres, best viewed after midnight.', category: 'astronomical' });
    addObservance({ date: `${year}-08-12`, name: 'Perseid Meteor Shower Peak', tradition: 'Astronomical', region: 'Global (Northern Hemisphere)', description: 'Most popular meteor shower of the year, producing up to 100 meteors per hour.', category: 'astronomical' });
    addObservance({ date: `${year}-12-14`, name: 'Geminid Meteor Shower Peak', tradition: 'Astronomical', region: 'Global', description: 'King of meteor showers, producing up to 150 multicolored meteors per hour.', category: 'astronomical' });

    // Harvest and seasonal traditions
    addObservance({ date: `${year}-09-29`, name: 'Michaelmas', tradition: 'Christian/Celtic', region: 'UK, Ireland, Germanic regions', description: 'Feast of St. Michael, traditionally marking the end of the harvest season.', category: 'seasonal' });
    addObservance({ date: `${year}-11-15`, name: 'Shichi-Go-San', tradition: 'Shinto/Japanese', region: 'Japan', description: 'Celebration of children aged 3, 5, and 7, giving thanks for their health and growth.', category: 'cultural' });

    // ========== MOVEABLE DATES ==========
    
    const easter = getEasterSunday(year);
    const orthodoxEaster = getOrthodoxEaster(year);
    
    // Easter-dependent dates
    const mardiGras = new Date(easter);
    mardiGras.setDate(mardiGras.getDate() - 47);
    
    const ashWednesday = new Date(easter);
    ashWednesday.setDate(ashWednesday.getDate() - 46);

    addObservance({ date: formatDate(mardiGras), name: 'Mardi Gras', tradition: 'Christian/Cultural', region: 'New Orleans, Brazil, Caribbean, Europe', description: 'Fat Tuesday celebration before the fasting season of Lent.', category: 'cultural' });
    addObservance({ date: formatDate(ashWednesday), name: 'Ash Wednesday', tradition: 'Christian', region: 'Global (Catholic, Anglican, Lutheran, Methodist)', description: 'First day of Lent, marking the beginning of 40 days of fasting.', category: 'religious' });
    addObservance({ date: formatDate(easter), name: 'Easter Sunday', tradition: 'Christian', region: 'Global (Western churches)', description: 'Christian celebration of the resurrection of Jesus Christ.', category: 'religious' });
    addObservance({ date: formatDate(orthodoxEaster), name: 'Orthodox Easter', tradition: 'Orthodox Christian', region: 'Russia, Greece, Serbia, Ethiopia, Egypt, Georgia, Ukraine', description: 'Eastern Orthodox celebration of the resurrection, following the Julian calendar.', category: 'religious' });

    // Monday holidays in January
    const jan1 = new Date(year, 0, 1);
    const dayOfWeek = jan1.getDay();
    const firstMonday = dayOfWeek === 1 ? 1 : (dayOfWeek === 0 ? 2 : 9 - dayOfWeek);
    
    const comingOfAgeDay = new Date(year, 0, firstMonday + 7);
    const mlkDay = new Date(year, 0, firstMonday + 14);

    addObservance({ date: formatDate(comingOfAgeDay), name: 'Coming of Age Day (Seijin no Hi)', tradition: 'Japanese', region: 'Japan', description: 'National holiday celebrating those who have turned 20, marking their transition to adulthood.', category: 'cultural' });
    addObservance({ date: formatDate(mlkDay), name: 'Martin Luther King Jr. Day', tradition: 'National', region: 'United States', description: 'Federal holiday honoring the civil rights leader Dr. Martin Luther King Jr.', category: 'national' });

    // Verified lunar/religious calendar dates
    if (LUNAR_NEW_YEAR[year]) addObservance({ date: LUNAR_NEW_YEAR[year], name: 'Lunar New Year', tradition: 'Chinese/East Asian', region: 'China, Korea, Vietnam, Singapore, Malaysia', description: 'Celebration of the new lunar year with family gatherings.', category: 'cultural' });
    if (DIWALI[year]) addObservance({ date: DIWALI[year], name: 'Diwali', tradition: 'Hindu', region: 'India, Nepal, Sri Lanka, diaspora worldwide', description: 'Festival of lights celebrating the victory of light over darkness.', category: 'religious' });
    if (HOLI[year]) addObservance({ date: HOLI[year], name: 'Holi', tradition: 'Hindu', region: 'India, Nepal, diaspora worldwide', description: 'Festival of colors celebrating spring and the victory of good over evil.', category: 'religious' });
    if (RAMADAN_START[year]) addObservance({ date: RAMADAN_START[year], name: 'Ramadan Begins', tradition: 'Islamic', region: 'Global Muslim communities', description: 'Beginning of the holy month of fasting, prayer, and reflection.', category: 'religious' });
    if (EID_AL_FITR[year]) addObservance({ date: EID_AL_FITR[year], name: 'Eid al-Fitr', tradition: 'Islamic', region: 'Global Muslim communities', description: 'Festival of breaking the fast, marking the end of Ramadan.', category: 'religious' });
    if (PASSOVER[year]) addObservance({ date: PASSOVER[year], name: 'Passover', tradition: 'Jewish', region: 'Global Jewish communities', description: 'Celebration of the liberation of Israelites from Egyptian slavery.', category: 'religious' });
    if (VESAK[year]) addObservance({ date: VESAK[year], name: 'Vesak', tradition: 'Buddhist', region: 'Sri Lanka, Southeast Asia, East Asia', description: "Buddha Day celebrating the birth, enlightenment, and death of Buddha.", category: 'religious' });
    if (ISRA_MIRAJ[year]) addObservance({ date: ISRA_MIRAJ[year], name: "Isra and Mi'raj", tradition: 'Islamic', region: 'Global Muslim communities', description: "Commemorates Prophet Muhammad's night journey and ascension to heaven.", category: 'religious' });

    // ========== HOLIDAYS FROM date-holidays LIBRARY ==========
    
    for (const config of CURATED_HOLIDAYS) {
      hd.init(config.country, { languages: ['en'] });
      const holidays = hd.getHolidays(year);
      
      for (const holidayConfig of config.holidays) {
        const found = holidays.find(h => 
          h.name === holidayConfig.name || 
          h.name.includes(holidayConfig.name) ||
          holidayConfig.name.includes(h.name)
        );
        
        if (found) {
          addObservance({
            date: found.date.split(' ')[0],
            name: holidayConfig.displayName || found.name,
            tradition: holidayConfig.tradition,
            region: holidayConfig.region,
            description: holidayConfig.description,
            category: holidayConfig.category,
          });
        }
      }
    }
  }

  return observances;
}

// ============================================
// MAIN SEED FUNCTION
// ============================================

async function seedObservances() {
  console.log('🌍 Seeding comprehensive cultural observances for 2026-2036...');
  
  try {
    await db.delete(culturalObservances);
    console.log('✓ Cleared existing observances');

    const observances = generateObservances(2026, 2036);
    console.log(`📅 Generated ${observances.length} observances`);

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

    // Show next 30 days
    const next30 = new Date();
    next30.setDate(next30.getDate() + 30);
    const upcoming = observances.filter(o => o.date >= today && o.date <= next30.toISOString().split('T')[0]);
    console.log(`\n📆 Next 30 days: ${upcoming.length} observances`);

  } catch (error) {
    console.error('❌ Error seeding observances:', error);
    process.exit(1);
  }
}

seedObservances();
