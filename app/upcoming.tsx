import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../lib/api';

export default function UpcomingScreen() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getPlanetaryEvents(10);
        setEvents(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  const nextMajorEvent = events.find(e => e.significance?.includes('Major')) || events[0];
  const otherEvents = events.filter(e => e.id !== nextMajorEvent?.id);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>Upcoming</Text>
        <Text style={styles.headerSubtitle}>Events & Moments</Text>

        {/* Featured Event */}
        {nextMajorEvent && (
          <View style={styles.featuredCard}>
            <Text style={styles.featuredLabel}>NEXT MAJOR ALIGNMENT</Text>
            <Text style={styles.featuredDate}>{new Date(nextMajorEvent.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</Text>
            <Text style={styles.featuredTitle}>{nextMajorEvent.name}</Text>
            <Text style={styles.featuredDesc}>{nextMajorEvent.description}</Text>
            <Text style={styles.featuredSig}>{nextMajorEvent.significance}</Text>
          </View>
        )}

        {/* Next 7 Days */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NEXT 7 DAYS</Text>
          {otherEvents.length > 0 ? (
            otherEvents.map((event) => (
              <View key={event.id} style={styles.eventRow}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateDay}>{new Date(event.date).getDate()}</Text>
                  <Text style={styles.dateMonth}>{new Date(event.date).toLocaleDateString(undefined, { month: 'short' })}</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventName}>{event.name}</Text>
                  <Text style={styles.eventDesc}>{event.description}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No other upcoming events found.</Text>
          )}
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
  featuredCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    marginBottom: 40,
  },
  featuredLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.5)',
    marginBottom: 12,
    letterSpacing: 1,
  },
  featuredDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  featuredTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 12,
    lineHeight: 36,
  },
  featuredDesc: {
    fontSize: 16,
    color: 'rgba(0,0,0,0.7)',
    marginBottom: 8,
    lineHeight: 22,
  },
  featuredSig: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
    letterSpacing: 1,
  },
  eventRow: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'center',
  },
  dateBox: {
    width: 50,
    alignItems: 'center',
    marginRight: 16,
  },
  dateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dateMonth: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  eventInfo: {
    flex: 1,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
  },
});
