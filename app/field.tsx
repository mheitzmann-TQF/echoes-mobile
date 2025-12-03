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

          {/* How to Read Section */}
          {howToRead && (
            <View style={[styles.howToReadContainer, { backgroundColor: colors.surface }]}>
              <Text style={[styles.subTitle, { color: colors.textSecondary }]}>How to read</Text>
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
              message: 'A phase that favors release and integration.'
            },
            solar: {
              phase: 'Afternoon Light',
              time_to_sunset: 3,
              message: 'Attention narrows; closure energy rises.'
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
            description: 'Energy steady; focus aligns with action.'
          },
          ultradian_remaining: 45,
          recommendations: [
            'Deep work windows',
            'Physical movement',
            'Strategic planning'
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
  // Use instant data for geomagnetic if available, otherwise fallback
  const geoActivity = instant?.geomagnetic?.activity || 'Quiet';
  const geoKp = instant?.geomagnetic?.kpIndex || 2;

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
            message={shorten(ctx?.lunar?.message)}
            isExpanded={expandedCards['lunar']}
            onToggle={() => toggleCard('lunar')}
            chips={['phase', 'illumination']}
            howToRead={['Phase indicates energy type (building vs releasing)', 'Illumination shows intensity']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ctx?.lunar?.phase}</Text>
                <Text style={[styles.expandedSub, { color: colors.textSecondary }]}>{Math.round(ctx?.lunar?.illumination || 0)}% Illumination</Text>
              </View>
            }
          />

          <ExpandableCard
            icon="☀️"
            title="Solar"
            message={shorten(ctx?.solar?.message)}
            isExpanded={expandedCards['solar']}
            onToggle={() => toggleCard('solar')}
            chips={['current phase', 'sunset timing']}
            howToRead={['Solar angle determines hormonal peaks', 'Sunset marks the shift to restoration']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{ctx?.solar?.phase}</Text>
                <Text style={[styles.expandedSub, { color: colors.textSecondary }]}>
                  {ctx?.solar?.time_to_sunset 
                    ? `Sunset in ${Math.round(ctx.solar.time_to_sunset)}h` 
                    : 'Sun cycle active'}
                </Text>
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
            message={ctx?.consciousness_index?.trend === 'rising' ? "Signal clarity is increasing." : "The field holds steady."}
            collapsedDetail={`Trend: ${ctx?.consciousness_index?.trend || 'Stable'}`}
            isExpanded={expandedCards['coherence']}
            onToggle={() => toggleCard('coherence')}
            chips={['global', 'regional', 'trend']}
            howToRead={['> 60% suggests high alignment', 'Stable trends support focus', 'Rising trends aid collective action']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Global Coherence</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{Math.round(ctx?.consciousness_index?.global_coherence || 0)}%</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Regional Resonance</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{Math.round(ctx?.consciousness_index?.regional_resonance || 0)}%</Text>
                </View>
                <Text style={[styles.explanationText, { color: colors.textSecondary }]}>
                  Coherence measures the synchronization of the Earth's magnetic field network. High coherence often correlates with collective calm.
                </Text>
              </View>
            }
          />

          <ExpandableCard
            icon="⚡"
            title="Geomagnetic"
            message={geoActivity === 'Active' ? "Higher background friction." : "Low disturbance."}
            collapsedDetail={geoActivity}
            isExpanded={expandedCards['geo']}
            onToggle={() => toggleCard('geo')}
            chips={['activity', 'kp index']}
            howToRead={['Kp < 4: Quiet conditions', 'Kp > 5: Potential sensitivity', 'Storms may affect sleep/mood']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Kp Index</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{geoKp}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Activity</Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>{geoActivity}</Text>
                </View>
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
            message={shorten(bioRhythms?.circadian?.description)}
            isExpanded={expandedCards['body']}
            onToggle={() => toggleCard('body')}
            chips={['circadian phase', 'ultradian']}
            howToRead={['Match activity intensity to phase', 'Respect ultradian rest dips (every 90m)']}
            expandedContent={
              <View style={styles.expandedDetails}>
                <Text style={[styles.expandedValue, { color: colors.text }]}>{bioRhythms?.circadian?.phase || 'Balanced'}</Text>
                <Text style={[styles.expandedSub, { color: colors.textSecondary }]}>
                  {bioRhythms?.ultradian_remaining ? `${bioRhythms.ultradian_remaining}m remaining in cycle` : 'Cycle active'}
                </Text>
                
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <Text style={[styles.subTitle, { color: colors.textSecondary }]}>Gentle Windows</Text>
                {bioRhythms?.recommendations?.map((rec: string, i: number) => (
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
