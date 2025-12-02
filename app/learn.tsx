import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import api from '../lib/api';

export default function LearnScreen() {
  const { coordinates, timezone } = useLocation();
  const [calendars, setCalendars] = useState<any>(null);
  const [culture, setCulture] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [calData, cultureData] = await Promise.all([
          api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone)
            .catch(() => null),
          api.getCulturalContent(5)
            .catch(() => [])
        ]);

        setCalendars(calData);
        setCulture(cultureData);
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Learn</Text>
        <Text style={styles.headerSubtitle}>Calendars & Culture</Text>

        {/* Calendar Gallery */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CALENDAR SYSTEMS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {calendars && Object.entries(calendars).map(([key, val]: [string, any]) => (
              <View key={key} style={styles.calendarCard}>
                <Text style={styles.calName}>{key}</Text>
                <View style={styles.calDetails}>
                  {key === 'mayan' && (
                    <>
                      <Text style={styles.calDate}>{val.tzolkin?.dayNumber} {val.tzolkin?.dayName}</Text>
                      <Text style={styles.calMeaning}>{val.tzolkin?.meaning}</Text>
                    </>
                  )}
                  {key === 'chinese' && (
                    <>
                      <Text style={styles.calDate}>{val.year} Year</Text>
                      <Text style={styles.calMeaning}>{val.element} Element</Text>
                    </>
                  )}
                  {key === 'hebrew' && (
                    <Text style={styles.calDate}>{val.day} {val.month}, {val.year}</Text>
                  )}
                  {key === 'islamic' && (
                    <Text style={styles.calDate}>{val.day} {val.month}, {val.year}</Text>
                  )}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Artifact of the Day */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ARTIFACT OF THE DAY</Text>
          {culture.length > 0 ? (
            <View style={styles.artifactCard}>
              <View style={styles.artifactHeader}>
                <Text style={styles.artifactType}>Wisdom</Text>
                <Text style={styles.artifactRegion}>{culture[0].region}</Text>
              </View>
              <Text style={styles.artifactTitle}>{culture[0].title}</Text>
              <Text style={styles.artifactSummary}>{culture[0].summary}</Text>
              <View style={styles.tags}>
                {culture[0].themes?.map((tag: string, i: number) => (
                  <View key={i} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Discovering cultural artifacts...</Text>
            </View>
          )}
        </View>

        {/* Living Calendar */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>LIVING CALENDAR</Text>
          <View style={styles.livingCard}>
            <Text style={styles.livingTitle}>Seasonal Pattern</Text>
            <Text style={styles.livingText}>
              Observe the changes in light as we approach the next solar turning point. 
              Nature is shifting gears.
            </Text>
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
  horizontalScroll: {
    gap: 12,
  },
  calendarCard: {
    width: 160,
    height: 140,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  calName: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  calDetails: {
    gap: 4,
  },
  calDate: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  calMeaning: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  artifactCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  artifactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  artifactType: {
    fontSize: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
  },
  artifactRegion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  artifactTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    lineHeight: 28,
  },
  artifactSummary: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    marginBottom: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyCard: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
  },
  livingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  livingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  livingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
});
