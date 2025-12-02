import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MoodTemperatureProps {
  value: number; // 0-100
  label: string;
}

export default function MoodTemperature({ value, label }: MoodTemperatureProps) {
  // Determine color based on value
  const getColor = (v: number) => {
    if (v < 30) return '#a2d2ff'; // Cool/Calm
    if (v < 60) return '#cdb4db'; // Balanced/Neutral
    if (v < 80) return '#ffc8dd'; // Warm/Active
    return '#ffafcc'; // Intense/High
  };

  const barColor = getColor(value);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Field Temperature</Text>
        <Text style={styles.valueLabel}>{label} / {value}</Text>
      </View>
      
      <View style={styles.track}>
        <View 
          style={[
            styles.fill, 
            { width: `${value}%`, backgroundColor: barColor }
          ]} 
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  valueLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});
