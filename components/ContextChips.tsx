import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { PlanetaryData } from '../lib/api';

interface ContextChipsProps {
  planetary: PlanetaryData;
  onPressChip?: (type: string) => void;
}

export default function ContextChips({ planetary, onPressChip }: ContextChipsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.chip}
        onPress={() => onPressChip?.('lunar')}
      >
        <Text style={styles.emoji}>🌙</Text>
        <View>
          <Text style={styles.label}>Lunar</Text>
          <Text style={styles.value}>
            {planetary.lunar.phase} · {Math.round(planetary.lunar.illumination)}%
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.chip}
        onPress={() => onPressChip?.('solar')}
      >
        <Text style={styles.emoji}>☀️</Text>
        <View>
          <Text style={styles.label}>Solar</Text>
          <Text style={styles.value}>{planetary.solar.currentPhase}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.chip}
        onPress={() => onPressChip?.('geomagnetic')}
      >
        <Text style={styles.emoji}>⚡</Text>
        <View>
          <Text style={styles.label}>Field</Text>
          <Text style={styles.value}>{planetary.geomagnetic.activity}</Text>
        </View>
      </TouchableOpacity>
      
       <TouchableOpacity 
        style={styles.chip}
        onPress={() => onPressChip?.('seasonal')}
      >
        <Text style={styles.emoji}>🍂</Text>
        <View>
          <Text style={styles.label}>Season</Text>
          <Text style={styles.value}>{planetary.seasonal.season}</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.chip}
        onPress={() => onPressChip?.('weather')}
      >
        <Text style={styles.emoji}>🌡️</Text>
        <View>
          <Text style={styles.label}>Weather</Text>
          <Text style={styles.value}>12°C · Clear</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.chip}
        onPress={() => onPressChip?.('culture')}
      >
        <Text style={styles.emoji}>🗓</Text>
        <View>
          <Text style={styles.label}>Culture</Text>
          <Text style={styles.value}>2 Observances</Text>
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
    marginBottom: 24,
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
