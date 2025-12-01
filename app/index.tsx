import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function DailyScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Daily Echoes</Text>
        <Text style={styles.subtitle}>Wisdom aligned with your moment</Text>
      </View>

      <View style={styles.cardContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Lunar Phase</Text>
          <Text style={styles.cardContent}>Waning Gibbous</Text>
          <Text style={styles.cardDescription}>
            A time for reflection and releasing what no longer serves you.
            Let go of the old to make space for the new.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: width - 40,
    height: 400,
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 30,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  cardContent: {
    fontSize: 18,
    color: '#aaa',
    marginBottom: 20,
    textAlign: 'center',
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
