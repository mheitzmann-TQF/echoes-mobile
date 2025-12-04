import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useTheme, ThemeColors } from '../lib/ThemeContext';
import api, { DailyBundleResponse, PlanetaryData } from '../lib/api';
import { ChevronDown, ChevronUp, Info } from 'lucide-react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableCardProps {
  icon: string;
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
          <Text style={styles.cardIcon}>{icon}</Text>
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
                <Text key={i} style={[styles.bulletPoint, { color: colors.textSecondary }]}>• {item}</Text>
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

function StickyHeader({ coherence, solarPhase, lunarIllumination }: { coherence: number, solarPhase: string, lunarIllumination: number }) {
  const { colors } = useTheme();
  // Derive states
  const coherenceState = coherence > 60 ? 'Stable' : (coherence < 40 ? 'Variable' : 'Building');
  const lightState = solarPhase.includes('Morning') ? 'Brightening' : (solarPhase.includes('Night') ? 'Resting' : 'Deepening');
  const moonState = lunarIllumination > 50 ? 'Rising' : 'Falling'; // Simplified logic

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
  const { coordinates, timezone, language } = useLocation();
  const { colors } = useTheme();
  const [bundle, setBundle] = useState<DailyBundleResponse['data'] | null>(null);
  const [instant, setInstant] = useState<PlanetaryData | null>(null);
  const [bioRhythms, setBioRhythms] = useState<any>(null);
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
        const [bundleData, instantData, bioData] = await Promise.all([
          api.getDailyBundle(coordinates.lat, coordinates.lng, language, timezone)
            .then(res => res.success ? res.data : null)
            .catch(() => null),
          api.getInstantPlanetary(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null),
          api.getBiologicalRhythms(coordinates.lat, coordinates.lng, timezone)
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
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coordinates, timezone, language]);

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
  const geoKp = instant?.geomagnetic?.kpIndex || 2;
  
  // Normalize geomagnetic state
  const getGeoState = (kp: number): { label: string; message: string } => {
    if (kp <= 2) return { label: 'Quiet', message: 'Geomagnetic field is calm.' };
    if (kp <= 5) return { label: 'Active', message: 'Elevated field activity.' };
    return { label: 'Stormy', message: 'Strong storm conditions.' };
  };
  
  const geoState = getGeoState(geoKp);
  
  // Compute sunset time correctly
  const getSunsetInfo = (): { display: string; label: string } => {
    // instant.solar has sunset as time string (e.g., "19:00")
    if (!instant?.solar?.sunset) {
      return { display: 'Sunset timing available when expanded', label: 'Evening transition' };
    }
    
    const now = new Date();
    const [sunsetHour, sunsetMin] = instant.solar.sunset.split(':').map(Number);
    const sunsetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), sunsetHour, sunsetMin);
    
    if (sunsetDate < now) {
      // Sunset already passed, show tomorrow's sunset
      const tomorrow = new Date(sunsetDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return { 
        display: `Sunset tomorrow at ${tomorrow.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        label: 'Evening transition' 
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
        display: `Sunset at ${instant.solar.sunset}`,
        label: 'Evening transition' 
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
          coherence={ctx?.consciousness_index?.global_coherence || 0}
          solarPhase={ctx?.solar?.phase || 'Day'}
          lunarIllumination={ctx?.lunar?.illumination || 0}
        />

        {/* Cosmos Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>COSMOS</Text>
          
          <ExpandableCard
            icon="🌙"
            title="Lunar"
            message={ctx?.lunar?.phase || 'Phase cycle active'}
            collapsedDetail={`${Math.round(ctx?.lunar?.illumination || 0)}%`}
            isExpanded={expandedCards['lunar']}
            onToggle={() => toggleCard('lunar')}
            chips={['phase', 'illumination']}
            howToRead={['Phase cycles new → waxing → full → waning over ~29.5 days', 'Illumination shows percentage of visible surface', 'Combined with other signals to shape daily echoes']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ctx?.lunar?.phase}</Text>
                <Text style={[styles.expandedSub, { color: colors.textSecondary }]}>{Math.round(ctx?.lunar?.illumination || 0)}% Illuminated</Text>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  The moon's visible portion reflects gravitational position. Waxing phases indicate increasing illumination toward full moon; waning indicates decrease toward new moon.
                </Text>
              </View>
            }
          />

          <ExpandableCard
            icon="☀️"
            title="Solar"
            message={ctx?.solar?.phase || 'Day cycle active'}
            collapsedDetail={sunsetInfo.label}
            isExpanded={expandedCards['solar']}
            onToggle={() => toggleCard('solar')}
            chips={['phase', 'sunset timing']}
            howToRead={['Solar phase indicates sun position: Morning (rising), Midday (highest), Afternoon (descending), Night (below horizon)', 'Sunset marks transition to evening phase', 'Used alongside lunar and coherence signals']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ctx?.solar?.phase}</Text>
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
            icon="🌐"
            title="Coherence"
            message={ctx?.consciousness_index?.global_coherence && ctx.consciousness_index.global_coherence > 60 ? "Coherence stable." : "Coherence variable."}
            collapsedDetail={`${Math.round(ctx?.consciousness_index?.global_coherence || 0)}%`}
            isExpanded={expandedCards['coherence']}
            onToggle={() => toggleCard('coherence')}
            chips={['global', 'regional', 'trend']}
            howToRead={['Coherence above 60% indicates global synchronization', 'Below 40% shows variable patterns', 'Combines global and regional measurements', 'Part of echo card relevance calculation']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Global</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{Math.round(ctx?.consciousness_index?.global_coherence || 0)}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Regional</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{Math.round(ctx?.consciousness_index?.regional_resonance || 0)}%</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  Coherence measures synchronization of the Earth's magnetic field as detected by global sensors. Higher values indicate more unified global patterns.
                </Text>
              </View>
            }
          />

          <ExpandableCard
            icon="⚡"
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
            icon="🧬"
            title="Body"
            message={bioRhythms?.circadian?.phase || 'Rhythm active'}
            collapsedDetail={bioRhythms?.ultradian_remaining ? `${bioRhythms.ultradian_remaining}m` : 'Active'}
            isExpanded={expandedCards['body']}
            onToggle={() => toggleCard('body')}
            chips={['circadian', 'ultradian']}
            howToRead={['Circadian: 24-hour biological clock', 'Ultradian: ~90-minute focus/energy cycles', 'Patterns derived from circadian research', 'Used to align echo timing with body readiness']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{bioRhythms?.circadian?.phase || 'Balanced'}</Text>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  Circadian rhythms regulate sleep-wake cycles and hormonal patterns over 24 hours. Ultradian cycles shape focus windows within the day.
                </Text>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Current Observations</Text>
                {(bioRhythms?.observations || bioRhythms?.recommendations)?.map((rec: string, i: number) => (
                  <Text key={i} style={[styles.bulletPoint, { color: colors.textSecondary }]}>• {rec}</Text>
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
  },
  stickyItem: {
    flex: 1,
    alignItems: 'center',
  },
  stickyLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  stickyValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  stickyDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 12,
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
    fontSize: 22,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  collapsedMessage: {
    fontSize: 15,
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
  bulletPoint: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 19,
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
