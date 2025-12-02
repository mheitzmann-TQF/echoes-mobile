import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api, { ConsciousnessData } from '../lib/api';
import { useLocation } from '../lib/LocationContext';

export default function GlobalScreen() {
  const { location } = useLocation();
  const [consciousness, setConsciousness] = useState<ConsciousnessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getMockConsciousness = (locationName: string = 'New York'): ConsciousnessData => ({
    rawCoherence: 72,
    filteredCoherence: 68,
    transformationalContent: 85,
    destructiveContent: 12,
    hopeLevel: 79,
    dominantEmotions: ['compassion', 'unity', 'awakening'],
  });

  const fetchData = useCallback(async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('API timeout')), 3000)
      );

      const data = await Promise.race([
        api.getConsciousnessAnalysis({ lat: location.lat, lng: location.lng }),
        timeoutPromise,
      ]) as ConsciousnessData;

      setConsciousness(data);
    } catch (error) {
      console.error('Failed to fetch consciousness data, using fallback:', error);
      setConsciousness(getMockConsciousness(location.name));
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
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Reading global consciousness...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
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
          <Text style={styles.title}>Global Consciousness</Text>
          <Text style={styles.subtitle}>Real-time collective awareness</Text>
        </View>

        {consciousness && (
          <>
            <View style={styles.mainMetric}>
              <Text style={styles.coherenceValue}>
                {Math.round(consciousness.filteredCoherence)}%
              </Text>
              <Text style={styles.coherenceLabel}>Coherence Level</Text>
              <View style={styles.coherenceBar}>
                <View
                  style={[
                    styles.coherenceFill,
                    { width: `${consciousness.filteredCoherence}%` },
                  ]}
                />
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>🌱</Text>
                <Text style={styles.metricValue}>
                  {consciousness.transformationalContent}%
                </Text>
                <Text style={styles.metricLabel}>Transformational</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>💚</Text>
                <Text style={styles.metricValue}>{consciousness.hopeLevel}%</Text>
                <Text style={styles.metricLabel}>Hope Level</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>⚡</Text>
                <Text style={styles.metricValue}>
                  {Math.round(consciousness.rawCoherence)}%
                </Text>
                <Text style={styles.metricLabel}>Raw Signal</Text>
              </View>

              <View style={styles.metricCard}>
                <Text style={styles.metricEmoji}>🛡️</Text>
                <Text style={styles.metricValue}>
                  {100 - consciousness.destructiveContent}%
                </Text>
                <Text style={styles.metricLabel}>Constructive</Text>
              </View>
            </View>

            <View style={styles.emotionsSection}>
              <Text style={styles.sectionTitle}>Dominant Themes</Text>
              <View style={styles.emotionTags}>
                {consciousness.dominantEmotions.map((emotion, index) => (
                  <View key={index} style={styles.emotionTag}>
                    <Text style={styles.emotionText}>{emotion}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Current Field Reading</Text>
              <Text style={styles.insightText}>
                Global consciousness shows {consciousness.filteredCoherence > 70 ? 'elevated' : 'stable'}{' '}
                coherence with {consciousness.transformationalContent}% transformational content.
                The collective field is {consciousness.hopeLevel > 60 ? 'hopeful' : 'contemplative'} and
                oriented toward growth.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  mainMetric: {
    alignItems: 'center',
    marginBottom: 32,
    padding: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
  },
  coherenceValue: {
    fontSize: 72,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  coherenceLabel: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 8,
  },
  coherenceBar: {
    width: '100%',
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
    marginTop: 20,
    overflow: 'hidden',
  },
  coherenceFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 32,
  },
  metricCard: {
    width: '47%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  metricEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  metricLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  emotionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  emotionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emotionTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emotionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  insightText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
});
