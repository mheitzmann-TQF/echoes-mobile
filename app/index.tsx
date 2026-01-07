import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Dimensions,
  Linking,
  TouchableOpacity,
  Modal,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import api, { Echo, PlanetaryData, DailyBundleResponse } from '../lib/api';
import { getDailyPhoto } from '../lib/PhotoService';
import { cleanTone } from '../lib/labelize';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

interface Observance {
  id: number;
  date: string;
  name: string;
  tradition: string;
  region: string;
  description: string;
  category: string;
}

// Components
import Hero from '../components/Hero';
import CalendarCarousel from '../components/CalendarCarousel';
import MetricsGrid from '../components/MetricsGrid';
import EchoStack from '../components/EchoStack';

interface DailyPhotoData {
  url: string;
  photographer?: string;
  photographerUrl?: string;
}

function PhotoOfTheDay({ photo }: { photo: DailyPhotoData }) {
  const { colors } = useTheme();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const { height: screenHeight } = Dimensions.get('window');

  const handlePhotographerPress = () => {
    if (photo.photographerUrl) {
      Linking.openURL(photo.photographerUrl);
    }
  };

  const handleUnsplashPress = () => {
    Linking.openURL('https://unsplash.com');
  };

  const isUnsplashPhoto = photo.photographerUrl?.includes('unsplash.com');

  return (
    <View style={photoStyles.container}>
      <Text style={[photoStyles.sectionLabel, { color: colors.textTertiary }]}>MOMENT</Text>
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => setFullscreen(true)}
        style={[photoStyles.imageWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {!imageLoaded && (
          <View style={photoStyles.placeholder}>
            <ActivityIndicator size="small" color={colors.textSecondary} />
          </View>
        )}
        <Image
          source={{ uri: photo.url }}
          style={[photoStyles.image, !imageLoaded && { opacity: 0 }]}
          resizeMode="cover"
          onLoad={() => setImageLoaded(true)}
        />
      </TouchableOpacity>
      <View style={photoStyles.creditContainer}>
        <Text style={[photoStyles.credit, { color: colors.textTertiary }]}>
          Photo by{' '}
        </Text>
        {photo.photographer ? (
          <>
            <TouchableOpacity onPress={handlePhotographerPress} disabled={!photo.photographerUrl}>
              <Text style={[photoStyles.creditLink, { color: colors.textSecondary }]}>
                {photo.photographer}
              </Text>
            </TouchableOpacity>
            {isUnsplashPhoto && (
              <>
                <Text style={[photoStyles.credit, { color: colors.textTertiary }]}> on </Text>
                <TouchableOpacity onPress={handleUnsplashPress}>
                  <Text style={[photoStyles.creditLink, { color: colors.textSecondary }]}>
                    Unsplash
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <Text style={[photoStyles.creditLink, { color: colors.textSecondary }]}>
            The Quiet Frame
          </Text>
        )}
      </View>

      <Modal
        visible={fullscreen}
        transparent={true}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setFullscreen(false)}
      >
        <StatusBar hidden={true} />
        <TouchableOpacity 
          activeOpacity={1}
          onPress={() => setFullscreen(false)}
          style={photoStyles.fullscreenOverlay}
        >
          <Image
            source={{ uri: photo.url }}
            style={{ width: screenWidth, height: screenHeight }}
            resizeMode="contain"
          />
          <View style={photoStyles.fullscreenCredit}>
            {photo.photographer && (
              <View style={photoStyles.fullscreenCreditRow}>
                <Text style={photoStyles.fullscreenCreditText}>Photo by </Text>
                <TouchableOpacity 
                  onPress={(e) => { e.stopPropagation(); handlePhotographerPress(); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={photoStyles.fullscreenCreditLink}>{photo.photographer}</Text>
                </TouchableOpacity>
                {isUnsplashPhoto && (
                  <>
                    <Text style={photoStyles.fullscreenCreditText}> on </Text>
                    <TouchableOpacity 
                      onPress={(e) => { e.stopPropagation(); handleUnsplashPress(); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={photoStyles.fullscreenCreditLink}>Unsplash</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
            <Text style={photoStyles.fullscreenHintText}>Tap anywhere to close</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const photoStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  creditContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  credit: {
    fontSize: 11,
  },
  creditLink: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCredit: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    alignItems: 'center',
    gap: 8,
  },
  fullscreenCreditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  fullscreenCreditText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
  },
  fullscreenCreditLink: {
    color: '#ffffff',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  fullscreenHintText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
});

function TodayObservances({ observances }: { observances: Observance[] }) {
  const { colors } = useTheme();
  
  if (!observances || observances.length === 0) {
    return null;
  }

  return (
    <View style={observanceStyles.container}>
      <Text style={[observanceStyles.sectionLabel, { color: colors.textTertiary }]}>
        TODAY'S OBSERVANCES
      </Text>
      {observances.map((obs) => (
        <View 
          key={obs.id} 
          style={[observanceStyles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
          data-testid={`observance-card-${obs.id}`}
        >
          <View style={observanceStyles.header}>
            <Text style={[observanceStyles.name, { color: colors.text }]}>{obs.name}</Text>
            <Text style={[observanceStyles.tradition, { color: colors.textSecondary }]}>
              {obs.tradition}
            </Text>
          </View>
          <Text style={[observanceStyles.description, { color: colors.textSecondary }]}>
            {obs.description}
          </Text>
          <Text style={[observanceStyles.region, { color: colors.textTertiary }]}>
            {obs.region}
          </Text>
        </View>
      ))}
    </View>
  );
}

const observanceStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  tradition: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  region: {
    fontSize: 12,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { locationName, coordinates, timezone, language } = useLocation();
  const { colors, theme } = useTheme();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [dailyPhoto, setDailyPhoto] = useState<DailyPhotoData | null>(null);
  const [observances, setObservances] = useState<Observance[]>([]);
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
    { id: 'gregorian', name: 'Gregorian', date: format(new Date(), 'd MMM yy'), type: 'Civil' },
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

      // Fetch Bundle + Calendars + Photo + Consciousness + Instant + Observances
      const [bundleData, calendarsData, photoData, consciousnessData, instantData, observancesData] = await Promise.all([
        Promise.race([
          api.getDailyBundle(coordinates.lat, coordinates.lng, language, timezone),
          timeoutPromise,
        ]) as Promise<DailyBundleResponse>,
        api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone, language).catch(() => null),
        getDailyPhoto().catch(() => null),
        api.getConsciousnessAnalysis().catch(() => null),
        api.getInstantPlanetary(coordinates.lat, coordinates.lng, timezone).catch(() => null),
        fetch('/api/proxy/observances').then(res => res.json()).catch(() => null),
      ]);
      
      if (photoData) {
        setDailyPhoto(photoData);
      }
      
      if (observancesData?.success && observancesData.observances) {
        setObservances(observancesData.observances);
      }

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
          geomagnetic: instantData?.geomagnetic ? {
            activity: instantData.geomagnetic.activity || 'Quiet',
            kpIndex: instantData.geomagnetic.kpIndex || (instantData.geomagnetic as any).kp_index || 2
          } : { 
            activity: 'Quiet', 
            kpIndex: 2 
          },
          seasonal: { season: 'Current', progress: 50 },
          consciousness: consciousnessData ? {
            global_coherence: consciousnessData.global_coherence,
            regional_resonance: consciousnessData.regional_coherence ? 
              Math.round(Object.values(consciousnessData.regional_coherence as Record<string, number>).reduce((a, b) => a + b, 0) / Object.values(consciousnessData.regional_coherence as Record<string, number>).length) : 65,
            trend: consciousnessData.trend || 'stable'
          } : ctx.consciousness_index
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

      // Process Calendars
      if (calendarsData && Array.isArray(calendarsData)) {
        const formattedCalendars = [
          { id: 'gregorian', name: 'Gregorian', date: format(new Date(), 'd MMM yy'), type: 'Civil' },
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
          } else if (cal.system === 'Hebrew Calendar') {
            formattedCalendars.push({
              id: 'hebrew',
              name: 'Hebrew',
              date: cal.date,
              type: 'Lunisolar'
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
      
      // Still try to fetch photo independently
      try {
        const fallbackPhoto = await getDailyPhoto();
        if (fallbackPhoto) {
          setDailyPhoto(fallbackPhoto);
        }
      } catch (photoError) {
        console.log('Photo fetch also failed, skipping');
      }
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

          {dailyPhoto && (
            <PhotoOfTheDay photo={dailyPhoto} />
          )}

          <CalendarCarousel calendars={calendars} onSelect={handleCalendarSelect} />

          {planetary && (
            <MetricsGrid planetary={planetary} />
          )}

          <TodayObservances observances={observances} />

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
