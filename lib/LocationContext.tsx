import React, { createContext, useState, ReactNode } from 'react';

interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface LocationContextType {
  location: Location;
  setLocation: (location: Location) => void;
  userLocationInput: string;
  setUserLocationInput: (input: string) => void;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [userLocationInput, setUserLocationInput] = useState('New York');
  const [location, setLocation] = useState<Location>({
    name: 'New York, USA',
    lat: 40.7128,
    lng: -74.006,
  });

  return (
    <LocationContext.Provider value={{ location, setLocation, userLocationInput, setUserLocationInput }}>
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
