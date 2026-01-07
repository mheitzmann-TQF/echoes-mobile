import React, { createContext, useState, ReactNode, useEffect } from 'react';
import * as Location from 'expo-location';
import { getLocales } from 'expo-localization';

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

const geocodeLocation = async (locationName: string): Promise<Coordinates | null> => {
  try {
    const results = await Location.geocodeAsync(locationName);
    if (results.length > 0) {
      const { latitude, longitude } = results[0];
      return { lat: latitude, lng: longitude };
    }
  } catch (e) {
    console.error('Geocoding error:', e);
  }
  return null;
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [locationName, setLocationName] = useState('New York');
  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 40.7128, lng: -74.006 });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState('UTC');
  const [language, setLanguage] = useState(detectDeviceLanguage());

  useEffect(() => {
    if (useCurrentLocation) {
      requestUserLocation();
    }
  }, [useCurrentLocation]);

  useEffect(() => {
    if (!useCurrentLocation && locationName && locationName !== 'New York') {
      geocodeLocation(locationName).then((coords) => {
        if (coords) {
          setCoordinates(coords);
        }
      });
    }
  }, [locationName, useCurrentLocation]);

  const requestUserLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        setLocationLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = currentLocation.coords;
      const name = await reverseGeocode(latitude, longitude);
      setLocationName(name);
      setCoordinates({ lat: latitude, lng: longitude });
    } catch (error) {
      setLocationError('Failed to get location');
      console.error('Location error:', error);
    } finally {
      setLocationLoading(false);
    }
  };

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
