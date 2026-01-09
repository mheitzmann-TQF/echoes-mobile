import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getApiLang } from '../lib/lang';
import api from '../lib/api';
import { Brain, Calendar, TrendingUp, TrendingDown, Minus, ChevronRight, Info, X } from 'lucide-react-native';
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

function TQFGauge({ score, size = 160 }: { score: number; size?: number }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  
  const clampedScore = Math.max(0, Math.min(100, score));
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const progress = (clampedScore / 100) * circumference;
  
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
  
  const color = getScoreColor(clampedScore);
  
  return (
    <View style={styles.gaugeContainer}>
      <Svg width={size} height={size / 2 + 20}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceHighlight}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          rotation={180}
          origin={`${size / 2}, ${size / 2}`}
          strokeDasharray={`${circumference}, ${circumference}`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          rotation={180}
          origin={`${size / 2}, ${size / 2}`}
          strokeDasharray={`${progress}, ${circumference}`}
        />
      </Svg>
      <View style={[styles.gaugeValue, { top: size / 2 - 30 }]}>
        <Text style={[styles.gaugeScore, { color }]}>{Math.round(clampedScore)}</Text>
        <Text style={[styles.gaugeLabel, { color: colors.textSecondary }]}>{getScoreLabel(clampedScore)}</Text>
      </View>
    </View>
  );
}

function PercentageBar({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  const clampedValue = Math.max(0, Math.min(100, value));
  
  return (
    <View style={styles.percentageRow}>
      <View style={styles.percentageLabel}>
        <View style={[styles.percentageDot, { backgroundColor: color }]} />
        <Text style={[styles.percentageText, { color: colors.text }]}>{label}</Text>
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
  const name = systemName.toLowerCase();
  if (name.includes('maya') || name.includes('tzolkin')) return 'maya';
  if (name.includes('chinese') || name.includes('chin') || name.includes('agricol')) return 'chinese';
  if (name.includes('hindu') || name.includes('panchang')) return 'hindu';
  if (name.includes('islam') || name.includes('hijri') || name.includes('muharram')) return 'islamic';
  if (name.includes('hebrew') || name.includes('hébr') || name.includes('tevet') || name.includes('jewish')) return 'hebrew';
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

function CalendarCard({ calendar, onPress }: { calendar: any; onPress: () => void }) {
  const { colors } = useTheme();
  const lang = getApiLang();
  
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

function CalendarDetailModal({ calendar, visible, onClose }: { calendar: any; visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const lang = getApiLang();
  
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
  const [loading, setLoading] = useState(true);
  const [methodologyVisible, setMethodologyVisible] = useState(false);
  const [selectedCalendar, setSelectedCalendar] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const lang = getApiLang();
        const [consciousnessData, calendarsData] = await Promise.all([
          api.getConsciousnessAnalysis().catch(() => null),
          api.getTraditionalCalendars(40.7128, -74.006, 'UTC', lang).catch(() => []),
        ]);
        
        setConsciousness(consciousnessData);
        setCalendars(calendarsData || []);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [i18n.language]);

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

  const tqfScore = consciousness?.global_coherence ?? consciousness?.tqf_score ?? 50;
  const transformationalPercent = consciousness?.transformational_percent ?? 33;
  const destructivePercent = consciousness?.destructive_percent ?? 33;
  const neutralPercent = consciousness?.neutral_percent ?? 34;
  const hopeLevel = consciousness?.hope_level ?? 'moderate';
  const trend7d = consciousness?.trend_7d ?? 'stable';
  const articlesAnalyzed = consciousness?.articles_analyzed ?? 52;

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
            <View style={styles.gaugeSection}>
              <Text style={[styles.tqfLabel, { color: colors.textSecondary }]}>{t('learn.tqfScore')}</Text>
              <TQFGauge score={tqfScore} />
            </View>
            
            <View style={styles.breakdownSection}>
              <PercentageBar 
                label={t('learn.transformational')} 
                value={transformationalPercent} 
                color="#10b981" 
              />
              <PercentageBar 
                label={t('learn.neutral')} 
                value={neutralPercent} 
                color="#6b7280" 
              />
              <PercentageBar 
                label={t('learn.destructive')} 
                value={destructivePercent} 
                color="#ef4444" 
              />
            </View>
            
            <View style={styles.metricsRow}>
              <HopeMeter level={hopeLevel} />
              <TrendIndicator trend={trend7d} />
            </View>
            
            <View style={styles.articlesRow}>
              <Text style={[styles.articlesText, { color: colors.textTertiary }]}>
                {formatNumberByLocale(articlesAnalyzed)} {t('learn.articlesAnalyzed').toLowerCase()}
              </Text>
            </View>
            
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
                  key={idx} 
                  calendar={cal} 
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
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.tqfScoreExplained')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.tqfScoreExplainedDesc')}</Text>
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
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.hopeLevelExplained')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.hopeLevelExplainedDesc')}</Text>
              </View>
              
              <View style={styles.methodologySection}>
                <Text style={[styles.methodologySectionTitle, { color: colors.text }]}>{t('learn.trendExplained')}</Text>
                <Text style={[styles.methodologySectionDesc, { color: colors.textSecondary }]}>{t('learn.trendExplainedDesc')}</Text>
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
  
  consciousnessCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  gaugeSection: { alignItems: 'center', marginBottom: 20 },
  tqfLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8 },
  gaugeContainer: { alignItems: 'center' },
  gaugeValue: { position: 'absolute', alignItems: 'center', width: '100%' },
  gaugeScore: { fontSize: 42, fontWeight: '700' },
  gaugeLabel: { fontSize: 13, marginTop: 4 },
  
  breakdownSection: { marginBottom: 20 },
  percentageRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  percentageLabel: { flexDirection: 'row', alignItems: 'center', gap: 8, width: 120 },
  percentageDot: { width: 8, height: 8, borderRadius: 4 },
  percentageText: { fontSize: 13, fontWeight: '500' },
  percentageBarContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 12 },
  percentageBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  percentageBarFill: { height: '100%', borderRadius: 3 },
  percentageValue: { fontSize: 12, width: 36, textAlign: 'right' },
  
  metricsRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  hopeMeterContainer: { flex: 1 },
  metricLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 8 },
  hopeMeterBar: { flexDirection: 'row', gap: 3, marginBottom: 6 },
  hopeMeterSegment: { flex: 1, height: 6, borderRadius: 3 },
  hopeMeterValue: { fontSize: 13, fontWeight: '500' },
  
  trendContainer: { flex: 1 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  trendValue: { fontSize: 13, fontWeight: '500' },
  
  articlesRow: { alignItems: 'center', marginBottom: 16 },
  articlesText: { fontSize: 12 },
  
  methodologyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderTopWidth: 1 },
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
});
