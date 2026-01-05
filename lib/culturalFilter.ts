/**
 * culturalFilter.ts - Shared cultural content filtering and fallback logic
 * 
 * Centralized utility for:
 * - Filtering out news/political content from cultural feeds
 * - Providing curated cultural artifacts as fallbacks
 * - Ensuring consistent filtering across api.ts and ContentService.ts
 */

// Keywords that indicate news/political content (should be filtered out)
export const NEWS_KEYWORDS = [
  'trump', 'biden', 'president', 'government', 'shutdown', 'congress',
  'election', 'vote', 'politics', 'politician', 'senate', 'house',
  'democrat', 'republican', 'party', 'breaking', 'update', 'news',
  'scandal', 'investigation', 'lawsuit', 'court', 'judge', 'ruling',
  'war', 'military', 'attack', 'strike', 'conflict', 'crisis',
  'stock', 'market', 'economy', 'inflation', 'recession', 'fed',
  'speaker', 'vote', 'bill', 'legislation', 'capitol', 'white house',
  'extort', 'impeach', 'indictment', 'verdict', 'conviction',
];

// Categories that are allowed for cultural content
export const ALLOWED_CATEGORIES = [
  'wisdom', 'cultural', 'artifact', 'tradition', 'philosophy',
  'spiritual', 'mindfulness', 'meditation', 'ritual', 'ceremony',
  'folklore', 'mythology', 'legend', 'proverb', 'teaching',
  'practice', 'art', 'craft', 'music', 'dance', 'poetry',
];

// Categories that should be rejected
export const REJECTED_CATEGORIES = [
  'news', 'politics', 'current_events', 'breaking', 'headlines',
  'business', 'finance', 'sports', 'entertainment', 'celebrity',
];

/**
 * Check if content appears to be news/political rather than cultural wisdom
 */
export function isNewsContent(item: any): boolean {
  // First check category/type fields if available
  const category = (item.category || item.type || '').toLowerCase();
  const source = (item.source || item.origin || '').toLowerCase();
  
  // Reject if category is explicitly news-related
  if (REJECTED_CATEGORIES.some(cat => category.includes(cat) || source.includes(cat))) {
    return true;
  }
  
  // Check text content for news keywords
  const textToCheck = [
    item.title || '',
    item.subtitle || '',
    item.summary || '',
    item.description || '',
    item.message || '',
    item.content || '',
  ].join(' ').toLowerCase();
  
  return NEWS_KEYWORDS.some(keyword => textToCheck.includes(keyword));
}

/**
 * Check if content is valid cultural wisdom
 */
export function isCulturalContent(item: any): boolean {
  // Must not be news
  if (isNewsContent(item)) {
    return false;
  }
  
  // Preferably has an allowed category
  const category = (item.category || item.type || '').toLowerCase();
  
  // If category is explicitly allowed, it's valid
  if (ALLOWED_CATEGORIES.some(cat => category.includes(cat))) {
    return true;
  }
  
  // If no category but doesn't match news keywords, allow it
  return true;
}

// Curated cultural artifacts for fallback (with full schema for ArtifactCard)
export const CURATED_ARTIFACTS = [
  {
    id: 'artifact-kintsugi',
    title: 'The Art of Kintsugi',
    summary: 'Japanese tradition of repairing broken pottery with gold, celebrating imperfection as beauty.',
    subtitle: 'Japanese tradition of repairing broken pottery with gold, celebrating imperfection as beauty.',
    region: 'Japanese',
    origin: 'Japanese',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-hygge',
    title: 'Hygge',
    summary: 'Danish concept of cozy contentment and well-being through enjoying simple pleasures with loved ones.',
    subtitle: 'Danish concept of cozy contentment and well-being through enjoying simple pleasures with loved ones.',
    region: 'Nordic',
    origin: 'Nordic',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-ubuntu',
    title: 'Ubuntu Philosophy',
    summary: '"I am because we are" - the interconnectedness of humanity in Southern African thought.',
    subtitle: '"I am because we are" - the interconnectedness of humanity in Southern African thought.',
    region: 'African',
    origin: 'African',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-wabi-sabi',
    title: 'Wabi-Sabi',
    summary: 'Finding beauty in impermanence and incompleteness, a cornerstone of Japanese aesthetics.',
    subtitle: 'Finding beauty in impermanence and incompleteness, a cornerstone of Japanese aesthetics.',
    region: 'Japanese',
    origin: 'Japanese',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-ikigai',
    title: 'Ikigai',
    summary: 'The Japanese concept of a reason for being, the intersection of passion and purpose.',
    subtitle: 'The Japanese concept of a reason for being, the intersection of passion and purpose.',
    region: 'Japanese',
    origin: 'Japanese',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-lagom',
    title: 'Lagom',
    summary: 'Swedish philosophy of "just enough" - balance and moderation in all things.',
    subtitle: 'Swedish philosophy of "just enough" - balance and moderation in all things.',
    region: 'Nordic',
    origin: 'Nordic',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-forest-bathing',
    title: 'Shinrin-yoku',
    summary: 'Japanese practice of forest bathing, connecting with nature for healing and clarity.',
    subtitle: 'Japanese practice of forest bathing, connecting with nature for healing and clarity.',
    region: 'Japanese',
    origin: 'Japanese',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-sisu',
    title: 'Sisu',
    summary: 'Finnish concept of extraordinary determination, courage, and resilience in the face of adversity.',
    subtitle: 'Finnish concept of extraordinary determination, courage, and resilience in the face of adversity.',
    region: 'Nordic',
    origin: 'Finnish',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-mono-no-aware',
    title: 'Mono no Aware',
    summary: 'The bittersweet awareness of impermanence, appreciating the transient beauty of things.',
    subtitle: 'The bittersweet awareness of impermanence, appreciating the transient beauty of things.',
    region: 'Japanese',
    origin: 'Japanese',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
  {
    id: 'artifact-friluftsliv',
    title: 'Friluftsliv',
    summary: 'Norwegian philosophy of open-air living, embracing nature as essential to well-being.',
    subtitle: 'Norwegian philosophy of open-air living, embracing nature as essential to well-being.',
    region: 'Nordic',
    origin: 'Norwegian',
    category: 'wisdom',
    category_label: 'Wisdom',
    type: 'cultural_artifact',
  },
];

/**
 * Get a curated artifact based on day rotation
 */
export function getCuratedArtifact(): typeof CURATED_ARTIFACTS[0] {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 
    (1000 * 60 * 60 * 24)
  );
  return CURATED_ARTIFACTS[dayOfYear % CURATED_ARTIFACTS.length];
}

/**
 * Filter an array of items to only include cultural content
 * Falls back to curated artifacts if all items are filtered out
 */
export function filterCulturalContent(items: any[]): any[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [getCuratedArtifact()];
  }
  
  const culturalItems = items.filter(isCulturalContent);
  
  if (culturalItems.length === 0) {
    console.log('⚠️ All API items filtered as news, using curated artifact');
    return [getCuratedArtifact()];
  }
  
  console.log(`✅ Found ${culturalItems.length} valid cultural items`);
  return culturalItems;
}
