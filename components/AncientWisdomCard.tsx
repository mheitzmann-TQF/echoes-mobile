import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import type { AncientWisdomCulture } from '../lib/api';

interface AncientWisdomCardProps {
  culture: AncientWisdomCulture;
}

function getCultureColor(culture: string): string {
  switch (culture) {
    case 'ethiopian': return '#22C55E'; // Green (Ethiopian flag)
    case 'hindu': return '#F97316'; // Saffron orange (Hindu tradition)
    case 'hebrew': return '#3B82F6'; // Blue (Jewish tradition)
    case 'islamic': return '#10B981'; // Emerald green (Islamic tradition)
    case 'chinese': return '#EF4444'; // Red (Chinese tradition)
    case 'mayan': return '#A855F7'; // Purple (Mesoamerican)
    case 'yoruba': return '#DC2626'; // Deep red (Yoruba/African)
    case 'celtic': return '#16A34A'; // Forest green (Celtic/Irish)
    case 'egyptian': return '#F59E0B'; // Amber gold (Egyptian)
    default: return '#8B5CF6'; // Violet fallback
  }
}

export default function AncientWisdomCard({ culture }: AncientWisdomCardProps) {
  const { colors } = useTheme();
  const accentColor = getCultureColor(culture.culture);
  
  const getSubtitle = (): string => {
    if (culture.daySign) return culture.daySign;
    if (culture.dayName) return culture.dayName;
    if (culture.tree) return culture.tree;
    if (culture.tithi) return culture.tithi;
    if (culture.decan) return culture.decan;
    if (culture.deity) return culture.deity;
    return '';
  };
  
  const getDetail = (): string | null => {
    if (culture.element) return culture.element;
    if (culture.toneName) return `Tone: ${culture.toneName}`;
    if (culture.month) return culture.month;
    return null;
  };
  
  const subtitle = getSubtitle();
  const detail = getDetail();
  
  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.colorAccent, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{culture.icon}</Text>
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: colors.text }]}>{culture.name}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, { color: accentColor }]}>{subtitle}</Text>
            )}
          </View>
        </View>
        {detail && (
          <Text style={[styles.detail, { color: colors.textTertiary }]}>{detail}</Text>
        )}
        <Text style={[styles.message, { color: colors.textSecondary }]}>
          {culture.message}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  colorAccent: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  detail: {
    fontSize: 12,
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
  },
});
