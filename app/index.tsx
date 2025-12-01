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
import api, { Echo, PlanetaryData } from '../lib/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 6) return 'Good Night';
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function HomeScreen() {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const lat = 40.7128;
      const lng = -74.006;
      const companionId = 'mobile-user-' + Date.now();

      const [planetaryData, echoesData] = await Promise.all([
        api.getInstantPlanetary(lat, lng),
        api.getDailyEchoes(companionId, lat, lng),
      ]);

      setPlanetary(planetaryData);
      if (echoesData.success && echoesData.echoes) {
        setEchoes(echoesData.echoes);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  if (error) {
    if (Platform.OS === 'web') {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.errorText, { fontSize: 20, textAlign: 'center' }]}>📱 Mobile App Ready</Text>
            <Text style={[styles.loadingText, { textAlign: 'center', paddingHorizontal: 20 }]}>
              The data cannot load here due to browser security (CORS).
              {'\n\n'}
              Please scan the QR code with your phone to see the app working with real data!
            </Text>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          <Text style={styles.loadingText}>Pull to refresh and try again</Text>
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
