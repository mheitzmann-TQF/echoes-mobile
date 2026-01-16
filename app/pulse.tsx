import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useLocation } from '../lib/LocationContext';
import { useTheme, ThemeColors } from '../lib/ThemeContext';
import api, { DailyBundleResponse, PlanetaryData } from '../lib/api';
import { ChevronDown, ChevronUp, Info, Moon, Sun, Globe, Zap, Dna, Clock } from 'lucide-react-native';
import { toTitleCase } from '../lib/labelize';
import { getApiLang } from '../lib/lang';
import { useTranslation } from 'react-i18next';
import { useEntitlement } from '../lib/iap/useEntitlement';
import PausedOverlay from '../components/PausedOverlay';

// Map API moon phase values to translation keys
const getMoonPhaseKey = (phase: string): string => {
  const phaseMap: Record<string, string> = {
    'waning_gibbous': 'waningGibbous',
    'waxing_gibbous': 'waxingGibbous',
    'full_moon': 'fullMoon',
    'new_moon': 'newMoon',
    'first_quarter': 'firstQuarter',
    'last_quarter': 'lastQuarter',
    'waning_crescent': 'waningCrescent',
    'waxing_crescent': 'waxingCrescent',
  };
  return phaseMap[phase.toLowerCase()] || 'waningGibbous';
};

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableCardProps {
  icon: React.ReactNode;
  title: string;
  collapsedValue?: string;
  collapsedDetail?: string;
  message?: string;
  expandedContent?: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
  chips?: string[];
  howToRead?: string[];
}

function ExpandableCard({ 
  icon, 
  title, 
  collapsedValue, 
  collapsedDetail, 
  message, 
  expandedContent, 
  isExpanded, 
  onToggle,
  chips,
  howToRead
}: ExpandableCardProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  return (
    <TouchableOpacity 
      style={[
        styles.card, 
        { backgroundColor: colors.surface, borderColor: colors.border },
        isExpanded && { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }
      ]} 
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.cardIcon}>{icon}</View>
          <View style={styles.headerTextContainer}>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
            
            {/* Collapsed State: Show simple message/value */}
            {!isExpanded && (
              <View>
                {message ? (
                  <Text style={[styles.collapsedMessage, { color: colors.text }]} numberOfLines={1}>{message}</Text>
                ) : null}
                {collapsedValue ? (
                  <Text style={[styles.collapsedValue, { color: colors.textSecondary }]}>{collapsedValue}</Text>
                ) : null}
              </View>
            )}
            
          </View>
        </View>
        
        <View style={styles.rightContainer}>
           {!isExpanded && collapsedDetail && (
             <Text 
               style={[styles.collapsedDetail, { color: colors.textSecondary }]}
               numberOfLines={1}
               adjustsFontSizeToFit
               minimumFontScale={0.8}
             >
               {collapsedDetail}
             </Text>
           )}
          <View style={styles.chevronContainer}>
            {isExpanded ? 
              <ChevronUp size={20} color={colors.textTertiary} /> : 
              <ChevronDown size={20} color={colors.textTertiary} />
            }
          </View>
        </View>
      </View>
      
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Expanded Content */}
          {expandedContent}

          {/* Reading Notes Section */}
          {howToRead && (
            <View style={[styles.howToReadContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{t('field.readingNotes')}</Text>
              {howToRead.map((item, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={[styles.bulletChar, { color: colors.textSecondary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{item}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Chips Section */}
          {chips && (
            <View style={styles.chipsContainer}>
              <Text style={[styles.chipsLabel, { color: colors.textTertiary }]}>{t('field.usedInEchoes')}</Text>
              <View style={styles.chipRow}>
                {chips.map((chip, i) => (
                  <View key={i} style={[styles.chip, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

function translateOptimalTiming(text: string, t: (key: string, options?: any) => string): string {
  // Handle "Wait X days" pattern - convert to observational language
  const waitMatch = text.match(/wait\s+(\d+)\s+days?/i);
  if (waitMatch) {
    const days = parseInt(waitMatch[1], 10);
    return t('field.timing_next_new_moon', { count: days, defaultValue: `Next new moon in ~${days} days` });
  }
  
  const key = text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  const translated = t(`field.timing_${key}`, { defaultValue: '' });
  return translated || text;
}

function generateCircadianObservations(phase: string, t: (key: string) => string): string[] {
  const normalizedPhase = phase.toLowerCase();
  
  // Map phases to translation key prefixes
  const phaseMap: Record<string, string> = {
    'secondary peak': 'obsSecondaryPeak',
    'peak': 'obsPeak',
    'rising': 'obsRising',
    'recovery': 'obsRecovery',
    'low': 'obsLow',
    'trough': 'obsLow',
    'morning': 'obsMorning',
    'midday': 'obsMidday',
    'afternoon': 'obsAfternoon',
    'evening': 'obsEvening',
    'night': 'obsNight'
  };
  
  for (const [key, prefix] of Object.entries(phaseMap)) {
    if (normalizedPhase.includes(key)) {
      return [t(`field.${prefix}1`), t(`field.${prefix}2`), t(`field.${prefix}3`)];
    }
  }
  return [t('field.obsDefault1'), t('field.obsDefault2'), t('field.obsDefault3')];
}

interface HeroTimingCardProps {
  optimalTiming: any;
  isExpanded: boolean;
  onToggle: () => void;
  colors: ThemeColors;
  theme: 'dark' | 'light';
  t: (key: string, options?: any) => string;
}

function HeroTimingCard({ optimalTiming, isExpanded, onToggle, colors, theme, t }: HeroTimingCardProps) {
  if (!optimalTiming || (!optimalTiming.activities?.length && !optimalTiming.recommendations?.length)) {
    return null;
  }

  const heroGradientDark = 'rgba(99, 102, 241, 0.15)';
  const heroGradientLight = 'rgba(99, 102, 241, 0.08)';
  const accentBorder = 'rgba(99, 102, 241, 0.4)';

  return (
    <TouchableOpacity 
      style={[
        styles.heroCard, 
        { 
          backgroundColor: theme === 'dark' ? heroGradientDark : heroGradientLight,
          borderColor: accentBorder 
        }
      ]} 
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={styles.heroHeader}>
        <View style={styles.heroIconContainer}>
          <Clock size={24} color={colors.accent} />
        </View>
        <View style={styles.heroTitleContainer}>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{t('field.optimalTiming')}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            {translateOptimalTiming(optimalTiming?.currentPhase || '', t) || t('field.timingDefault')}
          </Text>
        </View>
        <View style={styles.chevronContainer}>
          {isExpanded ? 
            <ChevronUp size={20} color={colors.textTertiary} /> : 
            <ChevronDown size={20} color={colors.textTertiary} />
          }
        </View>
      </View>
      
      {isExpanded && (
        <View style={styles.heroContent}>
          {optimalTiming?.activities && optimalTiming.activities.length > 0 && (
            <>
              <Text style={[styles.heroSectionTitle, { color: colors.accent }]}>{t('field.bestFor')}</Text>
              {optimalTiming.activities.map((item: any, index: number) => (
                <View key={index} style={styles.heroTimingRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.heroActivity, { color: colors.text }]}>
                      {translateOptimalTiming(item.activity, t)}
                    </Text>
                    {item.activity?.toLowerCase() !== 'new beginnings' && (
                      <Text style={[styles.heroReason, { color: colors.textSecondary }]}>
                        {translateOptimalTiming(item.reason, t)}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.heroTimeBadge, { backgroundColor: colors.surfaceHighlight }]}>
                    <Text style={[styles.heroTimeText, { color: colors.text }]}>
                      {translateOptimalTiming(item.optimalTime, t)}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
          
          {optimalTiming?.recommendations && optimalTiming.recommendations.length > 0 && (
            <>
              <View style={[styles.heroDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.heroSectionTitle, { color: colors.accent }]}>{t('field.recommendations')}</Text>
              {optimalTiming.recommendations.map((rec: string, index: number) => (
                <View key={index} style={styles.bulletRow}>
                  <Text style={[styles.bulletChar, { color: colors.accent }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{translateOptimalTiming(rec, t)}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

interface PulseSnapshotProps {
  coherence: number | null;
  circadianPhase: string;
  geoActivity: string;
  geoKpIndex: number;
  colors: ThemeColors;
  t: (key: string) => string;
}

function PulseSnapshot({ coherence, circadianPhase, geoActivity, geoKpIndex, colors, t }: PulseSnapshotProps) {
  const getCoherenceColor = () => {
    if (!coherence) return colors.textSecondary;
    if (coherence >= 70) return '#10B981';
    if (coherence >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const getGeoColor = () => {
    if (geoKpIndex <= 2) return '#10B981';
    if (geoKpIndex <= 5) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View style={styles.snapshotContainer}>
      <View style={[styles.snapshotChip, { backgroundColor: colors.surfaceHighlight }]}>
        <View style={[styles.snapshotDot, { backgroundColor: getCoherenceColor() }]} />
        <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>{t('field.coherence')}</Text>
        <Text style={[styles.snapshotValue, { color: colors.text }]}>
          {coherence !== null ? `${Math.round(coherence)}%` : '—'}
        </Text>
      </View>
      
      <View style={[styles.snapshotChip, { backgroundColor: colors.surfaceHighlight }]}>
        <View style={[styles.snapshotDot, { backgroundColor: colors.accent }]} />
        <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>{t('field.body')}</Text>
        <Text style={[styles.snapshotValue, { color: colors.text }]}>{circadianPhase}</Text>
      </View>
      
      <View style={[styles.snapshotChip, { backgroundColor: colors.surfaceHighlight }]}>
        <View style={[styles.snapshotDot, { backgroundColor: getGeoColor() }]} />
        <Text style={[styles.snapshotLabel, { color: colors.textSecondary }]}>{t('field.geomagneticShort')}</Text>
        <Text style={[styles.snapshotValue, { color: colors.text }]}>{geoActivity}</Text>
      </View>
    </View>
  );
}

export default function FieldScreen() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const { coordinates, timezone, coordinateKey } = useLocation();
  const { colors, theme } = useTheme();
  const { isFullAccess, refresh } = useEntitlement();
  
  // Refresh entitlement when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  
  const [bundle, setBundle] = useState<DailyBundleResponse['data'] | null>(null);
  const [instant, setInstant] = useState<PlanetaryData | null>(null);
  const [bioRhythms, setBioRhythms] = useState<any>(null);
  const [consciousness, setConsciousness] = useState<any>(null);
  const [optimalTiming, setOptimalTiming] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Expanded states - timing expanded by default for immediate value
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({
    timing: true
  });

  const toggleCard = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    async function loadData() {
      try {
        const lang = getApiLang();
        const [bundleData, instantData, bioData, consciousnessData, timingData] = await Promise.all([
          api.getDailyBundle(coordinates.lat, coordinates.lng, lang, timezone)
            .then(res => res.success ? res.data : null)
            .catch(() => null),
          api.getInstantPlanetary(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null),
          api.getBiologicalRhythms(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null),
          api.getConsciousnessAnalysis()
            .catch(() => null),
          api.getOptimalTiming(coordinates.lat, coordinates.lng, timezone, lang)
            .catch(() => null)
        ]);

        // Mock Data Fallbacks
        const mockBundle = {
          echo_cards: [],
          planetary_context: {
            lunar: {
              phase: 'Waxing Gibbous',
              illumination: 82,
              message: 'Moon building toward fullness.'
            },
            solar: {
              phase: 'Afternoon Light',
              time_to_sunset: 3,
              message: 'Sun descending toward the horizon.'
            },
            consciousness_index: {
              global_coherence: 68,
              regional_resonance: 65,
              trend: 'stable'
            }
          },
          location: {
            timezone,
            local_time: new Date().toLocaleTimeString(),
            coordinates: { lat: coordinates.lat, lng: coordinates.lng }
          }
        };

        const mockInstant = {
          lunar: { phase: 'Waxing Gibbous', illumination: 82 },
          solar: { sunrise: '07:00', sunset: '19:00', currentPhase: 'Afternoon Light' },
          geomagnetic: { activity: 'Quiet', kpIndex: 2 },
          seasonal: { season: 'Winter', progress: 35 },
          consciousness: { global_coherence: 68, regional_resonance: 65, trend: 'stable' }
        };

        const mockBioRhythms = {
          circadian: {
            phase: 'Balanced',
            description: 'Steady mid-cycle phase.'
          },
          ultradian_remaining: 45,
          observations: [
            'Focus window active',
            'Energy levels stable',
            'Cycle midpoint'
          ]
        };

        setBundle(bundleData || mockBundle);
        setInstant(instantData || mockInstant);
        setBioRhythms(bioData || mockBioRhythms);
        setConsciousness(consciousnessData);
        setOptimalTiming(timingData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coordinateKey, coordinates, timezone, language]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  const ctx = bundle?.planetary_context;
  const geoKp = instant?.geomagnetic?.kpIndex || (instant?.geomagnetic as any)?.kp_index || 2;
  
  // Consciousness data - prefer real API data, fallback to bundle, then null (show unavailable state)
  const consciousnessData = consciousness || ctx?.consciousness_index || instant?.consciousness || null;
  
  // Calculate regional average from regional_coherence object (API returns {north_america: 79, europe: 75, ...})
  const getRegionalAverage = (): number | null => {
    if (!consciousnessData?.regional_coherence) {
      return consciousnessData?.regional_resonance || null;
    }
    const regions = Object.values(consciousnessData.regional_coherence) as number[];
    if (regions.length === 0) return null;
    return Math.round(regions.reduce((a, b) => a + b, 0) / regions.length);
  };
  const regionalAverage = getRegionalAverage();
  
  // Normalize geomagnetic state (Kp 0-3 = quiet, Kp 4-5 = active, Kp 6+ = stormy)
  const getGeoState = (kp: number): { label: string; message: string } => {
    if (kp <= 3) return { label: t('field.quiet'), message: t('field.quietField') };
    if (kp <= 5) return { label: t('field.active'), message: t('field.elevatedFieldActivity') };
    return { label: t('field.stormy'), message: t('field.stormyField') };
  };
  
  const geoState = getGeoState(geoKp);
  
  // Get meaningful lunar phase from API data or compute from illumination
  const getLunarPhase = (): string => {
    const apiPhase = ctx?.lunar?.phase || instant?.lunar?.phase || '';
    const illumination = ctx?.lunar?.illumination || instant?.lunar?.illumination || 0;
    
    // Check if API phase is a valid moon phase name (not position like "Rising")
    const validPhases = ['new', 'waxing', 'waning', 'crescent', 'gibbous', 'quarter', 'full'];
    const isValidPhase = validPhases.some(p => apiPhase.toLowerCase().includes(p));
    
    if (isValidPhase && apiPhase) {
      return apiPhase;
    }
    
    // Compute phase from illumination
    if (illumination <= 2) return 'New Moon';
    if (illumination >= 98) return 'Full Moon';
    if (illumination >= 48 && illumination <= 52) return 'Quarter Moon';
    if (illumination < 50) return 'Crescent';
    return 'Gibbous';
  };
  
  const lunarPhase = getLunarPhase();
  
  // Helper to translate circadian phase
  const translateCircadianPhase = (phase: string): string => {
    const phaseMap: { [key: string]: string } = {
      'waking': 'waking',
      'rising': 'rising',
      'peak': 'peak',
      'secondary peak': 'secondaryPeak',
      'wind-down': 'windDown',
      'winding down': 'windDown',
      'wind down': 'windDown',
      'recovery': 'recovery',
      'deep rest': 'deepRest',
      'rest': 'deepRest',
      'midday': 'midday',
      'morning': 'morning',
      'afternoon': 'afternoon',
      'evening': 'evening',
      'night': 'night',
      'balanced': 'stable',
      'active': 'active',
      'quiet': 'quiet'
    };
    const lower = phase.toLowerCase();
    for (const [key, value] of Object.entries(phaseMap)) {
      if (lower.includes(key)) {
        return t(`field.${value}`);
      }
    }
    return phase;
  };

  // Get appropriate circadian phase based on time of day
  const getCircadianPhase = (): string => {
    const apiPhase = bioRhythms?.circadian?.phase || '';
    const hour = new Date().getHours();
    
    // Check if API phase makes sense for current time
    const morningPhases = ['rising', 'peak', 'morning', 'waking'];
    const eveningPhases = ['sleep', 'recovery', 'wind', 'preparation', 'evening', 'night'];
    
    const isApiMorningPhase = morningPhases.some(p => apiPhase.toLowerCase().includes(p));
    const isApiEveningPhase = eveningPhases.some(p => apiPhase.toLowerCase().includes(p));
    
    // If it's morning (5-11) but API says evening phase, compute instead
    if (hour >= 5 && hour < 12 && isApiEveningPhase) {
      if (hour < 7) return t('field.waking');
      if (hour < 9) return t('field.rising');
      return t('field.peak');
    }
    
    // If it's evening (18-23) but API says morning phase, compute instead
    if (hour >= 18 && isApiMorningPhase) {
      if (hour < 21) return t('field.windDown');
      return t('field.recovery');
    }
    
    // API phase seems reasonable, translate and use it
    if (apiPhase) return translateCircadianPhase(apiPhase);
    
    // Fallback: compute from time
    if (hour >= 5 && hour < 7) return t('field.waking');
    if (hour >= 7 && hour < 9) return t('field.rising');
    if (hour >= 9 && hour < 12) return t('field.peak');
    if (hour >= 12 && hour < 14) return t('field.midday');
    if (hour >= 14 && hour < 17) return t('field.secondaryPeak');
    if (hour >= 17 && hour < 21) return t('field.windDown');
    if (hour >= 21 || hour < 2) return t('field.recovery');
    return t('field.deepRest');
  };
  
  const circadianPhase = getCircadianPhase();
  
  // Helper to translate time of day
  const translateTimeOfDay = (tod: string): string => {
    const todMap: { [key: string]: string } = {
      'late morning': 'lateMorning',
      'early morning': 'earlyMorning',
      'early afternoon': 'earlyAfternoon',
      'late afternoon': 'lateAfternoon',
      'early evening': 'earlyEvening',
      'late evening': 'lateEvening',
      'morning': 'morning',
      'afternoon': 'afternoon',
      'evening': 'evening',
      'night': 'night',
      'midday': 'midday'
    };
    const lower = tod.toLowerCase();
    for (const [key, value] of Object.entries(todMap)) {
      if (lower.includes(key)) {
        return t(`field.${value}`);
      }
    }
    return tod;
  };

  // Get appropriate time of day label based on actual hour
  const getTimeOfDay = (): string => {
    const apiTimeOfDay = bioRhythms?.circadian?.timeOfDay || '';
    const hour = new Date().getHours();
    
    // Check if API value matches reality
    const morningTerms = ['morning', 'dawn', 'sunrise'];
    const afternoonTerms = ['afternoon', 'midday', 'noon'];
    const eveningTerms = ['evening', 'dusk', 'sunset'];
    const nightTerms = ['night', 'midnight', 'late'];
    
    const apiSaysMorning = morningTerms.some(term => apiTimeOfDay.toLowerCase().includes(term));
    const apiSaysAfternoon = afternoonTerms.some(term => apiTimeOfDay.toLowerCase().includes(term));
    const apiSaysEvening = eveningTerms.some(term => apiTimeOfDay.toLowerCase().includes(term));
    const apiSaysNight = nightTerms.some(term => apiTimeOfDay.toLowerCase().includes(term));
    
    // Validate API response against actual time
    if (hour >= 5 && hour < 12) {
      if (apiSaysNight || apiSaysEvening) return t('field.morning');
      if (apiSaysMorning || !apiTimeOfDay) return translateTimeOfDay(apiTimeOfDay) || t('field.morning');
    }
    if (hour >= 12 && hour < 17) {
      if (apiSaysNight || apiSaysMorning) return t('field.afternoon');
      if (apiSaysAfternoon || !apiTimeOfDay) return translateTimeOfDay(apiTimeOfDay) || t('field.afternoon');
    }
    if (hour >= 17 && hour < 21) {
      if (apiSaysNight || apiSaysMorning) return t('field.evening');
      if (apiSaysEvening || !apiTimeOfDay) return translateTimeOfDay(apiTimeOfDay) || t('field.evening');
    }
    // Night: 21-5
    if (apiSaysMorning || apiSaysAfternoon) return t('field.night');
    return translateTimeOfDay(apiTimeOfDay) || t('field.night');
  };
  
  const timeOfDay = getTimeOfDay();
  
  // Parse time string like "07:51 AM" or "19:00" to minutes since midnight
  const parseTimeToMinutes = (timeStr: string | undefined | null, defaultMinutes: number = 12 * 60): number => {
    if (!timeStr || typeof timeStr !== 'string') return defaultMinutes;
    
    const normalized = timeStr.trim().toUpperCase();
    if (!normalized) return defaultMinutes;
    
    const isPM = normalized.includes('PM');
    const isAM = normalized.includes('AM');
    
    // Remove AM/PM and extra spaces
    const cleaned = normalized.replace(/\s*(AM|PM)\s*/gi, '').trim();
    const parts = cleaned.split(':').map(p => parseInt(p, 10));
    
    let hours = parts[0];
    const minutes = parts[1] || 0;
    
    // Validate parsed values
    if (isNaN(hours) || isNaN(minutes)) return defaultMinutes;
    
    // Handle 12-hour format
    if (isAM || isPM) {
      if (isPM && hours !== 12) hours += 12;
      if (isAM && hours === 12) hours = 0;
    }
    
    return hours * 60 + minutes;
  };
  
  // Helper to translate solar phase
  const translateSolarPhase = (phase: string): string => {
    const phaseMap: { [key: string]: string } = {
      'night': 'night',
      'dawn': 'morning',
      'morning': 'morning',
      'midday': 'midday',
      'afternoon': 'afternoon',
      'dusk': 'evening',
      'evening': 'evening'
    };
    const key = phaseMap[phase.toLowerCase()] || 'midday';
    return t(`field.${key}`);
  };

  // Calculate actual solar phase based on current time vs sunrise/sunset
  const getSolarPhase = (): string => {
    // Prefer API-provided phase if available and meaningful
    const apiPhase = ctx?.solar?.phase || instant?.solar?.currentPhase;
    if (apiPhase && apiPhase.length > 0 && apiPhase !== 'Day') {
      return translateSolarPhase(apiPhase);
    }
    
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    // Parse sunrise/sunset from bundle data (instant doesn't have sunrise/sunset)
    const sunriseStr = (ctx?.solar as any)?.sunrise || '07:00';
    const sunsetStr = (ctx?.solar as any)?.sunset || '19:00';
    
    const sunriseTime = parseTimeToMinutes(sunriseStr, 7 * 60); // Default 7:00 AM
    const sunsetTime = parseTimeToMinutes(sunsetStr, 19 * 60); // Default 7:00 PM
    
    // Dawn: 90 minutes before sunrise to sunrise (civil + nautical twilight)
    const dawnStart = sunriseTime - 90;
    // Dusk: sunset to 90 minutes after sunset
    const duskEnd = sunsetTime + 90;
    // Midday: 11:00 to 13:00
    const middayStart = 11 * 60;
    const middayEnd = 13 * 60;
    
    if (currentTime < dawnStart) {
      return t('field.night');
    } else if (currentTime < sunriseTime) {
      return t('field.morning');
    } else if (currentTime < middayStart) {
      return t('field.morning');
    } else if (currentTime < middayEnd) {
      return t('field.midday');
    } else if (currentTime < sunsetTime) {
      return t('field.afternoon');
    } else if (currentTime < duskEnd) {
      return t('field.evening');
    } else {
      return t('field.night');
    }
  };
  
  const solarPhase = getSolarPhase();
  
  // Compute sunset time correctly
  const getSunsetInfo = (): { display: string; label: string } => {
    // Get sunset from bundle or instant data
    const sunsetStr = (ctx?.solar as any)?.sunset || (instant?.solar as any)?.sunset;
    if (!sunsetStr) {
      return { display: t('field.sunsetIn') + ' --:--', label: solarPhase };
    }
    
    const now = new Date();
    const sunsetMinutes = parseTimeToMinutes(sunsetStr);
    const sunsetHour = Math.floor(sunsetMinutes / 60);
    const sunsetMin = sunsetMinutes % 60;
    const sunsetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sunsetHour, sunsetMin);
    
    // Format time based on locale
    const formatTime = (date: Date) => {
      return date.toLocaleTimeString(language === 'en' ? 'en-US' : language, { hour: '2-digit', minute: '2-digit' });
    };
    
    if (sunsetDate < now) {
      // Sunset already passed, show tomorrow's sunset
      const tomorrow = new Date(sunsetDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { 
        display: `${t('field.sunsetAt')} ${formatTime(tomorrow)}`,
        label: solarPhase 
      };
    }
    
    const diff = sunsetDate.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours < 24) {
      return { 
        display: `${t('field.sunsetIn')} ${hours}h ${minutes}m`,
        label: `${hours}h ${minutes}m`
      };
    } else {
      return { 
        display: `${t('field.sunsetAt')} ${formatTime(sunsetDate)}`,
        label: solarPhase 
      };
    }
  };
  
  const sunsetInfo = getSunsetInfo();

  // Helper to shorten messages
  const shorten = (msg?: string) => msg ? msg.split('.')[0] + '.' : '';

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('field.title')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t('field.subtitle')}</Text>

          {/* Hero Timing Card - Primary action-oriented content */}
          <HeroTimingCard
          optimalTiming={optimalTiming}
          isExpanded={expandedCards['timing']}
          onToggle={() => toggleCard('timing')}
          colors={colors}
          theme={theme}
          t={t}
        />

        {/* Cosmos Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('field.cosmos')}</Text>
          
          <ExpandableCard
            icon={<Moon size={20} color={colors.text} />}
            title={t('field.lunar')}
            message={t(`field.${getMoonPhaseKey(lunarPhase)}`)}
            collapsedDetail={`${Math.round(ctx?.lunar?.illumination || 0)}%`}
            isExpanded={expandedCards['lunar']}
            onToggle={() => toggleCard('lunar')}
            chips={[t('field.chipPhase'), t('field.chipIllumination')]}
            howToRead={[t('field.lunarNote1'), t('field.lunarNote2'), t('field.lunarNote3')]}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{t(`field.${getMoonPhaseKey(lunarPhase)}`)}</Text>
                <Text style={[styles.expandedSub, { color: colors.textSecondary }]}>{Math.round(ctx?.lunar?.illumination || 0)}% {t('field.illuminated')}</Text>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  {t('field.lunarExplanation')}
                </Text>
              </View>
            }
          />

          <ExpandableCard
            icon={<Sun size={20} color={colors.text} />}
            title={t('field.solar')}
            message={solarPhase}
            collapsedDetail={solarPhase}
            isExpanded={expandedCards['solar']}
            onToggle={() => toggleCard('solar')}
            chips={[t('field.chipPhase'), t('field.chipSunsetTiming')]}
            howToRead={[t('field.solarNote1'), t('field.solarNote2'), t('field.solarNote3')]}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{solarPhase}</Text>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  {t('field.solarExplanation')}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{t('field.nextTransition')}</Text>
                <Text style={[styles.expandedSub, { color: colors.text }]}>{sunsetInfo.display}</Text>
              </View>
            }
          />
        </View>

        {/* Earth Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('field.earth')}</Text>
          
          <ExpandableCard
            icon={<Zap size={20} color={colors.text} />}
            title={t('field.geomagneticShort')}
            message={geoState.label}
            collapsedDetail={geoState.label}
            isExpanded={expandedCards['geo']}
            onToggle={() => toggleCard('geo')}
            chips={[t('field.chipActivity'), t('field.chipKpIndex')]}
            howToRead={[t('field.geoNote1'), t('field.geoNote2'), t('field.geoNote3'), t('field.geoNote4')]}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('field.kpIndexLabel')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{geoKp}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('field.stateLabel')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{geoState.label}</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  {t('field.geoExplanation')}
                </Text>
              </View>
            }
          />
        </View>

        {/* Body Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('field.body')}</Text>
          <Text style={[styles.sectionHint, { color: colors.textTertiary }]}>{t('field.bodyIndicator')}</Text>
          
          <ExpandableCard
            icon={<Dna size={20} color={colors.text} />}
            title={t('field.body')}
            message={circadianPhase}
            collapsedDetail={bioRhythms?.circadian?.alertness ? `${bioRhythms.circadian.alertness}%` : t('field.active')}
            isExpanded={expandedCards['body']}
            onToggle={() => toggleCard('body')}
            chips={[t('field.chipCircadian'), t('field.chipAlertness')]}
            howToRead={[t('field.bodyNote1'), t('field.bodyNote2'), t('field.bodyNote3'), t('field.bodyNote4')]}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('field.chipPhase')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{circadianPhase}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('field.timeOfDay')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{timeOfDay}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('field.chipAlertness')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{bioRhythms?.circadian?.alertness ? `${bioRhythms.circadian.alertness}%` : '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('field.cortisol')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{bioRhythms?.circadian?.cortisol ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>{t('field.melatonin')}</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{bioRhythms?.circadian?.melatonin ?? '—'}</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  {t('field.bodyExplanation')}
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>{t('field.context')}</Text>
                {generateCircadianObservations(circadianPhase, t).slice(0, 3).map((obs: string, i: number) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={[styles.bulletChar, { color: colors.textSecondary }]}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{obs}</Text>
                  </View>
                ))}
              </View>
            }
          />
        </View>

        {/* Signals */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('field.inputSignals').toUpperCase()}</Text>
          <View style={[styles.signalsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.signalsText, { color: colors.textSecondary }]}>
              {t('field.dataFromInputs')}
            </Text>
            <View style={styles.signalTags}>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>{t('field.signalMoon')}</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>{t('field.signalSun')}</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>{t('field.signalCoherence')}</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>{t('field.signalGeo')}</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>{t('field.signalSeasonal')}: {instant?.seasonal?.season || t('field.active')}</Text>
            </View>
          </View>
        </View>

        </ScrollView>
      </SafeAreaView>
      {!isFullAccess && <PausedOverlay section="pulse" onRefreshEntitlement={refresh} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 4,
    paddingHorizontal: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionHint: {
    fontSize: 10,
    fontStyle: 'italic',
    marginBottom: 12,
    paddingHorizontal: 20,
    opacity: 0.6,
  },
  card: {
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardExpanded: {
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    minHeight: 70,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTextContainer: {
    flex: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevronContainer: {
    paddingLeft: 12,
  },
  cardIcon: {
    marginRight: 12,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collapsedMessage: {
    fontSize: 16,
    fontWeight: '500',
  },
  collapsedValue: {
    fontSize: 14,
    marginTop: 2,
  },
  collapsedDetail: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 4,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 0,
  },
  expandedDetails: {
    marginBottom: 20,
  },
  expandedValue: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  expandedSub: {
    fontSize: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
    textAlign: 'right',
  },
  explanationText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
    lineHeight: 18,
  },
  howToReadContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
  subTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  bulletChar: {
    fontSize: 13,
    lineHeight: 19,
    width: 14,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 19,
    flex: 1,
  },
  chipsContainer: {
    marginTop: 20,
  },
  chipsLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  chipText: {
    fontSize: 11,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  signalsContainer: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  signalsText: {
    fontSize: 13,
    marginBottom: 12,
  },
  signalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalTag: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
  timingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  timingActivity: {
    fontSize: 14,
    flex: 1,
  },
  timingValue: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'right',
    marginLeft: 12,
  },
  timingReason: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  heroCard: {
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  heroIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  heroTitleContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  heroSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  heroTimingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  heroActivity: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  heroReason: {
    fontSize: 13,
    lineHeight: 18,
  },
  heroTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12,
  },
  heroTimeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroDivider: {
    height: 1,
    marginVertical: 16,
  },
  snapshotContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  snapshotChip: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  snapshotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 6,
  },
  snapshotLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 2,
    textAlign: 'center',
  },
  snapshotValue: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
