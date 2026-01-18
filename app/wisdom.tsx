import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getApiLang } from '../lib/lang';
import api, { RegionalBreakdown, AncientWisdomCulture } from '../lib/api';
import { Brain, Sparkles, TrendingUp, TrendingDown, Minus, Info, X, FileText, Globe } from 'lucide-react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import i18next from 'i18next';
import { useEntitlement } from '../lib/iap/useEntitlement';
import PausedOverlay from '../components/PausedOverlay';
import AncientWisdomCard from '../components/AncientWisdomCard';
import { cookieService } from '../lib/CookieService';

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
    return '#c9787a';
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
      <View style={{ width: size, height: svgHeight, overflow: Platform.OS === 'android' ? 'visible' : 'hidden' }}>
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
      color = '#c9787a';
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
      color = '#c9787a';
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

export default function WisdomScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const { isFullAccess, refresh } = useEntitlement();
  
  // Refresh entitlement when screen gains focus
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );
  
  const [consciousness, setConsciousness] = useState<any>(null);
  const [ancientWisdom, setAncientWisdom] = useState<AncientWisdomCulture[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [methodologyVisible, setMethodologyVisible] = useState(false);
  const [cookie, setCookie] = useState<string | null>(null);
  const [cookieLoading, setCookieLoading] = useState(true);
  
  // Track current language for proper re-fetching
  const currentLang = i18n.language?.split('-')[0]?.toLowerCase() || 'en';

  useEffect(() => {
    setLoading(true);
    setAncientWisdom([]);
    setConsciousness(null);
    setRegionalData([]);
    
    async function loadData() {
      try {
        console.log('[WisdomScreen] Loading data with lang:', currentLang);
        
        const [consciousnessData, wisdomData, regionalResponse] = await Promise.all([
          api.getConsciousnessAnalysis().catch(() => null),
          api.getWisdomCycle(currentLang).catch(() => null),
          api.getRegionalBreakdown().catch(() => null),
        ]);
        
        setConsciousness(consciousnessData);
        if (wisdomData?.cultures) {
          setAncientWisdom(wisdomData.cultures);
        }
        if (regionalResponse?.success && regionalResponse?.data?.regions) {
          setRegionalData(regionalResponse.data.regions);
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentLang]);

  useEffect(() => {
    async function loadCookie() {
      if (!i18n.language) return;
      setCookieLoading(true);
      try {
        const text = await cookieService.getCookie(i18n.language);
        setCookie(text);
      } catch {
        setCookie(null);
      } finally {
        setCookieLoading(false);
      }
    }
    loadCookie();
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

        {/* The Cookie - Daily reflection prompt */}
        {!cookieLoading && cookie && (
          <View style={[styles.cookieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.cookieAccent, { backgroundColor: colors.accent }]} />
            <View style={styles.cookieContent}>
              <Text style={[styles.cookieLabel, { color: colors.textTertiary }]}>{t('today.cookie')}</Text>
              <Text style={[styles.cookieText, { color: colors.text }]}>{cookie}</Text>
            </View>
          </View>
        )}

        {/* Ancient Wisdom Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color="#9b59b6" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('learn.ancientWisdom') || 'Ancient Wisdom'}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('learn.ancientWisdomDesc') || 'Daily guidance from ancient calendar traditions'}</Text>
          
          {ancientWisdom.length > 0 ? (
            <View style={styles.wisdomList}>
              {ancientWisdom.map((culture, idx) => (
                <AncientWisdomCard 
                  key={`${culture.culture}-${idx}`} 
                  culture={culture}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('learn.noDataAvailable') || 'No wisdom data available'}</Text>
            </View>
          )}
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
                    forceColor="#c9787a"
                  />
                </View>
                
                {/* CONTENT BREAKDOWN - Shows why media is broken */}
                <View style={styles.breakdownSection}>
                  <PercentageBar 
                    label={t('learn.destructive')} 
                    hint={t('learn.destructiveHint')}
                    value={destructivePercent} 
                    color="#c9787a" 
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

      </ScrollView>
      
      {/* Methodology Modal */}
      <Modal visible={methodologyVisible} animationType="fade" transparent onRequestClose={() => setMethodologyVisible(false)}>
        <TouchableOpacity 
          style={styles.methodologyOverlay} 
          activeOpacity={1} 
          onPress={() => setMethodologyVisible(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={[styles.methodologyContent, { backgroundColor: colors.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.methodologyHeaderRow}>
              <Text style={[styles.methodologyTitle, { color: colors.text }]}>{t('learn.methodology')}</Text>
              <TouchableOpacity onPress={() => setMethodologyVisible(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      
      {!isFullAccess && <PausedOverlay section="learn" onRefreshEntitlement={refresh} />}
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
  gaugeContainer: { alignItems: 'center', paddingBottom: Platform.OS === 'android' ? 48 : 16 },
  gaugeValue: { position: 'absolute', alignItems: 'center', width: '100%' },
  gaugeValueInner: { position: 'absolute', alignItems: 'center', width: '100%' },
  gaugeScore: { fontSize: 36, fontWeight: '700' },
  gaugeLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  gaugeSubtitle: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  gaugeSubtitleBelow: { fontSize: 11, marginTop: 8, textAlign: 'center', paddingHorizontal: 20, lineHeight: 16, maxWidth: 160 },
  narrativeSection: { alignItems: 'center', marginBottom: 32 },
  narrativeSectionSpaced: { alignItems: 'center', marginTop: 16, marginBottom: 40 },
  signalWithTrendRow: { flexDirection: 'row', alignItems: Platform.OS === 'android' ? 'flex-start' : 'center', justifyContent: 'center', gap: 16 },
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
  
  wisdomList: { gap: 12 },
  
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
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 15 },
  modalClose: { padding: 4 },
  modalBody: { padding: 20 },
  modalSection: { marginBottom: 20 },
  modalLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
  modalValue: { fontSize: 16, lineHeight: 24 },
  
  methodologyOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  methodologyContent: { borderRadius: 16, padding: 24, width: '100%', maxWidth: 380, maxHeight: '80%' },
  methodologyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  methodologyTitle: { fontSize: 18, fontWeight: '700' },
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
  
  cookieCard: { marginHorizontal: 20, marginBottom: 24, borderRadius: 16, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  cookieAccent: { width: 4 },
  cookieContent: { flex: 1, padding: 16 },
  cookieLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  cookieText: { fontSize: 16, lineHeight: 24 },
});
