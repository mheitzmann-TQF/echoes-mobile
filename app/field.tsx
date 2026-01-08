import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useTheme, ThemeColors } from '../lib/ThemeContext';
import api, { DailyBundleResponse, PlanetaryData } from '../lib/api';
import { ChevronDown, ChevronUp, Info, Moon, Sun, Globe, Zap, Dna } from 'lucide-react-native';
import { toTitleCase } from '../lib/labelize';
import { getApiLang } from '../lib/lang';

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
             <Text style={[styles.collapsedDetail, { color: colors.textSecondary }]}>{collapsedDetail}</Text>
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
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Reading notes</Text>
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
              <Text style={[styles.chipsLabel, { color: colors.textTertiary }]}>Used in Echoes</Text>
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

function generateCircadianObservations(phase: string): string[] {
  const normalizedPhase = phase.toLowerCase();
  
  // TQF API returns phases like: Secondary Peak, Peak, Recovery, Low, Rising, etc.
  const phaseMap: Record<string, string[]> = {
    // TQF circadian phases
    'secondary peak': ['Secondary energy surge occurring', 'Afternoon alertness window', 'Good for creative or physical tasks'],
    'peak': ['Peak mental clarity and focus', 'Energy at zenith', 'Optimal for demanding cognitive work'],
    'rising': ['Energy levels increasing', 'Alertness building', 'Good time to start focused work'],
    'recovery': ['Body entering restoration mode', 'Processing and consolidation active', 'Wind-down phase appropriate'],
    'low': ['Natural energy dip occurring', 'Rest or light activity preferred', 'Conserve energy for next cycle'],
    'trough': ['Deepest rest phase', 'Body temperature at minimum', 'Maximum recovery occurring'],
    // Time-of-day phases (fallback)
    'morning': ['Core body temperature rising', 'Cortisol peak aids alertness', 'Optimal for analytical work'],
    'midday': ['Peak mental clarity and focus', 'Energy at zenith', 'Ideal for decision-making'],
    'afternoon': ['Post-meal dip in attention', 'Secondary energy rise possible', 'Good for physical activity'],
    'evening': ['Melatonin beginning to rise', 'Temperature cooling', 'Wind-down phase begins'],
    'night': ['Deep sleep hormone levels peak', 'Body temperature lowest', 'Recovery and restoration mode'],
    'balanced': ['Circadian rhythm stable', 'Energy consistent', 'Flexible for most activities']
  };
  
  for (const [key, observations] of Object.entries(phaseMap)) {
    if (normalizedPhase.includes(key)) {
      return observations;
    }
  }
  return ['Circadian rhythm active', 'Biological patterns flowing', 'Energy cycles present'];
}

function StickyHeader({ coherence, solarPhase, lunarPhase }: { coherence: number, solarPhase: string, lunarPhase: string }) {
  const { colors } = useTheme();
  // Derive states
  const coherenceState = coherence > 60 ? 'Stable' : (coherence < 40 ? 'Variable' : 'Building');
  const lightState = solarPhase.includes('Morning') || solarPhase.includes('Dawn') ? 'Brightening' : 
                     (solarPhase.includes('Night') || solarPhase.includes('Dusk') ? 'Resting' : 'Active');
  // Determine if moon is waxing (rising) or waning (falling) from phase name
  const lowerPhase = lunarPhase.toLowerCase();
  const isWaxing = lowerPhase.includes('waxing') || lowerPhase.includes('new') || lowerPhase.includes('crescent') && !lowerPhase.includes('waning');
  const isWaning = lowerPhase.includes('waning') || lowerPhase.includes('full');
  const moonState = isWaning ? 'Falling' : 'Rising';

  return (
    <View style={[styles.stickyHeader, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.stickyItem}>
        <Text style={[styles.stickyLabel, { color: colors.textSecondary }]}>Coherence</Text>
        <Text style={[styles.stickyValue, { color: colors.text }]}>{coherenceState}</Text>
      </View>
      <View style={[styles.stickyDivider, { backgroundColor: colors.border }]} />
      <View style={styles.stickyItem}>
        <Text style={[styles.stickyLabel, { color: colors.textSecondary }]}>Light</Text>
        <Text style={[styles.stickyValue, { color: colors.text }]}>{lightState}</Text>
      </View>
      <View style={[styles.stickyDivider, { backgroundColor: colors.border }]} />
      <View style={styles.stickyItem}>
        <Text style={[styles.stickyLabel, { color: colors.textSecondary }]}>Moon</Text>
        <Text style={[styles.stickyValue, { color: colors.text }]}>{moonState}</Text>
      </View>
    </View>
  );
}

export default function FieldScreen() {
  const { coordinates, timezone } = useLocation();
  const { colors } = useTheme();
  const [bundle, setBundle] = useState<DailyBundleResponse['data'] | null>(null);
  const [instant, setInstant] = useState<PlanetaryData | null>(null);
  const [bioRhythms, setBioRhythms] = useState<any>(null);
  const [consciousness, setConsciousness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Expanded states
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

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
        const [bundleData, instantData, bioData, consciousnessData] = await Promise.all([
          api.getDailyBundle(coordinates.lat, coordinates.lng, lang, timezone)
            .then(res => res.success ? res.data : null)
            .catch(() => null),
          api.getInstantPlanetary(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null),
          api.getBiologicalRhythms(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null),
          api.getConsciousnessAnalysis()
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
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coordinates, timezone]);

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
  
  // Normalize geomagnetic state
  const getGeoState = (kp: number): { label: string; message: string } => {
    if (kp <= 2) return { label: 'Quiet', message: 'Geomagnetic field is calm.' };
    if (kp <= 5) return { label: 'Active', message: 'Elevated field activity.' };
    return { label: 'Stormy', message: 'Strong storm conditions.' };
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
      if (hour < 7) return 'Waking';
      if (hour < 9) return 'Rising';
      return 'Peak';
    }
    
    // If it's evening (18-23) but API says morning phase, compute instead
    if (hour >= 18 && isApiMorningPhase) {
      if (hour < 21) return 'Wind-down';
      return 'Recovery';
    }
    
    // API phase seems reasonable, use it
    if (apiPhase) return apiPhase;
    
    // Fallback: compute from time
    if (hour >= 5 && hour < 7) return 'Waking';
    if (hour >= 7 && hour < 9) return 'Rising';
    if (hour >= 9 && hour < 12) return 'Peak';
    if (hour >= 12 && hour < 14) return 'Midday';
    if (hour >= 14 && hour < 17) return 'Secondary Peak';
    if (hour >= 17 && hour < 21) return 'Wind-down';
    if (hour >= 21 || hour < 2) return 'Recovery';
    return 'Deep Rest';
  };
  
  const circadianPhase = getCircadianPhase();
  
  // Get appropriate time of day label based on actual hour
  const getTimeOfDay = (): string => {
    const apiTimeOfDay = bioRhythms?.circadian?.timeOfDay || '';
    const hour = new Date().getHours();
    
    // Check if API value matches reality
    const morningTerms = ['morning', 'dawn', 'sunrise'];
    const afternoonTerms = ['afternoon', 'midday', 'noon'];
    const eveningTerms = ['evening', 'dusk', 'sunset'];
    const nightTerms = ['night', 'midnight', 'late'];
    
    const apiSaysMorning = morningTerms.some(t => apiTimeOfDay.toLowerCase().includes(t));
    const apiSaysAfternoon = afternoonTerms.some(t => apiTimeOfDay.toLowerCase().includes(t));
    const apiSaysEvening = eveningTerms.some(t => apiTimeOfDay.toLowerCase().includes(t));
    const apiSaysNight = nightTerms.some(t => apiTimeOfDay.toLowerCase().includes(t));
    
    // Validate API response against actual time
    if (hour >= 5 && hour < 12) {
      if (apiSaysNight || apiSaysEvening) return 'Morning';
      if (apiSaysMorning || !apiTimeOfDay) return apiTimeOfDay || 'Morning';
    }
    if (hour >= 12 && hour < 17) {
      if (apiSaysNight || apiSaysMorning) return 'Afternoon';
      if (apiSaysAfternoon || !apiTimeOfDay) return apiTimeOfDay || 'Afternoon';
    }
    if (hour >= 17 && hour < 21) {
      if (apiSaysNight || apiSaysMorning) return 'Evening';
      if (apiSaysEvening || !apiTimeOfDay) return apiTimeOfDay || 'Evening';
    }
    // Night: 21-5
    if (apiSaysMorning || apiSaysAfternoon) return 'Night';
    return apiTimeOfDay || 'Night';
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
  
  // Calculate actual solar phase based on current time vs sunrise/sunset
  const getSolarPhase = (): string => {
    // Prefer API-provided phase if available and meaningful
    const apiPhase = ctx?.solar?.phase || instant?.solar?.currentPhase;
    if (apiPhase && apiPhase.length > 0 && apiPhase !== 'Day') {
      return apiPhase;
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
      return 'Night';
    } else if (currentTime < sunriseTime) {
      return 'Dawn';
    } else if (currentTime < middayStart) {
      return 'Morning';
    } else if (currentTime < middayEnd) {
      return 'Midday';
    } else if (currentTime < sunsetTime) {
      return 'Afternoon';
    } else if (currentTime < duskEnd) {
      return 'Dusk';
    } else {
      return 'Night';
    }
  };
  
  const solarPhase = getSolarPhase();
  
  // Compute sunset time correctly
  const getSunsetInfo = (): { display: string; label: string } => {
    // Get sunset from bundle or instant data
    const sunsetStr = (ctx?.solar as any)?.sunset || (instant?.solar as any)?.sunset;
    if (!sunsetStr) {
      return { display: 'Sunset timing available when expanded', label: solarPhase };
    }
    
    const now = new Date();
    const sunsetMinutes = parseTimeToMinutes(sunsetStr);
    const sunsetHour = Math.floor(sunsetMinutes / 60);
    const sunsetMin = sunsetMinutes % 60;
    const sunsetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sunsetHour, sunsetMin);
    
    if (sunsetDate < now) {
      // Sunset already passed, show tomorrow's sunset
      const tomorrow = new Date(sunsetDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { 
        display: `Sunset tomorrow at ${tomorrow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        label: solarPhase 
      };
    }
    
    const diff = sunsetDate.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours < 24) {
      return { 
        display: `Sunset in ${hours}h ${minutes}m`,
        label: `${hours}h ${minutes}m remaining`
      };
    } else {
      return { 
        display: `Sunset at ${sunsetStr}`,
        label: solarPhase 
      };
    }
  };
  
  const sunsetInfo = getSunsetInfo();

  // Helper to shorten messages
  const shorten = (msg?: string) => msg ? msg.split('.')[0] + '.' : '';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Field</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Cosmos · Earth · Body</Text>
        <Text style={[styles.headerSubtext, { color: colors.textTertiary }]}>How today’s signal is shaped</Text>

        <StickyHeader 
          coherence={consciousnessData?.global_coherence || 0}
          solarPhase={solarPhase}
          lunarPhase={lunarPhase}
        />

        {/* Cosmos Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>COSMOS</Text>
          
          <ExpandableCard
            icon={<Moon size={20} color={colors.text} />}
            title="Lunar"
            message={toTitleCase(lunarPhase)}
            collapsedDetail={`${Math.round(ctx?.lunar?.illumination || 0)}%`}
            isExpanded={expandedCards['lunar']}
            onToggle={() => toggleCard('lunar')}
            chips={['phase', 'illumination']}
            howToRead={['Phase cycles new → waxing → full → waning over ~29.5 days', 'Illumination shows percentage of visible surface', 'Combined with other signals to shape daily echoes']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{toTitleCase(lunarPhase)}</Text>
                <Text style={[styles.expandedSub, { color: colors.textSecondary }]}>{Math.round(ctx?.lunar?.illumination || 0)}% Illuminated</Text>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  The moon's visible portion reflects gravitational position. Waxing phases indicate increasing illumination toward full moon; waning indicates decrease toward new moon.
                </Text>
              </View>
            }
          />

          <ExpandableCard
            icon={<Sun size={20} color={colors.text} />}
            title="Solar"
            message={solarPhase}
            collapsedDetail={solarPhase}
            isExpanded={expandedCards['solar']}
            onToggle={() => toggleCard('solar')}
            chips={['phase', 'sunset timing']}
            howToRead={['Solar phase indicates sun position: Morning (rising), Midday (highest), Afternoon (descending), Night (below horizon)', 'Sunset marks transition to evening phase', 'Used alongside lunar and coherence signals']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{solarPhase}</Text>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  The sun's position shapes the light cycle and influences circadian rhythms. Sunrise begins the brightening phase; sunset marks the transition to rest.
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Next Transition</Text>
                <Text style={[styles.expandedSub, { color: colors.text }]}>{sunsetInfo.display}</Text>
              </View>
            }
          />
        </View>

        {/* Earth Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>EARTH</Text>
          
          <ExpandableCard
            icon={<Globe size={20} color={colors.text} />}
            title="Coherence"
            message={consciousnessData?.global_coherence && consciousnessData.global_coherence > 60 ? "Collective tone is stable." : consciousnessData ? "Collective tone is variable." : "Checking collective pulse..."}
            collapsedDetail={consciousnessData?.global_coherence !== undefined && consciousnessData?.global_coherence !== null ? `${Math.round(consciousnessData.global_coherence)}%` : "—"}
            isExpanded={expandedCards['coherence']}
            onToggle={() => toggleCard('coherence')}
            chips={['global', 'regional', 'trend']}
            howToRead={['Coherence above 60% indicates aligned collective sentiment', 'Below 40% shows divergent narratives', 'Synthesized from global news and contemplative sources', 'Part of echo card relevance calculation']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Global</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{consciousnessData?.global_coherence !== undefined && consciousnessData?.global_coherence !== null ? `${Math.round(consciousnessData.global_coherence)}%` : "—"}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Regional Avg</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{regionalAverage !== null ? `${regionalAverage}%` : "—"}</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  Coherence measures collective sentiment alignment synthesized from global news sources and contemplative observatories. Higher values indicate more unified collective patterns across regions.
                </Text>
              </View>
            }
          />

          <ExpandableCard
            icon={<Zap size={20} color={colors.text} />}
            title="Geomagnetic"
            message={geoState.message}
            collapsedDetail={geoState.label}
            isExpanded={expandedCards['geo']}
            onToggle={() => toggleCard('geo')}
            chips={['activity', 'kp index']}
            howToRead={['Kp 0-3: Quiet conditions', 'Kp 4-5: Active / Moderate conditions', 'Kp 6+: Storm conditions', 'Affects magnetosphere and potential auroral displays']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Kp Index</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{geoKp}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>State</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{geoState.label}</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  The Kp index measures disturbance in the Earth's magnetosphere. Higher values indicate stronger geomagnetic storms from solar wind interaction.
                </Text>
              </View>
            }
          />
        </View>

        {/* Body Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>BODY</Text>
          
          <ExpandableCard
            icon={<Dna size={20} color={colors.text} />}
            title="Body"
            message={circadianPhase}
            collapsedDetail={bioRhythms?.circadian?.alertness ? `${bioRhythms.circadian.alertness}%` : 'Active'}
            isExpanded={expandedCards['body']}
            onToggle={() => toggleCard('body')}
            chips={['circadian', 'alertness']}
            howToRead={['Circadian: 24-hour biological clock', 'Alertness: Current cognitive readiness', 'Cortisol/Melatonin: Hormonal balance indicators', 'Patterns derived from circadian research']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Phase</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{circadianPhase}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time of Day</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{timeOfDay}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Alertness</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{bioRhythms?.circadian?.alertness ? `${bioRhythms.circadian.alertness}%` : '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Cortisol</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{bioRhythms?.circadian?.cortisol ?? '—'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Melatonin</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{bioRhythms?.circadian?.melatonin ?? '—'}</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  Circadian rhythms regulate sleep-wake cycles and hormonal patterns over 24 hours. Alertness and hormone levels shift throughout the day.
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Context</Text>
                {(bioRhythms?.circadian?.recommendations || generateCircadianObservations(circadianPhase)).slice(0, 3).map((obs: string, i: number) => (
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
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>INPUT SIGNALS</Text>
          <View style={[styles.signalsContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.signalsText, { color: colors.textSecondary }]}>
              Data generated using real-time inputs from:
            </Text>
            <View style={styles.signalTags}>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>Moon: Phase & Illumination</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>Sun: Phase & Sunset</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>Coherence: Global & Trend</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>Geomagnetic: Activity & Kp</Text>
              <Text style={[styles.signalTag, { backgroundColor: colors.surfaceHighlight, color: colors.textSecondary }]}>Seasonal: {instant?.seasonal?.season || 'Current'}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
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
    marginBottom: 4,
  },
  headerSubtext: {
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  stickyHeader: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
  },
  stickyItem: {
    flex: 1,
    alignItems: 'center',
  },
  stickyLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  stickyValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  stickyDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 16,
    paddingHorizontal: 20,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
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
});
