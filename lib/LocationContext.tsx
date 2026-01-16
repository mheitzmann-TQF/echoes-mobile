import React, { createContext, useState, ReactNode, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { getLocales } from 'expo-localization';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from './i18n';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocationContextType {
  locationName: string;
  setLocationName: (name: string) => void;
  coordinates: Coordinates;
  setCoordinates: (coords: Coordinates) => void;
  useCurrentLocation: boolean;
  setUseCurrentLocation: (use: boolean) => void;
  locationLoading: boolean;
  locationError: string | null;
  timezone: string;
  setTimezone: (tz: string) => void;
  language: string;
  coordinateKey: string;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Map device language to supported language code (6 European languages only)
const mapLanguageToAPI = (locale: string): string => {
  // Supported languages: en, es, fr, pt, de, it
  const langCode = locale.split('-')[0].toLowerCase();
  
  const supportedMap: Record<string, string> = {
    en: 'en', es: 'es', fr: 'fr', pt: 'pt', de: 'de', it: 'it'
  };
  
  return supportedMap[langCode] || 'en';
};

const detectDeviceLanguage = (): string => {
  try {
    const locales = getLocales();
    if (locales && locales.length > 0) {
      const detectedLang = mapLanguageToAPI(locales[0].languageCode || 'en');
      console.log('🌍 Detected language:', locales[0].languageCode, '→ API code:', detectedLang);
      return detectedLang;
    }
  } catch (e) {
    console.log('Language detection fallback to English');
  }
  return 'en';
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results.length > 0) {
      const { city, country } = results[0];
      return `${city || 'Location'}, ${country || ''}`.trim();
    }
    return 'Current Location';
  } catch (e) {
    return 'Current Location';
  }
};

const geocodeLocation = async (locationName: string, lang: string = 'en'): Promise<{ coords: Coordinates; name: string; timezone: string } | null> => {
  const encodedQuery = encodeURIComponent(locationName);
  
  // Try direct first, then proxy fallback (same pattern as other endpoints)
  // Include language parameter for localized place names
  const urls = [
    `https://source.thequietframe.com/api/geocode?q=${encodedQuery}&lang=${lang}`,
    `/api/proxy/geocode?q=${encodedQuery}&lang=${lang}`
  ];
  
  for (const url of urls) {
    try {
      console.log('[Geocode] Trying:', url);
      const response = await fetch(url);
      if (!response.ok) {
        console.log('[Geocode] Response not OK:', response.status);
        continue;
      }
      const data = await response.json();
      if (data.lat && data.lng) {
        const tz = data.timezone || 'UTC';
        console.log('[Geocode] Success:', locationName, '→', data.name, { lat: data.lat, lng: data.lng, timezone: tz });
        return { coords: { lat: data.lat, lng: data.lng }, name: data.name, timezone: tz };
      }
      if (data.error) {
        console.error('[Geocode] Not found:', locationName);
        return null;
      }
    } catch (e) {
      console.log('[Geocode] Fetch failed, trying next:', e);
    }
  }
  
  console.error('[Geocode] All attempts failed for:', locationName);
  return null;
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [locationName, setLocationName] = useState('New York');
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 40.7128, lng: -74.006 });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('America/New_York'); // Default to NYC timezone
  const [language, setLanguage] = useState(detectDeviceLanguage());
  const prevLangRef = useRef(i18n.language);

  useEffect(() => {
    if (useCurrentLocation) {
      requestUserLocation();
    }
  }, [useCurrentLocation]);

  useEffect(() => {
    if (!useCurrentLocation && locationName && locationName !== 'New York') {
      const currentLang = getCurrentLanguage();
      geocodeLocation(locationName, currentLang).then((result) => {
        if (result) {
          setCoordinates(result.coords);
          setTimezone(result.timezone);
          // Update location name with disambiguated name from API (e.g., "Paris, France")
          if (result.name && result.name !== locationName) {
            setLocationName(result.name);
          }
        }
      });
    }
  }, [locationName, useCurrentLocation]);

  // Re-geocode when user changes app language (for localized country names)
  useEffect(() => {
    const currentLang = i18n.language;
    
    // Skip on first render, only trigger when language actually changes
    if (prevLangRef.current !== currentLang && prevLangRef.current !== '') {
      console.log('[Location] Language changed:', prevLangRef.current, '→', currentLang);
      
      // Only re-geocode if we have a manual location (not GPS)
      if (!useCurrentLocation && locationName && locationName !== 'New York') {
        console.log('[Location] Re-geocoding for new language:', locationName);
        geocodeLocation(locationName, currentLang).then((result) => {
          if (result && result.name && result.name !== locationName) {
            console.log('[Location] Updating location name:', locationName, '→', result.name);
            setLocationName(result.name);
          }
        });
      }
    }
    
    prevLangRef.current = currentLang;
  }, [i18n.language, locationName, useCurrentLocation]);

  const requestUserLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    console.log('[Location] Requesting user location...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[Location] Permission status:', status);
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = currentLocation.coords;
      console.log('[Location] Got coordinates:', { latitude, longitude });
      const name = await reverseGeocode(latitude, longitude);
      setLocationName(name);
      setCoordinates({ lat: latitude, lng: longitude });
      
      // Use device timezone for GPS location
      const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
      setTimezone(deviceTimezone);
      console.log('[Location] Updated to:', name, { lat: latitude, lng: longitude, timezone: deviceTimezone });
    } catch (error) {
      setLocationError('Failed to get location');
      console.error('[Location] Error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

  const coordinateKey = `${coordinates.lat.toFixed(4)},${coordinates.lng.toFixed(4)}`;

  return (
    <LocationContext.Provider
      value={{
        locationName,
        setLocationName,
        coordinates,
        setCoordinates,
        useCurrentLocation,
        setUseCurrentLocation,
        locationLoading,
        locationError,
        timezone,
        setTimezone,
        language,
        coordinateKey,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = React.useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }
  return context;
}
