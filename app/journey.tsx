import { View, Text, StyleSheet } from 'react-native';

export default function JourneyScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Journey</Text>
      <Text style={styles.text}>Track your personal patterns and engagement.</Text>
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
