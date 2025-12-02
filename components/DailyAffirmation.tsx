import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface DailyAffirmationProps {
  affirmation?: string;
}

export default function DailyAffirmation({ affirmation }: DailyAffirmationProps) {
  const defaultAffirmation = "Trust the rhythm of your becoming.";
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{affirmation || defaultAffirmation}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    marginTop: 16,
  },
  text: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
});
