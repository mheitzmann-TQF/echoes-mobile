import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import EchoCard from '../components/EchoCard';
import MoonPhase from '../components/MoonPhase';
import api, { Echo, PlanetaryData, DailyBundleResponse } from '../lib/api';
import { useLocation } from '../lib/LocationContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function HomeScreen() {
  const { locationName, coordinates, timezone } = useLocation();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getMockPlanetaryData = (): PlanetaryData => ({
    lunar: { phase: 'Waxing Gibbous', illumination: 0.82 },
    solar: { sunrise: '07:15 AM', sunset: '04:45 PM', currentPhase: 'afternoon' },
    geomagnetic: { activity: 'moderate', kpIndex: 4 },
    seasonal: { season: 'winter', progress: 0.35 },
  });

  const getMockEchoes = (): Echo[] => [
    {
      id: '1',
      type: 'lunar_guidance',
      title: 'Lunar Wisdom',
      message: 'The waxing moon brings energy for growth and manifestation. This is an ideal time to start new projects.',
      background_theme: 'lunar',
      relevance_score: 0.95,
    },
    {
      id: '2',
      type: 'solar_rhythm',
      title: 'Solar Balance',
      message: 'As afternoon light shifts, pause to reflect on the day\'s journey and ground yourself in the present moment.',
      background_theme: 'solar',
      relevance_score: 0.88,
    },
    {
      id: '3',
      type: 'global_consciousness',
      title: 'Collective Awareness',
      message: 'The world is awakening to deeper understanding. Your consciousness is part of this collective shift.',
      background_theme: 'consciousness',
      relevance_score: 0.91,
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('API timeout')), 3000)
        );

        const bundleData = await Promise.race([
          api.getDailyBundle(coordinates.lat, coordinates.lng, 'en', timezone),
          timeoutPromise,
        ]) as DailyBundleResponse;

        if (bundleData.success && bundleData.data) {
          setPlanetary({
            lunar: bundleData.data.planetary_context.lunar,
            solar: {
              sunrise: bundleData.data.planetary_context.solar.phase,
              sunset: bundleData.data.planetary_context.solar.phase,
              currentPhase: bundleData.data.planetary_context.solar.phase,
            },
            geomagnetic: { activity: 'stable', kpIndex: 2 },
            seasonal: { season: 'current', progress: 50 },
          });
          
          if (bundleData.data.echo_cards && bundleData.data.echo_cards.length > 0) {
            setEchoes(bundleData.data.echo_cards);
          } else {
            setEchoes(getMockEchoes());
          }
        }
      } catch (apiError) {
        console.error('API fetch failed, using fallback data:', apiError);
        setPlanetary(getMockPlanetaryData());
        setEchoes(getMockEchoes());
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPlanetary(getMockPlanetaryData());
      setEchoes(getMockEchoes());
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
    if (currentIndex < echoes.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Aligning with the cosmos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const visibleEchoes = echoes.slice(currentIndex, currentIndex + 3);

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
          <View style={styles.header}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </View>

          {planetary && (
            <View style={styles.planetarySection}>
              <MoonPhase
                phase={planetary.lunar.phase}
                illumination={planetary.lunar.illumination}
                size={80}
              />
            </View>
          )}

          <View style={styles.echoSection}>
            <Text style={styles.sectionTitle}>Today's Echoes</Text>
            <View style={styles.cardStack}>
              {visibleEchoes.map((echo, index) => (
                <EchoCard
                  key={echo.id}
                  echo={echo}
                  index={index}
                  totalCards={visibleEchoes.length}
                  onSwipeLeft={handleSwipeLeft}
                  onSwipeRight={handleSwipeRight}
                />
              ))}
            </View>
            <View style={styles.cardIndicator}>
              {echoes.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    index === currentIndex && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {planetary && (
            <View style={styles.statsSection}>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>☀️</Text>
                <Text style={styles.statLabel}>{planetary.solar.currentPhase}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🌡️</Text>
                <Text style={styles.statLabel}>{planetary.geomagnetic.activity}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statEmoji}>🍂</Text>
                <Text style={styles.statLabel}>{planetary.seasonal.season}</Text>
              </View>
            </View>
          )}
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
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    marginTop: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  planetarySection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  echoSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  cardStack: {
    height: 500,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  cardIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textTransform: 'capitalize',
  },
});
