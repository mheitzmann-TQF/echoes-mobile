import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet, Animated, ActivityIndicator, Platform, TouchableOpacity, Text } from 'react-native';
import { Svg, Path, Circle, Rect, Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationProvider } from '../lib/LocationContext';
import { ThemeProvider, useTheme } from '../lib/ThemeContext';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { logEnvOnce } from "@/lib/env";
import { initI18n } from '../lib/i18n';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import { SwipeTabs, type SwipeTab } from '../components/SwipeTabs';
import { InterruptionLayer } from '../components/InterruptionLayer';
import { initAppStateListener, useAppStateListener } from '../lib/useAppState';
import { EntitlementProvider } from '../lib/iap/useEntitlement';

const isWeb = Platform.OS === 'web';
const isExpoGo = (): boolean => Constants.appOwnership === 'expo';
const shouldUseSwipeTabs = !isWeb && !isExpoGo();

import TodayScreen from './index';
import PulseScreen from './pulse';
import WisdomScreen from './wisdom';
import UpcomingScreen from './upcoming';
import SettingsScreen from './settings';


function TodayIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Path d="M12 6V12L16 14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function PulseIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WisdomIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function UpcomingIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={4} width={18} height={18} rx={2} ry={2} stroke={color} strokeWidth={2} />
      <Line x1={16} y1={2} x2={16} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={8} y1={2} x2={8} y2={6} stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Line x1={3} y1={10} x2={21} y2={10} stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function SettingsIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const { theme, colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 1500);
    });
  }, []);

  return (
    <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Animated.Image
        source={require('../assets/images/tqf-logo-round.png')}
        style={[
          styles.splashLogo,
          { opacity: fadeAnim }
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

type TabConfig = {
  key: string;
  labelKey: string;
  icon: React.ComponentType<{ color: string }>;
};

const TAB_CONFIG: TabConfig[] = [
  { key: 'today', labelKey: 'tabs.today', icon: TodayIcon },
  { key: 'pulse', labelKey: 'tabs.pulse', icon: PulseIcon },
  { key: 'wisdom', labelKey: 'tabs.wisdom', icon: WisdomIcon },
  { key: 'upcoming', labelKey: 'tabs.upcoming', icon: UpcomingIcon },
  { key: 'settings', labelKey: 'tabs.settings', icon: SettingsIcon },
];

function BottomTabBar({ 
  activeIndex, 
  onTabPress 
}: { 
  activeIndex: number; 
  onTabPress: (index: number) => void;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const bottomInset = Platform.OS === 'android'
    ? Math.max(insets.bottom, 56)
    : insets.bottom;

  return (
    <View style={[
      styles.tabBar,
      { 
        backgroundColor: colors.background,
        borderTopColor: colors.border,
        paddingBottom: 8 + bottomInset,
      }
    ]}>
      {TAB_CONFIG.map((tab, index) => {
        const isActive = index === activeIndex;
        const color = isActive ? colors.text : colors.textTertiary;
        const IconComponent = tab.icon;
        
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tabButton}
            onPress={() => onTabPress(index)}
            activeOpacity={0.7}
          >
            <IconComponent color={color} />
            <Text style={[styles.tabLabel, { color }]}>
              {t(tab.labelKey)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function SwipeTabsNavigator() {
  const { theme, colors } = useTheme();
  
  const tabs: SwipeTab[] = useMemo(() => [
    { key: 'today', render: () => <TodayScreen /> },
    { key: 'pulse', render: () => <PulseScreen /> },
    { key: 'wisdom', render: () => <WisdomScreen /> },
    { key: 'upcoming', render: () => <UpcomingScreen /> },
    { key: 'settings', render: () => <SettingsScreen /> },
  ], []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <SwipeTabs
        tabs={tabs}
        initialIndex={0}
        renderTabBar={({ index, setIndex }: { index: number; setIndex: (i: number) => void }) => (
          <BottomTabBar activeIndex={index} onTabPress={setIndex} />
        )}
      />
    </View>
  );
}

function ExpoRouterTabsNavigator() {
  const { theme, colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  const bottomInset = Platform.OS === 'android'
    ? Math.max(insets.bottom, 56)
    : insets.bottom;
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: 56 + bottomInset,
            paddingBottom: 8 + bottomInset,
            paddingTop: 8,
          },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.today'),
            tabBarIcon: ({ color }) => <TodayIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="pulse"
          options={{
            title: t('tabs.pulse'),
            tabBarIcon: ({ color }) => <PulseIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="wisdom"
          options={{
            title: t('tabs.wisdom'),
            tabBarIcon: ({ color }) => <WisdomIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="upcoming"
          options={{
            title: t('tabs.upcoming'),
            tabBarIcon: ({ color }) => <UpcomingIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t('tabs.settings'),
            tabBarIcon: ({ color }) => <SettingsIcon color={color} />,
          }}
        />
        
        {/* Hidden routes */}
        <Tabs.Screen name="global" options={{ href: null }} />
        <Tabs.Screen name="journey" options={{ href: null }} />
        <Tabs.Screen name="you" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

function ThemedApp() {
  const { colors } = useTheme();
  const [showInterruption, setShowInterruption] = useState(true);
  const [i18nReady, setI18nReady] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    initI18n().then(() => setI18nReady(true));
  }, []);

  useEffect(() => {
    const cleanup = initAppStateListener();
    return cleanup;
  }, []);

  const handleNewDay = useCallback(() => {
    console.log('[ThemedApp] New day detected, showing interruption');
    setShowInterruption(true);
    setRefreshKey(k => k + 1);
  }, []);

  useAppStateListener({
    onNewDay: handleNewDay,
  });

  if (!i18nReady) {
    return (
      <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  if (showInterruption) {
    return <InterruptionLayer onComplete={() => setShowInterruption(false)} />;
  }
  
  if (shouldUseSwipeTabs) {
    return <SwipeTabsNavigator key={refreshKey} />;
  }
  
  return <ExpoRouterTabsNavigator key={refreshKey} />;
}

export default function RootLayout() {
  console.log('[ROOT:LAYOUT] RootLayout function called');
  logEnvOnce("BOOT");
  return (
    <LocationProvider>
      <ThemeProvider>
        <EntitlementProvider>
          <ThemedApp />
        </EntitlementProvider>
      </ThemeProvider>
    </LocationProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  splashContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashLogo: {
    width: 120,
    height: 120,
  },
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
  },
});
