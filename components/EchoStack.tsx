import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import EchoCard from './EchoCard';
import { Echo } from '../lib/api';

interface EchoStackProps {
  echoes: Echo[];
  currentIndex: number;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export default function EchoStack({ echoes, currentIndex, onSwipeLeft, onSwipeRight }: EchoStackProps) {
  const visibleEchoes = echoes.slice(currentIndex, currentIndex + 3);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Today's Echoes</Text>
      
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
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>All echoes received for today.</Text>
          </View>
        )}
      </View>

      <View style={styles.indicatorContainer}>
        {echoes.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentIndex && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 40,
  },
  label: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 16,
    paddingHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
    width: 12,
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
