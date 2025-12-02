import React, { createContext, useState, ReactNode, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationData {
  name: string;
  lat: number;
  lng: number;
}

interface LocationContextType {
  location: LocationData;
  setLocation: (location: LocationData) => void;
  userLocationInput: string;
  setUserLocationInput: (input: string) => void;
  useCurrentLocation: boolean;
  setUseCurrentLocation: (use: boolean) => void;
  locationLoading: boolean;
  locationError: string | null;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
    if (results.length > 0) {
      const { city, country } = results[0];
      return `${city || 'Location'}, ${country || ''}`.trim();
    }
    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  } catch (e) {
    return `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
  }
};

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocationInput, setUserLocationInput] = useState('New York');
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [location, setLocation] = useState<LocationData>({
    name: 'New York, USA',
    lat: 40.7128,
    lng: -74.006,
  });

  useEffect(() => {
    if (useCurrentLocation) {
      requestUserLocation();
    }
  }, [useCurrentLocation]);

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

      setLocation({
        name,
        lat: latitude,
        lng: longitude,
      });
      setUserLocationInput(name);
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
        location,
        setLocation,
        userLocationInput,
        setUserLocationInput,
        useCurrentLocation,
        setUseCurrentLocation,
        locationLoading,
        locationError,
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
