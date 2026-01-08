import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';
import { cookieService } from '../lib/CookieService';
import { Bookmark, X, ArrowRight, ChevronRight, BookOpen, Sparkles, Calendar, Globe, Leaf } from 'lucide-react-native';

const { width } = Dimensions.get('window');

// --- Constants & Helpers ---

const CALENDAR_EXPLAINER_KEYS: Record<string, string> = {
  gregorian: "calExplainerGregorian",
  mayan: "calExplainerMayan",
  chinese: "calExplainerChinese",
  hebrew: "calExplainerHebrew",
  islamic: "calExplainerIslamic",
  hindu: "calExplainerHindu",
};

const CALENDAR_DETAIL_KEYS: Record<string, string> = {
  gregorian: "calDetailGregorian",
  mayan: "calDetailMayan",
  chinese: "calDetailChinese",
  hebrew: "calDetailHebrew",
  islamic: "calDetailIslamic",
  hindu: "calDetailHindu",
};

const CALENDAR_TYPE_KEYS: Record<string, string> = {
  gregorian: "civil",
  mayan: "sacred",
  chinese: "lunisolar",
  hebrew: "lunisolar",
  islamic: "lunar",
  hindu: "lunisolar",
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
  const { colors } = useTheme();
  const { t } = useTranslation();
  const typeKey = CALENDAR_TYPE_KEYS[id] || 'civil';
  const type = t(`calendars.${typeKey}`);
  const explainerKey = CALENDAR_EXPLAINER_KEYS[id];
  const explainer = explainerKey ? t(`learn.${explainerKey}`) : t('learn.calendarDefault');
  const detailKey = CALENDAR_DETAIL_KEYS[id];
  const detail = detailKey ? t(`learn.${detailKey}`) : t('learn.calendarDefault');
  
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
          <View style={styles.systemCardHeader}>
            <View style={[styles.systemIcon, { backgroundColor: 'rgba(155, 89, 182, 0.15)' }]}>
              <Calendar size={18} color="#9b59b6" />
            </View>
            <Text style={[styles.systemLabel, { color: colors.textTertiary }]}>{name.toUpperCase()}</Text>
            <View style={[styles.systemTypeTag, { backgroundColor: colors.surfaceHighlight }]}>
              <Text style={[styles.systemTypeText, { color: colors.textSecondary }]}>{type}</Text>
            </View>
          </View>
          <Text style={[styles.systemExplainer, { color: colors.textSecondary, marginTop: 16 }]}>{explainer}</Text>
        </View>
        
        <View style={styles.rotateCue}>
          <Text style={[styles.rotateText, { color: colors.textTertiary }]}>{t('learn.rotateLens')}</Text>
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
          <Text style={[styles.backTitle, { color: colors.text }]}>{t('learn.about')} {name}</Text>
          <Text style={[styles.backDescription, { color: colors.textSecondary }]}>{detail}</Text>
          <View style={[styles.backFooter, { borderTopColor: colors.border }]}>
            <Text style={[styles.backCue, { color: colors.textTertiary }]}>{t('learn.tapToFlipBack')}</Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

function ArtifactCard({ artifact, onSave, isSaved }: { artifact: any, onSave: () => void, isSaved: boolean }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (!artifact) return null;

  return (
    <View style={[styles.artifactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.artifactHeader}>
        <View style={[styles.artifactTag, { backgroundColor: colors.surfaceHighlight }]}>
          <Text style={[styles.artifactTagText, { color: colors.text }]}>{artifact.region || t('learn.wisdom')}</Text>
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
        <Text style={[styles.whyText, { color: colors.textTertiary }]}>{t('learn.surfacedToday')}</Text>
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
  const { t } = useTranslation();
  if (count === 0) return null;
  
  return (
    <TouchableOpacity 
      style={[styles.savedStrip, { backgroundColor: colors.surface, borderColor: colors.border }]} 
      activeOpacity={0.9}
    >
      <View style={styles.savedContent}>
        <BookOpen size={16} color={colors.text} />
        <Text style={[styles.savedText, { color: colors.text }]}>{count} {count !== 1 ? t('learn.savedItems') : t('learn.savedItem')}</Text>
      </View>
      <ChevronRight size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const { coordinates, timezone, language } = useLocation();
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
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
  
  // Cookie State
  const [cookie, setCookie] = useState<string | null>(null);
  const [cookieLoading, setCookieLoading] = useState(true);

  // Default living calendar items
  const defaultLivingCalendars = [
    {
      id: 'seasonal',
      title: t('learn.seasonalPattern'),
      summary: t('learn.seasonalPatternSummary'),
      why_now: t('learn.seasonalPatternWhy')
    },
    {
      id: 'light',
      title: t('learn.lightShift'),
      summary: t('learn.lightShiftSummary'),
      why_now: t('learn.lightShiftWhy')
    }
  ];

  // Enrich living calendar data to ensure no void content
  const enrichLivingCalendarData = (items: any[]) => {
    return items
      .filter(item => item) // Remove null/undefined
      .map((item, idx) => ({
        id: item.id || `living-${idx}`,
        // API returns: cycleName, cycleDescription, dailyGuidance
        title: (item.cycleName || item.title || item.name || '').trim() || t('learn.seasonalRhythms'),
        summary: (item.cycleDescription || item.summary || item.description || '').trim() || t('learn.defaultLivingSummary'),
        why_now: (item.dailyGuidance || item.why_now || item.relevance || '').trim() || t('learn.activeNow'),
        origin: item.culture ? item.culture.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : t('learn.traditionalOrigin')
      }))
      .filter((item) => {
        // Only keep items if they have non-default content
        const defaultTitle = t('learn.seasonalRhythms');
        const defaultSummary = t('learn.defaultLivingSummary');
        const hasRealTitle = item.title !== defaultTitle;
        const hasRealContent = item.summary !== defaultSummary;
        return hasRealTitle || hasRealContent;
      });
  };

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        const [calData, livingData] = await Promise.all([
          api.getTraditionalCalendars(coordinates.lat, coordinates.lng, timezone, language)
            .catch(() => null),
          api.getLivingCalendars(language)
            .catch(() => defaultLivingCalendars)
        ]);

        // Convert calendar array to object format for Learn page
        if (Array.isArray(calData)) {
          const calendarObj: any = { gregorian: { name: t('learn.gregorian') } };
          calData.forEach((cal: any) => {
            if (cal.system === 'Mayan Tzolkin') {
              calendarObj.mayan = { name: t('learn.mayanTzolkin'), date: cal.date, system: cal.system };
            } else if (cal.system === 'Chinese Agricultural') {
              calendarObj.chinese = { name: t('learn.chinese'), date: cal.date, system: cal.system };
            } else if (cal.system === 'Hindu Panchang') {
              calendarObj.hindu = { name: t('learn.hinduPanchang'), date: cal.date, system: cal.system };
            } else if (cal.system === 'Islamic Hijri') {
              calendarObj.islamic = { name: t('learn.islamic'), date: cal.date, system: cal.system };
            } else if (cal.system === 'Hebrew Calendar') {
              calendarObj.hebrew = { name: t('learn.hebrew'), date: cal.date, system: cal.system };
            }
          });
          setCalendars(calendarObj);
        } else {
          setCalendars(calData);
        }
        
        // Enrich living data to ensure content is never void
        const enrichedLiving = Array.isArray(livingData) && livingData.length > 0 
          ? enrichLivingCalendarData(livingData)
          : [];
        // Always show content - use defaults if enriched is empty
        setLiving(enrichedLiving.length > 0 ? enrichedLiving : defaultLivingCalendars);
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

  // Load cookie
  useEffect(() => {
    async function loadCookie() {
      setCookieLoading(true);
      try {
        const text = await cookieService.getCookie();
        setCookie(text);
      } catch {
        setCookie(t('learn.cookieDisclaimer'));
      } finally {
        setCookieLoading(false);
      }
    }
    loadCookie();
  }, []);

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
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>{t('learn.title')}</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{t('learn.subtitle')}</Text>
          </View>
          
          {/* Living Calendar Skeleton */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.livingCalendar').toUpperCase()}</Text>
            <SkeletonCard style={{ width: '100%', height: 100, borderRadius: 16, marginBottom: 12 }} />
            <SkeletonCard style={{ width: '100%', height: 100, borderRadius: 16 }} />
          </View>

          {/* Artifact Skeleton */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.artifactOfDay').toUpperCase()}</Text>
            <SkeletonCard style={{ width: '100%', height: 250, borderRadius: 16 }} />
          </View>

          {/* Carousel Skeleton (at bottom) */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.calendarSystems').toUpperCase()}</Text>
          </View>
          
          <View style={styles.carouselContainer}>
            <View style={styles.carouselScroll}>
              <SkeletonCard style={{ width: width * 0.85, height: 200, borderRadius: 16 }} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t('learn.title')}</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{t('learn.subtitle')}</Text>
        </View>
        
        {/* 1. Living Calendar */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.livingCalendar').toUpperCase()}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{t('learn.livingCalendarDesc')}</Text>
          {living.map((item, i) => (
            <LivingCard 
              key={i} 
              item={item} 
              onPress={() => setSelectedLiving(item)}
            />
          ))}
        </View>

        {/* 2. Artifact of the Day */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.artifactOfDay').toUpperCase()}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{t('learn.artifactDesc')}</Text>
          
          {cultureLoading ? (
            <SkeletonCard style={{ width: '100%', height: 250, borderRadius: 16 }} />
          ) : cultureEmpty ? (
            <View style={[styles.fallbackCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.fallbackCardTitle, { color: colors.textSecondary }]}>{t('learn.noArtifact')}</Text>
              <Text style={[styles.fallbackCardSub, { color: colors.textTertiary }]}>{t('learn.fieldQuiet')}</Text>
              <TouchableOpacity 
                style={[styles.fallbackRefreshButton, { backgroundColor: colors.surfaceHighlight }]} 
                onPress={handleRefreshCulture}
              >
                <Text style={[styles.fallbackRefreshText, { color: colors.textSecondary }]}>{t('learn.tryAgain')}</Text>
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
              <Text style={[styles.fallbackCardTitle, { color: colors.textSecondary }]}>{t('learn.noArtifact')}</Text>
              <Text style={[styles.fallbackCardSub, { color: colors.textTertiary }]}>{t('learn.fieldQuiet')}</Text>
              <TouchableOpacity 
                style={[styles.fallbackRefreshButton, { backgroundColor: colors.surfaceHighlight }]} 
                onPress={handleRefreshCulture}
              >
                <Text style={[styles.fallbackRefreshText, { color: colors.textSecondary }]}>{t('learn.tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 3. Explore Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.explore').toUpperCase()}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{t('learn.sacredGeography')}</Text>
          
          <View style={[styles.exploreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.exploreHeader}>
              <View style={[styles.exploreIcon, { backgroundColor: 'rgba(52, 152, 219, 0.15)' }]}>
                <Globe size={20} color="#3498db" />
              </View>
              <View style={styles.exploreContent}>
                <Text style={[styles.exploreTitle, { color: colors.text }]}>{t('learn.sacredGeographyTitle')}</Text>
                <Text style={[styles.exploreOrigin, { color: colors.textSecondary }]}>{t('learn.sacredGeographyOrigin')}</Text>
              </View>
            </View>
            <Text style={[styles.exploreDesc, { color: colors.textSecondary }]}>
              {t('learn.sacredGeographyDesc')}
            </Text>
          </View>

          <View style={[styles.exploreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.exploreHeader}>
              <View style={[styles.exploreIcon, { backgroundColor: 'rgba(155, 89, 182, 0.15)' }]}>
                <BookOpen size={20} color="#9b59b6" />
              </View>
              <View style={styles.exploreContent}>
                <Text style={[styles.exploreTitle, { color: colors.text }]}>{t('learn.oralTraditionTitle')}</Text>
                <Text style={[styles.exploreOrigin, { color: colors.textSecondary }]}>{t('learn.oralTraditionOrigin')}</Text>
              </View>
            </View>
            <Text style={[styles.exploreDesc, { color: colors.textSecondary }]}>
              {t('learn.oralTraditionDesc')}
            </Text>
          </View>

          <View style={[styles.exploreCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.exploreHeader}>
              <View style={[styles.exploreIcon, { backgroundColor: 'rgba(46, 204, 113, 0.15)' }]}>
                <Leaf size={20} color="#2ecc71" />
              </View>
              <View style={styles.exploreContent}>
                <Text style={[styles.exploreTitle, { color: colors.text }]}>{t('learn.seasonalRhythmsTitle')}</Text>
                <Text style={[styles.exploreOrigin, { color: colors.textSecondary }]}>{t('learn.seasonalRhythmsOrigin')}</Text>
              </View>
            </View>
            <Text style={[styles.exploreDesc, { color: colors.textSecondary }]}>
              {t('learn.seasonalRhythmsDesc')}
            </Text>
          </View>
        </View>

        {/* 4. The Cookie */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.theCookie').toUpperCase()}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>{t('learn.cookieSubtitle')}</Text>
          
          <View style={[styles.cookieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cookieHeader}>
              <View style={[styles.cookieIcon, { backgroundColor: 'rgba(241, 196, 15, 0.15)' }]}>
                <Sparkles size={20} color="#f1c40f" />
              </View>
              <Text style={[styles.cookieLabel, { color: colors.textTertiary }]}>{t('learn.todaysCookie')}</Text>
            </View>
            
            {cookieLoading ? (
              <View style={styles.cookieTextContainer}>
                <SkeletonCard style={{ width: '100%', height: 24, borderRadius: 8 }} />
              </View>
            ) : (
              <View style={styles.cookieTextContainer}>
                <Text style={[styles.cookieText, { color: colors.text }]}>"{cookie}"</Text>
              </View>
            )}
            
            <View style={[styles.cookieFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.cookieDisclaimer, { color: colors.textTertiary }]}>
                {t('learn.cookieFictionalDisclaimer')}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Calendar Systems (static reference) */}
        <View style={[styles.section, { marginBottom: 12 }]}>
          <Text style={[styles.sectionLabel, { color: colors.textTertiary }]}>{t('learn.calendarSystems').toUpperCase()}</Text>
          <Text style={[styles.sectionDescription, { color: colors.textSecondary, marginBottom: 0 }]}>{t('learn.calendarSystemsDesc')}</Text>
        </View>
        
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
                name={val?.name || key}
                onPress={() => setSelectedSystem(key)} 
              />
            ))}
          </ScrollView>
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
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('learn.todayIn')} {t(`learn.${selectedSystem}`)}</Text>
                <View style={[styles.modalDateContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {selectedSystem === 'mayan' && (
                    <>
                      <Text style={[styles.modalDateMain, { color: colors.text }]}>{calendars[selectedSystem].tzolkin?.dayNumber} {calendars[selectedSystem].tzolkin?.dayName}</Text>
                      <Text style={[styles.modalDateSub, { color: colors.textSecondary }]}>{calendars[selectedSystem].tzolkin?.meaning}</Text>
                    </>
                  )}
                  {selectedSystem === 'chinese' && (
                    <>
                      <Text style={[styles.modalDateMain, { color: colors.text }]}>{calendars[selectedSystem].year} {t('learn.year')}</Text>
                      <Text style={[styles.modalDateSub, { color: colors.textSecondary }]}>{calendars[selectedSystem].element} {t('learn.element')}</Text>
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
                  {t(`learn.${CALENDAR_EXPLAINER_KEYS[selectedSystem] || 'calendarDefault'}`)}
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
                <Text style={[styles.modalTitle, { color: colors.textSecondary }]}>{t('learn.livingCalendar')}</Text>
                <Text style={[styles.modalDateMain, { color: colors.text }]}>{selectedLiving.title}</Text>
                
                <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                  {selectedLiving.summary}
                </Text>

                <View style={[styles.whySurfaced, { borderTopColor: colors.border }]}>
                  <Text style={[styles.whyText, { color: colors.textTertiary }]}>{selectedLiving.why_now}</Text>
                </View>

                <TouchableOpacity style={[styles.actionButton, { backgroundColor: colors.accent }]} onPress={() => setSelectedLiving(null)}>
                  <Text style={styles.actionButtonText}>{t('learn.carryForward')}</Text>
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
  pageHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 24,
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
    marginBottom: 48,
    paddingHorizontal: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.35)',
    marginBottom: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionDescription: {
    fontSize: 13,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
    lineHeight: 18,
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
    borderRadius: 16,
    padding: 24,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  systemCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  systemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    flex: 1,
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
    borderRadius: 16,
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
    borderRadius: 16,
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
  // Explore Section
  exploreCard: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  exploreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  exploreIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exploreContent: {
    flex: 1,
  },
  exploreTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  exploreOrigin: {
    fontSize: 11,
    fontWeight: '600',
  },
  exploreDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Cookie Section
  cookieCard: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
  },
  cookieHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  cookieIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cookieLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cookieTextContainer: {
    paddingVertical: 16,
  },
  cookieText: {
    fontSize: 19,
    fontWeight: '500',
    fontStyle: 'italic',
    lineHeight: 30,
    textAlign: 'center',
  },
  cookieFooter: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  cookieDisclaimer: {
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 14,
  },
});
