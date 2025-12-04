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
import { useRouter } from 'expo-router';
import api, { Echo, PlanetaryData, DailyBundleResponse } from '../lib/api';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';

// Components
import Hero from '../components/Hero';
import CalendarCarousel from '../components/CalendarCarousel';
import MetricsGrid from '../components/MetricsGrid';
import EchoStack from '../components/EchoStack';

export default function HomeScreen() {
  const router = useRouter();
  const { locationName, coordinates, timezone, language } = useLocation();
  const { colors, theme } = useTheme();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedMetric, setSelectedMetric] = useState<string>('lunar');

  const handleCalendarSelect = useCallback(() => {
    router.push('/learn');
  }, [router]);

  // Default mock data for fallbacks
  const getMockPlanetaryData = (): PlanetaryData => ({
    lunar: { phase: 'Waxing Gibbous', illumination: 82 },
    solar: { sunrise: '07:15 AM', sunset: '04:45 PM', currentPhase: 'Afternoon light' },
    geomagnetic: { activity: 'Quiet', kpIndex: 2 },
    seasonal: { season: 'Winter', progress: 35 },
    consciousness: { global_coherence: 68, regional_resonance: 65, trend: 'stable' }
  });

  const getMockEchoes = (): Echo[] => {
    const hour = new Date().getHours();
    const dayOfMonth = new Date().getDate();
    const seed = dayOfMonth * 13 + hour;
    
    const lunarMessages = [
      'The waxing energy invites expansion. Plant seeds of intention now.',
      'Lunar pull intensifies. Magnetize what you desire through focused presence.',
      'Under this lunar influence, trust your intuition. It knows the way.',
      'The moon amplifies your power. Use this window for manifestation.',
      'Lunar energy whispers: release what no longer serves you.',
    ];
    
    const solarMessages = [
      'Solar vitality peaks. This is your moment for bold action.',
      'Sunlight illuminates your path. See clearly, act decisively.',
      'The sun\'s arc reaches its power. Channel this energy into creation.',
      'Golden hours approaching. Optimize your efforts with solar alignment.',
      'Solar flare of creativity. Ride this wave of inspiration.',
    ];
    
    const consciousnessMessages = [
      'Global coherence surges. You are part of a unified field.',
      'Collective consciousness aligns today. Your resonance matters.',
      'The noosphere vibrates at harmony. Tune into this frequency.',
      'Hearts worldwide synchronize. Feel the pulse of connection.',
      'Humanity\'s intentions converge. Add your voice to this chorus.',
    ];
    
    const culturalMessages = [
      'Ancient calendars converge today. Honor the wisdom of ages.',
      'Cultures across time echo the same truth. You are not alone.',
      'Sacred rhythms align from many traditions. Listen deeply.',
      'The ancestors whisper their guidance. Open your ears.',
      'Ceremonial time unfolds globally. Participate consciously.',
    ];
    
    const ancestralMessages = [
      'Your lineage flows through you now. Inherit their strength.',
      'Ancestral wisdom activates within. Trust this deeper knowing.',
      'Seven generations support your step forward today.',
      'The bones of your ancestors hold memory. Access their power.',
      'Through you, they live. Through them, you are eternal.',
    ];

    const getRandomItem = (arr: string[], index: number) => arr[index % arr.length];
    
    return [
      {
        id: '1',
        type: 'lunar_guidance',
        title: 'Lunar Calling',
        message: getRandomItem(lunarMessages, seed),
        background_theme: 'lunar',
        relevance_score: 0.9 + Math.random() * 0.1,
        source_metrics: ['Lunar'],
      },
      {
        id: '2',
        type: 'global_consciousness',
        title: 'Global Pulse',
        message: getRandomItem(consciousnessMessages, seed + 1),
        background_theme: 'consciousness',
        relevance_score: 0.85 + Math.random() * 0.1,
        source_metrics: ['Coherence', 'Geomagnetism'],
      },
      {
        id: '3',
        type: 'cultural_rhythms',
        title: 'Sacred Sync',
        message: getRandomItem(culturalMessages, seed + 2),
        background_theme: 'culture',
        relevance_score: 0.88 + Math.random() * 0.1,
        source_metrics: ['Lunar', 'Coherence'],
      },
      {
        id: '4',
        type: 'solar_rhythm',
        title: hour >= 12 ? 'Afternoon Ascent' : 'Morning Rise',
        message: getRandomItem(solarMessages, seed + 3),
        background_theme: 'solar',
        relevance_score: 0.84 + Math.random() * 0.1,
        source_metrics: ['Solar'],
      },
      {
        id: '5',
        type: 'ancestral_echo',
        title: 'Lineage Call',
        message: getRandomItem(ancestralMessages, seed + 4),
        background_theme: 'ancestral',
        relevance_score: 0.86 + Math.random() * 0.1,
        source_metrics: ['Lunar', 'Cultural'],
      },
    ];
  };

  const getMockCalendars = () => [
    { id: 'gregorian', name: 'Gregorian', date: new Date().toLocaleDateString(), type: 'Civil' },
    { id: 'mayan', name: 'Mayan Tzolkin', date: '7 Manik', type: 'Sacred' },
    { id: 'chinese', name: 'Chinese', date: 'Month 10 · Dragon', type: 'Lunisolar' },
    { id: 'hebrew', name: 'Hebrew', date: '20 Kislev', type: 'Lunisolar' },
    { id: 'islamic', name: 'Islamic', date: '16 Jumada I', type: 'Lunar' },
  ];

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 15000)
      );

      // Fetch Bundle + Calendars
      const [bundleData, calendarsData] = await Promise.all([
        Promise.race([
          api.getDailyBundle(coordinates.lat, coordinates.lng, language, timezone),
          timeoutPromise,
        ]) as Promise<DailyBundleResponse>,
        api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone, language).catch(() => null),
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
      if (calendarsData && Array.isArray(calendarsData)) {
        const formattedCalendars = [
          { id: 'gregorian', name: 'Gregorian', date: new Date().toLocaleDateString(), type: 'Civil' },
        ];
        
        // Map calendar systems from API array
        calendarsData.forEach((cal: any) => {
          if (cal.system === 'Mayan Tzolkin') {
            formattedCalendars.push({
              id: 'mayan',
              name: 'Mayan Tzolkin',
              date: cal.date,
              type: 'Sacred'
            });
          } else if (cal.system === 'Chinese Agricultural') {
            formattedCalendars.push({
              id: 'chinese',
              name: 'Chinese',
              date: cal.date,
              type: 'Lunisolar'
            });
          } else if (cal.system === 'Hindu Panchang') {
            formattedCalendars.push({
              id: 'hindu',
              name: 'Hindu Panchang',
              date: cal.date,
              type: 'Lunisolar'
            });
          } else if (cal.system === 'Islamic Hijri') {
            formattedCalendars.push({
              id: 'islamic',
              name: 'Islamic',
              date: cal.date,
              type: 'Lunar'
            });
          }
        });
        
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
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
            />
          }
          showsVerticalScrollIndicator={false}
          scrollEnabled={true}
        >
          <Hero 
            title="Today" 
            subtitle="" 
          />

          <CalendarCarousel calendars={calendars} onSelect={handleCalendarSelect} />

          {planetary && (
            <MetricsGrid 
              planetary={planetary}
              selectedMetric={selectedMetric}
              onSelectMetric={setSelectedMetric}
            />
          )}

          <EchoStack 
            echoes={echoes}
            currentIndex={currentIndex}
            onSwipeLeft={handleSwipeLeft}
            onSwipeRight={handleSwipeRight}
            selectedMetric={selectedMetric}
          />

        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 80,
  },
});
