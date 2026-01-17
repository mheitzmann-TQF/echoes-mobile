import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import contentService from '../lib/ContentService';
import { cleanTone, getCategoryLabel, formatOrigin } from '../lib/labelize';
import { Clock, Moon, Leaf, Sparkles, Globe, Star } from 'lucide-react-native';
import { useEntitlement } from '../lib/iap/useEntitlement';
import PausedOverlay from '../components/PausedOverlay';
import { getApiLang } from '../lib/lang';

const { width } = Dimensions.get('window');

type Band = 'soon' | 'cycle' | 'season';
type Category = 'all' | 'astronomical' | 'cultural';

// --- Utility Functions ---

function getDateRange(band: Band): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now);
  let end = new Date(now);

  if (band === 'soon') {
    end.setDate(now.getDate() + 14);
  } else if (band === 'cycle') {
    end.setDate(now.getDate() + 30);
  } else {
    end.setDate(now.getDate() + 90);
  }
  return { start, end };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' });
}

// --- Fallback Data (includes diverse cultural/religious/pagan/indigenous observances) ---

// Helper to get the next occurrence of a date (handles year rollover)
function getNextOccurrence(month: number, day: number): Date {
  const now = new Date();
  const thisYear = now.getFullYear();
  const dateThisYear = new Date(thisYear, month, day);
  
  // If the date has passed this year, use next year
  if (dateThisYear < now) {
    return new Date(thisYear + 1, month, day);
  }
  return dateThisYear;
}

const CORE_DATES = [
  // Winter/Year-end events
  { id: 'epiphany', name: 'Epiphany', date: getNextOccurrence(0, 6), category: 'religious', origin: 'Christian', description: 'Celebration of revelation and light.' },
  { id: 'makar-sankranti', name: 'Makar Sankranti', date: getNextOccurrence(0, 14), category: 'religious', origin: 'Hindu', description: 'Harvest festival marking the sun\'s journey northward.' },
  { id: 'lunar-new-year', name: 'Lunar New Year', date: getNextOccurrence(0, 29), category: 'cultural', origin: 'East Asian', description: 'Celebrated across East Asia, marking a new lunar cycle.' },
  { id: 'imbolc', name: 'Imbolc', date: getNextOccurrence(1, 1), category: 'pagan', origin: 'Celtic', description: 'Festival marking the first stirrings of spring and the goddess Brigid.' },
  { id: 'candlemas', name: 'Candlemas', date: getNextOccurrence(1, 2), category: 'religious', origin: 'Christian', description: 'Feast of light and purification.' },
  { id: 'valentines', name: 'Valentine\'s Day', date: getNextOccurrence(1, 14), category: 'cultural', origin: 'Global', description: 'Day of love, affection, and connection.' },
  
  // Spring events
  { id: 'mardi-gras', name: 'Mardi Gras', date: getNextOccurrence(2, 4), category: 'cultural', origin: 'Global', description: 'Carnival celebration before the Lenten season.' },
  { id: 'holi', name: 'Holi', date: getNextOccurrence(2, 14), category: 'religious', origin: 'Hindu', description: 'Festival of colors celebrating spring and love.' },
  { id: 'spring-equinox', name: 'Spring Equinox', date: getNextOccurrence(2, 20), category: 'natural', origin: 'Global', description: 'Day and night in balance, a threshold into the light half of the year.' },
  { id: 'ostara', name: 'Ostara', date: getNextOccurrence(2, 20), category: 'pagan', origin: 'Germanic', description: 'Spring festival of renewal, fertility, and new beginnings.' },
  { id: 'nowruz', name: 'Nowruz', date: getNextOccurrence(2, 20), category: 'cultural', origin: 'Persian · Central Asian', description: 'Persian New Year celebrating the arrival of spring.' },
  { id: 'easter', name: 'Easter', date: getNextOccurrence(3, 20), category: 'religious', origin: 'Christian', description: 'Celebration of resurrection and new life.' },
  { id: 'passover', name: 'Passover', date: getNextOccurrence(3, 12), category: 'religious', origin: 'Jewish', description: 'Festival of freedom commemorating the Exodus.' },
  { id: 'earth-day', name: 'Earth Day', date: getNextOccurrence(3, 22), category: 'cultural', origin: 'Global', description: 'Celebration of environmental awareness and protection.' },
  
  // Late Spring/Summer events  
  { id: 'beltane', name: 'Beltane', date: getNextOccurrence(4, 1), category: 'pagan', origin: 'Celtic', description: 'Fire festival celebrating the height of spring and fertility.' },
  { id: 'vesak', name: 'Vesak', date: getNextOccurrence(4, 12), category: 'religious', origin: 'Buddhist', description: 'Celebration of Buddha\'s birth, enlightenment, and passing.' },
  { id: 'summer-solstice', name: 'Summer Solstice', date: getNextOccurrence(5, 21), category: 'natural', origin: 'Global', description: 'The longest day, peak of solar energy.' },
  { id: 'litha', name: 'Litha', date: getNextOccurrence(5, 21), category: 'pagan', origin: 'Celtic', description: 'Midsummer celebration of light and abundance.' },
  
  // Autumn events
  { id: 'lammas', name: 'Lammas', date: getNextOccurrence(7, 1), category: 'pagan', origin: 'Celtic', description: 'First harvest festival, giving thanks for grain.' },
  { id: 'autumn-equinox', name: 'Autumn Equinox', date: getNextOccurrence(8, 22), category: 'natural', origin: 'Global', description: 'Balance point before descending into the dark half of the year.' },
  { id: 'mabon', name: 'Mabon', date: getNextOccurrence(8, 22), category: 'pagan', origin: 'Celtic', description: 'Second harvest, thanksgiving for abundance.' },
  { id: 'rosh-hashanah', name: 'Rosh Hashanah', date: getNextOccurrence(8, 15), category: 'religious', origin: 'Jewish', description: 'Jewish New Year, a time of reflection and renewal.' },
  { id: 'diwali', name: 'Diwali', date: getNextOccurrence(9, 20), category: 'religious', origin: 'Hindu · Jain · Sikh', description: 'Festival of lights celebrating the triumph of light over darkness.' },
  { id: 'samhain', name: 'Samhain', date: getNextOccurrence(9, 31), category: 'pagan', origin: 'Celtic', description: 'The veil between worlds thins; honoring ancestors.' },
  { id: 'day-of-dead', name: 'Día de los Muertos', date: getNextOccurrence(10, 1), category: 'cultural', origin: 'Mexican', description: 'Honoring deceased loved ones with offerings and celebration.' },
  { id: 'thanksgiving', name: 'Thanksgiving', date: getNextOccurrence(10, 28), category: 'cultural', origin: 'North American', description: 'Day of gratitude and gathering.' },
  
  // Winter events
  { id: 'winter-solstice', name: 'Winter Solstice', date: getNextOccurrence(11, 21), category: 'natural', origin: 'Global', description: 'The shortest day, a threshold between darkness and returning light.' },
  { id: 'yule', name: 'Yule', date: getNextOccurrence(11, 21), category: 'pagan', origin: 'Nordic · Celtic', description: 'Ancient festival of light and renewal at the darkest point of the year.' },
  { id: 'hanukkah', name: 'Hanukkah', date: getNextOccurrence(11, 25), category: 'religious', origin: 'Jewish', description: 'Festival of Lights celebrating dedication and miracles.' },
  { id: 'christmas', name: 'Christmas', date: getNextOccurrence(11, 25), category: 'religious', origin: 'Christian', description: 'Celebration of light, generosity, and gathering.' },
  { id: 'kwanzaa-start', name: 'Kwanzaa', date: getNextOccurrence(11, 26), category: 'cultural', origin: 'African American', description: 'Seven-day celebration of African heritage and unity.' },
  { id: 'new-year', name: 'New Year', date: getNextOccurrence(0, 1), category: 'cultural', origin: 'Global', description: 'A fresh cycle begins, inviting reflection and intention.' },
];

const getFallbackSoon = (t: any) => [
  { id: 'soon-1', name: t('upcoming.fallbackTwilightWindow'), time: '18:00', description: t('upcoming.fallbackTwilightWindowDesc'), category: 'astronomical', daysUntil: 0 },
  { id: 'soon-2', name: t('upcoming.fallbackMidnightPoint'), time: '00:00', description: t('upcoming.fallbackMidnightPointDesc'), category: 'astronomical', daysUntil: 0.5 },
];

const getFallbackCycle = (t: any) => [
  { id: 'cycle-1', name: t('upcoming.fallbackFirstQuarterMoon'), date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), description: t('upcoming.fallbackFirstQuarterMoonDesc'), significance: 'Major', category: 'astronomical' },
  { id: 'cycle-2', name: t('upcoming.fallbackMercuryDirect'), date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), description: t('upcoming.fallbackMercuryDirectDesc'), significance: 'Moderate', category: 'astronomical' },
  { id: 'cycle-3', name: t('upcoming.fallbackVenusAlignment'), date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), description: t('upcoming.fallbackVenusAlignmentDesc'), significance: 'Minor', category: 'astronomical' },
];

const getFallbackSeason = (t: any) => [
  { id: 'season-1', name: t('upcoming.fallbackWinterSolsticeApproach'), date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), description: t('upcoming.fallbackWinterSolsticeApproachDesc'), category: 'astronomical', daysUntil: 20 },
  { id: 'season-2', name: t('upcoming.fallbackNewMoonCycle'), date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), description: t('upcoming.fallbackNewMoonCycleDesc'), category: 'astronomical', daysUntil: 45 },
  { id: 'season-3', name: t('upcoming.fallbackTurningPointWindow'), date: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), description: t('upcoming.fallbackTurningPointWindowDesc'), category: 'astronomical', daysUntil: 75 },
];

// --- Components ---

function BandControl({ value, onChange }: { value: Band; onChange: (band: Band) => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
            {t(`upcoming.${band}`)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CategoryFilter({ value, onChange }: { value: Category; onChange: (cat: Category) => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const getCategoryAccent = (cat: Category) => {
    switch (cat) {
      case 'astronomical': return '#818CF8';
      case 'cultural': return '#F59E0B';
      case 'all': return '#10B981'; // Emerald green for "All"
      default: return colors.text;
    }
  };
  
  return (
    <View style={styles.categoryFilter}>
      {(['all', 'astronomical', 'cultural'] as Category[]).map((cat) => {
        const accent = getCategoryAccent(cat);
        const isSelected = value === cat;
        return (
          <TouchableOpacity
            key={cat}
            style={[
              styles.categoryChip, 
              { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 },
              isSelected && { backgroundColor: accent + '25', borderColor: accent, borderWidth: 2 }
            ]}
            onPress={() => onChange(cat)}
          >
            <Text style={[
              styles.categoryChipText, 
              { color: colors.textSecondary },
              isSelected && { color: accent, fontWeight: '700' }
            ]}>
              {cat === 'all' ? t('upcoming.all') : cat === 'astronomical' ? t('upcoming.astronomicalFilter') : t('upcoming.culturalFilter')}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function EventCard({ event }: { event: any }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  // Handle date formatting - parse fixedDate (MM-DD) or regular date
  const parseEventDate = (): Date => {
    // First check for fixedDate in "MM-DD" format (from API observances)
    if (event.fixedDate && typeof event.fixedDate === 'string') {
      const match = event.fixedDate.match(/^(\d{2})-(\d{2})$/);
      if (match) {
        const month = parseInt(match[1], 10) - 1; // 0-indexed month
        const day = parseInt(match[2], 10);
        const now = new Date();
        const thisYear = now.getFullYear();
        const dateThisYear = new Date(thisYear, month, day);
        // If the date has passed this year, use next year
        if (dateThisYear < now) {
          return new Date(thisYear + 1, month, day);
        }
        return dateThisYear;
      }
    }
    // Try parsing regular date field (check multiple possible field names)
    const raw = event.date || event.startDate || event.peakDate;
    if (raw) {
      const parsed = new Date(raw);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  };
  
  const eventDate = parseEventDate();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const eventDay = new Date(eventDate);
  eventDay.setHours(0, 0, 0, 0);
  const daysUntil = Math.ceil((eventDay.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Get category color
  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'astronomical': return '#818CF8';
      case 'pagan': return '#9b59b6';
      case 'religious': return '#3498db';
      case 'natural': return '#27ae60';
      case 'indigenous': return '#e67e22';
      case 'cultural': return '#F59E0B';
      default: return colors.accent;
    }
  };

  // Get translated time label
  const getTimeLabel = () => {
    if (daysUntil <= 0) return t('upcoming.today');
    if (daysUntil === 1) return t('upcoming.tomorrow');
    return t('upcoming.daysShort', { count: daysUntil });
  };
  
  const accentColor = getCategoryColor(event.displayCategory);
  
  return (
    <View style={[styles.eventRow, { borderLeftWidth: 3, borderLeftColor: accentColor }]}>
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
      <Text style={[styles.eventTime, { color: colors.textSecondary }]}>{getTimeLabel()}</Text>
    </View>
  );
}

// --- Main Screen ---

export default function UpcomingScreen() {
  const { coordinates, timezone, coordinateKey } = useLocation();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { isFullAccess, refresh } = useEntitlement();
  
  // Refresh entitlement when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  
  const [band, setBand] = useState<Band>('soon');
  const [category, setCategory] = useState<Category>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get translated date range label
  const getDateRangeLabel = (b: Band): string => {
    if (b === 'soon') return t('upcoming.next14Days');
    if (b === 'cycle') return t('upcoming.next30Days');
    return t('upcoming.next90Days');
  };

  useEffect(() => {
    async function loadEvents() {
      try {
        const normalizeCategory = (cat: string) => {
          if (['pagan', 'religious', 'natural', 'indigenous', 'seasonal'].includes(cat)) {
            return 'cultural';
          }
          return cat === 'astronomical' ? 'astronomical' : 'cultural';
        };
        
        // Get current language inside effect to ensure fresh value on re-render
        const language = getApiLang();
        const apiEvents = await contentService.getMergedUpcomingEvents(90, language);
        
        if (apiEvents && apiEvents.length > 0) {
          const allEvents = apiEvents.map(e => ({ 
            ...e, 
            displayCategory: e.category,
            category: normalizeCategory(e.category || 'cultural'),
            description: cleanTone(e.description || e.summary || '')
          }));
          
          const seen = new Set<string>();
          const deduped = allEvents.filter(e => {
            const key = e.name?.toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          
          console.log('📊 Merged events from source:', deduped.length);
          setEvents(deduped);
        } else {
          console.log('📊 Using fallback CORE_DATES');
          setEvents(CORE_DATES.map(e => ({ 
            ...e, 
            displayCategory: e.category,
            category: normalizeCategory(e.category)
          })));
        }
      } catch (e) {
        console.error('Error loading events:', e);
        setEvents(CORE_DATES.map(e => ({ ...e, category: 'cultural' })));
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, [i18n.language]);

  // Helper to parse date and normalize to local midnight for consistent comparison
  const parseEventDate = (e: any): Date => {
    // First check for fixedDate in "MM-DD" format (from API observances)
    if (e.fixedDate && typeof e.fixedDate === 'string') {
      const match = e.fixedDate.match(/^(\d{2})-(\d{2})$/);
      if (match) {
        const month = parseInt(match[1], 10) - 1; // 0-indexed month
        const day = parseInt(match[2], 10);
        const now = new Date();
        const thisYear = now.getFullYear();
        const dateThisYear = new Date(thisYear, month, day);
        // If the date has passed this year, use next year
        if (dateThisYear < now) {
          return new Date(thisYear + 1, month, day);
        }
        return dateThisYear;
      }
    }
    
    // Check multiple possible date field names (both camelCase and snake_case)
    const raw = e.date || e.startDate || e.peakDate || e.start_date || e.event_date || e.observance_date || e.timestamp;
    if (!raw) {
      console.log('⚠️ No date field found for:', e.name, 'Available keys:', Object.keys(e).join(', '));
      return new Date(NaN);
    }
    
    let parsed: Date;
    
    // If already a Date object
    if (raw instanceof Date) {
      parsed = raw;
    } else if (typeof raw === 'string') {
      // For date-only strings (YYYY-MM-DD), parse as local time directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        const [year, month, day] = raw.split('-').map(Number);
        return new Date(year, month - 1, day); // Already local midnight
      }
      // For ISO strings, parse and then normalize to local date
      parsed = new Date(raw);
    } else if (typeof raw === 'number') {
      parsed = new Date(raw);
    } else {
      return new Date(NaN);
    }
    
    // Normalize to local midnight for consistent date-only comparison
    if (!isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    }
    
    return new Date(NaN);
  };

  // Bucket events by date range and filter by category
  const bucketedEvents = useMemo(() => {
    const { start, end } = getDateRange(band);

    // Debug logging
    if (events.length > 0) {
      console.log('🔍 Filtering', events.length, 'events for band:', band);
      console.log('🔍 Date range:', start.toDateString(), 'to', end.toDateString());
    }

    // Filter events by date range only first (not category)
    const inRangeEvents = events.filter(e => {
      const eventDate = parseEventDate(e);
      if (isNaN(eventDate.getTime())) {
        return false;
      }
      return eventDate >= start && eventDate <= end;
    });

    // Check if we have any astronomical events from API
    const hasAstronomicalEvents = inRangeEvents.some(e => e.category === 'astronomical');
    
    // Get the appropriate fallback based on band
    const getFallback = () => {
      if (band === 'soon') return getFallbackSoon(t);
      if (band === 'cycle') return getFallbackCycle(t);
      return getFallbackSeason(t);
    };

    // Merge fallback astronomical events if none exist from API
    let eventsWithFallbacks = inRangeEvents;
    if (!hasAstronomicalEvents) {
      console.log('🌟 No astronomical events from API, adding fallbacks for band:', band);
      const fallbackAstro = getFallback().filter(e => e.category === 'astronomical');
      // Add unique ids to avoid collisions
      const fallbacksWithDates = fallbackAstro.map(e => ({
        ...e,
        date: (e as any).date || new Date(Date.now() + ((e as any).daysUntil || 0) * 24 * 60 * 60 * 1000)
      }));
      eventsWithFallbacks = [...inRangeEvents, ...fallbacksWithDates];
    }

    // Now filter by category
    const filtered = eventsWithFallbacks.filter(e => 
      category === 'all' || e.category === category
    );

    // If still empty after all filtering, use full fallback
    if (filtered.length === 0) {
      return getFallback().filter(e => category === 'all' || e.category === category);
    }

    return filtered;
  }, [events, band, category, t]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.text} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('upcoming.title')}</Text>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>{getDateRangeLabel(band)}</Text>
        </View>

        {/* Band Control */}
        <BandControl value={band} onChange={setBand} />

        {/* Category Filter */}
        <CategoryFilter value={category} onChange={setCategory} />

        {/* Content by Band */}
        {band === 'soon' && (
          <View style={styles.bandContent}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('upcoming.timingWindows')}</Text>
            {bucketedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'cycle' && (
          <View style={styles.bandContent}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('upcoming.lunarPlanetaryMilestones')}</Text>
            {bucketedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}

        {band === 'season' && (
          <View style={styles.bandContent}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('upcoming.seasonalTurningPoints')}</Text>
            {bucketedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </View>
        )}
      </ScrollView>
      {!isFullAccess && <PausedOverlay section="upcoming" onRefreshEntitlement={refresh} />}
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
    borderRadius: 16,
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
    marginBottom: 12,
    paddingHorizontal: 20,
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
