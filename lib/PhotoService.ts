export type PhotoSource = 'unsplash' | 'community' | 'tqf';

export interface TQFPhoto {
  url: string;
  photographer?: string;
  photographerUrl?: string;
  downloadLocation?: string;
  source: PhotoSource;
  featuredDate?: string;
  category?: string;
  subject?: string;
}

interface PhotoCache {
  photos: TQFPhoto[];
  fetchedAt: number;
  dailyPhoto: TQFPhoto | null;
  dailyPhotoDate: string;
}

const PHOTOS_JSON_URL = 'https://raw.githubusercontent.com/mheitzmann-TQF/-Photos/main/cdn/tqf-photos.json';
const TQF_FRAME_BASE = 'https://raw.githubusercontent.com/mheitzmann-TQF/-Photos/main/photos/TQF_Frame-';
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let cache: PhotoCache = {
  photos: [],
  fetchedAt: 0,
  dailyPhoto: null,
  dailyPhotoDate: '',
};

function getTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDailyPhotoIndex(photos: TQFPhoto[]): number {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return seed % photos.length;
}

function generateTQFPhotos(): TQFPhoto[] {
  const photos: TQFPhoto[] = [];
  for (let i = 1; i <= 50; i++) {
    photos.push({
      url: `${TQF_FRAME_BASE}${i}.webp`,
      photographer: 'The Quiet Frame',
      source: 'tqf',
    });
  }
  return photos;
}

function shouldShowTQF(): boolean {
  const today = new Date();
  const dateStr = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}-tqf`;
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 100) < 20;
}

function normalizePhoto(photo: any): TQFPhoto {
  return {
    ...photo,
    source: photo.source || 'unsplash',
  };
}

function findFeaturedPhoto(photos: TQFPhoto[]): TQFPhoto | null {
  const todayISO = getTodayISO();
  const featured = photos.find((p) => p.featuredDate === todayISO);
  return featured || null;
}

export async function fetchPhotos(): Promise<TQFPhoto[]> {
  const now = Date.now();
  if (cache.photos.length > 0 && now - cache.fetchedAt < CACHE_DURATION) {
    return cache.photos;
  }

  try {
    const response = await fetch(PHOTOS_JSON_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch photos: ${response.status}`);
    }
    const raw: any[] = await response.json();
    const photos: TQFPhoto[] = raw.map(normalizePhoto);
    cache.photos = photos;
    cache.fetchedAt = now;
    return photos;
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    return [];
  }
}

export async function getDailyPhoto(): Promise<TQFPhoto> {
  const today = getTodayISO();
  
  if (cache.dailyPhoto && cache.dailyPhotoDate === today) {
    return cache.dailyPhoto;
  }

  const allPhotos = await fetchPhotos();

  const featured = findFeaturedPhoto(allPhotos);
  if (featured) {
    console.log(`[Photo] Featured photo for ${getTodayISO()} by ${featured.photographer || 'anonymous'} (source: ${featured.source})`);
    cache.dailyPhoto = featured;
    cache.dailyPhotoDate = today;
    return featured;
  }

  let dailyPhoto: TQFPhoto;
  
  if (shouldShowTQF()) {
    const tqfPhotos = generateTQFPhotos();
    const index = getDailyPhotoIndex(tqfPhotos);
    dailyPhoto = tqfPhotos[index];
    console.log('[Photo] Selected TQF photo (20% chance)');
  } else {
    if (allPhotos.length === 0) {
      const tqfPhotos = generateTQFPhotos();
      const index = getDailyPhotoIndex(tqfPhotos);
      dailyPhoto = tqfPhotos[index];
    } else {
      const index = getDailyPhotoIndex(allPhotos);
      dailyPhoto = allPhotos[index];
      console.log(`[Photo] Selected photo by ${dailyPhoto.photographer || 'unknown'} (source: ${dailyPhoto.source})`);
    }
  }
  
  cache.dailyPhoto = dailyPhoto;
  cache.dailyPhotoDate = today;
  
  return dailyPhoto;
}

export async function getRandomPhoto(): Promise<TQFPhoto> {
  if (Math.random() < 0.2) {
    const tqfPhotos = generateTQFPhotos();
    return tqfPhotos[Math.floor(Math.random() * tqfPhotos.length)];
  }
  
  const allPhotos = await fetchPhotos();
  if (allPhotos.length === 0) {
    const tqfPhotos = generateTQFPhotos();
    return tqfPhotos[Math.floor(Math.random() * tqfPhotos.length)];
  }

  return allPhotos[Math.floor(Math.random() * allPhotos.length)];
}

export default {
  fetchPhotos,
  getDailyPhoto,
  getRandomPhoto,
};
