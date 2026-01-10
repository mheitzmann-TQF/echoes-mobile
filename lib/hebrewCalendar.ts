interface HebrewDateCache {
  date: string;
  hebrewDate: string;
  timestamp: number;
}

let cache: HebrewDateCache | null = null;
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function fetchHebrewDate(date: Date = new Date()): Promise<string> {
  const dateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  
  if (cache && cache.date === dateStr && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.hebrewDate;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(
      `https://www.hebcal.com/converter?cfg=json&gy=${date.getFullYear()}&gm=${date.getMonth() + 1}&gd=${date.getDate()}&g2h=1`,
      { signal: controller.signal }
    );
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error('Hebcal API error');
    }
    
    const data = await response.json();
    const hebrewDate = `${data.hd} ${data.hm}`;
    
    cache = {
      date: dateStr,
      hebrewDate,
      timestamp: Date.now()
    };
    
    return hebrewDate;
  } catch {
    return getHebrewDateFallback(date);
  }
}

export function getHebrewDate(date: Date = new Date()): string {
  if (cache && cache.date === `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`) {
    return cache.hebrewDate;
  }
  return getHebrewDateFallback(date);
}

function getHebrewDateFallback(_date: Date): string {
  return '—';
}

export function getHebrewYear(date: Date = new Date()): number {
  const month = date.getMonth();
  const day = date.getDate();
  const baseYear = date.getFullYear() + 3760;
  if (month > 8 || (month === 8 && day >= 15)) {
    return baseYear + 1;
  }
  return baseYear;
}
