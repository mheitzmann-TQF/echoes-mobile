import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import api from '../lib/api';
import { Clock, Moon, Leaf } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type Band = 'soon' | 'cycle' | 'season';

// --- Utility Functions ---

function getDateRange(band: Band): { start: Date; end: Date; label: string } {
  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);

  if (band === 'soon') {
    end.setHours(now.getHours() + 48);
    return { start, end, label: 'Next 48 hours' };
  } else if (band === 'cycle') {
    end.setDate(now.getDate() + 14);
    return { start, end, label: 'Next 14 days' };
  } else {
    end.setDate(now.getDate() + 90);
    return { start, end, label: 'Next 90 days' };
  }
}

function timeUntil(date: Date): string {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (hours < 1) return 'Now';
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
}

// --- Fallback Data ---

const FALLBACK_SOON = [
  { id: 'soon-1', name: 'Twilight Window', time: '18:00', description: 'Day-night threshold', daysUntil: 0 },
  { id: 'soon-2', name: 'Midnight Point', time: '00:00', description: 'Deep night anchor', daysUntil: 0.5 },
];

const FALLBACK_CYCLE = [
  { id: 'cycle-1', name: 'First Quarter Moon', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), description: 'Building lunar energy', significance: 'Major' },
  { id: 'cycle-2', name: 'Mercury Direct', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), description: 'Communication clears', significance: 'Moderate' },
  { id: 'cycle-3', name: 'Venus Alignment', date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), description: 'Relational harmony', significance: 'Minor' },
];

const FALLBACK_SEASON = [
  { id: 'season-1', name: 'Winter Solstice Approach', date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), description: 'Shortest day approaches—time to nest and reflect.', daysUntil: 20 },
  { id: 'season-2', name: 'New Moon Cycle', date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), description: 'New beginnings emerge from darkness.', daysUntil: 45 },
  { id: 'season-3', name: 'Turning Point Window', date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), description: 'Energy shifts into new terrain.', daysUntil: 75 },
];

// --- Components ---

function SegmentedControl({ value, onChange }: { value: Band; onChange: (band: Band) => void }) {
  return (
    <View style={styles.segmentedControl}>
      {(['soon', 'cycle', 'season'] as Band[]).map((band) => (
        <TouchableOpacity
          key={band}
          style={[styles.segment, value === band && styles.segmentActive]}
          onPress={() => onChange(band)}
        >
          <Text style={[styles.segmentText, value === band && styles.segmentTextActive]}>
            {band === 'soon' ? 'Soon' : band === 'cycle' ? 'Cycle' : 'Season'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CountdownCard({ event }: { event: any }) {
  return (
    <View style={styles.countdownCard}>
      <View style={styles.countdownHeader}>
        <Clock size={20} color="#FFFFFF" />
        <Text style={styles.countdownTime}>{event.time}</Text>
      </View>
      <Text style={styles.countdownTitle}>{event.name}</Text>
      <Text style={styles.countdownDesc}>{event.description}</Text>
    </View>
  );
}

function CycleEventRow({ event }: { event: any }) {
  const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <View style={styles.cycleRow}>
      <View style={styles.cycleDate}>
        <Text style={styles.cycleDateDay}>{event.date.getDate()}</Text>
        <Text style={styles.cycleDateMonth}>{event.date.toLocaleDateString(undefined, { month: 'short' })}</Text>
      </View>
      <View style={styles.cycleContent}>
        <View style={styles.cycleHeader}>
          <Text style={styles.cycleName}>{event.name}</Text>
          <View style={[styles.cycleTag, event.significance === 'Major' && styles.cycleTagMajor]}>
            <Text style={styles.cycleTagText}>{event.significance || 'Event'}</Text>
          </View>
        </View>
        <Text style={styles.cycleDesc}>{event.description}</Text>
      </View>
      <Text style={styles.cycleDays}>{daysUntil === 0 ? 'Today' : `${daysUntil}d`}</Text>
    </View>
  );
}

function SeasonCard({ event }: { event: any }) {
  return (
    <View style={styles.seasonCard}>
      <View style={styles.seasonHeader}>
        <View style={styles.seasonIcon}>
          <Leaf size={20} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.seasonTitle}>{event.name}</Text>
          <Text style={styles.seasonDays}>{event.daysUntil} days away</Text>
        </View>
      </View>
      <Text style={styles.seasonDesc}>{event.description}</Text>
    </View>
  );
}

// --- Main Screen ---

export default function UpcomingScreen() {
  const { coordinates, timezone } = useLocation();
  const [band, setBand] = useState<Band>('soon');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        // Fetch more events to have enough for bucketing
        const data = await api.getPlanetaryEvents(50).catch(() => []);
        setEvents(data.length > 0 ? data : []);
      } catch (e) {
        console.error('Error loading events:', e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  // Bucket events by date range
  const bucketedEvents = useMemo(() => {
    const { start, end } = getDateRange(band);

    const filtered = events.filter(e => {
      const eventDate = new Date(e.date || e.timestamp);
      return eventDate >= start && eventDate <= end;
    });

    if (band === 'soon') {
      return filtered.length > 0 ? filtered : FALLBACK_SOON;
    } else if (band === 'cycle') {
      return filtered.length > 0 ? filtered : FALLBACK_CYCLE;
    } else {
      return filtered.length > 0 ? filtered : FALLBACK_SEASON;
    }
  }, [events, band]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  const { label } = getDateRange(band);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Upcoming</Text>
          <Text style={styles.headerLabel}>{label}</Text>
        </View>

        {/* Segmented Control */}
        <SegmentedControl value={band} onChange={setBand} />

        {/* Content by Band */}
        {band === 'soon' && (
          <View style={styles.bandContent}>
            <Text style={styles.bandLabel}>TIMING WINDOWS</Text>
            {bucketedEvents.map((event) => (
              <CountdownCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'cycle' && (
          <View style={styles.bandContent}>
            <Text style={styles.bandLabel}>LUNAR & PLANETARY MILESTONES</Text>
            {bucketedEvents.map((event) => (
              <CycleEventRow key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'season' && (
          <View style={styles.bandContent}>
            <Text style={styles.bandLabel}>SEASONAL TURNING POINTS</Text>
            {bucketedEvents.map((event) => (
              <SeasonCard key={event.id} event={event} />
            ))}
          </View>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  // Segmented Control
  segmentedControl: {
    marginHorizontal: 20,
    marginBottom: 32,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  // Band Content
  bandContent: {
    paddingHorizontal: 20,
  },
  bandLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  // Countdown Cards (Soon)
  countdownCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  countdownTime: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  countdownTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  countdownDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 20,
  },
  // Cycle Event Rows
  cycleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  cycleDate: {
    width: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  cycleDateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cycleDateMonth: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  cycleContent: {
    flex: 1,
  },
  cycleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  cycleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  cycleTag: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cycleTagMajor: {
    backgroundColor: 'rgba(255,200,100,0.2)',
  },
  cycleTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  cycleDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  cycleDays: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  // Season Cards
  seasonCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  seasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  seasonIcon: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  seasonDays: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  seasonDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 22,
    marginLeft: 58,
  },
});
