import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';
import api from '../lib/api';
import { Clock, Moon, Leaf, Sparkles } from 'lucide-react-native';

const { width } = Dimensions.get('window');

type Band = 'soon' | 'cycle' | 'season';
type Category = 'all' | 'astronomical' | 'cultural';

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

// Core cultural dates for fallback
const CORE_DATES = [
  { id: 'core-christmas', name: 'Christmas', date: new Date(new Date().getFullYear(), 11, 25), category: 'cultural', description: 'Winter solstice celebration' },
  { id: 'core-newyear', name: 'New Year', date: new Date(new Date().getFullYear() + 1, 0, 1), category: 'cultural', description: 'Fresh cycle begins' },
  { id: 'core-halloween', name: 'Halloween', date: new Date(new Date().getFullYear(), 9, 31), category: 'cultural', description: 'Veil between worlds thins' },
  { id: 'core-summer', name: 'Summer Solstice', date: new Date(new Date().getFullYear(), 5, 20), category: 'astronomical', description: 'Peak solar energy' },
  { id: 'core-thanksgiving', name: 'Thanksgiving', date: new Date(new Date().getFullYear(), 10, 28), category: 'cultural', description: 'Gathering of gratitude' },
];

const FALLBACK_SOON = [
  { id: 'soon-1', name: 'Twilight Window', time: '18:00', description: 'Day-night threshold', category: 'astronomical', daysUntil: 0 },
  { id: 'soon-2', name: 'Midnight Point', time: '00:00', description: 'Deep night anchor', category: 'astronomical', daysUntil: 0.5 },
];

const FALLBACK_CYCLE = [
  { id: 'cycle-1', name: 'First Quarter Moon', date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), description: 'Building lunar energy', significance: 'Major', category: 'astronomical' },
  { id: 'cycle-2', name: 'Mercury Direct', date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), description: 'Communication clears', significance: 'Moderate', category: 'astronomical' },
  { id: 'cycle-3', name: 'Venus Alignment', date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), description: 'Relational harmony', significance: 'Minor', category: 'astronomical' },
];

const FALLBACK_SEASON = [
  { id: 'season-1', name: 'Winter Solstice Approach', date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), description: 'Shortest day approaches—time to nest and reflect.', category: 'astronomical', daysUntil: 20 },
  { id: 'season-2', name: 'New Moon Cycle', date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), description: 'New beginnings emerge from darkness.', category: 'astronomical', daysUntil: 45 },
  { id: 'season-3', name: 'Turning Point Window', date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), description: 'Energy shifts into new terrain.', category: 'astronomical', daysUntil: 75 },
];

// --- Components ---

function BandControl({ value, onChange }: { value: Band; onChange: (band: Band) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bandControl, { backgroundColor: colors.surface }]}>
      {(['soon', 'cycle', 'season'] as Band[]).map((band) => (
        <TouchableOpacity
          key={band}
          style={[
            styles.bandSegment, 
            value === band && { backgroundColor: colors.surfaceHighlight }
          ]}
          onPress={() => onChange(band)}
        >
          <Text style={[
            styles.bandSegmentText, 
            { color: colors.textSecondary },
            value === band && { color: colors.text, fontWeight: '700' }
          ]}>
            {band === 'soon' ? 'Soon' : band === 'cycle' ? 'Cycle' : 'Season'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CategoryFilter({ value, onChange }: { value: Category; onChange: (cat: Category) => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.categoryFilter}>
      {(['all', 'astronomical', 'cultural'] as Category[]).map((cat) => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryChip, 
            { backgroundColor: colors.surface, borderColor: colors.border },
            value === cat && { backgroundColor: colors.surfaceHighlight, borderColor: colors.textTertiary }
          ]}
          onPress={() => onChange(cat)}
        >
          <Text style={[
            styles.categoryChipText, 
            { color: colors.textSecondary },
            value === cat && { color: colors.text }
          ]}>
            {cat === 'all' ? 'All' : cat === 'astronomical' ? 'Astronomical' : 'Cultural'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CountdownCard({ event }: { event: any }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.countdownCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
      <View style={styles.countdownHeader}>
        <Clock size={20} color={colors.text} />
        <Text style={[styles.countdownTime, { color: colors.text }]}>{event.time}</Text>
      </View>
      <Text style={[styles.countdownTitle, { color: colors.text }]}>{event.name}</Text>
      <Text style={[styles.countdownDesc, { color: colors.textSecondary }]}>{event.description}</Text>
    </View>
  );
}

function CycleEventRow({ event }: { event: any }) {
  const daysUntil = Math.ceil((new Date(event.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const { colors } = useTheme();
  
  return (
    <View style={styles.cycleRow}>
      <View style={[styles.cycleDate, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={[styles.cycleDateDay, { color: colors.text }]}>{event.date.getDate()}</Text>
        <Text style={[styles.cycleDateMonth, { color: colors.textSecondary }]}>{event.date.toLocaleDateString(undefined, { month: 'short' })}</Text>
      </View>
      <View style={styles.cycleContent}>
        <View style={styles.cycleHeader}>
          <Text style={[styles.cycleName, { color: colors.text }]}>{event.name}</Text>
          <View style={[
            styles.cycleTag, 
            { backgroundColor: colors.surface },
            event.significance === 'Major' && { backgroundColor: colors.accentSubtle }
          ]}>
            <Text style={[
              styles.cycleTagText, 
              { color: colors.textSecondary },
              event.significance === 'Major' && { color: colors.accent }
            ]}>{event.significance || 'Event'}</Text>
          </View>
        </View>
        <Text style={[styles.cycleDesc, { color: colors.textTertiary }]}>{event.description}</Text>
      </View>
      <Text style={[styles.cycleDays, { color: colors.textSecondary }]}>{daysUntil === 0 ? 'Today' : `${daysUntil}d`}</Text>
    </View>
  );
}

function SeasonCard({ event }: { event: any }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.seasonCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.seasonHeader}>
        <View style={[styles.seasonIcon, { backgroundColor: colors.surfaceHighlight }]}>
          <Leaf size={20} color={colors.text} />
        </View>
        <View>
          <Text style={[styles.seasonTitle, { color: colors.text }]}>{event.name}</Text>
          <Text style={[styles.seasonDays, { color: colors.textSecondary }]}>{event.daysUntil} days away</Text>
        </View>
      </View>
      <Text style={[styles.seasonDesc, { color: colors.textTertiary }]}>{event.description}</Text>
    </View>
  );
}

// --- Main Screen ---

export default function UpcomingScreen() {
  const { coordinates, timezone, language } = useLocation();
  const { colors } = useTheme();
  const [band, setBand] = useState<Band>('soon');
  const [category, setCategory] = useState<Category>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEvents() {
      try {
        const [planetaryData, importantData] = await Promise.all([
          api.getPlanetaryEvents(50, language).catch(() => []),
          api.getImportantDates(language).catch(() => [])
        ]);
        
        // Use fallback if fetches are empty
        const astronomicalEvents = planetaryData.length > 0 
          ? planetaryData 
          : FALLBACK_CYCLE;
        
        const culturalEvents = importantData.length > 0 
          ? importantData 
          : CORE_DATES;
        
        // Merge both feeds with proper category tagging
        const merged = [
          ...astronomicalEvents.map(e => ({ ...e, category: e.category || 'astronomical' })),
          ...culturalEvents.map(e => ({ ...e, category: e.category || 'cultural' }))
        ];
        
        console.log('📊 Merged events:', merged.length, 'astronomical:', astronomicalEvents.length, 'cultural:', culturalEvents.length);
        setEvents(merged);
      } catch (e) {
        console.error('Error loading events:', e);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [language]);

  // Bucket events by date range and filter by category
  const bucketedEvents = useMemo(() => {
    const { start, end } = getDateRange(band);

    let filtered = events.filter(e => {
      const eventDate = new Date(e.date || e.timestamp);
      const inRange = eventDate >= start && eventDate <= end;
      const matchesCategory = category === 'all' || e.category === category;
      return inRange && matchesCategory;
    });

    if (band === 'soon') {
      return filtered.length > 0 ? filtered : FALLBACK_SOON.filter(e => category === 'all' || e.category === category);
    } else if (band === 'cycle') {
      return filtered.length > 0 ? filtered : FALLBACK_CYCLE.filter(e => category === 'all' || e.category === category);
    } else {
      return filtered.length > 0 ? filtered : FALLBACK_SEASON.filter(e => category === 'all' || e.category === category);
    }
  }, [events, band, category]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  const { label } = getDateRange(band);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Upcoming</Text>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>{label}</Text>
        </View>

        {/* Band Control */}
        <BandControl value={band} onChange={setBand} />

        {/* Category Filter */}
        <CategoryFilter value={category} onChange={setCategory} />

        {/* Content by Band */}
        {band === 'soon' && (
          <View style={styles.bandContent}>
            <Text style={[styles.bandLabel, { color: colors.textTertiary }]}>TIMING WINDOWS</Text>
            {bucketedEvents.map((event) => (
              <CountdownCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'cycle' && (
          <View style={styles.bandContent}>
            <Text style={[styles.bandLabel, { color: colors.textTertiary }]}>LUNAR & PLANETARY MILESTONES</Text>
            {bucketedEvents.map((event) => (
              <CycleEventRow key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'season' && (
          <View style={styles.bandContent}>
            <Text style={[styles.bandLabel, { color: colors.textTertiary }]}>SEASONAL TURNING POINTS</Text>
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
  // Band Control
  bandControl: {
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  bandSegment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  bandSegmentActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  bandSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  bandSegmentTextActive: {
    color: '#FFFFFF',
  },
  // Category Filter
  categoryFilter: {
    marginHorizontal: 20,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  categoryChipActive: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  categoryChipTextActive: {
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
