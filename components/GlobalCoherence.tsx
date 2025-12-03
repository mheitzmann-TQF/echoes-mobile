import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../lib/ThemeContext';

interface GlobalCoherenceProps {
  value: number; // 0-100
}

export default function GlobalCoherence({ value }: GlobalCoherenceProps) {
  const { colors } = useTheme();
  const getLabel = (v: number) => {
    if (v < 30) return 'Low';
    if (v < 60) return 'Moderate';
    if (v < 80) return 'High';
    return 'Peak';
  };

  const getColor = (v: number) => {
    if (v < 30) return '#a2d2ff'; // Cool
    if (v < 60) return '#cdb4db'; // Balanced
    if (v < 80) return '#ffc8dd'; // Warm
    return '#ffafcc'; // Intense
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Global Coherence</Text>
          <Text style={[styles.value, { color: colors.text }]}>{value}%</Text>
        </View>
        
        <View style={[styles.track, { backgroundColor: colors.surfaceHighlight }]}>
          <View 
            style={[
              styles.fill, 
              { width: `${value}%`, backgroundColor: getColor(value) }
            ]} 
          />
        </View>
        
        <Text style={[styles.status, { color: colors.textSecondary }]}>{getLabel(value)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  status: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});
