import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';

export default function SettingsScreen() {
  const { useCurrentLocation, setUseCurrentLocation, locationName } = useLocation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Use Current Location</Text>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: '#3e3e3e', true: '#ffffff' }}
              thumbColor={useCurrentLocation ? '#000000' : '#f4f3f4'}
            />
          </View>
          <Text style={styles.value}>{locationName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Language</Text>
            <Text style={styles.value}>English</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Theme</Text>
            <Text style={styles.value}>Dark</Text>
          </View>
        </View>

         <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <Text style={styles.infoText}>No accounts. Preferences stored on-device.</Text>
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
  content: {
    padding: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  value: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.5)',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
});
