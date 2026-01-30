import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, TextInput, Modal, Image, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocation } from '../lib/LocationContext';
import { useState, useCallback, useEffect } from 'react';
import { MapPin, Clock, ChevronRight, Check, Sparkles, Crown, Globe, X, Bug, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../lib/ThemeContext';
import { useEntitlementContext } from '@/lib/iap/useEntitlement';
import Paywall from '@/components/Paywall';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES, changeLanguage, getCurrentLanguage, type SupportedLanguage } from '../lib/i18n';
import { contentService } from '../lib/ContentService';
import { cookieService } from '../lib/CookieService';
import { cycleDevAccessState, type DevAccessState } from '@/lib/iap/devAccessOverride';
import { getInstallId } from '@/lib/iap/installId';
import { getLastRestoreDiagnostics, type RestoreDiagnostics } from '@/lib/iap/iap';

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
  
  const { 
    isFullAccess, 
    isLoading: entitlementLoading, 
    expiresAt, 
    restorePurchasesAction, 
    devOverride, 
    isDevMode, 
    refresh: refreshEntitlement,
    error: entitlementError,
    isGrace,
    graceReason
  } = useEntitlementContext();
  
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [debugInstallId, setDebugInstallId] = useState<string>('loading...');
  const [debugTapCount, setDebugTapCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [restoreDiagnostics, setRestoreDiagnostics] = useState<RestoreDiagnostics | null>(null);
  
  useEffect(() => {
    getInstallId().then(id => setDebugInstallId(id));
  }, []);
  
  const handleDebugRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshEntitlement();
      const id = await getInstallId();
      setDebugInstallId(id);
      // Get latest restore diagnostics after refresh
      setRestoreDiagnostics(getLastRestoreDiagnostics());
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshEntitlement]);
  
  // Update diagnostics when debug panel is shown
  useEffect(() => {
    if (showDebugPanel) {
      setRestoreDiagnostics(getLastRestoreDiagnostics());
    }
  }, [showDebugPanel]);
  
  const handleVersionTap = useCallback(() => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    if (newCount >= 5) {
      setShowDebugPanel(true);
      setDebugTapCount(0);
    }
    setTimeout(() => setDebugTapCount(0), 2000);
  }, [debugTapCount]);
  
  const handleDevAccessCycle = useCallback(async () => {
    if (!isDevMode) return;
    const newState = await cycleDevAccessState();
    console.log('[SETTINGS] Dev access cycled to:', newState);
    await refreshEntitlement();
  }, [isDevMode, refreshEntitlement]);

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
            style={[styles.locationCard, { 
              backgroundColor: colors.surfaceHighlight, 
              borderColor: colors.border,
              opacity: useCurrentLocation ? 0.7 : 1
            }]}
            onPress={() => !useCurrentLocation && setShowManualInput(!showManualInput)}
            disabled={useCurrentLocation}
          >
            <View style={styles.locationCardHeader}>
              <MapPin size={18} color={useCurrentLocation ? colors.textSecondary : colors.accent} />
              <Text style={[styles.locationCardTitle, { color: useCurrentLocation ? colors.textSecondary : colors.accent }]}>
                {locationName || t('settings.setLocation')}
              </Text>
            </View>
            <Text style={[styles.coordinates, { color: colors.textSecondary }]}>
              {coordinates.lat.toFixed(4)}°, {coordinates.lng.toFixed(4)}°
            </Text>
            {useCurrentLocation ? (
              <Text style={[styles.hint, { color: colors.textTertiary }]}>{t('settings.usingGPS')}</Text>
            ) : (
              <Text style={[styles.hint, { color: colors.textTertiary }]}>{t('settings.tapToChange')}</Text>
            )}
          </TouchableOpacity>

          {/* Manual Location Input - only show when NOT using current location */}
          {!useCurrentLocation && showManualInput && (
            <View style={[styles.manualInputContainer, { borderTopColor: colors.border }]}>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.textInput, { 
                    backgroundColor: colors.surfaceHighlight, 
                    borderColor: colors.border,
                    color: colors.text,
                    paddingRight: 40
                  }]}
                  placeholder={t('settings.enterLocation')}
                  placeholderTextColor={colors.textTertiary}
                  value={manualInput}
                  onChangeText={setManualInput}
                  onSubmitEditing={handleSetLocation}
                />
                {manualInput.length > 0 && (
                  <TouchableOpacity 
                    style={styles.clearButton}
                    onPress={() => setManualInput('')}
                    data-testid="button-clear-location"
                  >
                    <X size={18} color={colors.textTertiary} />
                  </TouchableOpacity>
                )}
              </View>
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
        <Modal visible={showThemeModal} transparent animationType="fade" onRequestClose={() => setShowThemeModal(false)}>
          <TouchableOpacity 
            style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
            activeOpacity={1}
            onPress={() => setShowThemeModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111' : '#FFF' }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.theme')}</Text>
                <TouchableOpacity onPress={() => setShowThemeModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
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
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Language Modal */}
        <Modal visible={showLanguageModal} transparent animationType="fade" onRequestClose={() => setShowLanguageModal(false)}>
          <TouchableOpacity 
            style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
            activeOpacity={1}
            onPress={() => setShowLanguageModal(false)}
          >
            <TouchableOpacity 
              activeOpacity={1}
              style={[styles.modalContent, { backgroundColor: theme === 'dark' ? '#111' : '#FFF' }]}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHeaderRow}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>{t('settings.selectLanguage')}</Text>
                <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                  <X size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
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
            </TouchableOpacity>
          </TouchableOpacity>
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
                {t('settings.exploreAccess')}
              </Text>
              <TouchableOpacity
                style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
                onPress={() => setShowPaywall(true)}
                data-testid="button-continue-access"
              >
                <Text style={styles.upgradeButtonText}>{t('settings.continueWithFullAccess')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Paywall Modal */}
        <Modal 
          visible={showPaywall} 
          animationType="slide" 
          presentationStyle="fullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => setShowPaywall(false)}
        >
          <Paywall 
            onClose={() => setShowPaywall(false)}
            onSubscribed={() => setShowPaywall(false)}
          />
        </Modal>

        {/* Privacy Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('settings.privacy')}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t('settings.privacyNote')}</Text>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: colors.surfaceHighlight }]}
            onPress={() => Linking.openURL('https://thequietframe.com/#privacy')}
          >
            <Text style={[styles.supportButtonText, { color: colors.accent }]}>{t('paywall.privacyPolicy')}</Text>
          </TouchableOpacity>
        </View>

        {/* Support Section */}
        <View style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>{t('settings.support')}</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>{t('settings.supportNote')}</Text>
          <TouchableOpacity
            style={[styles.supportButton, { backgroundColor: colors.surfaceHighlight }]}
            onPress={() => Linking.openURL('mailto:hey@thequietframe.com')}
            data-testid="button-contact-support"
          >
            <Text style={[styles.supportButtonText, { color: colors.accent }]}>{t('settings.contactUs')}</Text>
          </TouchableOpacity>
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
            <Text style={[styles.aboutLink, { color: colors.accent }]}>
              The Quiet Frame
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onLongPress={handleDevAccessCycle}
            onPress={handleVersionTap}
            delayLongPress={1000}
            activeOpacity={0.6}
          >
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>
              {t('settings.version')}
            </Text>
            {isDevMode && (
              <Text style={[styles.devOverrideText, { color: devOverride ? colors.accent : colors.textTertiary }]}>
                DEV: {devOverride || 'none'}
              </Text>
            )}
            {debugTapCount > 0 && (
              <Text style={[styles.debugTapHint, { color: colors.textTertiary }]}>
                {5 - debugTapCount} more taps for debug
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Debug Panel - shown after 5 taps on version */}
        {showDebugPanel && (
          <View style={[styles.debugSection, { backgroundColor: colors.surface, borderColor: '#F59E0B' }]}>
            <View style={styles.debugHeader}>
              <View style={styles.debugHeaderLeft}>
                <Bug size={18} color="#F59E0B" />
                <Text style={[styles.debugTitle, { color: '#F59E0B' }]}>Debug Info</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDebugPanel(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Install ID:</Text>
              <Text style={[styles.debugValue, { color: colors.text }]} selectable>{debugInstallId}</Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Platform:</Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>{Platform.OS}</Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Full Access:</Text>
              <Text style={[styles.debugValue, { color: isFullAccess ? '#22C55E' : '#EF4444' }]}>
                {isFullAccess ? 'YES' : 'NO'}
              </Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Loading:</Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>
                {entitlementLoading ? 'YES' : 'NO'}
              </Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Expires At:</Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>{expiresAt || 'null'}</Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Grace Period:</Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>
                {isGrace ? `YES (${graceReason})` : 'NO'}
              </Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Error:</Text>
              <Text style={[styles.debugValue, { color: entitlementError ? '#EF4444' : colors.text }]}>
                {entitlementError || 'none'}
              </Text>
            </View>
            
            <View style={styles.debugRow}>
              <Text style={[styles.debugLabel, { color: colors.textSecondary }]}>Dev Mode:</Text>
              <Text style={[styles.debugValue, { color: colors.text }]}>
                {isDevMode ? `YES (${devOverride || 'no override'})` : 'NO'}
              </Text>
            </View>
            
            {/* Restore Diagnostics Section */}
            {restoreDiagnostics && (
              <View style={styles.debugDiagnosticsSection}>
                <Text style={[styles.debugDiagnosticsTitle, { color: '#F59E0B' }]}>Restore Diagnostics:</Text>
                <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary }]}>
                  Time: {restoreDiagnostics.timestamp.split('T')[1]?.split('.')[0] || 'N/A'}
                </Text>
                <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.getAvailablePurchases.count > 0 ? '#22C55E' : '#EF4444' }]}>
                  getAvailablePurchases: {restoreDiagnostics.getAvailablePurchases.tried ? `${restoreDiagnostics.getAvailablePurchases.count} found` : 'not tried'}
                  {restoreDiagnostics.getAvailablePurchases.error ? ` (err: ${restoreDiagnostics.getAvailablePurchases.error.substring(0, 30)})` : ''}
                </Text>
                <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.getActiveSubscriptions.count > 0 ? '#22C55E' : (restoreDiagnostics.getActiveSubscriptions.tried ? '#EF4444' : colors.textSecondary) }]}>
                  getActiveSubscriptions: {restoreDiagnostics.getActiveSubscriptions.tried ? `${restoreDiagnostics.getActiveSubscriptions.count} found` : 'not tried'}
                  {restoreDiagnostics.getActiveSubscriptions.error ? ` (err: ${restoreDiagnostics.getActiveSubscriptions.error.substring(0, 30)})` : ''}
                </Text>
                <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.currentEntitlement.found ? '#22C55E' : (restoreDiagnostics.currentEntitlement.tried ? '#EF4444' : colors.textSecondary) }]}>
                  currentEntitlement: {restoreDiagnostics.currentEntitlement.tried ? (restoreDiagnostics.currentEntitlement.found ? `found (${restoreDiagnostics.currentEntitlement.productId})` : 'not found') : 'not tried'}
                  {restoreDiagnostics.currentEntitlement.error ? ` (err: ${restoreDiagnostics.currentEntitlement.error.substring(0, 30)})` : ''}
                </Text>
                <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.finalCount > 0 ? '#22C55E' : '#EF4444', fontWeight: '600' }]}>
                  Final: {restoreDiagnostics.finalCount} purchase(s) found
                </Text>
                {restoreDiagnostics.purchaseDetails && (
                  <>
                    <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, marginTop: 4 }]}>
                      Product: {restoreDiagnostics.purchaseDetails.productId}
                    </Text>
                    <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.purchaseDetails.hasTransactionId ? '#22C55E' : '#EF4444' }]}>
                      TransactionId: {restoreDiagnostics.purchaseDetails.hasTransactionId ? 'YES' : 'MISSING'}
                    </Text>
                    {restoreDiagnostics.purchaseDetails.transactionId && (
                      <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, fontSize: 10 }]}>
                        ID: {restoreDiagnostics.purchaseDetails.transactionId}
                      </Text>
                    )}
                    {restoreDiagnostics.purchaseDetails.transactionIdSource && (
                      <Text style={[styles.debugDiagnosticsText, { color: '#F59E0B', fontSize: 10 }]}>
                        Source: {restoreDiagnostics.purchaseDetails.transactionIdSource}
                      </Text>
                    )}
                    {restoreDiagnostics.purchaseDetails.rawObjectKeys && (
                      <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, fontSize: 8 }]}>
                        Keys: {restoreDiagnostics.purchaseDetails.rawObjectKeys}
                      </Text>
                    )}
                    <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.purchaseDetails.hasTransactionReceipt ? '#22C55E' : '#EF4444' }]}>
                      Receipt: {restoreDiagnostics.purchaseDetails.hasTransactionReceipt ? `YES (${restoreDiagnostics.purchaseDetails.receiptLength} bytes)` : 'MISSING'}
                    </Text>
                  </>
                )}
                {restoreDiagnostics.verifyRequest && (
                  <>
                    <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, marginTop: 8, fontWeight: '600' }]}>
                      Verify Request Sent:
                    </Text>
                    <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, fontSize: 10 }]}>
                      installId: {restoreDiagnostics.verifyRequest.installId}
                    </Text>
                    <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, fontSize: 10 }]}>
                      platform: {restoreDiagnostics.verifyRequest.platform}, sku: {restoreDiagnostics.verifyRequest.sku}
                    </Text>
                    <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, fontSize: 10 }]}>
                      transactionId: {restoreDiagnostics.verifyRequest.transactionId || 'MISSING'}
                    </Text>
                    <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.verifyRequest.hasReceipt ? '#22C55E' : '#F59E0B', fontSize: 10 }]}>
                      hasReceipt: {restoreDiagnostics.verifyRequest.hasReceipt ? 'YES' : 'NO'}
                    </Text>
                  </>
                )}
                {restoreDiagnostics.verifyResponse && (
                  <>
                    <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, marginTop: 8, fontWeight: '600' }]}>
                      Verify Response:
                    </Text>
                    <Text style={[styles.debugDiagnosticsText, { color: restoreDiagnostics.verifyResponse.entitlement === 'full' ? '#22C55E' : '#EF4444' }]}>
                      HTTP {restoreDiagnostics.verifyResponse.status || 'N/A'} → {restoreDiagnostics.verifyResponse.entitlement || 'error'}
                    </Text>
                    {restoreDiagnostics.verifyResponse.expiresAt && (
                      <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, fontSize: 10 }]}>
                        expiresAt: {restoreDiagnostics.verifyResponse.expiresAt}
                      </Text>
                    )}
                    {restoreDiagnostics.verifyResponse.appleEnvironment && (
                      <Text style={[styles.debugDiagnosticsText, { color: '#3B82F6', fontSize: 10 }]}>
                        Apple Env: {restoreDiagnostics.verifyResponse.appleEnvironment}
                      </Text>
                    )}
                    {restoreDiagnostics.verifyResponse.appleStatus && (
                      <Text style={[styles.debugDiagnosticsText, { color: '#3B82F6', fontSize: 10 }]}>
                        Apple Status: {restoreDiagnostics.verifyResponse.appleStatus}
                      </Text>
                    )}
                    {restoreDiagnostics.verifyResponse.error && (
                      <Text style={[styles.debugDiagnosticsText, { color: '#EF4444', fontSize: 10 }]}>
                        Error: {restoreDiagnostics.verifyResponse.error}
                      </Text>
                    )}
                    {restoreDiagnostics.verifyResponse.rawBody && (
                      <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, fontSize: 9, marginTop: 4 }]}>
                        Raw: {restoreDiagnostics.verifyResponse.rawBody}
                      </Text>
                    )}
                  </>
                )}
                {!restoreDiagnostics.verifyResponse && restoreDiagnostics.finalCount > 0 && (
                  <Text style={[styles.debugDiagnosticsText, { color: '#F59E0B', marginTop: 8 }]}>
                    Verify: NOT CALLED (purchase found but not verified)
                  </Text>
                )}
              </View>
            )}
            {!restoreDiagnostics && (
              <Text style={[styles.debugDiagnosticsText, { color: colors.textSecondary, marginTop: 8 }]}>
                No restore attempt yet. Tap Refresh to trigger restore.
              </Text>
            )}
            
            <TouchableOpacity 
              style={[styles.debugRefreshButton, { backgroundColor: '#F59E0B' }]}
              onPress={handleDebugRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw size={16} color="#000" style={isRefreshing ? { opacity: 0.5 } : undefined} />
              <Text style={styles.debugRefreshText}>
                {isRefreshing ? 'Refreshing...' : 'Refresh Status'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

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
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
  },
  clearButton: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
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
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
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
    marginBottom: 16,
  },
  versionText: {
    fontSize: 11,
    textAlign: 'center',
  },
  devOverrideText: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
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
  supportButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  supportButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  debugTapHint: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontStyle: 'italic',
  },
  debugSection: {
    marginTop: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  debugHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  debugLabel: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  debugValue: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    flex: 2,
    textAlign: 'right',
  },
  debugRefreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
  },
  debugRefreshText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  debugDiagnosticsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.3)',
  },
  debugDiagnosticsTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  debugDiagnosticsText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: 3,
  },
});
