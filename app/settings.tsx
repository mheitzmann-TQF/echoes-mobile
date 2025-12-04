import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useState } from 'react';
import { MapPin, Clock, ChevronRight, Check } from 'lucide-react-native';
import { useTheme } from '../lib/ThemeContext';

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

  const { theme, setTheme, colors } = useTheme();

  const [manualInput, setManualInput] = useState(locationName);
  const [showManualInput, setShowManualInput] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  const handleSetLocation = () => {
    if (manualInput.trim()) {
      setLocationName(manualInput);
      setShowManualInput(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
        
        {/* Location Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Location</Text>
          
          {/* Current Location Toggle */}
          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: colors.text }]}>Use Current Location</Text>
              {locationLoading && <Text style={styles.smallText}>Loading...</Text>}
              {locationError && <Text style={[styles.errorText, { color: colors.error }]}>⚠ {locationError}</Text>}
            </View>
            <Switch
              value={useCurrentLocation}
              onValueChange={setUseCurrentLocation}
              trackColor={{ false: '#3e3e3e', true: colors.accentSubtle }}
              thumbColor={useCurrentLocation ? colors.accent : '#f4f3f4'}
            />
          </View>

          {/* Location Display */}
          <TouchableOpacity 
            style={[styles.locationCard, { backgroundColor: colors.surfaceHighlight, borderColor: colors.border }]}
            onPress={() => setShowManualInput(!showManualInput)}
          >
            <View style={styles.locationCardHeader}>
              <MapPin size={18} color={colors.accent} />
              <Text style={[styles.locationCardTitle, { color: colors.accent }]}>{locationName || 'Set Location'}</Text>
            </View>
            <Text style={[styles.coordinates, { color: colors.textSecondary }]}>
              {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </Text>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>Tap to change location</Text>
          </TouchableOpacity>

          {/* Manual Location Input */}
          {showManualInput && (
            <View style={[styles.manualInputContainer, { borderTopColor: colors.border }]}>
              <TextInput
                style={[styles.textInput, { 
                  backgroundColor: colors.surfaceHighlight, 
                  borderColor: colors.border,
                  color: colors.text 
                }]}
                placeholder="Enter city or location..."
                placeholderTextColor={colors.textTertiary}
                value={manualInput}
                onChangeText={setManualInput}
                onSubmitEditing={handleSetLocation}
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonCancel, { borderColor: colors.border, backgroundColor: colors.surface }]}
                  onPress={() => {
                    setShowManualInput(false);
                    setManualInput(locationName);
                  }}
                >
                  <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonConfirm, { 
                    backgroundColor: colors.accentSubtle,
                    borderColor: colors.accent
                  }]}
                  onPress={handleSetLocation}
                >
                  <Text style={[styles.buttonTextConfirm, { color: colors.accent }]}>Set Location</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Timezone Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.row}>
            <View style={styles.tzHeader}>
              <Clock size={18} color={colors.accent} />
              <Text style={[styles.label, { color: colors.text }]}>Timezone</Text>
            </View>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{timezone || 'UTC'}</Text>
          </View>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>Auto-detected from location</Text>
        </View>

        {/* Display Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Display</Text>
          
          {/* Theme Selector */}
          <TouchableOpacity 
            style={styles.row}
            onPress={() => setShowThemeModal(true)}
          >
            <Text style={[styles.label, { color: colors.text }]}>Theme</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{theme === 'dark' ? 'Dark' : 'Light'}</Text>
              <ChevronRight size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Theme Modal */}
        <Modal visible={showThemeModal} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111' : '#FFF' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
              {THEMES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.modalOption, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setTheme(t.toLowerCase() as 'dark' | 'light');
                    setShowThemeModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText, 
                    { color: colors.textSecondary },
                    theme === t.toLowerCase() && { color: colors.accent, fontWeight: '700' }
                  ]}>
                    {t}
                  </Text>
                  {theme === t.toLowerCase() && <Check size={18} color={colors.accent} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => setShowThemeModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Privacy</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>No accounts. Preferences stored on-device.</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    marginBottom: 32,
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 28,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  smallText: {
    fontSize: 12,
    color: 'rgba(100, 200, 255, 0.7)',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  hint: {
    fontSize: 12,
    marginTop: 4,
  },
  // Location Card
  locationCard: {
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
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
  },
  coordinates: {
    fontSize: 13,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  // Manual Input
  manualInputContainer: {
    marginTop: 16,
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
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
    borderWidth: 1,
  },
  buttonConfirm: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonTextConfirm: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
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
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalCloseButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
