/**
 * labelize.ts - Central label humanization layer
 * 
 * Converts raw taxonomy keys to human-readable labels.
 * Removes accuracy % claims and directive language.
 * Exposes consistent display fields for all content items.
 */

// System ID to human-readable name mappings
const SYSTEM_LABELS: Record<string, string> = {
  // Calendar systems
  'hindu_vedic': 'Hindu Vedic',
  'hindu_panchang': 'Hindu Panchang',
  'mayan_tzolkin': 'Mayan Tzolkin',
  'mayan_haab': 'Mayan Haab',
  'chinese_agricultural': 'Chinese Agricultural',
  'chinese_lunar': 'Chinese Lunar',
  'islamic_hijri': 'Islamic Hijri',
  'hebrew_jewish': 'Hebrew',
  'gregorian': 'Gregorian',
  'celtic_wheel': 'Celtic Wheel',
  'norse': 'Norse',
  'aztec': 'Aztec',
  'inca': 'Inca',
  'egyptian': 'Egyptian',
  'babylonian': 'Babylonian',
  
  // Traditions
  'navajo_dine': 'Navajo Diné',
  'hopi': 'Hopi',
  'lakota': 'Lakota',
  'cherokee': 'Cherokee',
  'aboriginal': 'Aboriginal Australian',
  'maori': 'Māori',
  'celtic': 'Celtic',
  'nordic': 'Nordic',
  'african': 'African',
  'yoruba': 'Yoruba',
  'akan': 'Akan',
  
  // Timing systems
  'ayurvedic_timing': 'Ayurvedic Timing',
  'daily_sandhya': 'Daily Sandhya',
  'muhurta': 'Muhurta',
  'hora': 'Hora',
  'tithi': 'Tithi',
  'nakshatra': 'Nakshatra',
  'karana': 'Karana',
  'yoga_day': 'Yoga of the Day',
  
  // Event types
  'cultural': 'Cultural',
  'religious': 'Religious',
  'natural': 'Natural',
  'astronomical': 'Astronomical',
  'seasonal': 'Seasonal',
  'lunar': 'Lunar',
  'solar': 'Solar',
  'global': 'Global',
  'regional': 'Regional',
  'local': 'Local',
  
  // Content categories
  'sacred_geography': 'Sacred Geography',
  'oral_tradition': 'Oral Tradition',
  'living_calendar': 'Living Calendar',
  'consciousness_calendar': 'Consciousness Calendar',
  'cultural_offering': 'Cultural Offering',
};

// Category display labels
const CATEGORY_LABELS: Record<string, string> = {
  'observed': 'Observed',
  'traditional': 'Traditional',
  'mythic': 'Mythic',
  'reflective': 'Reflective',
  'cultural': 'Cultural',
  'religious': 'Religious',
  'natural': 'Natural Cycle',
  'astronomical': 'Astronomical',
  'indigenous': 'Indigenous',
  'pagan': 'Pagan',
  'spiritual': 'Spiritual',
};

// Phrases to remove (fake precision and directive language)
const REMOVE_PATTERNS = [
  /\d+[-–]\d+%\s*(accuracy|accurate|precision|precise)/gi,
  /\d+%\s*(accuracy|accurate|precision|precise)/gi,
  /accuracy:?\s*\d+[-–]?\d*%/gi,
  /precision:?\s*\d+[-–]?\d*%/gi,
  /you should/gi,
  /you must/gi,
  /review your/gi,
  /prepare yourself/gi,
  /prepare for/gi,
  /take action/gi,
  /act now/gi,
  /do this/gi,
  /make sure to/gi,
  /remember to/gi,
  /don't forget to/gi,
];

// Directive phrases to replace with descriptive alternatives
const DIRECTIVE_REPLACEMENTS: [RegExp, string][] = [
  [/today is auspicious for/gi, 'Often treated as favorable for'],
  [/this is a good time to/gi, 'Traditionally considered suitable for'],
  [/use this time to/gi, 'A period often associated with'],
  [/take a break/gi, 'A moment of rest'],
  [/how about a/gi, 'Traditionally a time for'],
  [/consider/gi, 'Traditionally associated with'],
  [/thoughts get clearer/gi, 'clarity is emphasized'],
  [/this causes/gi, 'traditionally associated with'],
  [/many traditional societies/gi, 'Various traditions'],
];

/**
 * Convert snake_case or kebab-case to Title Case
 */
export function toTitleCase(str: string): string {
  if (!str) return '';
  
  // Check if we have a known mapping first
  const lower = str.toLowerCase();
  if (SYSTEM_LABELS[lower]) {
    return SYSTEM_LABELS[lower];
  }
  
  // Convert snake_case/kebab-case to spaces, then title case
  return str
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

/**
 * Get human-readable label for a system ID
 */
export function getSystemLabel(systemId: string): string {
  if (!systemId) return '';
  
  const key = systemId.toLowerCase().replace(/[-\s]/g, '_');
  return SYSTEM_LABELS[key] || toTitleCase(systemId);
}

/**
 * Get human-readable category label
 */
export function getCategoryLabel(category: string): string {
  if (!category) return '';
  
  const key = category.toLowerCase().replace(/[-\s]/g, '_');
  return CATEGORY_LABELS[key] || toTitleCase(category);
}

/**
 * Humanize an array of tags
 */
export function humanizeTags(tags: string[]): string[] {
  if (!tags || !Array.isArray(tags)) return [];
  
  return tags.map((tag) => {
    const key = tag.toLowerCase().replace(/[-\s]/g, '_');
    return SYSTEM_LABELS[key] || CATEGORY_LABELS[key] || toTitleCase(tag);
  });
}

/**
 * Remove fake precision claims and directive language from text
 */
export function cleanTone(text: string): string {
  if (!text) return '';
  
  let cleaned = text;
  
  // Remove fake precision patterns
  for (const pattern of REMOVE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Apply directive replacements
  for (const [pattern, replacement] of DIRECTIVE_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }
  
  // Clean up multiple spaces and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove trailing periods if sentence was truncated
  cleaned = cleaned.replace(/\.\s*\.$/, '.');
  
  return cleaned;
}

/**
 * Format an origin/tradition label
 */
export function formatOrigin(origin: string | undefined, tradition?: string, region?: string): string {
  const parts: string[] = [];
  
  if (tradition) {
    parts.push(getSystemLabel(tradition));
  }
  
  if (origin && origin !== tradition) {
    parts.push(getSystemLabel(origin));
  }
  
  if (region) {
    parts.push(toTitleCase(region));
  }
  
  return parts.filter(Boolean).join(' · ') || 'Traditional';
}

/**
 * Standard display item structure
 */
export interface DisplayItem {
  id: string;
  title: string;
  subtitle?: string;
  message?: string;
  origin?: string;
  category_label?: string;
  tags_display?: string[];
  date?: Date | string;
  type?: string;
}

/**
 * Transform a raw content item into a display-ready item
 */
export function labelize(item: any): DisplayItem {
  if (!item) {
    return {
      id: 'unknown',
      title: 'Content',
    };
  }
  
  const displayItem: DisplayItem = {
    id: item.id || item._id || `item_${Date.now()}`,
    title: item.title || item.name || toTitleCase(item.type || 'Content'),
    subtitle: item.subtitle || item.summary || item.description,
    message: item.message ? cleanTone(item.message) : undefined,
    origin: formatOrigin(item.origin, item.tradition, item.region),
    category_label: getCategoryLabel(item.category || item.type || ''),
    tags_display: humanizeTags(item.tags || []),
    date: item.date || item.timestamp,
    type: item.type,
  };
  
  // Clean subtitle/message of directive language
  if (displayItem.subtitle) {
    displayItem.subtitle = cleanTone(displayItem.subtitle);
  }
  
  return displayItem;
}

/**
 * Format a date for display
 */
export function formatDisplayDate(date: Date | string | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format relative time (e.g., "in 3 days", "Tomorrow")
 */
export function formatRelativeTime(date: Date | string | undefined): string {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Past';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays <= 14) return 'Next week';
  if (diffDays <= 30) return 'This month';
  if (diffDays <= 90) return 'This season';
  
  return formatDisplayDate(d);
}

export default {
  toTitleCase,
  getSystemLabel,
  getCategoryLabel,
  humanizeTags,
  cleanTone,
  formatOrigin,
  labelize,
  formatDisplayDate,
  formatRelativeTime,
};
