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
const TQF_FRAME_BASE = 'https://raw.githubusercontent.com/mheitzmann-TQF/-Photos/main/cdn/photos/TQF_Frame-';
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
    console.error('Failed to fetch TQF photos:', error);
    return generateFallbackPhotos();
  }
}

function generateFallbackPhotos(): TQFPhoto[] {
  const photos: TQFPhoto[] = [];
  for (let i = 1; i <= 40; i++) {
    photos.push({
      url: `${TQF_FRAME_BASE}${i}.webp`,
      photographer: 'The Quiet Frame',
    });
  }
  return photos;
}

export async function getDailyPhoto(): Promise<TQFPhoto> {
  const today = getTodayString();
  
  if (cache.dailyPhoto && cache.dailyPhotoDate === today) {
    return cache.dailyPhoto;
  }

  const photos = await fetchPhotos();
  
  if (photos.length === 0) {
    const fallbackIndex = Math.floor(Math.random() * 40) + 1;
    return {
      url: `${TQF_FRAME_BASE}${fallbackIndex}.webp`,
      photographer: 'The Quiet Frame',
    };
  }

  const index = getDailyPhotoIndex(photos);
  const dailyPhoto = photos[index];
  
  cache.dailyPhoto = dailyPhoto;
  cache.dailyPhotoDate = today;
  
  return dailyPhoto;
}

export async function getRandomPhoto(): Promise<TQFPhoto> {
  const photos = await fetchPhotos();
  
  if (photos.length === 0) {
    const fallbackIndex = Math.floor(Math.random() * 40) + 1;
    return {
      url: `${TQF_FRAME_BASE}${fallbackIndex}.webp`,
      photographer: 'The Quiet Frame',
    };
  }

  return photos[Math.floor(Math.random() * photos.length)];
}

export default {
  fetchPhotos,
  getDailyPhoto,
  getRandomPhoto,
};
