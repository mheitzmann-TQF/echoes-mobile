import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import type { AncientWisdomCulture } from '../lib/api';

interface AncientWisdomCardProps {
  culture: AncientWisdomCulture;
}

function getCultureColor(culture: string): string {
  switch (culture) {
    case 'mayan': return '#9b59b6';
    case 'yoruba': return '#e74c3c';
    case 'chinese': return '#e74c3c';
    case 'ethiopian': return '#f39c12';
    case 'celtic': return '#27ae60';
    case 'hindu': return '#f39c12';
    case 'egyptian': return '#3498db';
    default: return '#9b59b6';
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
    fontSize: 14,
    lineHeight: 20,
  },
});
