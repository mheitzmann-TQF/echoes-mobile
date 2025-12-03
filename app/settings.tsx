import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useState } from 'react';
import { MapPin, Clock, AlertCircle, ChevronRight, Check } from 'lucide-react-native';

const LANGUAGES = ['English', 'Français', 'Deutsch', 'Español', '中文'];
const THEMES = ['Dark', 'Light'];

export default function SettingsScreen() {
  const { 
    useCurrentLocation, 
    setUseCurrentLocation, 
    locationName, 
    setLocationName,
    coordinates,
    locationLoading,
    locationError,
    timezone,
    setTimezone
  } = useLocation();

  const [manualInput, setManualInput] = useState(locationName);
  const [showManualInput, setShowManualInput] = useState(false);
  const [language, setLanguage] = useState('English');
  const [theme, setTheme] = useState('Dark');
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleSetLocation = () => {
    if (manualInput.trim()) {
      setLocationName(manualInput);
      setShowManualInput(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Settings</Text>
        
        {/* Location Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          
          {/* Current Location Toggle */}
          <View style={styles.row}>
            <View>
              <Text style={styles.label}>Use Current Location</Text>
              {locationLoading && <Text style={styles.smallText}>Loading...</Text>}
              {locationError && <Text style={styles.errorText}>⚠ {locationError}</Text>}
            </View>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: '#3e3e3e', true: 'rgba(100, 200, 255, 0.6)' }}
              thumbColor={useCurrentLocation ? '#4DB8FF' : '#f4f3f4'}
            />
          </View>

          {/* Location Display */}
          <TouchableOpacity 
            style={styles.locationCard}
            onPress={() => setShowManualInput(!showManualInput)}
          >
            <View style={styles.locationCardHeader}>
              <MapPin size={18} color="#4DB8FF" />
              <Text style={styles.locationCardTitle}>{locationName || 'Set Location'}</Text>
            </View>
            <Text style={styles.coordinates}>
              {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </Text>
            <Text style={styles.hint}>Tap to change location</Text>
          </TouchableOpacity>

          {/* Manual Location Input */}
          {showManualInput && (
            <View style={styles.manualInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter city or location..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={manualInput}
                onChangeText={setManualInput}
                onSubmitEditing={handleSetLocation}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonCancel]}
                  onPress={() => {
                    setShowManualInput(false);
                    setManualInput(locationName);
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonConfirm]}
                  onPress={handleSetLocation}
                >
                  <Text style={styles.buttonTextConfirm}>Set Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Timezone Section */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={styles.tzHeader}>
              <Clock size={18} color="#4DB8FF" />
              <Text style={styles.label}>Timezone</Text>
            </View>
            <Text style={styles.value}>{timezone || 'UTC'}</Text>
          </View>
          <Text style={styles.hint}>Auto-detected from location</Text>
        </View>

        {/* Display Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display</Text>
          
          {/* Language Selector */}
          <TouchableOpacity 
            style={styles.row}
            onPress={() => setShowLanguageModal(true)}
          >
            <Text style={styles.label}>Language</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{language}</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
            </View>
          </TouchableOpacity>

          {/* Theme Selector */}
          <TouchableOpacity 
            style={styles.row}
            onPress={() => setShowThemeModal(true)}
          >
            <Text style={styles.label}>Theme</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{theme}</Text>
              <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Language Modal */}
        <Modal visible={showLanguageModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Language</Text>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={styles.modalOption}
                  onPress={() => {
                    setLanguage(lang);
                    setShowLanguageModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, language === lang && styles.modalOptionTextActive]}>
                    {lang}
                  </Text>
                  {language === lang && <Check size={18} color="#4DB8FF" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Theme Modal */}
        <Modal visible={showThemeModal} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Theme</Text>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={styles.modalOption}
                  onPress={() => {
                    setTheme(t);
                    setShowThemeModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, theme === t && styles.modalOptionTextActive]}>
                    {t}
                  </Text>
                  {theme === t && <Check size={18} color="#4DB8FF" />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setShowThemeModal(false)}
              >
                <Text style={styles.modalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Privacy Section */}
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
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tzHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  value: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  smallText: {
    fontSize: 12,
    color: 'rgba(100, 200, 255, 0.7)',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: 'rgba(255, 100, 100, 0.8)',
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 4,
  },
  // Location Card
  locationCard: {
    backgroundColor: 'rgba(77, 184, 255, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: 'rgba(77, 184, 255, 0.2)',
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  locationCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4DB8FF',
  },
  coordinates: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  // Manual Input
  manualInputContainer: {
    marginTop: 16,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonCancel: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  buttonConfirm: {
    backgroundColor: 'rgba(77, 184, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(77, 184, 255, 0.4)',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  buttonTextConfirm: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4DB8FF',
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  modalOptionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
  modalOptionTextActive: {
    color: '#4DB8FF',
    fontWeight: '700',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
});
