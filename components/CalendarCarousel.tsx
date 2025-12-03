import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../lib/ThemeContext';

interface CalendarData {
  id: string;
  name: string;
  date: string;
  type: string;
  description?: string;
}

interface CalendarCarouselProps {
  calendars: CalendarData[];
  onSelect?: (calendar: CalendarData) => void;
}

export default function CalendarCarousel({ calendars, onSelect }: CalendarCarouselProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {calendars.map((cal) => (
          <TouchableOpacity 
            key={cal.id} 
            style={[styles.card, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
            onPress={() => onSelect?.(cal)}
            activeOpacity={0.8}
          >
            <Text style={[styles.cardName, { color: colors.textTertiary }]}>{cal.name}</Text>
            <Text style={[styles.cardDate, { color: colors.text }]}>{cal.date}</Text>
            <View style={styles.typeContainer}>
              <Text style={[styles.cardType, { backgroundColor: colors.surface, color: colors.textSecondary }]}>{cal.type}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  card: {
    width: '31%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 10,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 85,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 3,
  },
  typeContainer: {
    marginTop: 8,
  },
  cardType: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
});
