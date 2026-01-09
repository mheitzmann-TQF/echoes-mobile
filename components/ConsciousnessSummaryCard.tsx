import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Brain, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import api from '../lib/api';

interface ConsciousnessData {
  global_coherence?: number;
  tqf_score?: number;
  transformational_percent?: number;
  destructive_percent?: number;
  neutral_percent?: number;
  hope_level?: string;
  trend_7d?: string;
  articles_analyzed?: number;
}

interface ConsciousnessSummaryCardProps {
  compact?: boolean;
}

export default function ConsciousnessSummaryCard({ compact = false }: ConsciousnessSummaryCardProps) {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [data, setData] = useState<ConsciousnessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const result = await api.getConsciousnessAnalysis();
        setData(result);
      } catch (error) {
        console.log('Consciousness fetch error:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [i18n.language]);

  const handlePress = () => {
    router.navigate('/wisdom');
  };

  if (loading || !data) {
    return null;
  }

  const score = data.global_coherence ?? data.tqf_score ?? 50;
  const trend = data.trend_7d ?? 'stable';
  
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

  const normalizedTrend = trend?.toLowerCase() || 'stable';
  let TrendIcon = Minus;
  let trendColor = colors.textSecondary;
  
  if (normalizedTrend.includes('up') || normalizedTrend.includes('rising') || normalizedTrend.includes('increasing')) {
    TrendIcon = TrendingUp;
    trendColor = '#10b981';
  } else if (normalizedTrend.includes('down') || normalizedTrend.includes('falling') || normalizedTrend.includes('decreasing')) {
    TrendIcon = TrendingDown;
    trendColor = '#ef4444';
  }

  const scoreColor = getScoreColor(score);

  if (compact) {
    return (
      <TouchableOpacity 
        style={[styles.compactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={styles.compactContent}>
          <Brain size={18} color="#8b5cf6" />
          <View style={styles.compactTextContainer}>
            <Text style={[styles.compactLabel, { color: colors.textSecondary }]}>{t('learn.globalConsciousness')}</Text>
            <View style={styles.compactValueRow}>
              <Text style={[styles.compactScore, { color: scoreColor }]}>{Math.round(score)}</Text>
              <Text style={[styles.compactLabel2, { color: colors.textTertiary }]}>{getScoreLabel(score)}</Text>
            </View>
          </View>
        </View>
        <View style={styles.compactRight}>
          <TrendIcon size={16} color={trendColor} />
          <ChevronRight size={18} color={colors.textTertiary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Brain size={20} color="#8b5cf6" />
          <Text style={[styles.title, { color: colors.text }]}>{t('learn.globalConsciousness')}</Text>
        </View>
        <ChevronRight size={20} color={colors.textTertiary} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.scoreSection}>
          <Text style={[styles.scoreValue, { color: scoreColor }]}>{Math.round(score)}</Text>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>{getScoreLabel(score)}</Text>
        </View>
        
        <View style={styles.trendSection}>
          <View style={styles.trendRow}>
            <TrendIcon size={16} color={trendColor} />
            <Text style={[styles.trendText, { color: trendColor }]}>{t('learn.trend7d')}</Text>
          </View>
        </View>
      </View>
      
      <Text style={[styles.tapHint, { color: colors.textTertiary }]}>{t('learn.tapToExplore')}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 13,
  },
  trendSection: {
    alignItems: 'flex-end',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 11,
    marginTop: 12,
    textAlign: 'center',
  },
  
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  compactTextContainer: {
    gap: 2,
  },
  compactLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  compactValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  compactScore: {
    fontSize: 20,
    fontWeight: '700',
  },
  compactLabel2: {
    fontSize: 11,
  },
  compactRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
