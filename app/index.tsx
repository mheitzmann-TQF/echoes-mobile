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
import { format, Locale } from 'date-fns';
import { enUS, es, fr, pt, de, it } from 'date-fns/locale';
import api, { Echo, PlanetaryData, DailyBundleResponse } from '../lib/api';
import { getDailyPhoto } from '../lib/PhotoService';
import { cleanTone } from '../lib/labelize';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';
import { getApiLang } from '../lib/lang';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '../lib/i18n';

const dateLocales: Record<string, Locale> = {
  en: enUS,
  es: es,
  fr: fr,
  pt: pt,
  de: de,
  it: it,
};

function getDateLocale(): Locale {
  const lang = getCurrentLanguage();
  return dateLocales[lang] || enUS;
}

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
  const { t } = useTranslation();
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
      <Text style={[photoStyles.sectionLabel, { color: colors.textTertiary }]}>{t('today.moment')}</Text>
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
          {t('today.photoBy')}{' '}
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
                <Text style={[photoStyles.credit, { color: colors.textTertiary }]}> {t('today.on')} </Text>
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
                <Text style={photoStyles.fullscreenCreditText}>{t('today.photoBy')} </Text>
                <TouchableOpacity 
                  onPress={(e) => { e.stopPropagation(); handlePhotographerPress(); }}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={photoStyles.fullscreenCreditLink}>{photo.photographer}</Text>
                </TouchableOpacity>
                {isUnsplashPhoto && (
                  <>
                    <Text style={photoStyles.fullscreenCreditText}> {t('today.on')} </Text>
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
            <Text style={photoStyles.fullscreenHintText}>{t('today.tapToClose')}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const photoStyles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
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
  const { t } = useTranslation();
  
  if (!observances || observances.length === 0) {
    return null;
  }

  return (
    <View style={observanceStyles.container}>
      <Text style={[observanceStyles.sectionLabel, { color: colors.textTertiary }]}>
        {t('today.todaysObservances')}
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
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  name: {
    fontSize: 19,
    fontWeight: '600',
    flex: 1,
    lineHeight: 24,
  },
  tradition: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 8,
  },
  region: {
    fontSize: 11,
    lineHeight: 16,
  },
});

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { locationName, coordinates, timezone } = useLocation();
  const { colors, theme } = useTheme();
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [rawCalendars, setRawCalendars] = useState<any[]>([]);
  const [dailyPhoto, setDailyPhoto] = useState<DailyPhotoData | null>(null);
  const [observances, setObservances] = useState<Observance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const handleCalendarSelect = useCallback((calendar: any) => {
    const rawCal = rawCalendars.find((c: any) => {
      const sys = (c.system || '').toLowerCase();
      if (calendar.id === 'mayan' && (sys.includes('maya') || sys.includes('tzolkin'))) return true;
      if (calendar.id === 'chinese' && (sys.includes('chin') || sys.includes('agricol'))) return true;
      if (calendar.id === 'hindu' && (sys.includes('hindu') || sys.includes('panchang'))) return true;
      if (calendar.id === 'islamic' && (sys.includes('islam') || sys.includes('hijri'))) return true;
      if (calendar.id === 'hebrew' && (sys.includes('hebrew') || sys.includes('hébr'))) return true;
      return false;
    });
    
    const calendarDetail = rawCal ? {
      ...calendar,
      significance: rawCal.significance,
      energy: rawCal.energy,
      phase: rawCal.phase,
      element: rawCal.element,
    } : {
      ...calendar,
      significance: calendar.id === 'gregorian' ? t('calendars.gregorianSignificance') : null,
    };
    
    setSelectedCalendar(calendarDetail);
    setCalendarModalVisible(true);
  }, [rawCalendars, t]);

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
        title: t('today.lunarNote'),
        message: getRandomItem(lunarMessages, seed),
        background_theme: 'lunar',
        relevance_score: 0.9,
        source_metrics: ['Lunar'],
      },
      {
        id: '2',
        type: 'global_consciousness',
        title: t('today.globalPulse'),
        message: getRandomItem(consciousnessMessages, seed + 1),
        background_theme: 'consciousness',
        relevance_score: 0.85,
        source_metrics: ['Coherence', 'Geomagnetism'],
      },
      {
        id: '3',
        type: 'cultural_rhythms',
        title: t('today.calendarConfluence'),
        message: getRandomItem(culturalMessages, seed + 2),
        background_theme: 'culture',
        relevance_score: 0.88,
        source_metrics: ['Lunar', 'Coherence'],
      },
      {
        id: '4',
        type: 'solar_rhythm',
        title: hour >= 12 ? t('today.afternoonLight') : t('today.morningLight'),
        message: getRandomItem(solarMessages, seed + 3),
        background_theme: 'solar',
        relevance_score: 0.84,
        source_metrics: ['Solar'],
      },
      {
        id: '5',
        type: 'ancestral_echo',
        title: t('today.ancestralThread'),
        message: getRandomItem(ancestralMessages, seed + 4),
        background_theme: 'ancestral',
        relevance_score: 0.86,
        source_metrics: ['Lunar', 'Cultural'],
      },
    ];
  };

  const getMockCalendars = () => [
    { id: 'gregorian', name: t('learn.gregorian'), date: format(new Date(), 'd MMM yy', { locale: getDateLocale() }), type: t('calendars.civil') },
    { id: 'mayan', name: t('learn.mayanTzolkin'), date: '7 Manik', type: t('calendars.sacred') },
    { id: 'chinese', name: t('learn.chinese'), date: 'Month 10 · Dragon', type: t('calendars.lunisolar') },
    { id: 'hebrew', name: t('learn.hebrew'), date: '20 Kislev', type: t('calendars.lunisolar') },
    { id: 'islamic', name: t('learn.islamic'), date: '16 Jumada I', type: t('calendars.lunar') },
  ];

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 15000)
      );

      // Fetch Bundle + Calendars + Photo + Consciousness + Instant + Observances
      const lang = getApiLang();
      const [bundleData, calendarsData, photoData, consciousnessData, instantData, observancesData] = await Promise.all([
        Promise.race([
          api.getDailyBundle(coordinates.lat, coordinates.lng, lang, timezone),
          timeoutPromise,
        ]) as Promise<DailyBundleResponse>,
        api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone, lang).catch(() => null),
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
        setRawCalendars(calendarsData);
        const formattedCalendars = [
          { id: 'gregorian', name: t('learn.gregorian'), date: format(new Date(), 'd MMM yy', { locale: getDateLocale() }), type: t('calendars.civil') },
        ];
        
        calendarsData.forEach((cal: any) => {
          const sys = (cal.system || '').toLowerCase();
          if (sys.includes('maya') || sys.includes('tzolkin')) {
            formattedCalendars.push({
              id: 'mayan',
              name: t('learn.mayanTzolkin'),
              date: cal.date,
              type: t('calendars.sacred')
            });
          } else if (sys.includes('chin') || sys.includes('agricol')) {
            formattedCalendars.push({
              id: 'chinese',
              name: t('learn.chinese'),
              date: cal.date,
              type: t('calendars.lunisolar')
            });
          } else if (sys.includes('hindu') || sys.includes('panchang')) {
            formattedCalendars.push({
              id: 'hindu',
              name: t('learn.hinduPanchang'),
              date: cal.date,
              type: t('calendars.lunisolar')
            });
          } else if (sys.includes('islam') || sys.includes('hijri')) {
            formattedCalendars.push({
              id: 'islamic',
              name: t('learn.islamic'),
              date: cal.date,
              type: t('calendars.lunar')
            });
          } else if (sys.includes('hebrew') || sys.includes('hébr')) {
            formattedCalendars.push({
              id: 'hebrew',
              name: t('learn.hebrew'),
              date: cal.date,
              type: t('calendars.lunisolar')
            });
          }
        });
        
        setCalendars(formattedCalendars);
      } else {
        setRawCalendars([]);
        setCalendars(getMockCalendars());
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPlanetary(getMockPlanetaryData());
      setEchoes(getMockEchoes());
      setRawCalendars([]);
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
            title={t('today.title')} 
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

        {/* Calendar Detail Modal */}
        <Modal
          visible={calendarModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setCalendarModalVisible(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setCalendarModalVisible(false)}
          >
            <TouchableOpacity 
              activeOpacity={1} 
              style={[styles.modalContent, { backgroundColor: colors.surface }]}
              onPress={(e) => e.stopPropagation()}
            >
              {selectedCalendar && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedCalendar.name}</Text>
                    <Text style={[styles.modalDate, { color: colors.accent }]}>{selectedCalendar.date}</Text>
                    <View style={[styles.modalTypeChip, { backgroundColor: colors.surfaceHighlight }]}>
                      <Text style={[styles.modalTypeText, { color: colors.textSecondary }]}>{selectedCalendar.type}</Text>
                    </View>
                  </View>
                  
                  {selectedCalendar.significance && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('calendars.significance')}</Text>
                      <Text style={[styles.modalValue, { color: colors.text }]}>{selectedCalendar.significance}</Text>
                    </View>
                  )}
                  
                  {selectedCalendar.energy && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('calendars.energy')}</Text>
                      <Text style={[styles.modalValue, { color: colors.text }]}>{selectedCalendar.energy}</Text>
                    </View>
                  )}
                  
                  {selectedCalendar.phase && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('calendars.phase')}</Text>
                      <Text style={[styles.modalValue, { color: colors.text }]}>{selectedCalendar.phase}</Text>
                    </View>
                  )}
                  
                  {selectedCalendar.element && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('calendars.element')}</Text>
                      <Text style={[styles.modalValue, { color: colors.text }]}>{selectedCalendar.element}</Text>
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.modalCloseButton, { backgroundColor: colors.surfaceHighlight }]}
                    onPress={() => setCalendarModalVisible(false)}
                  >
                    <Text style={[styles.modalCloseText, { color: colors.text }]}>{t('common.close')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalDate: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  modalTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalTypeText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 15,
    lineHeight: 22,
  },
  modalCloseButton: {
    marginTop: 8,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
