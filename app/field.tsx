import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import api, { DailyBundleResponse } from '../lib/api';
import { ChevronDown, ChevronUp, Info } from 'lucide-react-native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ExpandableCardProps {
  icon: string;
  title: string;
  value: string;
  detail?: string;
  message?: string;
  expandedContent?: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

function ExpandableCard({ icon, title, value, detail, message, expandedContent, isExpanded, onToggle }: ExpandableCardProps) {
  return (
    <TouchableOpacity 
      style={[styles.card, isExpanded && styles.cardExpanded]} 
      onPress={onToggle}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeaderRow}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.cardIcon}>{icon}</Text>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardValue}>{value}</Text>
            {detail && <Text style={styles.cardDetail}>{detail}</Text>}
          </View>
        </View>
        <View style={styles.chevronContainer}>
          {isExpanded ? 
            <ChevronUp size={20} color="rgba(255,255,255,0.4)" /> : 
            <ChevronDown size={20} color="rgba(255,255,255,0.4)" />
          }
        </View>
      </View>
      
      {isExpanded && (
        <View style={styles.expandedContent}>
          {message && (
            <View style={styles.messageContainer}>
              <Info size={14} color="rgba(255,255,255,0.6)" style={{ marginTop: 2 }} />
              <Text style={styles.cardMessage}>{message}</Text>
            </View>
          )}
          {expandedContent}
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function FieldScreen() {
  const { coordinates, timezone } = useLocation();
  const [bundle, setBundle] = useState<DailyBundleResponse['data'] | null>(null);
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
        // Reuse cache if possible via the API (handled internally or just fetch fresh)
        // In a real app we might use a global store
        const [bundleData, bioData] = await Promise.all([
          api.getDailyBundle(coordinates.lat, coordinates.lng, 'en', timezone)
            .then(res => res.success ? res.data : null)
            .catch(() => null),
          api.getBiologicalRhythms(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null)
        ]);

        setBundle(bundleData);
        setBioRhythms(bioData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coordinates, timezone]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  const ctx = bundle?.planetary_context;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>Field Details</Text>
        <Text style={styles.headerSubtitle}>Cosmos · Earth · Body</Text>

        {/* Cosmos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COSMOS</Text>
          
          <ExpandableCard
            icon="🌙"
            title="Lunar Phase"
            value={ctx?.lunar.phase || 'Unknown'}
            detail={`${Math.round(ctx?.lunar.illumination || 0)}% Illumination`}
            message={ctx?.lunar.message}
            isExpanded={expandedCards['lunar']}
            onToggle={() => toggleCard('lunar')}
            expandedContent={
              <View style={styles.extraContent}>
                <Text style={styles.extraText}>
                  The moon's phase affects tidal forces and biological rhythms. 
                  Current illumination suggests {ctx?.lunar.illumination && ctx.lunar.illumination > 50 ? 'high' : 'building'} energy.
                </Text>
              </View>
            }
          />

          <ExpandableCard
            icon="☀️"
            title="Solar Cycle"
            value={ctx?.solar.phase || 'Day'}
            detail={ctx?.solar.time_to_sunset ? `Sunset in ${Math.round(ctx.solar.time_to_sunset)}h` : undefined}
            message={ctx?.solar.message}
            isExpanded={expandedCards['solar']}
            onToggle={() => toggleCard('solar')}
          />
        </View>

        {/* Earth Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EARTH</Text>
          
          <ExpandableCard
            icon="⚡"
            title="Geomagnetic Activity"
            value={ctx?.consciousness_index.global_coherence && ctx.consciousness_index.global_coherence > 60 ? 'Coherent' : 'Quiet'}
            detail={`Regional Resonance: ${Math.round(ctx?.consciousness_index.regional_resonance || 0)}%`}
            message="Geomagnetic field variations can influence human nervous system activity."
            isExpanded={expandedCards['geo']}
            onToggle={() => toggleCard('geo')}
          />

          <ExpandableCard
            icon="🌐"
            title="Global Coherence"
            value={`${Math.round(ctx?.consciousness_index.global_coherence || 0)}%`}
            detail={`Trend: ${ctx?.consciousness_index.trend || 'Stable'}`}
            message="A measure of synchronization in the Earth's magnetic field network."
            isExpanded={expandedCards['coherence']}
            onToggle={() => toggleCard('coherence')}
          />
        </View>

        {/* Body Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BODY</Text>
          
          <ExpandableCard
            icon="🧬"
            title="Biological Rhythms"
            value={bioRhythms?.circadian?.phase || 'Balanced'}
            detail="Circadian Alignment"
            message={bioRhythms?.circadian?.description}
            isExpanded={expandedCards['body']}
            onToggle={() => toggleCard('body')}
            expandedContent={
              bioRhythms?.recommendations ? (
                <View style={styles.extraContent}>
                  <View style={styles.divider} />
                  <Text style={styles.subTitle}>Optimal Timing For:</Text>
                  {bioRhythms.recommendations.map((rec: string, i: number) => (
                    <Text key={i} style={styles.bulletPoint}>• {rec}</Text>
                  ))}
                </View>
              ) : null
            }
          />
        </View>

        {/* Signals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INPUT SIGNALS</Text>
          <View style={styles.signalsContainer}>
            <Text style={styles.signalsText}>
              Data generated using real-time inputs from:
            </Text>
            <View style={styles.signalTags}>
              <Text style={styles.signalTag}>NOAA Space Weather</Text>
              <Text style={styles.signalTag}>NASA JPL</Text>
              <Text style={styles.signalTag}>GCP Network</Text>
              <Text style={styles.signalTag}>Astronomical Algorithms</Text>
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
    backgroundColor: '#000000',
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
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    overflow: 'hidden',
  },
  cardExpanded: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chevronContainer: {
    paddingLeft: 16,
  },
  cardIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
    marginBottom: 2,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  cardDetail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 0,
  },
  messageContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 12,
    borderRadius: 8,
    gap: 10,
  },
  cardMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    flex: 1,
  },
  extraContent: {
    marginTop: 12,
  },
  extraText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 4,
    lineHeight: 20,
  },
  signalsContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  signalsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  signalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  signalTag: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    overflow: 'hidden',
  },
});
