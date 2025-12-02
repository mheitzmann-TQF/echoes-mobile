import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

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
  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {calendars.map((cal) => (
          <TouchableOpacity 
            key={cal.id} 
            style={styles.card}
            onPress={() => onSelect?.(cal)}
            activeOpacity={0.8}
          >
            <Text style={styles.cardName}>{cal.name}</Text>
            <Text style={styles.cardDate}>{cal.date}</Text>
            <View style={styles.typeContainer}>
              <Text style={styles.cardType}>{cal.type}</Text>
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
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 12,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    minHeight: 90,
    marginBottom: 8,
  },
  cardName: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
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
