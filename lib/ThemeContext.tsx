import React, { createContext, useState, useContext, useEffect } from 'react';
import { useColorScheme } from 'react-native';

export type ThemeType = 'dark' | 'light';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceHighlight: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  accent: string;
  accentSubtle: string;
  error: string;
  success: string;
  overlay: string;
}

export const darkColors: ThemeColors = {
  background: '#000000',
  surface: 'rgba(255,255,255,0.05)',
  surfaceHighlight: 'rgba(255,255,255,0.1)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.6)',
  textTertiary: 'rgba(255,255,255,0.4)',
  border: 'rgba(255,255,255,0.1)',
  accent: '#4DB8FF',
  accentSubtle: 'rgba(77, 184, 255, 0.15)',
  error: '#FF453A',
  success: '#32D74B',
  overlay: 'rgba(0,0,0,0.7)',
};

export const lightColors: ThemeColors = {
  background: '#F2F2F7',
  surface: '#FFFFFF',
  surfaceHighlight: '#E5E5EA',
  text: '#000000',
  textSecondary: 'rgba(0,0,0,0.6)',
  textTertiary: 'rgba(0,0,0,0.4)',
  border: 'rgba(0,0,0,0.1)',
  accent: '#007AFF',
  accentSubtle: 'rgba(0, 122, 255, 0.1)',
  error: '#FF3B30',
  success: '#34C759',
  overlay: 'rgba(0,0,0,0.3)',
};

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [theme, setTheme] = useState<ThemeType>('dark'); // Default to dark

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
