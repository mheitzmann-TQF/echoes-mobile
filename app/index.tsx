import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import api, { Echo, PlanetaryData, DailyBundleResponse } from '../lib/api';
import contentService from '../lib/ContentService';
import { cleanTone, formatOrigin, getCategoryLabel } from '../lib/labelize';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';
import { Sparkles } from 'lucide-react-native';

// Components
import Hero from '../components/Hero';
import CalendarCarousel from '../components/CalendarCarousel';
import MetricsGrid from '../components/MetricsGrid';
import EchoStack from '../components/EchoStack';

// Living Tradition Card (inline component)
interface LivingTraditionData {
  name: string;
  description: string;
  origin?: string;
  category?: string;
}

function LivingTraditionCard({ data }: { data: LivingTraditionData }) {
  const { colors } = useTheme();
  
  return (
    <View style={[liveTradStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={liveTradStyles.header}>
        <View style={[liveTradStyles.icon, { backgroundColor: colors.surfaceHighlight }]}>
          <Sparkles size={18} color={colors.text} />
        </View>
        <View style={liveTradStyles.headerText}>
          <Text style={[liveTradStyles.title, { color: colors.text }]}>{data.name}</Text>
          {data.origin && (
            <View style={[liveTradStyles.originBadge, { backgroundColor: 'rgba(155, 89, 182, 0.2)' }]}>
              <Text style={[liveTradStyles.originText, { color: '#9b59b6' }]}>{data.origin}</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[liveTradStyles.description, { color: colors.textSecondary }]}>
        {cleanTone(data.description)}
      </Text>
    </View>
  );
}

const liveTradStyles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  originBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  originText: {
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { locationName, coordinates, timezone, language } = useLocation();
  const { colors, theme } = useTheme();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [livingTradition, setLivingTradition] = useState<LivingTraditionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

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
    
    // Observational messages (no directive coaching tone)
    const lunarMessages = [
      'The moon waxes toward fullness, drawing tides and rhythms into alignment.',
      'Lunar illumination grows, bringing the hidden into relief.',
      'Tonight the moon sits at a threshold between shadow and light.',
      'The lunar cycle continues its ancient pattern of ebb and flow.',
      'Moonlight filters through the atmosphere, softer than day.',
    ];
    
    const solarMessages = [
      'The sun traces its arc across the sky, measuring the hours.',
      'Daylight fills the spaces between shadows.',
      'The solar rhythm anchors the day\'s unfolding.',
      'Light angles shift as the sun moves toward the horizon.',
      'The sun\'s position marks this moment in the daily cycle.',
    ];
    
    const consciousnessMessages = [
      'Billions of heartbeats pulse in synchrony across the planet.',
      'The global field hums with collective activity.',
      'Patterns of coherence ripple through the noosphere.',
      'Human attention converges on shared moments worldwide.',
      'The interconnected web of awareness vibrates gently.',
    ];
    
    const culturalMessages = [
      'Multiple calendar systems mark this day with different names.',
      'Ancient and modern reckonings of time overlap here.',
      'Traditions across cultures recognize similar thresholds.',
      'The rhythms of the land and sky are noticed by many peoples.',
      'Calendars from different eras converge on shared observances.',
    ];
    
    const ancestralMessages = [
      'The patterns you notice were noticed by those before you.',
      'Generations have watched these same cycles unfold.',
      'The wisdom of observation passes through time.',
      'What was true for the ancestors remains true now.',
      'The continuity of attention spans centuries.',
    ];

    const getRandomItem = (arr: string[], index: number) => arr[index % arr.length];
    
    return [
      {
        id: '1',
        type: 'lunar_guidance',
        title: 'Lunar Note',
        message: getRandomItem(lunarMessages, seed),
        background_theme: 'lunar',
        relevance_score: 0.9,
        source_metrics: ['Lunar'],
      },
      {
        id: '2',
        type: 'global_consciousness',
        title: 'Global Pulse',
        message: getRandomItem(consciousnessMessages, seed + 1),
        background_theme: 'consciousness',
        relevance_score: 0.85,
        source_metrics: ['Coherence', 'Geomagnetism'],
      },
      {
        id: '3',
        type: 'cultural_rhythms',
        title: 'Calendar Confluence',
        message: getRandomItem(culturalMessages, seed + 2),
        background_theme: 'culture',
        relevance_score: 0.88,
        source_metrics: ['Lunar', 'Coherence'],
      },
      {
        id: '4',
        type: 'solar_rhythm',
        title: hour >= 12 ? 'Afternoon Light' : 'Morning Light',
        message: getRandomItem(solarMessages, seed + 3),
        background_theme: 'solar',
        relevance_score: 0.84,
        source_metrics: ['Solar'],
      },
      {
        id: '5',
        type: 'ancestral_echo',
        title: 'Ancestral Thread',
        message: getRandomItem(ancestralMessages, seed + 4),
        background_theme: 'ancestral',
        relevance_score: 0.86,
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

  // Fallback living tradition content
  const getMockLivingTradition = (): LivingTraditionData => ({
    name: 'Seasonal Threshold',
    description: 'Cultures across the world have long recognized the winter period as a time of gathering, reflection, and renewal. Traditions from Celtic Yule to the Roman Saturnalia mark this darkest season as a passage toward returning light.',
    origin: 'Global · Seasonal',
    category: 'seasonal'
  });

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 15000)
      );

      // Fetch Bundle + Calendars + Living Tradition
      const [bundleData, calendarsData, livingData] = await Promise.all([
        Promise.race([
          api.getDailyBundle(coordinates.lat, coordinates.lng, language, timezone),
          timeoutPromise,
        ]) as Promise<DailyBundleResponse>,
        api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone, language).catch(() => null),
        contentService.getLivingCalendarToday(coordinates.lat, coordinates.lng, timezone, language).catch(() => null),
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
            sunrise: '07:00',
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
          // Clean tone on API echo cards
          const cleanedEchoes = bundleData.data.echo_cards.map((e: Echo) => ({
            ...e,
            message: cleanTone(e.message)
          }));
          setEchoes(cleanedEchoes);
        } else {
          setEchoes(getMockEchoes());
        }
      } else {
        setPlanetary(getMockPlanetaryData());
        setEchoes(getMockEchoes());
      }

      // Process Living Tradition
      if (livingData && livingData.length > 0) {
        const item = livingData[0];
        setLivingTradition({
          name: item.name || item.title || 'Seasonal Note',
          description: cleanTone(item.description || item.summary || ''),
          origin: item.origin || item.tradition || 'Global',
          category: item.category || 'seasonal'
        });
      } else {
        setLivingTradition(getMockLivingTradition());
      }

      // Process Calendars
      if (calendarsData && Array.isArray(calendarsData)) {
        const formattedCalendars = [
          { id: 'gregorian', name: 'Gregorian', date: new Date().toLocaleDateString(), type: 'Civil' },
        ];
        
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
      setLivingTradition(getMockLivingTradition());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [coordinates, timezone, language]);

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
            <MetricsGrid planetary={planetary} />
          )}

          {livingTradition && (
            <LivingTraditionCard data={livingTradition} />
          )}

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
