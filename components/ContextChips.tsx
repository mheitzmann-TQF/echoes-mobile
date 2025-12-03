import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlanetaryData } from '../lib/api';
import { useTheme } from '../lib/ThemeContext';

interface ContextChipsProps {
  planetary: PlanetaryData;
  onPressChip?: (type: string) => void;
}

export default function ContextChips({ planetary, onPressChip }: ContextChipsProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onPressChip?.('lunar')}
      >
        <Text style={styles.emoji}>🌙</Text>
        <View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Lunar</Text>
          <Text style={[styles.value, { color: colors.text }]}>
            {planetary.lunar.phase} · {Math.round(planetary.lunar.illumination)}%
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => onPressChip?.('geomagnetic')}
      >
        <Text style={styles.emoji}>⚡</Text>
        <View>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Field</Text>
          <Text style={[styles.value, { color: colors.text }]}>{planetary.geomagnetic.activity}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emoji: {
    fontSize: 16,
    marginRight: 8,
  },
  label: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});
