import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlanetaryData } from '../lib/api';

interface MetricsGridProps {
  planetary: PlanetaryData;
  selectedMetric?: string;
  onSelectMetric?: (metric: string) => void;
}

export default function MetricsGrid({ planetary, selectedMetric = 'lunar', onSelectMetric }: MetricsGridProps) {

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
      <View style={styles.metricsRow}>
        {metrics.map((metric) => (
          <TouchableOpacity 
            key={metric.id}
            style={[
              styles.metricBox,
              selectedMetric === metric.id && styles.metricBoxActive
            ]}
            onPress={() => onSelectMetric?.(metric.id)}
          >
            <Text style={styles.emoji}>{metric.emoji}</Text>
            <Text style={styles.number}>{metric.number}</Text>
            <Text style={[
              styles.label,
              selectedMetric === metric.id && styles.labelActive
            ]}>
              {metric.numberLabel}
            </Text>
          </TouchableOpacity>
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
  metricBoxActive: {
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  number: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '500',
  },
  labelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
