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
import CalendarCarousel from '../components/CalendarCarousel';
import MetricsGrid from '../components/MetricsGrid';
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
    consciousness: { global_coherence: 68, regional_resonance: 65, trend: 'stable' }
  });

  const getMockEchoes = (): Echo[] => [
    {
      id: '1',
      type: 'lunar_guidance',
      title: 'Waxing Gibbous',
      message: 'Energy is building. Review your intentions and prepare for the culmination of the full moon.',
      background_theme: 'lunar',
      relevance_score: 0.95,
      source_metrics: ['Lunar'],
    },
    {
      id: '2',
      type: 'global_consciousness',
      title: 'Coherent Field',
      message: 'Global coherence is high today. Align your actions with collective intention.',
      background_theme: 'consciousness',
      relevance_score: 0.88,
      source_metrics: ['Coherence', 'Geomagnetism'],
    },
    {
      id: '3',
      type: 'cultural_rhythms',
      title: 'Connected Moment',
      message: 'Many cultures observe synchrony today. This is a time for joining intentions.',
      background_theme: 'culture',
      relevance_score: 0.91,
      source_metrics: ['Lunar', 'Coherence'],
    },
  ];

  const getMockCalendars = () => [
    { id: 'gregorian', name: 'Gregorian', date: new Date().toLocaleDateString(), type: 'Civil' },
    { id: 'mayan', name: 'Mayan Tzolkin', date: '7 Manik', type: 'Sacred' },
    { id: 'chinese', name: 'Chinese', date: 'Dragon Year', type: 'Lunisolar' },
    { id: 'hebrew', name: 'Hebrew', date: '20 Kislev', type: 'Lunisolar' },
    { id: 'islamic', name: 'Islamic', date: '16 Jumada I', type: 'Lunar' },
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
          consciousness: ctx.consciousness_index
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
        if (calendarsData.islamic) {
          formattedCalendars.push({
            id: 'islamic',
            name: 'Islamic',
            date: `${calendarsData.islamic.day} ${calendarsData.islamic.month}`,
            type: 'Lunar'
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
          scrollEnabled={false}
        >
          <Hero 
            title="Echoes" 
            subtitle="" 
          />

          <CalendarCarousel calendars={calendars} />

          {planetary && <MetricsGrid planetary={planetary} />}

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
