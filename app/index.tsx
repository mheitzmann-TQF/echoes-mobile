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
import api, { PlanetaryData, DailyBundleResponse } from '../lib/api';
import { getDailyPhoto } from '../lib/PhotoService';
import { cleanTone } from '../lib/labelize';
import { X } from 'lucide-react-native';
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
  const { t, i18n } = useTranslation();
  const { locationName, coordinates, timezone, coordinateKey } = useLocation();
  const { colors, theme } = useTheme();
  const [planetary, setPlanetary] = useState<PlanetaryData | null>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [rawCalendars, setRawCalendars] = useState<any[]>([]);
  const [dailyPhoto, setDailyPhoto] = useState<DailyPhotoData | null>(null);
  const [observances, setObservances] = useState<Observance[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<any | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [natureFact, setNatureFact] = useState<{ category: string; fact: string } | null>(null);

  const translateCalendarContent = useCallback((content: string | undefined | null): string | null => {
    if (!content) return null;
    const lower = content.toLowerCase();
    if (lower.includes('new beginning') || lower.includes('fresh start') || lower.includes('setting intention')) {
      return t('calendars.newBeginnings');
    }
    if (lower.includes('building') && lower.includes('waning')) {
      return t('calendars.buildingWaningEnergy');
    }
    if (lower.includes('sacred month') && lower.includes('reflection')) {
      return t('calendars.sacredMonthReflection');
    }
    if (lower.includes('sacred month') && lower.includes('energy')) {
      return t('calendars.sacredMonthEnergy');
    }
    if (lower.includes('sacred beginning')) {
      return t('calendars.sacredBeginning');
    }
    if (lower.includes('deer') && lower.includes('grace')) {
      return t('calendars.deerGrace');
    }
    if (lower.includes('achievement') || (lower.includes('patience') && lower.includes('perseverance'))) {
      return t('calendars.achievementPatience');
    }
    if (lower.includes('waxing') && lower.includes('building')) {
      return t('calendars.waxingPhase');
    }
    if (lower.includes('waning') && lower.includes('releasing')) {
      return t('calendars.waningPhase');
    }
    if (lower.includes('full moon') && lower.includes('peak')) {
      return t('calendars.fullMoonEnergy');
    }
    if (lower.includes('new moon') && lower.includes('fresh')) {
      return t('calendars.newMoonEnergy');
    }
    return content;
  }, [t]);

  const handleCalendarSelect = useCallback((calendar: any) => {
    const rawCal = rawCalendars.find((c: any) => {
      const sys = (c.system || '').toLowerCase();
      // Support multilingual calendar system names (EN, ES, FR, DE, PT, IT)
      if (calendar.id === 'mayan' && (sys.includes('maya') || sys.includes('tzolkin') || sys.includes('maia'))) return true;
      if (calendar.id === 'chinese' && (sys.includes('chin') || sys.includes('agricol') || sys.includes('chino') || sys.includes('cinese') || sys.includes('chinês'))) return true;
      if (calendar.id === 'hindu' && (sys.includes('hindu') || sys.includes('hindú') || sys.includes('hindou') || sys.includes('panchang') || sys.includes('induísta'))) return true;
      if (calendar.id === 'islamic' && (sys.includes('islam') || sys.includes('hijri') || sys.includes('islám') || sys.includes('islamique') || sys.includes('islamisch') || sys.includes('islâmico'))) return true;
      if (calendar.id === 'hebrew' && (sys.includes('hebrew') || sys.includes('hébr') || sys.includes('hebreo') || sys.includes('ebraico') || sys.includes('hebräisch') || sys.includes('hebraico'))) return true;
      return false;
    });
    
    const calendarDetail = rawCal ? {
      ...calendar,
      significance: translateCalendarContent(rawCal.significance),
      energy: translateCalendarContent(rawCal.energy),
      phase: rawCal.phase,
      element: rawCal.element,
    } : {
      ...calendar,
      significance: calendar.id === 'gregorian' ? t('calendars.gregorianSignificance') : null,
    };
    
    setSelectedCalendar(calendarDetail);
    setCalendarModalVisible(true);
  }, [rawCalendars, t, translateCalendarContent]);

  // Default mock data for fallbacks
  const getMockPlanetaryData = (): PlanetaryData => ({
    lunar: { phase: 'Waxing Gibbous', illumination: 82 },
    solar: { sunrise: '07:15 AM', sunset: '04:45 PM', currentPhase: 'Afternoon light' },
    geomagnetic: { activity: 'Quiet', kpIndex: 2 },
    seasonal: { season: 'Winter', progress: 35 },
    consciousness: { global_coherence: 68, regional_resonance: 65, trend: 'stable' }
  });

  const getMockCalendars = () => [
    { id: 'gregorian', name: t('learn.gregorian'), date: format(new Date(), 'd MMM yy', { locale: getDateLocale() }), type: t('calendars.civil') },
    { id: 'mayan', name: t('learn.mayanTzolkin'), date: '7 Manik', type: t('calendars.sacred') },
    { id: 'chinese', name: t('learn.chinese'), date: 'Month 10 · Dragon', type: t('calendars.lunisolar') },
    { id: 'hindu', name: t('learn.hinduPanchang'), date: 'Pausha - Dwitiya', type: t('calendars.lunisolar') },
    { id: 'hebrew', name: t('learn.hebrew'), date: '—', type: t('calendars.lunisolar') },
    { id: 'islamic', name: t('learn.islamic'), date: '16 Jumada I', type: t('calendars.lunar') },
  ];

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 15000)
      );

      // Fetch Bundle + Calendars + Photo + Consciousness + Instant
      const lang = getApiLang();
      const [bundleData, calendarsData, photoData, consciousnessData, instantData, importantDatesData] = await Promise.all([
        Promise.race([
          api.getDailyBundle(coordinates.lat, coordinates.lng, lang, timezone),
          timeoutPromise,
        ]) as Promise<DailyBundleResponse>,
        api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone, lang).catch(() => null),
        getDailyPhoto().catch(() => null),
        api.getConsciousnessAnalysis(lang).catch(() => null),
        api.getInstantPlanetary(coordinates.lat, coordinates.lng, timezone).catch(() => null),
        api.getImportantDates(lang).catch(() => []),
      ]);
      
      if (photoData) {
        setDailyPhoto(photoData);
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
        
        if (bundleData.data.nature_fact) {
          setNatureFact(bundleData.data.nature_fact);
        }
        
      } else {
        setPlanetary(getMockPlanetaryData());
      }

      // Process Calendars
      if (calendarsData && Array.isArray(calendarsData)) {
        setRawCalendars(calendarsData);
        const formattedCalendars = [
          { id: 'gregorian', name: t('learn.gregorian'), date: format(new Date(), 'd MMM yy', { locale: getDateLocale() }), type: t('calendars.civil') },
        ];
        
        calendarsData.forEach((cal: any) => {
          const sys = (cal.system || '').toLowerCase();
          // Support multilingual calendar system names (EN, ES, FR, DE, PT, IT)
          if (sys.includes('maya') || sys.includes('tzolkin') || sys.includes('maia')) {
            formattedCalendars.push({
              id: 'mayan',
              name: t('learn.mayanTzolkin'),
              date: cal.date,
              type: t('calendars.sacred')
            });
          } else if (sys.includes('chin') || sys.includes('agricol') || sys.includes('chino') || sys.includes('cinese') || sys.includes('chinês')) {
            formattedCalendars.push({
              id: 'chinese',
              name: t('learn.chinese'),
              date: cal.date,
              type: t('calendars.lunisolar')
            });
          } else if (sys.includes('hindu') || sys.includes('hindú') || sys.includes('hindou') || sys.includes('panchang') || sys.includes('induísta')) {
            formattedCalendars.push({
              id: 'hindu',
              name: t('learn.hinduPanchang'),
              date: cal.date,
              type: t('calendars.lunisolar')
            });
          } else if (sys.includes('islam') || sys.includes('hijri') || sys.includes('islám') || sys.includes('islamique') || sys.includes('islamisch') || sys.includes('islâmico')) {
            formattedCalendars.push({
              id: 'islamic',
              name: t('learn.islamic'),
              date: cal.date,
              type: t('calendars.lunar')
            });
          } else if (sys.includes('hebrew') || sys.includes('hébr') || sys.includes('hebreo') || sys.includes('ebraico') || sys.includes('hebräisch') || sys.includes('hebraico')) {
            formattedCalendars.push({
              id: 'hebrew',
              name: t('learn.hebrew'),
              date: cal.date || '—',
              type: t('calendars.lunisolar')
            });
          }
        });
        
        if (!formattedCalendars.find(c => c.id === 'hebrew')) {
          formattedCalendars.push({
            id: 'hebrew',
            name: t('learn.hebrew'),
            date: '—',
            type: t('calendars.lunisolar')
          });
        }
        
        setCalendars(formattedCalendars);
      } else {
        setRawCalendars([]);
        setCalendars(getMockCalendars());
      }

      if (importantDatesData && Array.isArray(importantDatesData) && importantDatesData.length > 0) {
        const langSuffix = lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase();
        const mapped: Observance[] = importantDatesData.map((item: any, idx: number) => ({
          id: item.id || idx,
          date: item.date || item.computedDate || '',
          name: item[`name${langSuffix}`] || item.name || item.title || '',
          tradition: item.culturalOrigin || item.culture || item.tradition || '',
          region: item.region || '',
          description: item[`description${langSuffix}`] || item.description || (item.descriptions && item.descriptions[lang]) || '',
          category: item.category || item.type || '',
        })).filter(o => o.name.trim().length > 0);
        if (mapped.length > 0) {
          setObservances(mapped);
        }
      }

    } catch (error) {
      console.error('Failed to fetch data:', error);
      setPlanetary(getMockPlanetaryData());
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
  }, [coordinateKey, coordinates, timezone, i18n.language, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

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

          <TodayObservances observances={observances} />

          {natureFact && (
            <View style={[styles.natureFactCard, { backgroundColor: colors.surface, borderColor: colors.border, borderLeftColor: '#1abc9c', borderLeftWidth: 3 }]}>
              <Text style={[styles.natureFactText, { color: colors.text }]}>
                {natureFact.fact}
              </Text>
            </View>
          )}

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
                  <TouchableOpacity 
                    style={styles.modalXButton}
                    onPress={() => setCalendarModalVisible(false)}
                  >
                    <X size={24} color={colors.text} />
                  </TouchableOpacity>
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
    paddingTop: 20,
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
  modalXButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
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
  cookieSection: {
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  cookieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cookieSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  cookieCard: {
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
  },
  cookieText: {
    fontSize: 17,
    fontWeight: '500',
    lineHeight: 26,
    textAlign: 'left',
  },
  natureFactCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  natureFactText: {
    fontSize: 15,
    lineHeight: 23,
  },
});
