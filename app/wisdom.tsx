import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getApiLang } from '../lib/lang';
import api, { RegionalBreakdown } from '../lib/api';
import { Brain, Calendar, TrendingUp, TrendingDown, Minus, ChevronRight, Info, X, FileText, Globe } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import i18next from 'i18next';

const { width } = Dimensions.get('window');

function formatNumberByLocale(num: number): string {
  const lang = i18next.language || 'en';
  if (lang === 'en') {
    return num.toLocaleString('en-US');
  }
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

function SkeletonCard({ style }: { style?: any }) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const { colors } = useTheme();

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.skeleton, { opacity, backgroundColor: colors.surfaceHighlight }, style]} />
  );
}

function TQFGauge({ score, size = 160, label, subtitle, forceColor }: { score: number; size?: number; label?: string; subtitle?: string; forceColor?: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const centerX = size / 2;
  const centerY = radius + strokeWidth / 2;
  
  const getScoreColor = (s: number) => {
    if (s >= 70) return '#10b981';
    if (s >= 50) return '#3b82f6';
    if (s >= 30) return '#f59e0b';
    return '#ef4444';
  };
  
  const getScoreLabel = (s: number) => {
    if (s >= 70) return t('learn.highlyAligned');
    if (s >= 50) return t('learn.moderatelyAligned');
    if (s >= 30) return t('learn.transitional');
    return t('learn.misaligned');
  };
  
  const color = forceColor || getScoreColor(clampedScore);
  
  const svgHeight = radius + strokeWidth;
  
  const createArcPath = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };
  
  const bgArcPath = createArcPath(180, 360);
  const progressAngle = 180 + (clampedScore / 100) * 180;
  const progressArcPath = createArcPath(180, progressAngle);
  
  return (
    <View style={styles.gaugeContainer}>
      {label && <Text style={[styles.gaugeTitle, { color: colors.textSecondary }]}>{label}</Text>}
      <View style={{ width: size, height: svgHeight, overflow: 'hidden' }}>
        <Svg width={size} height={svgHeight}>
          <Path
            d={bgArcPath}
            stroke={colors.surfaceHighlight}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
          <Path
            d={progressArcPath}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
        <View style={[styles.gaugeValueInner, { top: svgHeight - 60 }]}>
          <Text style={[styles.gaugeScore, { color, fontSize: size > 120 ? 36 : 28 }]}>{Math.round(clampedScore)}</Text>
          <Text style={[styles.gaugeLabel, { color: colors.textSecondary }]}>{getScoreLabel(clampedScore)}</Text>
        </View>
      </View>
      {subtitle && <Text style={[styles.gaugeSubtitleBelow, { color: colors.textTertiary }]}>{subtitle}</Text>}
    </View>
  );
}

function PercentageBar({ label, hint, value, color }: { label: string; hint?: string; value: number; color: string }) {
  const { colors } = useTheme();
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <View style={styles.percentageRow}>
      <View style={styles.percentageLabel}>
        <View style={[styles.percentageDot, { backgroundColor: color }]} />
        <View style={styles.percentageLabelText}>
          <Text style={[styles.percentageText, { color: colors.text }]}>{label}</Text>
          {hint && <Text style={[styles.percentageHint, { color: colors.textTertiary }]}>{hint}</Text>}
        </View>
      </View>
      <View style={styles.percentageBarContainer}>
        <View style={[styles.percentageBarBg, { backgroundColor: colors.surfaceHighlight }]}>
          <View style={[styles.percentageBarFill, { width: `${clampedValue}%`, backgroundColor: color }]} />
        </View>
        <Text style={[styles.percentageValue, { color: colors.textSecondary }]}>{Math.round(clampedValue)}%</Text>
      </View>
    </View>
  );
}

function HopeMeter({ level }: { level: string | number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const levels = ['low', 'moderate', 'elevated', 'high', 'very_high'];
  
  // Handle numeric values (0-100) or string levels
  let activeIndex = 1; // default to moderate
  let levelKey = 'moderate';
  
  if (typeof level === 'number') {
    // Convert 0-100 to 0-4 index
    const clampedLevel = Math.max(0, Math.min(100, level));
    if (clampedLevel < 20) {
      activeIndex = 0;
      levelKey = 'low';
    } else if (clampedLevel < 40) {
      activeIndex = 1;
      levelKey = 'moderate';
    } else if (clampedLevel < 60) {
      activeIndex = 2;
      levelKey = 'elevated';
    } else if (clampedLevel < 80) {
      activeIndex = 3;
      levelKey = 'high';
    } else {
      activeIndex = 4;
      levelKey = 'very_high';
    }
  } else if (typeof level === 'string') {
    const normalizedLevel = level?.toLowerCase().replace(/\s+/g, '_') || 'moderate';
    const idx = levels.indexOf(normalizedLevel);
    activeIndex = idx >= 0 ? idx : 1;
    levelKey = idx >= 0 ? normalizedLevel : 'moderate';
  }
  
  const displayLabel = t(`learn.hope_${levelKey}`);
  
  return (
    <View style={styles.hopeMeterContainer}>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('learn.hopeLevel')}</Text>
      <View style={styles.hopeMeterBar}>
        {levels.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.hopeMeterSegment,
              { backgroundColor: idx <= activeIndex ? '#10b981' : colors.surfaceHighlight }
            ]}
          />
        ))}
      </View>
      <Text style={[styles.hopeMeterValue, { color: colors.text }]}>{displayLabel}</Text>
    </View>
  );
}

function TrendIndicator({ trend }: { trend: string | number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  let Icon = Minus;
  let color = colors.textSecondary;
  let label = '0';
  
  // Handle numeric trend values (e.g., +14.4 or -5.2)
  if (typeof trend === 'number' || !isNaN(parseFloat(trend))) {
    const numValue = typeof trend === 'number' ? trend : parseFloat(trend);
    if (numValue > 0) {
      Icon = TrendingUp;
      color = '#10b981';
      label = `+${numValue.toFixed(1)}`;
    } else if (numValue < 0) {
      Icon = TrendingDown;
      color = '#ef4444';
      label = numValue.toFixed(1);
    } else {
      label = '0';
    }
  } else {
    // Handle string trend values (e.g., "rising", "falling", "stable")
    const normalizedTrend = trend?.toLowerCase() || 'stable';
    label = trend?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Stable';
    
    if (normalizedTrend.includes('up') || normalizedTrend.includes('rising') || normalizedTrend.includes('increasing')) {
      Icon = TrendingUp;
      color = '#10b981';
    } else if (normalizedTrend.includes('down') || normalizedTrend.includes('falling') || normalizedTrend.includes('decreasing')) {
      Icon = TrendingDown;
      color = '#ef4444';
    }
  }
  
  return (
    <View style={styles.trendContainer}>
      <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>{t('learn.trend7d')}</Text>
      <View style={styles.trendRow}>
        <Icon size={20} color={color} />
        <Text style={[styles.trendValue, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

// Calendar system name translations
const CALENDAR_TRANSLATIONS: Record<string, Record<string, string>> = {
  en: {
    maya: 'Mayan Tzolkin',
    chinese: 'Chinese Agricultural',
    hindu: 'Hindu Panchang',
    islamic: 'Islamic Hijri',
    hebrew: 'Hebrew Calendar',
  },
  fr: {
    maya: 'Tzolkin Maya',
    chinese: 'Calendrier Agricole Chinois',
    hindu: 'Panchang Hindou',
    islamic: 'Calendrier Hijri Islamique',
    hebrew: 'Calendrier Hébraïque',
  },
  es: {
    maya: 'Tzolkin Maya',
    chinese: 'Calendario Agrícola Chino',
    hindu: 'Panchang Hindú',
    islamic: 'Calendario Hijri Islámico',
    hebrew: 'Calendario Hebreo',
  },
  de: {
    maya: 'Maya Tzolkin',
    chinese: 'Chinesischer Landwirtschaftskalender',
    hindu: 'Hindu Panchang',
    islamic: 'Islamischer Hijri Kalender',
    hebrew: 'Hebräischer Kalender',
  },
  pt: {
    maya: 'Tzolkin Maia',
    chinese: 'Calendário Agrícola Chinês',
    hindu: 'Panchang Hindu',
    islamic: 'Calendário Hijri Islâmico',
    hebrew: 'Calendário Hebraico',
  },
  it: {
    maya: 'Tzolkin Maya',
    chinese: 'Calendario Agricolo Cinese',
    hindu: 'Panchang Indù',
    islamic: 'Calendario Hijri Islamico',
    hebrew: 'Calendario Ebraico',
  },
};

function getCalendarKey(systemName: string): string | null {
  // Normalize: lowercase and strip diacritics (é→e, ã→a, etc.)
  const name = systemName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Maya/Mayan Tzolkin calendar (matches EN, FR, DE, ES, PT, IT)
  if (name.includes('maya') || name.includes('maia') || name.includes('tzolkin')) return 'maya';
  // Chinese Agricultural calendar (matches various translations including accented forms)
  if (name.includes('chinese') || name.includes('chin') || name.includes('agricol') || 
      name.includes('chines') || name.includes('landwirtschaft')) return 'chinese';
  // Hindu Panchang calendar
  if (name.includes('hindu') || name.includes('hindou') || name.includes('panchang') || 
      name.includes('indu')) return 'hindu';
  // Islamic Hijri calendar (accents stripped: islâmico→islamico, hébraïque→hebraique)
  if (name.includes('islam') || name.includes('hijri') || name.includes('muharram')) return 'islamic';
  // Hebrew calendar (accents stripped)
  if (name.includes('hebrew') || name.includes('hebr') || name.includes('hebreo') ||
      name.includes('tevet') || name.includes('jewish') || name.includes('ebraico')) return 'hebrew';
  return null;
}

function translateCalendarName(systemName: string, lang: string): string {
  const key = getCalendarKey(systemName);
  if (!key) return systemName;
  
  const translations = CALENDAR_TRANSLATIONS[lang] || CALENDAR_TRANSLATIONS.en;
  return translations[key] || systemName;
}

function getCalendarColor(calendar: any): string {
  // First try type-based color (for backward compatibility)
  if (calendar.type) {
    switch (calendar.type?.toLowerCase()) {
      case 'sacred': return '#9b59b6';
      case 'lunisolar': return '#3498db';
      case 'lunar': return '#f1c40f';
      case 'civil': return '#2ecc71';
    }
  }
  // Fallback to system name-based color
  const key = getCalendarKey(calendar.system || calendar.name || '');
  switch (key) {
    case 'maya': return '#9b59b6';
    case 'chinese': return '#e74c3c';
    case 'hindu': return '#f39c12';
    case 'islamic': return '#2ecc71';
    case 'hebrew': return '#3498db';
    default: return '#9b59b6';
  }
}

function normalizeCalendar(calendar: any, lang: string = 'en'): { name: string; date: string; phase?: string } {
  const systemName = calendar.system || calendar.name || 'Unknown Calendar';
  return {
    name: translateCalendarName(systemName, lang),
    date: calendar.date || calendar.currentDate || '',
    phase: calendar.phase || undefined,
  };
}

function CalendarCard({ calendar, onPress, lang }: { calendar: any; onPress: () => void; lang: string }) {
  const { colors } = useTheme();
  
  const color = getCalendarColor(calendar);
  const { name, date, phase } = normalizeCalendar(calendar, lang);
  
  return (
    <TouchableOpacity
      style={[styles.calendarCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.calendarColorBar, { backgroundColor: color }]} />
      <View style={styles.calendarContent}>
        <Text style={[styles.calendarName, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.calendarDate, { color: colors.textSecondary }]}>{date}</Text>
        {phase && (
          <Text style={[styles.calendarPhase, { color: colors.textTertiary }]}>{phase}</Text>
        )}
      </View>
      <ChevronRight size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

function RegionalBreakdownCard({ regions, t }: { regions: RegionalBreakdown[]; t: any }) {
  const { colors } = useTheme();
  
  const getRegionTranslationKey = (region: string): string => {
    const regionMap: Record<string, string> = {
      'Asia': 'region_asia',
      'Africa': 'region_africa',
      'Europe': 'region_europe',
      'Latin America': 'region_latinAmerica',
      'Middle East': 'region_middleEast',
      'North America': 'region_northAmerica',
      'Oceania': 'region_oceania',
    };
    return regionMap[region] || 'region_asia';
  };
  
  const sortedRegions = [...regions].sort((a, b) => b.articleCount - a.articleCount);
  
  return (
    <View style={styles.regionalSection}>
      <View style={styles.regionalHeader}>
        <Globe size={16} color={colors.textSecondary} />
        <Text style={[styles.regionalTitle, { color: colors.text }]}>{t('learn.regionalBreakdown')}</Text>
      </View>
      <View style={styles.regionalCompactGrid}>
        {sortedRegions.map((region, idx) => (
          <View key={idx} style={[styles.regionCompactItem, { backgroundColor: colors.surfaceHighlight }]}>
            <Text style={[styles.regionCompactName, { color: colors.text }]}>
              {t(`learn.${getRegionTranslationKey(region.regionDisplay || region.region)}`)}
            </Text>
            <Text style={[styles.regionCompactPercent, { color: colors.textSecondary }]}>
              {region.percentOfTotal?.toFixed(1) || 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function CalendarDetailModal({ calendar, visible, onClose }: { calendar: any; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.split('-')[0]?.toLowerCase() || 'en';
  
  if (!calendar) return null;
  
  const color = getCalendarColor(calendar);
  const { name: calendarName, date: calendarDate } = normalizeCalendar(calendar, lang);
  
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <View style={[styles.modalColorBar, { backgroundColor: color }]} />
            <View style={styles.modalHeaderText}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{calendarName}</Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>{calendarDate}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.modalClose}>
              <X size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {calendar.type && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('learn.calendarType') || 'Type'}</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{calendar.type}</Text>
              </View>
            )}
            
            {calendar.significance && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('learn.significance') || 'Significance'}</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{calendar.significance}</Text>
              </View>
            )}
            
            {calendar.energy && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('learn.energy') || 'Energy'}</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{calendar.energy}</Text>
              </View>
            )}
            
            {calendar.phase && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('learn.phase') || 'Phase'}</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{calendar.phase}</Text>
              </View>
            )}
            
            {calendar.element && (
              <View style={styles.modalSection}>
                <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>{t('learn.element')}</Text>
                <Text style={[styles.modalValue, { color: colors.text }]}>{calendar.element}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function WisdomScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  
  const [consciousness, setConsciousness] = useState<any>(null);
  const [calendars, setCalendars] = useState<any[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodologyVisible, setMethodologyVisible] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<any>(null);
  
  // Track current language for proper re-fetching
  const currentLang = i18n.language?.split('-')[0]?.toLowerCase() || 'en';

  useEffect(() => {
    // Reset state when language changes to trigger fresh fetch
    setLoading(true);
    setCalendars([]);
    setConsciousness(null);
    setRegionalData([]);
    
    async function loadData() {
      try {
        console.log('[WisdomScreen] Loading data with lang:', currentLang);
        
        const [consciousnessData, calendarsData, regionalResponse] = await Promise.all([
          api.getConsciousnessAnalysis().catch(() => null),
          api.getTraditionalCalendars(40.7128, -74.006, 'UTC', currentLang).catch(() => []),
          api.getRegionalBreakdown().catch(() => null),
        ]);
        
        setConsciousness(consciousnessData);
        setCalendars(calendarsData || []);
        if (regionalResponse?.success && regionalResponse?.data?.regions) {
          setRegionalData(regionalResponse.data.regions);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentLang]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>{t('learn.title')}</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{t('learn.subtitle')}</Text>
          </View>
          <View style={styles.section}>
            <SkeletonCard style={{ width: '100%', height: 280, borderRadius: 16, marginBottom: 20 }} />
            <SkeletonCard style={{ width: '100%', height: 200, borderRadius: 16 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const tqfScore = consciousness?.global_coherence ?? consciousness?.tqf_score ?? 0;
  const filteredScore = consciousness?.filtered_coherence ?? null;
  const transformationalPercent = consciousness?.transformational_percent ?? 0;
  const destructivePercent = consciousness?.destructive_percent ?? 0;
  const neutralPercent = 100 - transformationalPercent - destructivePercent;
  const hopeLevel = consciousness?.hope_level ?? 0;
  const trend7d = consciousness?.trend_7d ?? 'stable';
  const articlesAnalyzed = consciousness?.articles_analyzed ?? 0;
  const contentSources: string[] = consciousness?.content_sources ?? [];
  
  const hasFilteredData = filteredScore !== null && filteredScore > 0;
  // Data is only unavailable if BOTH main consciousness AND filtered data are missing/zero
  const isConsciousnessUnavailable = tqfScore === 0 && articlesAnalyzed === 0 && !hasFilteredData;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>{t('learn.title')}</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{t('learn.subtitle')}</Text>
        </View>

        {/* Global Consciousness Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Brain size={20} color="#8b5cf6" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('learn.globalConsciousness')}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('learn.globalConsciousnessDesc')}</Text>
          
          <View style={[styles.consciousnessCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {isConsciousnessUnavailable ? (
              <View style={styles.unavailableContainer}>
                <Brain size={40} color={colors.textTertiary} />
                <Text style={[styles.unavailableTitle, { color: colors.text }]}>{t('learn.dataTemporarilyUnavailable')}</Text>
                <Text style={[styles.unavailableDesc, { color: colors.textSecondary }]}>{t('learn.consciousnessUnavailableDesc')}</Text>
              </View>
            ) : (
              <>
                {/* MEDIA REALITY - First gauge (red, misaligned) */}
                <View style={styles.narrativeSection}>
                  <TQFGauge 
                    score={tqfScore} 
                    size={140} 
                    label={t('learn.rawScore')} 
                    subtitle={t('learn.mediaRealityDesc').replace('{{count}}', formatNumberByLocale(articlesAnalyzed))}
                    forceColor="#ef4444"
                  />
                </View>
                
                {/* CONTENT BREAKDOWN - Shows why media is broken */}
                <View style={styles.breakdownSection}>
                  <PercentageBar 
                    label={t('learn.destructive')} 
                    hint={t('learn.destructiveHint')}
                    value={destructivePercent} 
                    color="#ef4444" 
                  />
                  <PercentageBar 
                    label={t('learn.neutral')} 
                    hint={t('learn.neutralHint')}
                    value={neutralPercent} 
                    color="#6b7280" 
                  />
                  <PercentageBar 
                    label={t('learn.transformational')} 
                    hint={t('learn.transformationalHint')}
                    value={transformationalPercent} 
                    color="#10b981" 
                  />
                </View>

                {/* SIGNAL WITHIN - Filtered gauge (green) with trend - moved before article count */}
                {hasFilteredData && (
                  <View style={styles.narrativeSectionSpaced}>
                    <View style={styles.signalWithTrendRow}>
                      <TQFGauge 
                        score={filteredScore} 
                        size={140} 
                        label={t('learn.filteredScore')} 
                        subtitle={t('learn.signalWithinDesc').replace('{{count}}', formatNumberByLocale(Math.round(articlesAnalyzed * transformationalPercent / 100)))}
                        forceColor="#10b981"
                      />
                      <View style={styles.trendSideBadge}>
                        <TrendIndicator trend={trend7d} />
                      </View>
                    </View>
                  </View>
                )}
                
                {/* ANALYSIS SUMMARY - Article count and content sources */}
                <View style={[styles.analysisSummary, { borderTopColor: colors.border }]}>
                  <View style={styles.articleCountRow}>
                    <FileText size={16} color={colors.textSecondary} />
                    <Text style={[styles.articleCountText, { color: colors.text }]}>
                      {formatNumberByLocale(articlesAnalyzed)} {t('learn.articlesAnalyzed')}
                    </Text>
                  </View>
                  {contentSources.length > 0 && (
                    <View style={styles.contentSourcesRow}>
                      <Text style={[styles.contentSourcesLabel, { color: colors.textSecondary }]}>
                        {t('learn.contentSources')}:
                      </Text>
                      <View style={styles.sourceTagsContainer}>
                        {contentSources.map((source, idx) => (
                          <View key={idx} style={[styles.sourceTag, { backgroundColor: colors.border }]}>
                            <Text style={[styles.sourceTagText, { color: colors.textSecondary }]}>{source}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* REGIONAL BREAKDOWN - Geographic distribution (compact) */}
                {regionalData.length > 0 && (
                  <RegionalBreakdownCard regions={regionalData} t={t} />
                )}
                
                {/* Narrative hint */}
                <View style={styles.signalNoiseHint}>
                  <Text style={[styles.signalNoiseText, { color: colors.textTertiary }]}>
                    {t('learn.signalBeneathNoise')}
                  </Text>
                </View>
              </>
            )}
            
            <TouchableOpacity 
              style={[styles.methodologyBtn, { borderColor: colors.border }]}
              onPress={() => setMethodologyVisible(true)}
            >
              <Info size={16} color={colors.textSecondary} />
              <Text style={[styles.methodologyText, { color: colors.textSecondary }]}>{t('learn.methodology')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Wisdom Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#e67e22" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('learn.calendarWisdom')}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('learn.calendarWisdomDesc')}</Text>
          
          {calendars.length > 0 ? (
            <View style={styles.calendarList}>
              {calendars.map((cal, idx) => (
                <CalendarCard 
                  key={`${idx}-${currentLang}`} 
                  calendar={cal} 
                  lang={currentLang}
                  onPress={() => setSelectedCalendar(cal)} 
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('learn.noDataAvailable') || 'No calendar data available'}</Text>
            </View>
          )}
        </View>

      </ScrollView>
      
      {/* Methodology Modal */}
      <Modal visible={methodologyVisible} animationType="fade" transparent>
        <TouchableOpacity 
          style={styles.methodologyOverlay} 
          activeOpacity={1} 
          onPress={() => setMethodologyVisible(false)}
        >
          <View style={[styles.methodologyContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.methodologyTitle, { color: colors.text }]}>{t('learn.methodology')}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
              <Text style={[styles.methodologyDesc, { color: colors.textSecondary }]}>{t('learn.methodologyDesc')}</Text>
              
              <View style={styles.methodologySection}>
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.rawScore')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.mediaRealityExplainedDesc')}</Text>
              </View>
              
              <View style={styles.methodologySection}>
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.filteredScore')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.signalWithinExplainedDesc')}</Text>
              </View>
              
              <View style={styles.methodologySection}>
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.transformationalExplained')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.transformationalExplainedDesc')}</Text>
              </View>
              
              <View style={styles.methodologySection}>
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.destructiveExplained')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.destructiveExplainedDesc')}</Text>
              </View>
              
              <View style={styles.methodologySection}>
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.trendExplained')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.trendExplainedDesc')}</Text>
              </View>
              
              <View style={[styles.faqDivider, { backgroundColor: colors.border }]} />
              <Text style={[styles.faqSectionTitle, { color: colors.text }]}>{t('learn.aboutThisData')}</Text>
              
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{t('learn.faq1Question')}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{t('learn.faq1Answer')}</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{t('learn.faq2Question')}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{t('learn.faq2Answer')}</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{t('learn.faq3Question')}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{t('learn.faq3Answer')}</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{t('learn.faq4Question')}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{t('learn.faq4Answer')}</Text>
              </View>
              
              <View style={styles.faqItem}>
                <Text style={[styles.faqQuestion, { color: colors.text }]}>{t('learn.faq5Question')}</Text>
                <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{t('learn.faq5Answer')}</Text>
              </View>
            </ScrollView>
            
            <TouchableOpacity 
              style={[styles.methodologyCloseBtn, { backgroundColor: colors.surfaceHighlight }]}
              onPress={() => setMethodologyVisible(false)}
            >
              <Text style={[styles.methodologyCloseText, { color: colors.text }]}>{t('common.close')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Calendar Detail Modal */}
      <CalendarDetailModal 
        calendar={selectedCalendar} 
        visible={!!selectedCalendar} 
        onClose={() => setSelectedCalendar(null)} 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  pageHeader: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  pageTitle: { fontSize: 34, fontWeight: '700', marginBottom: 8, letterSpacing: -0.5 },
  pageSubtitle: { fontSize: 16, lineHeight: 24 },
  section: { marginBottom: 32, paddingHorizontal: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  sectionTitle: { fontSize: 20, fontWeight: '600' },
  sectionSubtitle: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  skeleton: { borderRadius: 8 },
  
  consciousnessCard: { borderRadius: 16, padding: 24, borderWidth: 1 },
  gaugeSection: { alignItems: 'center', marginBottom: 28 },
  dualGaugeSection: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8, paddingHorizontal: 8 },
  gaugeColumn: { alignItems: 'center', flex: 1 },
  gaugeTitle: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  tqfLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  gaugeContainer: { alignItems: 'center' },
  gaugeValue: { position: 'absolute', alignItems: 'center', width: '100%' },
  gaugeValueInner: { position: 'absolute', alignItems: 'center', width: '100%' },
  gaugeScore: { fontSize: 36, fontWeight: '700' },
  gaugeLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  gaugeSubtitle: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  gaugeSubtitleBelow: { fontSize: 11, marginTop: 8, textAlign: 'center', paddingHorizontal: 10, lineHeight: 16 },
  narrativeSection: { alignItems: 'center', marginBottom: 32 },
  narrativeSectionSpaced: { alignItems: 'center', marginTop: 16, marginBottom: 40 },
  signalWithTrendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  trendSideBadge: { marginLeft: 8 },
  signalNoiseHint: { alignItems: 'center', marginBottom: 20, paddingHorizontal: 16 },
  signalNoiseText: { fontSize: 12, textAlign: 'center', fontStyle: 'italic', lineHeight: 18 },
  
  breakdownSection: { marginBottom: 32, gap: 20 },
  analysisSummary: { marginTop: 24, paddingTop: 20, marginBottom: 32, paddingHorizontal: 8, gap: 12, borderTopWidth: 1 },
  articleCountRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  articleCountText: { fontSize: 14, fontWeight: '600' },
  contentSourcesRow: { gap: 8 },
  contentSourcesLabel: { fontSize: 12 },
  sourceTagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  sourceTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  sourceTagText: { fontSize: 11 },
  percentageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  percentageLabel: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, width: 160 },
  percentageLabelText: { flexDirection: 'column' },
  percentageDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  percentageText: { fontSize: 13, fontWeight: '500' },
  percentageHint: { fontSize: 10, marginTop: 2 },
  percentageBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, marginLeft: 12 },
  percentageBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: 'hidden' },
  percentageBarFill: { height: '100%', borderRadius: 4 },
  percentageValue: { fontSize: 13, width: 40, textAlign: 'right', fontWeight: '500' },
  
  metricsRow: { flexDirection: 'row', gap: 24, marginBottom: 24, paddingTop: 8 },
  hopeMeterContainer: { flex: 1 },
  metricLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 10 },
  hopeMeterBar: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  hopeMeterSegment: { flex: 1, height: 8, borderRadius: 4 },
  hopeMeterValue: { fontSize: 14, fontWeight: '500' },
  
  trendContainer: { flex: 1 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trendValue: { fontSize: 14, fontWeight: '600' },
  
  articlesRow: { alignItems: 'center', marginBottom: 20 },
  articlesText: { fontSize: 13 },
  
  methodologyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderTopWidth: 1, marginTop: 4 },
  methodologyText: { fontSize: 13 },
  
  calendarList: { gap: 12 },
  calendarCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  calendarColorBar: { width: 4, height: '100%' },
  calendarContent: { flex: 1, padding: 16 },
  calendarName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  calendarDate: { fontSize: 14, marginBottom: 2 },
  calendarPhase: { fontSize: 12 },
  
  emptyCard: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  unavailableContainer: { alignItems: 'center', paddingVertical: 30 },
  unavailableTitle: { fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8 },
  unavailableDesc: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.1)' },
  modalColorBar: { width: 4, height: 50, borderRadius: 2, marginRight: 16 },
  modalHeaderText: { flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 15 },
  modalClose: { padding: 4 },
  modalBody: { padding: 20 },
  modalSection: { marginBottom: 20 },
  modalLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  modalValue: { fontSize: 16, lineHeight: 24 },
  
  methodologyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  methodologyContent: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, maxHeight: '80%' },
  methodologyTitle: { fontSize: 18, fontWeight: '600', marginBottom: 16 },
  methodologyDesc: { fontSize: 14, lineHeight: 22, marginBottom: 20 },
  methodologySection: { marginBottom: 16 },
  methodologySectionTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  methodologySectionDesc: { fontSize: 13, lineHeight: 20 },
  methodologyCloseBtn: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  methodologyCloseText: { fontSize: 15, fontWeight: '500' },
  
  regionalSection: { marginBottom: 24, paddingTop: 8 },
  regionalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  regionalTitle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.5 },
  regionalCompactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionCompactItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  regionCompactName: { fontSize: 12, fontWeight: '500', marginRight: 6 },
  regionCompactPercent: { fontSize: 12, fontWeight: '600' },
  analysisSummaryCompact: { marginBottom: 20, paddingHorizontal: 8, alignItems: 'center' },
  
  faqDivider: { height: 1, marginVertical: 20 },
  faqSectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 16 },
  faqItem: { marginBottom: 16 },
  faqQuestion: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  faqAnswer: { fontSize: 13, lineHeight: 19 },
});
