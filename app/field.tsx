import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import api, { DailyBundleResponse } from '../lib/api';

export default function FieldScreen() {
  const { coordinates, timezone } = useLocation();
  const [bundle, setBundle] = useState<DailyBundleResponse['data'] | null>(null);
  const [bioRhythms, setBioRhythms] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
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
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Field Details</Text>
        <Text style={styles.headerSubtitle}>Cosmos · Earth · Body</Text>

        {/* Cosmos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>COSMOS</Text>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🌙</Text>
              <Text style={styles.cardTitle}>Lunar Phase</Text>
            </View>
            <Text style={styles.cardValue}>{ctx?.lunar.phase || 'Unknown'}</Text>
            <Text style={styles.cardDetail}>
              {Math.round(ctx?.lunar.illumination || 0)}% Illumination
            </Text>
            <Text style={styles.cardMessage}>{ctx?.lunar.message}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>☀️</Text>
              <Text style={styles.cardTitle}>Solar Cycle</Text>
            </View>
            <Text style={styles.cardValue}>{ctx?.solar.phase || 'Day'}</Text>
            <Text style={styles.cardMessage}>{ctx?.solar.message}</Text>
          </View>
        </View>

        {/* Earth Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>EARTH</Text>
          
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.cardTitle}>Geomagnetic</Text>
              <Text style={styles.cardValue}>{ctx?.geomagnetic?.activity || 'Quiet'}</Text>
              <Text style={styles.cardDetail}>Kp Index: {ctx?.geomagnetic?.kp_index || 2}</Text>
            </View>

            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.cardTitle}>Global Coherence</Text>
              <Text style={styles.cardValue}>{Math.round(ctx?.consciousness_index.global_coherence || 0)}%</Text>
              <Text style={styles.cardDetail}>Trend: {ctx?.consciousness_index.trend || 'Stable'}</Text>
            </View>
          </View>
        </View>

        {/* Body Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>BODY</Text>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🧬</Text>
              <Text style={styles.cardTitle}>Biological Rhythms</Text>
            </View>
            
            {bioRhythms ? (
              <>
                <Text style={styles.cardValue}>{bioRhythms.circadian?.phase || 'Balanced'}</Text>
                <Text style={styles.cardMessage}>{bioRhythms.circadian?.description}</Text>
                
                <View style={styles.divider} />
                
                <Text style={styles.subTitle}>Optimal Timing</Text>
                {bioRhythms.recommendations?.map((rec: string, i: number) => (
                  <Text key={i} style={styles.bulletPoint}>• {rec}</Text>
                ))}
              </>
            ) : (
              <Text style={styles.cardMessage}>Aligning biological data...</Text>
            )}
          </View>
        </View>

        {/* Signals */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>INPUT SIGNALS</Text>
          <Text style={styles.signalsText}>
            Generated using real-time data from NOAA, NASA, and global consciousness monitoring stations.
          </Text>
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
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
    marginBottom: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  cardDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  cardMessage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
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
  },
  signalsText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    lineHeight: 18,
  },
});
