import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import { getApiLang } from '../lib/lang';
import api from '../lib/api';
import { cookieService } from '../lib/CookieService';
import { Calendar, MessageCircle, Sparkles, Moon, Clock, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

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

function TabSelector({ tabs, activeTab, onTabChange }: { tabs: { key: string; label: string }[]; activeTab: string; onTabChange: (key: string) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.tabContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, activeTab === tab.key && { backgroundColor: colors.surfaceHighlight }]}
          onPress={() => onTabChange(tab.key)}
        >
          <Text style={[styles.tabText, { color: activeTab === tab.key ? colors.text : colors.textSecondary }]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function ChipList({ items, color }: { items: string[]; color: string }) {
  const { colors } = useTheme();
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.chipContainer}>
      {items.map((item, idx) => (
        <View key={idx} style={[styles.chip, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}>
          <Text style={[styles.chipText, { color }]}>{item.replace(/_/g, ' ')}</Text>
        </View>
      ))}
    </View>
  );
}

function GuidanceCard({ title, content, color = '#9b59b6' }: { title: string; content: string; color?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.guidanceCard, { backgroundColor: color + '15', borderLeftColor: color }]}>
      <Text style={[styles.guidanceTitle, { color }]}>{title}</Text>
      <Text style={[styles.guidanceContent, { color: colors.textSecondary }]}>{content}</Text>
    </View>
  );
}

function CeremonialTimingCard({ ceremony }: { ceremony: any }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  if (!ceremony) return null;
  
  const formatTitle = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  return (
    <View style={[styles.ceremonialCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.ceremonialHeader}>
        <Moon size={18} color="#9b59b6" />
        <Text style={[styles.ceremonialTitle, { color: colors.text }]}>{formatTitle(ceremony.ceremony || '')}</Text>
      </View>
      
      {ceremony.duration && (
        <View style={styles.ceremonialRow}>
          <Text style={[styles.ceremonialLabel, { color: colors.textSecondary }]}>{t('learn.duration')}:</Text>
          <Text style={[styles.ceremonialValue, { color: colors.textTertiary }]}>{ceremony.duration.replace(/_/g, ' ')}</Text>
        </View>
      )}
      
      {ceremony.intentions && ceremony.intentions.length > 0 && (
        <View style={styles.ceremonialSection}>
          <Text style={[styles.ceremonialLabel, { color: colors.textSecondary }]}>{t('learn.intentions')}</Text>
          <ChipList items={ceremony.intentions} color="#9b59b6" />
        </View>
      )}
      
      {ceremony.soloPractices && ceremony.soloPractices.length > 0 && (
        <View style={styles.ceremonialSection}>
          <Text style={[styles.ceremonialLabel, { color: colors.textSecondary }]}>{t('learn.soloPractices')}</Text>
          <Text style={[styles.ceremonialValue, { color: colors.textTertiary }]}>
            {ceremony.soloPractices.join(' • ')}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function WisdomScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  
  const [livingCalendars, setLivingCalendars] = useState<any[]>([]);
  const [oralTraditions, setOralTraditions] = useState<any[]>([]);
  const [plantMedicine, setPlantMedicine] = useState<any[]>([]);
  const [ceremonialTimings, setCeremonialTimings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [livingTab, setLivingTab] = useState('vedic');
  const [oralTab, setOralTab] = useState('weather');
  
  const [cookie, setCookie] = useState<string | null>(null);
  const [cookieLoading, setCookieLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const lang = getApiLang();
        const [living, oral, plants, ceremonial] = await Promise.all([
          api.getLivingCalendars(lang).catch(() => []),
          api.getOralTraditions(lang).catch(() => []),
          api.getPlantMedicineTiming(lang).catch(() => []),
          api.getCeremonialTimings(lang).catch(() => []),
        ]);
        setLivingCalendars(living);
        setOralTraditions(oral);
        setPlantMedicine(plants);
        setCeremonialTimings(ceremonial);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [i18n.language]);

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

  const vedic = livingCalendars.find(c => c.culture === 'hindu_vedic' || c.calendarSystem === 'vedic_panchang');
  const aztec = livingCalendars.find(c => c.culture === 'aztec_mesoamerican' || c.calendarSystem === 'aztec_tonalpohualli');
  const activeLivingCalendar = livingTab === 'vedic' ? vedic : aztec;

  // Filter oral traditions - match both English API keys and translated values
  // Covers all 6 supported languages: EN, ES, FR, DE, PT, IT
  const isWeatherTradition = (type: string) => {
    if (!type) return false;
    const t = type.toLowerCase();
    return t === 'weather_prophecy' || 
      t.includes('weather') ||           // EN
      t.includes('météo') ||              // FR
      t.includes('prophétie') ||          // FR
      t.includes('clima') ||              // ES/IT/PT
      t.includes('tiempo') ||             // ES
      t.includes('wetter') ||             // DE
      t.includes('prophezeiung') ||       // DE
      t.includes('previsão') ||           // PT
      t.includes('meteorolog');           // IT/multi
  };
  
  const isDreamTradition = (type: string) => {
    if (!type) return false;
    const t = type.toLowerCase();
    return t === 'dream_time' || 
      t.includes('dream') ||              // EN
      t.includes('rêve') ||               // FR
      t.includes('sueño') ||              // ES
      t.includes('traum') ||              // DE
      t.includes('sonho') ||              // PT
      t.includes('sogno');                // IT
  };
  
  const weatherTraditions = oralTraditions.filter(t => isWeatherTradition(t.traditionType));
  const dreamTraditions = oralTraditions.filter(t => isDreamTradition(t.traditionType));
  
  const activeOralTraditions = oralTab === 'weather' ? weatherTraditions : oralTab === 'dreaming' ? dreamTraditions : [];

  const formatCulture = (s: string) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

  const livingTabs = [
    { key: 'vedic', label: t('learn.vedic') },
    { key: 'aztec', label: t('learn.aztec') },
  ];

  const oralTabs = [
    { key: 'weather', label: t('learn.weather') },
    { key: 'plants', label: t('learn.plants') },
    { key: 'dreaming', label: t('learn.dreaming') },
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.pageHeader}>
            <Text style={[styles.pageTitle, { color: colors.text }]}>{t('learn.title')}</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textSecondary }]}>{t('learn.subtitle')}</Text>
          </View>
          <View style={styles.section}>
            <SkeletonCard style={{ width: '100%', height: 300, borderRadius: 16, marginBottom: 20 }} />
            <SkeletonCard style={{ width: '100%', height: 250, borderRadius: 16 }} />
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

        {/* Living Calendar Wisdom */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color="#e67e22" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('learn.livingCalendarWisdom')}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('learn.livingCalendarDesc2')}</Text>
          
          <TabSelector tabs={livingTabs} activeTab={livingTab} onTabChange={setLivingTab} />
          
          {activeLivingCalendar ? (
            <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Star size={18} color="#e67e22" />
                <View style={styles.cardHeaderText}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>{activeLivingCalendar.cycleName}</Text>
                  <Text style={[styles.cardCulture, { color: colors.textTertiary }]}>{formatCulture(activeLivingCalendar.culture)}</Text>
                </View>
              </View>
              
              {activeLivingCalendar.dailyGuidance && (
                <GuidanceCard title={t('learn.dailyGuidance')} content={activeLivingCalendar.dailyGuidance} color="#e67e22" />
              )}
              
              {activeLivingCalendar.spiritualThemes && activeLivingCalendar.spiritualThemes.length > 0 && (
                <View style={styles.themesSection}>
                  <Text style={[styles.themesLabel, { color: colors.textSecondary }]}>{t('learn.spiritualThemes')}</Text>
                  <ChipList items={activeLivingCalendar.spiritualThemes.slice(0, 4)} color="#e67e22" />
                </View>
              )}
              
              {activeLivingCalendar.agriculturalWisdom && activeLivingCalendar.agriculturalWisdom.length > 0 && (
                <View style={styles.themesSection}>
                  <Text style={[styles.themesLabel, { color: colors.textSecondary }]}>{t('learn.agriculturalWisdom')}</Text>
                  <ChipList items={activeLivingCalendar.agriculturalWisdom.slice(0, 4)} color="#27ae60" />
                </View>
              )}
              
              {activeLivingCalendar.ceremonialPractices && activeLivingCalendar.ceremonialPractices.length > 0 && (
                <View style={styles.themesSection}>
                  <Text style={[styles.themesLabel, { color: colors.textSecondary }]}>{t('learn.ceremonialPractices')}</Text>
                  <ChipList items={activeLivingCalendar.ceremonialPractices.slice(0, 4)} color="#9b59b6" />
                </View>
              )}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('learn.noDataAvailable')}</Text>
            </View>
          )}
          
          {/* Ceremonial Timing */}
          {ceremonialTimings.length > 0 && (
            <View style={styles.ceremonialSection}>
              <View style={styles.sectionHeader}>
                <Clock size={18} color="#9b59b6" />
                <Text style={[styles.subSectionTitle, { color: colors.text }]}>{t('learn.ceremonialTiming')}</Text>
              </View>
              {ceremonialTimings.slice(0, 1).map((ceremony, idx) => (
                <CeremonialTimingCard key={idx} ceremony={ceremony} />
              ))}
            </View>
          )}
        </View>

        {/* Oral Tradition Wisdom */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageCircle size={20} color="#2ecc71" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('learn.oralTraditionWisdom')}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('learn.oralTraditionDesc2')}</Text>
          
          <TabSelector tabs={oralTabs} activeTab={oralTab} onTabChange={setOralTab} />
          
          {oralTab === 'plants' ? (
            plantMedicine.length > 0 ? (
              <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {plantMedicine.map((plant, idx) => {
                  const harvestText = plant.harvestTiming 
                    ? Object.entries(plant.harvestTiming).map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${v}`).join('\n')
                    : null;
                  const spiritualText = plant.spiritualProperties
                    ? Object.entries(plant.spiritualProperties).map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${v}`).join('\n')
                    : null;
                  return (
                  <View key={idx} style={[styles.traditionCard, idx === 0 && styles.firstTraditionCard, { borderColor: colors.border }]}>
                    <View style={styles.traditionHeader}>
                      <Star size={16} color="#27ae60" />
                      <View>
                        <Text style={[styles.traditionName, { color: colors.text }]}>{plant.plantName}</Text>
                        <Text style={[styles.traditionCulture, { color: colors.textTertiary }]}>{formatCulture(plant.culture || '')}</Text>
                      </View>
                    </View>
                    
                    {plant.ceremonyRole && (
                      <GuidanceCard title={t('learn.dailyGuidance')} content={plant.ceremonyRole} color="#27ae60" />
                    )}
                    
                    {harvestText && (
                      <View style={styles.relevanceSection}>
                        <Text style={[styles.relevanceLabel, { color: colors.textSecondary }]}>{t('learn.ceremonialTiming')}</Text>
                        <Text style={[styles.relevanceText, { color: colors.textTertiary }]}>{harvestText}</Text>
                      </View>
                    )}
                    
                    {spiritualText && (
                      <View style={styles.relevanceSection}>
                        <Text style={[styles.relevanceLabel, { color: colors.textSecondary }]}>{t('learn.spiritualThemes')}</Text>
                        <Text style={[styles.relevanceText, { color: colors.textTertiary }]}>{spiritualText}</Text>
                      </View>
                    )}
                    
                    {plant.modernResearch && (
                      <View style={styles.relevanceSection}>
                        <Text style={[styles.relevanceLabel, { color: colors.textSecondary }]}>{t('learn.modernRelevance')}</Text>
                        <Text style={[styles.relevanceText, { color: colors.textTertiary }]}>{plant.modernResearch}</Text>
                      </View>
                    )}
                  </View>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('learn.noDataAvailable')}</Text>
              </View>
            )
          ) : activeOralTraditions.length > 0 ? (
            <View style={[styles.contentCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {activeOralTraditions.map((tradition, idx) => (
                <View key={idx} style={[styles.traditionCard, idx === 0 && styles.firstTraditionCard, { borderColor: colors.border }]}>
                  <View style={styles.traditionHeader}>
                    <Star size={16} color="#f1c40f" />
                    <View>
                      <Text style={[styles.traditionName, { color: colors.text }]}>{tradition.traditionName}</Text>
                      <Text style={[styles.traditionCulture, { color: colors.textTertiary }]}>{formatCulture(tradition.culture)}</Text>
                    </View>
                  </View>
                  
                  {tradition.dreamTimeNarrative && (
                    <GuidanceCard title={t('learn.dreamingNarrative')} content={tradition.dreamTimeNarrative} color="#9b59b6" />
                  )}
                  
                  {tradition.prophecyPattern && (
                    <GuidanceCard title={t('learn.prophecyPattern')} content={tradition.prophecyPattern} color="#3498db" />
                  )}
                  
                  {tradition.modernRelevance && (
                    <View style={styles.relevanceSection}>
                      <Text style={[styles.relevanceLabel, { color: colors.textSecondary }]}>{t('learn.modernRelevance')}</Text>
                      <Text style={[styles.relevanceText, { color: colors.textTertiary }]}>{tradition.modernRelevance}</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('learn.noDataAvailable')}</Text>
            </View>
          )}
        </View>

        {/* The Cookie */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sparkles size={20} color="#f1c40f" />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('learn.theCookie')}</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>{t('learn.cookieSubtitle')}</Text>
          
          <View style={[styles.cookieCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {cookieLoading ? (
              <SkeletonCard style={{ width: '100%', height: 60, borderRadius: 8 }} />
            ) : (
              <Text style={[styles.cookieText, { color: colors.text }]}>"{cookie}"</Text>
            )}
            
            <View style={[styles.cookieFooter, { borderTopColor: colors.border }]}>
              <Text style={[styles.cookieDisclaimer, { color: colors.textTertiary }]}>
                {t('learn.cookieFictionalDisclaimer')}
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
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
  subSectionTitle: { fontSize: 16, fontWeight: '600' },
  tabContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 16, borderWidth: 1 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  tabText: { fontSize: 14, fontWeight: '500' },
  contentCard: { borderRadius: 16, padding: 20, borderWidth: 1, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 16 },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  cardCulture: { fontSize: 13 },
  guidanceCard: { borderRadius: 12, padding: 16, borderLeftWidth: 3, marginBottom: 16 },
  guidanceTitle: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
  guidanceContent: { fontSize: 15, lineHeight: 22 },
  themesSection: { marginTop: 8 },
  themesLabel: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  chipContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 12, fontWeight: '500' },
  ceremonialSection: { marginTop: 20 },
  ceremonialCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  ceremonialHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  ceremonialTitle: { fontSize: 16, fontWeight: '600' },
  ceremonialRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  ceremonialLabel: { fontSize: 13, fontWeight: '500' },
  ceremonialValue: { fontSize: 13 },
  oralHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  oralSectionName: { fontSize: 16, fontWeight: '600' },
  traditionCard: { borderTopWidth: 1, paddingTop: 16, marginTop: 16 },
  firstTraditionCard: { borderTopWidth: 0, paddingTop: 0, marginTop: 0 },
  traditionHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  traditionName: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
  traditionCulture: { fontSize: 13 },
  relevanceSection: { marginTop: 12 },
  relevanceLabel: { fontSize: 13, fontWeight: '500', marginBottom: 4 },
  relevanceText: { fontSize: 14, lineHeight: 20 },
  emptyCard: { borderRadius: 16, padding: 40, borderWidth: 1, alignItems: 'center' },
  emptyText: { fontSize: 14 },
  cookieCard: { borderRadius: 16, padding: 20, borderWidth: 1 },
  cookieText: { fontSize: 18, fontStyle: 'italic', lineHeight: 28, textAlign: 'center' },
  cookieFooter: { borderTopWidth: 1, marginTop: 16, paddingTop: 12 },
  cookieDisclaimer: { fontSize: 12, textAlign: 'center' },
  skeleton: { borderRadius: 8 },
});
