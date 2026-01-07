import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Moon, Zap, Globe } from 'lucide-react-native';
import { PlanetaryData } from '../lib/api';
import { useTheme } from '../lib/ThemeContext';

interface MetricsGridProps {
  planetary: PlanetaryData;
}

export default function MetricsGrid({ planetary }: MetricsGridProps) {
  const { colors } = useTheme();

  const lunarIllumination = Math.round(planetary.lunar.illumination);
  const geoKpIndex = planetary.geomagnetic.kpIndex || 2;
  const coherence = planetary.consciousness?.global_coherence || 68;

  const metrics = [
    {
      id: 'lunar',
      number: `${lunarIllumination}%`,
      numberLabel: 'Lunar',
      icon: <Moon size={22} color={colors.text} />,
      cardTitle: planetary.lunar.phase,
      cardDesc: 'Lunar Phase',
    },
    {
      id: 'geomagnetism',
      number: `${geoKpIndex}`,
      numberLabel: 'Geomagnetism',
      icon: <Zap size={22} color={colors.text} />,
      cardTitle: planetary.geomagnetic.activity,
      cardDesc: 'Geomagnetic',
    },
    {
      id: 'coherence',
      number: `${Math.round(coherence)}%`,
      numberLabel: 'Coherence',
      icon: <Globe size={22} color={colors.text} />,
      cardTitle: 'Active',
      cardDesc: 'Field Strength',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <View 
            key={metric.id}
            style={[styles.metricBox, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={styles.iconContainer}>
              {metric.icon}
            </View>
            <Text style={[styles.number, { color: colors.text }]}>{metric.number}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              {metric.numberLabel}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 16,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  iconContainer: {
    marginBottom: 8,
  },
  number: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 4,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
    lineHeight: 14,
  },
});
