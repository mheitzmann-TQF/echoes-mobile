import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlanetaryData } from '../lib/api';

interface MetricsGridProps {
  planetary: PlanetaryData;
  onPressMetric?: (type: string) => void;
}

export default function MetricsGrid({ planetary, onPressMetric }: MetricsGridProps) {
  const lunarIllumination = Math.round(planetary.lunar.illumination);
  const geoKpIndex = planetary.geomagnetic.kpIndex || 2;
  const coherence = planetary.consciousness?.global_coherence || 68;

  return (
    <View style={styles.container}>
      {/* Top Row: Numbers */}
      <View style={styles.numbersRow}>
        <View style={styles.numberBox}>
          <Text style={styles.number}>{lunarIllumination}%</Text>
          <Text style={styles.numberLabel}>Lunar</Text>
        </View>
        
        <View style={styles.numberBox}>
          <Text style={styles.number}>{geoKpIndex}</Text>
          <Text style={styles.numberLabel}>Geomagnetism</Text>
        </View>
        
        <View style={styles.numberBox}>
          <Text style={styles.number}>{Math.round(coherence)}%</Text>
          <Text style={styles.numberLabel}>Coherence</Text>
        </View>
      </View>

      {/* Bottom Row: Detail Cards */}
      <View style={styles.cardsRow}>
        <TouchableOpacity 
          style={styles.card}
          onPress={() => onPressMetric?.('lunar')}
        >
          <Text style={styles.emoji}>🌙</Text>
          <Text style={styles.cardTitle}>{planetary.lunar.phase}</Text>
          <Text style={styles.cardDesc}>Lunar Phase</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => onPressMetric?.('geomagnetism')}
        >
          <Text style={styles.emoji}>⚡</Text>
          <Text style={styles.cardTitle}>{planetary.geomagnetic.activity}</Text>
          <Text style={styles.cardDesc}>Geomagnetic</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.card}
          onPress={() => onPressMetric?.('coherence')}
        >
          <Text style={styles.emoji}>🌐</Text>
          <Text style={styles.cardTitle}>Active</Text>
          <Text style={styles.cardDesc}>Field Strength</Text>
        </TouchableOpacity>
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
