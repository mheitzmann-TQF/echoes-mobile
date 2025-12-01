import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JourneyScreen() {
  const mockJourney = [
    { id: 1, date: 'Today', echoes: 5, theme: 'transformation' },
    { id: 2, date: 'Yesterday', echoes: 4, theme: 'connection' },
    { id: 3, date: 'Nov 29', echoes: 6, theme: 'awareness' },
    { id: 4, date: 'Nov 28', echoes: 3, theme: 'growth' },
    { id: 5, date: 'Nov 27', echoes: 5, theme: 'clarity' },
  ];

  const stats = {
    daysActive: 14,
    totalEchoes: 67,
    currentStreak: 7,
    favoriteTime: 'Morning',
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Journey</Text>
          <Text style={styles.subtitle}>Patterns in your awareness</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.daysActive}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.totalEchoes}</Text>
            <Text style={styles.statLabel}>Echoes</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightEmoji}>🌅</Text>
          <Text style={styles.insightTitle}>Peak Engagement</Text>
          <Text style={styles.insightText}>
            You resonate most with echoes in the {stats.favoriteTime.toLowerCase()}
          </Text>
        </View>

        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {mockJourney.map((day) => (
            <View key={day.id} style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{day.date}</Text>
                <Text style={styles.timelineEchoes}>
                  {day.echoes} echoes received
                </Text>
                <View style={styles.themeTag}>
                  <Text style={styles.themeText}>{day.theme}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.patternCard}>
          <Text style={styles.patternTitle}>Emerging Pattern</Text>
          <Text style={styles.patternText}>
            Your journey shows increasing alignment with transformation themes during
            lunar waxing phases. Consider morning contemplation for deeper integration.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  header: {
    marginTop: 20,
    marginBottom: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  insightCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 32,
  },
  insightEmoji: {
    fontSize: 32,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  timelineSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    marginRight: 16,
  },
  timelineContent: {
    flex: 1,
  },
  timelineDate: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  timelineEchoes: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
  },
  themeTag: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  themeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textTransform: 'capitalize',
  },
  patternCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  patternTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  patternText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 24,
  },
});
