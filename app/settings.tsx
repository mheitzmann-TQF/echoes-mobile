import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Modal, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useState } from 'react';
import { MapPin, Clock, ChevronRight, Check, Sparkles, Crown, Globe } from 'lucide-react-native';
import { useTheme } from '../lib/ThemeContext';
import { useEntitlement } from '@/lib/iap/useEntitlement';
import Paywall from '@/components/Paywall';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, changeLanguage, getCurrentLanguage, type SupportedLanguage } from '../lib/i18n';
import { contentService } from '../lib/ContentService';
import { cookieService } from '../lib/CookieService';

const THEMES = ['Dark', 'Light'];

export default function SettingsScreen() {
  const { t } = useTranslation();
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
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>(getCurrentLanguage());
  
  const { isFullAccess, isLoading: entitlementLoading, expiresAt, restorePurchasesAction } = useEntitlement();

  const handleLanguageChange = async (lang: SupportedLanguage) => {
    // Clear all cached content when language changes
    contentService.clearCache();
    cookieService.invalidateCache();
    
    await changeLanguage(lang);
    setCurrentLanguage(lang);
    setShowLanguageModal(false);
  };

  const handleSetLocation = () => {
    if (manualInput.trim()) {
      setLocationName(manualInput);
      setShowManualInput(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>{t('settings.title')}</Text>
        
        {/* Location Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('settings.location')}</Text>
          
          {/* Current Location Toggle */}
          <View style={styles.row}>
            <View>
              <Text style={[styles.label, { color: colors.text }]}>{t('settings.useCurrentLocation')}</Text>
              {locationLoading && <Text style={styles.smallText}>{t('common.loading')}</Text>}
              {locationError && <Text style={[styles.errorText, { color: colors.error }]}>{locationError}</Text>}
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
              <Text style={[styles.locationCardTitle, { color: colors.accent }]}>{locationName || t('settings.setLocation')}</Text>
            </View>
            <Text style={[styles.coordinates, { color: colors.textSecondary }]}>
              {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </Text>
            <Text style={[styles.hint, { color: colors.textTertiary }]}>{t('settings.tapToChange')}</Text>
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
                placeholder={t('settings.enterLocation')}
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
                  <Text style={[styles.buttonText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.button, styles.buttonConfirm, { 
                    backgroundColor: colors.accentSubtle,
                    borderColor: colors.accent
                  }]}
                  onPress={handleSetLocation}
                >
                  <Text style={[styles.buttonTextConfirm, { color: colors.accent }]}>{t('settings.setLocation')}</Text>
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
              <Text style={[styles.label, { color: colors.text }]}>{t('settings.timezone')}</Text>
            </View>
            <Text style={[styles.value, { color: colors.textSecondary }]}>{timezone || 'UTC'}</Text>
          </View>
          <Text style={[styles.hint, { color: colors.textTertiary }]}>{t('settings.autoDetected')}</Text>
        </View>

        {/* Display Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('settings.display')}</Text>
          
          {/* Theme Selector */}
          <TouchableOpacity 
            style={styles.row}
            onPress={() => setShowThemeModal(true)}
          >
            <Text style={[styles.label, { color: colors.text }]}>{t('settings.theme')}</Text>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{theme === 'dark' ? t('settings.dark') : t('settings.light')}</Text>
              <ChevronRight size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>

          {/* Language Selector */}
          <TouchableOpacity 
            style={styles.row}
            onPress={() => setShowLanguageModal(true)}
            data-testid="button-language"
          >
            <View style={styles.tzHeader}>
              <Globe size={18} color={colors.accent} />
              <Text style={[styles.label, { color: colors.text }]}>{t('settings.language')}</Text>
            </View>
            <View style={styles.valueRow}>
              <Text style={[styles.value, { color: colors.textSecondary }]}>{LANGUAGE_NAMES[currentLanguage]}</Text>
              <ChevronRight size={16} color={colors.textTertiary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Theme Modal */}
        <Modal visible={showThemeModal} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111' : '#FFF' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
              {THEMES.map((themeOption) => (
                <TouchableOpacity
                  key={themeOption}
                  style={[styles.modalOption, { backgroundColor: colors.surface }]}
                  onPress={() => {
                    setTheme(themeOption.toLowerCase() as 'dark' | 'light');
                    setShowThemeModal(false);
                  }}
                >
                  <Text style={[
                    styles.modalOptionText, 
                    { color: colors.textSecondary },
                    theme === themeOption.toLowerCase() && { color: colors.accent, fontWeight: '700' }
                  ]}>
                    {themeOption === 'Dark' ? t('settings.dark') : t('settings.light')}
                  </Text>
                  {theme === themeOption.toLowerCase() && <Check size={18} color={colors.accent} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => setShowThemeModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Language Modal */}
        <Modal visible={showLanguageModal} transparent animationType="fade">
          <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111' : '#FFF' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.selectLanguage')}</Text>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[styles.modalOption, { backgroundColor: colors.surface }]}
                  onPress={() => handleLanguageChange(lang)}
                  data-testid={`button-language-${lang}`}
                >
                  <Text style={[
                    styles.modalOptionText, 
                    { color: colors.textSecondary },
                    currentLanguage === lang && { color: colors.accent, fontWeight: '700' }
                  ]}>
                    {LANGUAGE_NAMES[lang]}
                  </Text>
                  {currentLanguage === lang && <Check size={18} color={colors.accent} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                style={[styles.modalCloseButton, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => setShowLanguageModal(false)}
              >
                <Text style={[styles.modalCloseText, { color: colors.textSecondary }]}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Subscription Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('settings.subscription')}</Text>
          
          {isFullAccess ? (
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Crown size={20} color="#F59E0B" />
                <Text style={[styles.subscriptionTitle, { color: colors.text }]}>{t('settings.echoesPro')}</Text>
              </View>
              <Text style={[styles.subscriptionStatus, { color: colors.textSecondary }]}>
                {expiresAt 
                  ? t('settings.activeUntil', { date: new Date(expiresAt).toLocaleDateString() })
                  : t('settings.activeSubscription')}
              </Text>
              <TouchableOpacity
                style={[styles.manageButton, { backgroundColor: colors.surfaceHighlight }]}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('https://apps.apple.com/account/subscriptions');
                  } else {
                    Linking.openURL('https://play.google.com/store/account/subscriptions');
                  }
                }}
                data-testid="button-manage-subscription"
              >
                <Text style={[styles.manageButtonText, { color: colors.accent }]}>{t('settings.manageSubscription')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.subscriptionCard}>
              <View style={styles.subscriptionHeader}>
                <Sparkles size={20} color={colors.textSecondary} />
                <Text style={[styles.subscriptionTitle, { color: colors.text }]}>{t('settings.free')}</Text>
              </View>
              <Text style={[styles.subscriptionStatus, { color: colors.textSecondary }]}>
                {t('settings.unlockAccess')}
              </Text>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowPaywall(true)}
                data-testid="button-upgrade"
              >
                <Text style={styles.upgradeButtonText}>{t('settings.upgradeToPro')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Paywall Modal */}
        <Modal visible={showPaywall} animationType="slide" presentationStyle="pageSheet">
          <Paywall 
            onClose={() => setShowPaywall(false)}
            onSubscribed={() => setShowPaywall(false)}
          />
        </Modal>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('settings.privacy')}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t('settings.privacyNote')}</Text>
        </View>

        {/* About Section */}
        <View style={[styles.aboutSection, { borderColor: colors.border }]}>
          <Image
            source={require('../assets/images/tqf-logo-round.png')}
            style={styles.aboutLogo}
            resizeMode="contain"
          />
          <Text style={[styles.aboutText, { color: colors.textTertiary }]}>
            {t('settings.partOf')}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://thequietframe.com')}>
            <Text style={[styles.aboutLink, { color: colors.textSecondary }]}>
              The Quiet Frame
            </Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: colors.textTertiary }]}>
            {t('settings.version')}
          </Text>
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
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'left',
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
    borderRadius: 16,
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
  // About Section
  aboutSection: {
    alignItems: 'center',
    paddingVertical: 40,
    marginTop: 20,
    borderTopWidth: 1,
  },
  aboutLogo: {
    width: 48,
    height: 48,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 12,
    marginBottom: 4,
  },
  aboutLink: {
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
    marginBottom: 16,
  },
  versionText: {
    fontSize: 11,
  },
  // Subscription Styles
  subscriptionCard: {
    gap: 8,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  subscriptionStatus: {
    fontSize: 14,
    marginBottom: 8,
  },
  manageButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  upgradeButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
