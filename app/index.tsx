import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import api, { Echo, PlanetaryData, DailyBundleResponse } from '../lib/api';
import { useLocation } from '../lib/LocationContext';

// Components
import Hero from '../components/Hero';
import MoodTemperature from '../components/MoodTemperature';
import CalendarCarousel from '../components/CalendarCarousel';
import ContextChips from '../components/ContextChips';
import EchoStack from '../components/EchoStack';

export default function HomeScreen() {
  const { locationName, coordinates, timezone } = useLocation();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Default mock data for fallbacks
  const getMockPlanetaryData = (): PlanetaryData => ({
    lunar: { phase: 'Waxing Gibbous', illumination: 82 },
    solar: { sunrise: '07:15 AM', sunset: '04:45 PM', currentPhase: 'Afternoon light' },
    geomagnetic: { activity: 'Quiet', kpIndex: 2 },
    seasonal: { season: 'Winter', progress: 35 },
  });

  const getMockEchoes = (): Echo[] => [
    {
      id: '1',
      type: 'lunar_guidance',
      title: 'Waxing Gibbous',
      message: 'Energy is building. Review your intentions and prepare for the culmination of the full moon.',
      background_theme: 'lunar',
      relevance_score: 0.95,
    },
    {
      id: '2',
      type: 'solar_rhythm',
      title: 'Afternoon Focus',
      message: 'Solar energy is steady. Good time for completing tasks before the evening wind-down.',
      background_theme: 'solar',
      relevance_score: 0.88,
    },
    {
      id: '3',
      type: 'cultural_rhythms',
      title: 'Global Pulse',
      message: 'Many cultures observe a time of gratitude today. Connect with your community.',
      background_theme: 'culture',
      relevance_score: 0.91,
    },
  ];

  const getMockCalendars = () => [
    { id: 'gregorian', name: 'Gregorian', date: new Date().toLocaleDateString(), type: 'Civil' },
    { id: 'mayan', name: 'Mayan Tzolkin', date: '7 Manik', type: 'Sacred' },
    { id: 'chinese', name: 'Chinese', date: 'Dragon Year', type: 'Lunisolar' },
  ];

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 5000)
      );

      // Fetch Bundle + Calendars
      const [bundleData, calendarsData] = await Promise.all([
        Promise.race([
          api.getDailyBundle(coordinates.lat, coordinates.lng, 'en', timezone),
          timeoutPromise,
        ]) as Promise<DailyBundleResponse>,
        api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone).catch(() => null),
      ]);

      // Process Bundle
      if (bundleData.success && bundleData.data) {
        const ctx = bundleData.data.planetary_context;
        setPlanetary({
          lunar: {
            phase: ctx.lunar.phase,
            illumination: ctx.lunar.illumination
          },
          solar: {
            sunrise: '07:00', // Not in bundle explicitly sometimes, using defaults or context
            sunset: '19:00',
            currentPhase: ctx.solar.phase
          },
          geomagnetic: { 
            activity: ctx.consciousness_index.global_coherence > 60 ? 'Coherent' : 'Quiet', 
            kpIndex: 2 
          },
          seasonal: { season: 'Current', progress: 50 },
        });
        
        if (bundleData.data.echo_cards && bundleData.data.echo_cards.length > 0) {
          setEchoes(bundleData.data.echo_cards);
        } else {
          setEchoes(getMockEchoes());
        }
      }

      // Process Calendars
      if (calendarsData) {
        const formattedCalendars = [
          { id: 'gregorian', name: 'Gregorian', date: new Date().toLocaleDateString(), type: 'Civil' },
        ];
        
        if (calendarsData.mayan?.tzolkin) {
          formattedCalendars.push({
            id: 'mayan',
            name: 'Mayan Tzolkin',
            date: `${calendarsData.mayan.tzolkin.dayNumber} ${calendarsData.mayan.tzolkin.dayName}`,
            type: 'Sacred'
          });
        }
        if (calendarsData.chinese) {
          formattedCalendars.push({
            id: 'chinese',
            name: 'Chinese',
            date: `${calendarsData.chinese.year} Year`,
            type: 'Lunisolar'
          });
        }
        if (calendarsData.hebrew) {
           formattedCalendars.push({
            id: 'hebrew',
            name: 'Hebrew',
            date: `${calendarsData.hebrew.day} ${calendarsData.hebrew.month}`,
            type: 'Lunisolar'
          });
        }
        
        setCalendars(formattedCalendars);
      } else {
        setCalendars(getMockCalendars());
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPlanetary(getMockPlanetaryData());
      setEchoes(getMockEchoes());
      setCalendars(getMockCalendars());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coordinates, timezone]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentIndex(0);
    fetchData();
  }, [fetchData]);

  const handleSwipeLeft = () => {
    if (currentIndex < echoes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSwipeRight = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {echoes.length > 0 && (
            <Hero 
              title={echoes[0].title} 
              subtitle={echoes[0].message.substring(0, 60) + "..."} 
            />
          )}

          <MoodTemperature value={68} label="Warm" />

          <CalendarCarousel calendars={calendars} />

          {planetary && <ContextChips planetary={planetary} />}

          <EchoStack 
            echoes={echoes}
            currentIndex={currentIndex}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
          />

        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
});
