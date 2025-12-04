import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';
import api from '../lib/api';
import { Bookmark, X, ArrowRight, ChevronRight, BookOpen } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- Constants & Helpers ---

const CALENDAR_EXPLAINERS: Record<string, string> = {
  gregorian: "The civil standard, tracking the solar year.",
  mayan: "A sacred count of 260 days, weaving time and destiny.",
  chinese: "Tracks months by the moon, corrected by the sun.",
  hebrew: "Lunisolar rhythm aligning festivals with seasons.",
  islamic: "Pure lunar count, drifting through the solar year.",
  hindu: "Integrating celestial observations with spiritual timekeeping.",
};

const CALENDAR_DETAILS: Record<string, string> = {
  gregorian: "Established in 1582, the Gregorian calendar divides time into 365 days with leap years every 4 years. It's the international standard for civil use, based on the solar cycle.",
  mayan: "The Tzolkin weaves 13 numbers with 20 day names in a sacred 260-day cycle. Mayans believed this reflected cosmic rhythms and human consciousness—used for spiritual guidance and timing ceremonies.",
  chinese: "Combining lunar months with solar corrections, the Chinese calendar maintains harmony between celestial cycles. Each year cycles through 12 animals, each associated with elements and personality traits.",
  hebrew: "Balancing lunar observation with solar precision, the Hebrew calendar aligns festivals with seasons while honoring the moon's cycles. Deeply spiritual, it marks sacred time through seasonal celebrations.",
  islamic: "Following the pure lunar year of 354 days, the Islamic calendar shifts 11 days earlier each solar year, creating a complete cycle every 33 years. This cycle reconnects observers to the original revelation.",
  hindu: "The Panchang integrates multiple calendric systems—solar, lunar, and stellar cycles—into a comprehensive framework used for auspicious timing of ceremonies and spiritual practices across Hindu traditions.",
};

const CALENDAR_TYPES: Record<string, string> = {
  gregorian: "Civil",
  mayan: "Sacred",
  chinese: "Lunisolar",
  hebrew: "Lunisolar",
  islamic: "Lunar",
  hindu: "Lunisolar",
};

// --- Components ---

function SkeletonCard({ style }: { style?: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const { colors } = useTheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.skeleton, 
        { opacity, backgroundColor: colors.surfaceHighlight }, 
        style
      ]} 
    />
  );
}

function SystemCard({ id, name, onPress }: { id: string, name: string, onPress: () => void }) {
  const type = CALENDAR_TYPES[id] || 'System';
  const explainer = CALENDAR_EXPLAINERS[id] || 'A traditional system of timekeeping.';
  const { colors } = useTheme();
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = () => {
    Animated.timing(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableOpacity 
      style={styles.systemCardContainer}
      onPress={handleFlip}
      activeOpacity={1}
    >
      {/* Front of card */}
      <Animated.View 
        style={[
          styles.systemCard, 
          { 
            backgroundColor: colors.surface, 
            borderColor: colors.border,
            opacity: frontOpacity,
            transform: [{ rotateY: frontRotate }],
            position: 'absolute',
          }
        ]}
      >
        <View>
          <View style={styles.systemHeader}>
            <Text style={[styles.systemName, { color: colors.text }]}>{name}</Text>
            <View style={[styles.systemTypeTag, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.systemTypeText, { color: colors.textSecondary }]}>{type}</Text>
            </View>
          </View>
          <Text style={[styles.systemExplainer, { color: colors.textSecondary }]}>{explainer}</Text>
        </View>
        
        <View style={styles.rotateCue}>
          <Text style={[styles.rotateText, { color: colors.textTertiary }]}>Rotate lens</Text>
          <ArrowRight size={14} color={colors.textTertiary} />
        </View>
      </Animated.View>

      {/* Back of card */}
      <Animated.View 
        style={[
          styles.systemCard, 
          { 
            backgroundColor: colors.surfaceHighlight, 
            borderColor: colors.border,
            opacity: backOpacity,
            transform: [{ rotateY: backRotate }],
            position: 'absolute',
          }
        ]}
      >
        <View style={styles.cardBackContent}>
          <Text style={[styles.backTitle, { color: colors.text }]}>About {name}</Text>
          <Text style={[styles.backDescription, { color: colors.textSecondary }]}>{CALENDAR_DETAILS[id] || 'A system for understanding time cycles.'}</Text>
          <View style={[styles.backFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.backCue, { color: colors.textTertiary }]}>Tap to flip back</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function ArtifactCard({ artifact, onSave, isSaved }: { artifact: any, onSave: () => void, isSaved: boolean }) {
  const { colors } = useTheme();
  if (!artifact) return null;

  return (
    <View style={[styles.artifactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.artifactHeader}>
        <View style={[styles.artifactTag, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.artifactTagText, { color: colors.text }]}>{artifact.region || 'Wisdom'}</Text>
        </View>
        <TouchableOpacity onPress={onSave}>
          <Bookmark 
            size={22} 
            color={isSaved ? colors.text : colors.textTertiary} 
            fill={isSaved ? colors.text : "none"}
          />
        </TouchableOpacity>
      </View>
      
      <Text style={[styles.artifactTitle, { color: colors.text }]}>{artifact.title}</Text>
      <Text style={[styles.artifactSummary, { color: colors.textSecondary }]}>{artifact.summary}</Text>
      
      <View style={[styles.whySurfaced, { borderTopColor: colors.border }]}>
        <Text style={[styles.whyText, { color: colors.textTertiary }]}>Surfaced for today's coherent field.</Text>
      </View>
    </View>
  );
}

function LivingCard({ item, onPress }: { item: any, onPress: () => void }) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity 
      style={[styles.livingCard, { backgroundColor: colors.surfaceHighlight, borderLeftColor: colors.text }]} 
      activeOpacity={0.8} 
      onPress={onPress}
    >
      <View>
        <Text style={[styles.livingTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.livingSummary, { color: colors.textSecondary }]}>{item.summary}</Text>
      </View>
      <Text style={[styles.whyNow, { color: colors.textTertiary }]}>{item.why_now}</Text>
    </TouchableOpacity>
  );
}

function SavedStrip({ count }: { count: number }) {
  const { colors } = useTheme();
  if (count === 0) return null;
  
  return (
    <TouchableOpacity 
      style={[styles.savedStrip, { backgroundColor: colors.surface, borderColor: colors.border }]} 
      activeOpacity={0.9}
    >
      <View style={styles.savedContent}>
        <BookOpen size={16} color={colors.text} />
        <Text style={[styles.savedText, { color: colors.text }]}>{count} saved item{count !== 1 ? 's' : ''}</Text>
      </View>
      <ChevronRight size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const { coordinates, timezone, language } = useLocation();
  const { colors, theme } = useTheme();
  const [calendars, setCalendars] = useState<any>(null);
  const [culture, setCulture] = useState<any[]>([]);
  const [cultureLoading, setCultureLoading] = useState(true);
  const [cultureEmpty, setCultureEmpty] = useState(false);
  const [living, setLiving] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [lastCultureRefresh, setLastCultureRefresh] = useState<number>(0);
  
  // Detail Modal State
  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [selectedLiving, setSelectedLiving] = useState<any | null>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [calData, livingData] = await Promise.all([
          api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone, language)
            .catch(() => ({
              gregorian: { name: "Gregorian", day: 2, month: 12, year: 2025 },
              mayan: { name: "Mayan", tzolkin: { dayNumber: 4, dayName: "Kan", meaning: "Reptile" } },
              chinese: { name: "Chinese", year: "Dragon", element: "Wood" },
              hebrew: { name: "Hebrew", day: 29, month: "Kislev", year: 5785 },
              islamic: { name: "Islamic", day: 1, month: "Jumada al-Awwal", year: 1446 }
            })),
          api.getLivingCalendars(language)
            .catch(() => [
              {
                id: 'seasonal',
                title: 'Seasonal Pattern',
                summary: 'The light is shifting as we approach the solstice threshold.',
                why_now: 'We are 18 days from the turning point.'
              },
              {
                id: 'light',
                title: 'Light Shift',
                summary: 'Twilight lengthens in the northern hemisphere, inviting introspection.',
                why_now: 'Solar angle is currently at 23 degrees.'
              }
            ])
        ]);

        setCalendars(calData);
        setLiving(livingData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [coordinates, timezone, language]);

  // Mock artifacts for fallback
  const MOCK_ARTIFACTS = [
    {
      id: 'artifact-1',
      title: 'The Codex Boturini',
      region: 'Mesoamerica',
      summary: 'An ancient Aztec codex depicting the migration myth of the Mexica people. The narrative unfolds as a spiral, representing the eternal cycle of time and the search for Tenochtitlan, the destined homeland.'
    },
    {
      id: 'artifact-2',
      title: 'Stonehenge Alignments',
      region: 'British Isles',
      summary: 'A 5,000-year-old monument aligned with celestial events. The stones mark solstices and equinoxes, serving as a vast calendar connecting human consciousness to cosmic rhythms.'
    },
    {
      id: 'artifact-3',
      title: 'The I Ching (Book of Changes)',
      region: 'China',
      summary: 'An ancient divination text encoding 64 hexagrams representing all possible states of change. Each pattern reflects the dynamic interplay between yin and yang, chaos and order.'
    },
    {
      id: 'artifact-4',
      title: 'Vedic Fire Ceremonies',
      region: 'India',
      summary: 'Rituals thousands of years old that synchronize human action with celestial events. Fire serves as mediator between earthly and cosmic realms, maintaining universal harmony.'
    },
  ];

  // Load cultural content separately
  useEffect(() => {
    async function loadCulture() {
      setCultureLoading(true);
      setCultureEmpty(false);
      try {
        const data = await api.getCulturalContent(1, language);
        if (Array.isArray(data) && data.length > 0) {
          setCulture(data);
          setCultureEmpty(false);
        } else {
          // Use random mock artifact from collection
          const randomArtifact = MOCK_ARTIFACTS[Math.floor(Math.random() * MOCK_ARTIFACTS.length)];
          setCulture([randomArtifact]);
          setCultureEmpty(false);
        }
      } catch {
        // Use random mock artifact on error
        const randomArtifact = MOCK_ARTIFACTS[Math.floor(Math.random() * MOCK_ARTIFACTS.length)];
        setCulture([randomArtifact]);
        setCultureEmpty(false);
      } finally {
        setCultureLoading(false);
      }
    }
    loadCulture();
  }, [language]);

  const handleRefreshCulture = async () => {
    const now = Date.now();
    if (now - lastCultureRefresh < 30000) {
      // Rate limit: only allow refresh every 30 seconds
      return;
    }
    
    setLastCultureRefresh(now);
    setCultureLoading(true);
    setCultureEmpty(false);
    
    try {
      const data = await api.getCulturalContent(1, language);
      if (Array.isArray(data) && data.length > 0) {
        setCulture(data);
        setCultureEmpty(false);
      } else {
        // Use random mock artifact on empty response
        const randomArtifact = MOCK_ARTIFACTS[Math.floor(Math.random() * MOCK_ARTIFACTS.length)];
        setCulture([randomArtifact]);
        setCultureEmpty(false);
      }
    } catch {
      // Use random mock artifact on error
      const randomArtifact = MOCK_ARTIFACTS[Math.floor(Math.random() * MOCK_ARTIFACTS.length)];
      setCulture([randomArtifact]);
      setCultureEmpty(false);
    } finally {
      setCultureLoading(false);
    }
  };

  const handleSave = (id: string) => {
    setSavedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getSystemDetails = (key: string) => {
    if (!calendars || !calendars[key]) return null;
    return calendars[key];
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content} scrollEnabled={false}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar Systems</Text>
          
          {/* Carousel Skeleton */}
          <View style={styles.carouselContainer}>
            <View style={styles.carouselScroll}>
              <SkeletonCard style={{ width: width * 0.85, height: 200, borderRadius: 24 }} />
            </View>
          </View>

          {/* Artifact Skeleton */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ARTIFACT OF THE DAY</Text>
            <SkeletonCard style={{ width: '100%', height: 250, borderRadius: 20 }} />
          </View>

          {/* Living Calendar Skeleton */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>LIVING CALENDAR</Text>
            <SkeletonCard style={{ width: '100%', height: 100, borderRadius: 16, marginBottom: 12 }} />
            <SkeletonCard style={{ width: '100%', height: 100, borderRadius: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Calendar Systems</Text>
        
        {/* 1. Calendar Systems Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselScroll}
            decelerationRate="fast"
            snapToInterval={width * 0.85 + 12}
          >
            {calendars && Object.entries(calendars).map(([key, val]: [string, any]) => (
              <SystemCard 
                key={key} 
                id={key} 
                name={val?.name || key} // Fallback if name is missing in API
                onPress={() => setSelectedSystem(key)} 
              />
            ))}
          </ScrollView>
        </View>

        {/* 2. Artifact of the Day */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>ARTIFACT OF THE DAY</Text>
          
          {cultureLoading ? (
            <SkeletonCard style={{ width: '100%', height: 250, borderRadius: 20 }} />
          ) : cultureEmpty ? (
            <View style={[styles.fallbackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fallbackCardTitle, { color: colors.textSecondary }]}>No cultural offering surfaced today.</Text>
              <Text style={[styles.fallbackCardSub, { color: colors.textTertiary }]}>The field is quiet here. Try again later.</Text>
              <TouchableOpacity 
                style={[styles.fallbackRefreshButton, { backgroundColor: colors.surfaceHighlight }]} 
                onPress={handleRefreshCulture}
              >
                <Text style={[styles.fallbackRefreshText, { color: colors.textSecondary }]}>Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : culture.length > 0 ? (
            <ArtifactCard 
              artifact={culture[0]} 
              isSaved={savedIds.includes(culture[0].id || 'art1')}
              onSave={() => handleSave(culture[0].id || 'art1')}
            />
          ) : (
            <View style={[styles.fallbackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fallbackCardTitle, { color: colors.textSecondary }]}>No cultural offering surfaced today.</Text>
              <Text style={[styles.fallbackCardSub, { color: colors.textTertiary }]}>The field is quiet here. Try again later.</Text>
              <TouchableOpacity 
                style={[styles.fallbackRefreshButton, { backgroundColor: colors.surfaceHighlight }]} 
                onPress={handleRefreshCulture}
              >
                <Text style={[styles.fallbackRefreshText, { color: colors.textSecondary }]}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Living Calendar */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>LIVING CALENDAR</Text>
          {living.map((item, i) => (
            <LivingCard 
              key={i} 
              item={item} 
              onPress={() => setSelectedLiving(item)}
            />
          ))}
        </View>

      </ScrollView>

      {/* 4. Saved Strip */}
      <SavedStrip count={savedIds.length} />

      {/* Detail Bottom Sheet (System Modal) */}
      <Modal
        visible={!!selectedSystem}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedSystem(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSelectedSystem(null)} />
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111' : '#FFF', borderTopColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surfaceHighlight }]} onPress={() => setSelectedSystem(null)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedSystem && calendars && calendars[selectedSystem] && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Today in {selectedSystem}</Text>
                <View style={[styles.modalDateContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {selectedSystem === 'mayan' && (
                    <>
                      <Text style={[styles.modalDateMain, { color: colors.text }]}>{calendars[selectedSystem].tzolkin?.dayNumber} {calendars[selectedSystem].tzolkin?.dayName}</Text>
                      <Text style={[styles.modalDateSub, { color: colors.textSecondary }]}>{calendars[selectedSystem].tzolkin?.meaning}</Text>
                    </>
                  )}
                  {selectedSystem === 'chinese' && (
                    <>
                      <Text style={[styles.modalDateMain, { color: colors.text }]}>{calendars[selectedSystem].year} Year</Text>
                      <Text style={[styles.modalDateSub, { color: colors.textSecondary }]}>{calendars[selectedSystem].element} Element</Text>
                    </>
                  )}
                  {(selectedSystem === 'hebrew' || selectedSystem === 'islamic') && (
                    <Text style={[styles.modalDateMain, { color: colors.text }]}>{calendars[selectedSystem].day} {calendars[selectedSystem].month}, {calendars[selectedSystem].year}</Text>
                  )}
                   {selectedSystem === 'gregorian' && (
                    <Text style={[styles.modalDateMain, { color: colors.text }]}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
                  )}
                </View>
                
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {CALENDAR_EXPLAINERS[selectedSystem]} This system offers a unique lens on the passage of time, emphasizing {CALENDAR_TYPES[selectedSystem].toLowerCase()} rhythms.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Living Calendar Detail Modal */}
      <Modal
        visible={!!selectedLiving}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedLiving(null)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setSelectedLiving(null)} />
          <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111' : '#FFF', borderTopColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.surfaceHighlight }]} onPress={() => setSelectedLiving(null)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            {selectedLiving && (
              <View style={styles.modalBody}>
                <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>Living Rhythm</Text>
                <Text style={[styles.modalDateMain, { color: colors.text }]}>{selectedLiving.title}</Text>
                
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {selectedLiving.summary}
                </Text>

                <View style={[styles.whySurfaced, { borderTopColor: colors.border }]}>
                  <Text style={[styles.whyText, { color: colors.textTertiary }]}>{selectedLiving.why_now}</Text>
                </View>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={() => setSelectedLiving(null)}>
                  <Text style={styles.actionButtonText}>Carry into Quiet Frame</Text>
                  <ArrowRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  // Carousel
  carouselContainer: {
    marginBottom: 32,
  },
  carouselScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  systemCard: {
    width: width * 0.85,
    height: 280,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: 24,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  systemName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  systemTypeTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  systemTypeText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  systemExplainer: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 24,
    maxWidth: '90%',
  },
  rotateCue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rotateText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  systemCardContainer: {
    width: width * 0.85,
    height: 280,
    position: 'relative',
  },
  cardBackContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  backTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  backDescription: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 21,
    flex: 1,
    marginBottom: 12,
  },
  backFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  backCue: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Artifact
  artifactCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  artifactTag: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  artifactTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
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
  whySurfaced: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  whyText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  fallbackCard: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    minHeight: 180,
    justifyContent: 'center',
  },
  fallbackCardTitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackCardSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  fallbackRefreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  fallbackRefreshText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: '500',
  },
  // Living Calendar
  livingCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FFFFFF',
  },
  livingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  livingSummary: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
    marginBottom: 12,
  },
  whyNow: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
  // Saved Strip
  savedStrip: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#222',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  savedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  savedText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -4,
  },
  modalBody: {
    gap: 16,
  },
  modalTitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 1,
  },
  modalDateContainer: {
    marginBottom: 8,
  },
  modalDateMain: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalDateSub: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  modalDescription: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
  skeleton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  actionButton: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
