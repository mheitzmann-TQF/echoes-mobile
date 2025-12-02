import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';

export default function YouScreen() {
  const { locationName, setLocationName, useCurrentLocation, setUseCurrentLocation, locationLoading, locationError } = useLocation();
  const [notifications, setNotifications] = useState(true);
  const [dawnEchoes, setDawnEchoes] = useState(true);
  const [lunarAlerts, setLunarAlerts] = useState(true);
  const [language, setLanguage] = useState('English');
  const [calendar, setCalendar] = useState('Gregorian');

  const languages = ['English', 'Spanish', 'French', 'German', 'Japanese'];
  const calendars = ['Gregorian', 'Lunar', 'Hindu', 'Hebrew'];

  const cycleLanguage = () => {
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLanguage(languages[nextIndex]);
  };

  const cycleCalendar = () => {
    const currentIndex = calendars.indexOf(calendar);
    const nextIndex = (currentIndex + 1) % calendars.length;
    setCalendar(calendars[nextIndex]);
  };

  const handleAbout = () => {
    Alert.alert('About Echoes', 'A meditation app that aligns your consciousness with cosmic rhythms and lunar cycles.');
  };

  const handlePrivacy = () => {
    Alert.alert('Privacy Policy', 'Your data is private and never shared. All echoes remain yours alone.');
  };

  const handleFeedback = () => {
    Alert.alert('Send Feedback', 'Your thoughts help us evolve. Thank you for sharing your journey with us.');
  };

  const profile = {
    name: 'Seeker',
    joinedDays: 14,
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>You</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>🌙</Text>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileSubtext}>
            On this journey for {profile.joinedDays} days
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.toggleRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📍</Text>
              <View>
                <Text style={styles.settingLabel}>Current Location</Text>
                <Text style={styles.settingDescription}>
                  Use device location
                </Text>
              </View>
            </View>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,255,255,0.3)' }}
              thumbColor={useCurrentLocation ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
            />
          </View>

          {!useCurrentLocation && (
            <View style={[styles.settingRow, { paddingVertical: 12 }]}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>✏️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>Manual Location</Text>
                  <TextInput
                    style={styles.locationInput}
                    placeholder="Enter city, country..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={locationName}
                    onChangeText={setLocationName}
                    editable={true}
                  />
                </View>
              </View>
            </View>
          )}

          {useCurrentLocation && locationLoading && (
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={[styles.settingLabel, { marginLeft: 12 }]}>Getting location...</Text>
              </View>
            </View>
          )}

          {useCurrentLocation && locationError && (
            <View style={styles.settingRow}>
              <Text style={[styles.settingDescription, { color: '#FF6B6B' }]}>
                {locationError}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.settingRow} onPress={cycleLanguage}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🌐</Text>
              <View>
                <Text style={styles.settingLabel}>Language</Text>
                <Text style={styles.settingValue}>{language}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={cycleCalendar}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📅</Text>
              <View>
                <Text style={styles.settingLabel}>Cultural Calendars</Text>
                <Text style={styles.settingValue}>{calendar}</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.toggleRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔔</Text>
              <View>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive echo reminders
                </Text>
              </View>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,255,255,0.3)' }}
              thumbColor={notifications ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🌅</Text>
              <View>
                <Text style={styles.settingLabel}>Dawn Echoes</Text>
                <Text style={styles.settingDescription}>
                  Start each day with wisdom
                </Text>
              </View>
            </View>
            <Switch
              value={dawnEchoes}
              onValueChange={setDawnEchoes}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,255,255,0.3)' }}
              thumbColor={dawnEchoes ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🌕</Text>
              <View>
                <Text style={styles.settingLabel}>Lunar Alerts</Text>
                <Text style={styles.settingDescription}>
                  New & full moon notifications
                </Text>
              </View>
            </View>
            <Switch
              value={lunarAlerts}
              onValueChange={setLunarAlerts}
              trackColor={{ false: 'rgba(255,255,255,0.1)', true: 'rgba(255,255,255,0.3)' }}
              thumbColor={lunarAlerts ? '#FFFFFF' : 'rgba(255,255,255,0.5)'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>

          <TouchableOpacity style={styles.settingRow} onPress={handleAbout}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>📖</Text>
              <Text style={styles.settingLabel}>About Echoes</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handlePrivacy}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>🔒</Text>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingRow} onPress={handleFeedback}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingIcon}>💬</Text>
              <Text style={styles.settingLabel}>Send Feedback</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>Echoes v1.0.0</Text>
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
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  profileCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 32,
    marginBottom: 32,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileSubtext: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.3)',
  },
  locationInput: {
    fontSize: 14,
    color: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 0,
    marginVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.2)',
  },
  version: {
    textAlign: 'center',
    fontSize: 13,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 16,
  },
});
