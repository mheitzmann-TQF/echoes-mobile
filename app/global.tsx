import { View, Text, StyleSheet } from 'react-native';

export default function GlobalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Global Consciousness</Text>
      <Text style={styles.text}>Real-time coherence monitoring coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  text: {
    color: '#888',
  },
});
