import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

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
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={160} // approximate card width + gap
        decelerationRate="fast"
      >
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
              <View style={styles.infoIcon}>
                <Text style={styles.infoText}>i</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    width: 150,
    height: 100,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardName: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 4,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  cardType: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  infoIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    fontFamily: 'serif', // Using serif for 'i' to look more informational
  },
});
