import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import EchoCard from './EchoCard';
import { Echo } from '../lib/api';
import { useTheme } from '../lib/ThemeContext';

interface EchoStackProps {
  echoes: Echo[];
  currentIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  selectedMetric?: string;
}

export default function EchoStack({ echoes, currentIndex, onSwipeLeft, onSwipeRight, selectedMetric }: EchoStackProps) {
  const { colors } = useTheme();
  // Always show all echoes - no filtering
  const visibleEchoes = echoes.slice(currentIndex, currentIndex + 3);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Echoes</Text>
      
      <View style={styles.stackContainer}>
        {visibleEchoes.length > 0 ? (
          visibleEchoes.map((echo, index) => (
            <EchoCard
              key={echo.id}
              echo={echo}
              index={index}
              totalCards={visibleEchoes.length}
              onSwipeLeft={onSwipeLeft}
              onSwipeRight={onSwipeRight}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>All echoes received for today.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 38,
    letterSpacing: -0.5,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  stackContainer: {
    height: 500,
    alignItems: 'center',
  },
  emptyState: {
    height: 400,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  ctaButton: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
