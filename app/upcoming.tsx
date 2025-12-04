import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';
import contentService from '../lib/ContentService';
import { cleanTone, getCategoryLabel, formatOrigin } from '../lib/labelize';
import { Clock, Moon, Leaf, Sparkles, Globe, Star } from 'lucide-react-native';

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

// --- Fallback Data (includes diverse cultural/religious/pagan/indigenous observances) ---

const year = new Date().getFullYear();
const nextYear = year + 1;

const CORE_DATES = [
  // December events
  { id: 'winter-solstice', name: 'Winter Solstice', date: new Date(year, 11, 21), category: 'natural', origin: 'Global', description: 'The shortest day, a threshold between darkness and returning light.' },
  { id: 'yule', name: 'Yule', date: new Date(year, 11, 21), category: 'pagan', origin: 'Nordic · Celtic', description: 'Ancient festival of light and renewal at the darkest point of the year.' },
  { id: 'christmas', name: 'Christmas', date: new Date(year, 11, 25), category: 'religious', origin: 'Christian', description: 'Celebration of light, generosity, and gathering.' },
  { id: 'kwanzaa-start', name: 'Kwanzaa', date: new Date(year, 11, 26), category: 'cultural', origin: 'African American', description: 'Seven-day celebration of African heritage and unity.' },
  { id: 'new-year', name: 'New Year', date: new Date(nextYear, 0, 1), category: 'cultural', origin: 'Global', description: 'A fresh cycle begins, inviting reflection and intention.' },
  
  // January/February events
  { id: 'epiphany', name: 'Epiphany', date: new Date(nextYear, 0, 6), category: 'religious', origin: 'Christian', description: 'Celebration of revelation and light.' },
  { id: 'makar-sankranti', name: 'Makar Sankranti', date: new Date(nextYear, 0, 14), category: 'religious', origin: 'Hindu', description: 'Harvest festival marking the sun\'s journey northward.' },
  { id: 'lunar-new-year', name: 'Lunar New Year', date: new Date(nextYear, 0, 29), category: 'cultural', origin: 'East Asian', description: 'Celebrated across East Asia, marking a new lunar cycle.' },
  { id: 'imbolc', name: 'Imbolc', date: new Date(nextYear, 1, 1), category: 'pagan', origin: 'Celtic', description: 'Festival marking the first stirrings of spring and the goddess Brigid.' },
  { id: 'candlemas', name: 'Candlemas', date: new Date(nextYear, 1, 2), category: 'religious', origin: 'Christian', description: 'Feast of light and purification.' },
  
  // Spring events
  { id: 'mardi-gras', name: 'Mardi Gras', date: new Date(nextYear, 2, 4), category: 'cultural', origin: 'Global', description: 'Carnival celebration before the Lenten season.' },
  { id: 'holi', name: 'Holi', date: new Date(nextYear, 2, 14), category: 'religious', origin: 'Hindu', description: 'Festival of colors celebrating spring and love.' },
  { id: 'spring-equinox', name: 'Spring Equinox', date: new Date(nextYear, 2, 20), category: 'natural', origin: 'Global', description: 'Day and night in balance, a threshold into the light half of the year.' },
  { id: 'ostara', name: 'Ostara', date: new Date(nextYear, 2, 20), category: 'pagan', origin: 'Germanic', description: 'Spring festival of renewal, fertility, and new beginnings.' },
  { id: 'nowruz', name: 'Nowruz', date: new Date(nextYear, 2, 20), category: 'cultural', origin: 'Persian · Central Asian', description: 'Persian New Year celebrating the arrival of spring.' },
  
  // More observances
  { id: 'beltane', name: 'Beltane', date: new Date(nextYear, 4, 1), category: 'pagan', origin: 'Celtic', description: 'Fire festival celebrating the height of spring and fertility.' },
  { id: 'vesak', name: 'Vesak', date: new Date(nextYear, 4, 12), category: 'religious', origin: 'Buddhist', description: 'Celebration of Buddha\'s birth, enlightenment, and passing.' },
  { id: 'summer-solstice', name: 'Summer Solstice', date: new Date(nextYear, 5, 21), category: 'natural', origin: 'Global', description: 'The longest day, peak of solar energy.' },
  { id: 'litha', name: 'Litha', date: new Date(nextYear, 5, 21), category: 'pagan', origin: 'Celtic', description: 'Midsummer celebration of light and abundance.' },
  { id: 'lammas', name: 'Lammas', date: new Date(nextYear, 7, 1), category: 'pagan', origin: 'Celtic', description: 'First harvest festival, giving thanks for grain.' },
  { id: 'autumn-equinox', name: 'Autumn Equinox', date: new Date(nextYear, 8, 22), category: 'natural', origin: 'Global', description: 'Balance point before descending into the dark half of the year.' },
  { id: 'mabon', name: 'Mabon', date: new Date(nextYear, 8, 22), category: 'pagan', origin: 'Celtic', description: 'Second harvest, thanksgiving for abundance.' },
  { id: 'diwali', name: 'Diwali', date: new Date(nextYear, 9, 20), category: 'religious', origin: 'Hindu · Jain · Sikh', description: 'Festival of lights celebrating the triumph of light over darkness.' },
  { id: 'samhain', name: 'Samhain', date: new Date(nextYear, 9, 31), category: 'pagan', origin: 'Celtic', description: 'The veil between worlds thins; honoring ancestors.' },
  { id: 'day-of-dead', name: 'Día de los Muertos', date: new Date(nextYear, 10, 1), category: 'cultural', origin: 'Mexican', description: 'Honoring deceased loved ones with offerings and celebration.' },
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

function EventCard({ event }: { event: any }) {
  const { colors } = useTheme();
  
  // Handle date formatting
  const eventDate = event.date ? new Date(event.date) : new Date();
  const daysUntil = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  
  // Get category color
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'pagan': return '#9b59b6';
      case 'religious': return '#3498db';
      case 'natural': return '#27ae60';
      case 'indigenous': return '#e67e22';
      default: return colors.accent;
    }
  };
  
  return (
    <View style={styles.eventRow}>
      <View style={[styles.eventDate, { backgroundColor: colors.surfaceHighlight }]}>
        <Text style={[styles.eventDateDay, { color: colors.text }]}>{eventDate.getDate()}</Text>
        <Text style={[styles.eventDateMonth, { color: colors.textSecondary }]}>{eventDate.toLocaleDateString(undefined, { month: 'short' })}</Text>
      </View>
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventName, { color: colors.text }]}>{event.name}</Text>
          {event.origin && (
            <View style={[styles.originBadge, { backgroundColor: getCategoryColor(event.displayCategory) + '20' }]}>
              <Text style={[styles.originBadgeText, { color: getCategoryColor(event.displayCategory) }]}>
                {event.origin}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.eventDesc, { color: colors.textTertiary }]}>{event.description}</Text>
      </View>
      <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{daysUntil <= 0 ? 'Today' : `${daysUntil}d`}</Text>
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
        // Use ContentService for merged events (includes caching)
        const apiEvents = await contentService.getMergedUpcomingEvents(90, language);
        
        // Always include CORE_DATES + API events
        // Map categories: pagan/religious/natural → cultural for filtering
        const normalizeCategory = (cat: string) => {
          if (['pagan', 'religious', 'natural', 'indigenous'].includes(cat)) {
            return 'cultural';
          }
          return cat === 'astronomical' ? 'astronomical' : 'cultural';
        };
        
        const allEvents = [
          ...CORE_DATES.map(e => ({ 
            ...e, 
            displayCategory: e.category,
            category: normalizeCategory(e.category)
          })),
          ...apiEvents.map(e => ({ 
            ...e, 
            displayCategory: e.category,
            category: normalizeCategory(e.category || 'cultural'),
            description: cleanTone(e.description || e.summary || '')
          }))
        ];
        
        // Deduplicate by name (keep first occurrence)
        const seen = new Set<string>();
        const deduped = allEvents.filter(e => {
          const key = e.name?.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        
        console.log('📊 Merged events:', deduped.length);
        setEvents(deduped);
      } catch (e) {
        console.error('Error loading events:', e);
        // Use CORE_DATES as fallback
        setEvents(CORE_DATES.map(e => ({ ...e, category: 'cultural' })));
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
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>TIMING WINDOWS</Text>
            {bucketedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'cycle' && (
          <View style={styles.bandContent}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>LUNAR & PLANETARY MILESTONES</Text>
            {bucketedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'season' && (
          <View style={styles.bandContent}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>SEASONAL TURNING POINTS</Text>
            {bucketedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 1,
    marginBottom: 16,
    marginHorizontal: 20,
    textTransform: 'uppercase',
  },
  // Unified Event Cards
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  eventDate: {
    width: 56,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  eventDateDay: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  eventDateMonth: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: 8,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
  },
  eventDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 18,
  },
  eventTime: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  originBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  originBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
