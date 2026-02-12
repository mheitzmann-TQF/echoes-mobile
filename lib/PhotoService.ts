interface TQFPhoto {
  url: string;
  photographer?: string;
  photographerUrl?: string;
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

function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
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
    const photos: TQFPhoto[] = await response.json();
    cache.photos = photos;
    cache.fetchedAt = now;
    return photos;
  } catch (error) {
    console.error('Failed to fetch Unsplash photos:', error);
    return [];
  }
}

function generateFallbackPhotos(): TQFPhoto[] {
  return generateTQFPhotos();
}

export async function getDailyPhoto(): Promise<TQFPhoto> {
  const today = getTodayString();
  
  if (cache.dailyPhoto && cache.dailyPhotoDate === today) {
    return cache.dailyPhoto;
  }

  let dailyPhoto: TQFPhoto;
  
  if (shouldShowTQF()) {
    const tqfPhotos = generateTQFPhotos();
    const index = getDailyPhotoIndex(tqfPhotos);
    dailyPhoto = tqfPhotos[index];
    console.log('[Photo] Selected TQF photo (20% chance)');
  } else {
    const unsplashPhotos = await fetchPhotos();
    if (unsplashPhotos.length === 0) {
      const tqfPhotos = generateTQFPhotos();
      const index = getDailyPhotoIndex(tqfPhotos);
      dailyPhoto = tqfPhotos[index];
    } else {
      const index = getDailyPhotoIndex(unsplashPhotos);
      dailyPhoto = unsplashPhotos[index];
      console.log('[Photo] Selected Unsplash photo (80% chance)');
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
  
  const unsplashPhotos = await fetchPhotos();
  if (unsplashPhotos.length === 0) {
    const tqfPhotos = generateTQFPhotos();
    return tqfPhotos[Math.floor(Math.random() * tqfPhotos.length)];
  }

  return unsplashPhotos[Math.floor(Math.random() * unsplashPhotos.length)];
}

export default {
  fetchPhotos,
  getDailyPhoto,
  getRandomPhoto,
};
