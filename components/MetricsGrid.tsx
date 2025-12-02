import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlanetaryData } from '../lib/api';

interface MetricsGridProps {
  planetary: PlanetaryData;
}

export default function MetricsGrid({ planetary }: MetricsGridProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('lunar');

  const lunarIllumination = Math.round(planetary.lunar.illumination);
  const geoKpIndex = planetary.geomagnetic.kpIndex || 2;
  const coherence = planetary.consciousness?.global_coherence || 68;

  const metrics = [
    {
      id: 'lunar',
      number: `${lunarIllumination}%`,
      numberLabel: 'Lunar',
      emoji: '🌙',
      cardTitle: planetary.lunar.phase,
      cardDesc: 'Lunar Phase',
    },
    {
      id: 'geomagnetism',
      number: `${geoKpIndex}`,
      numberLabel: 'Geomagnetism',
      emoji: '⚡',
      cardTitle: planetary.geomagnetic.activity,
      cardDesc: 'Geomagnetic',
    },
    {
      id: 'coherence',
      number: `${Math.round(coherence)}%`,
      numberLabel: 'Coherence',
      emoji: '🌐',
      cardTitle: 'Active',
      cardDesc: 'Field Strength',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Top Row: Numbers - Tappable */}
      <View style={styles.numbersRow}>
        {metrics.map((metric) => (
          <TouchableOpacity 
            key={metric.id}
            style={[
              styles.numberBox,
              selectedMetric === metric.id && styles.numberBoxActive
            ]}
            onPress={() => setSelectedMetric(metric.id)}
          >
            <Text style={styles.number}>{metric.number}</Text>
            <Text style={[
              styles.numberLabel,
              selectedMetric === metric.id && styles.numberLabelActive
            ]}>
              {metric.numberLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Row: Detail Cards - Aligned with numbers */}
      <View style={styles.cardsRow}>
        {metrics.map((metric) => (
          <View 
            key={metric.id}
            style={[
              styles.card,
              selectedMetric === metric.id && styles.cardActive
            ]}
          >
            <Text style={styles.emoji}>{metric.emoji}</Text>
            <Text style={styles.cardTitle}>{metric.cardTitle}</Text>
            <Text style={styles.cardDesc}>{metric.cardDesc}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  numbersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  numberBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  numberBoxActive: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  number: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 28,
  },
  numberLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: 4,
    letterSpacing: 0.5,
  },
  numberLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    opacity: 0.5,
  },
  cardActive: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
    opacity: 1,
  },
  emoji: {
    fontSize: 20,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
    textAlign: 'center',
  },
  cardDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
