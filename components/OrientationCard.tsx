import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/ThemeContext';

export const ORIENTATION_SEEN_KEY = 'orientationSeen';

export async function checkOrientationSeen(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(ORIENTATION_SEEN_KEY);
    return val === 'true';
  } catch {
    return true;
  }
}

interface Props {
  onDismiss: () => void;
}

export function OrientationCard({ onDismiss }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  async function handleDismiss() {
    try {
      await AsyncStorage.setItem(ORIENTATION_SEEN_KEY, 'true');
    } catch {}
    onDismiss();
  }

  const tabs = [
    { name: t('tabs.today'), desc: t('orientation.todayDesc') },
    { name: t('tabs.pulse'), desc: t('orientation.pulseDesc') },
    { name: t('tabs.wisdom'), desc: t('orientation.wisdomDesc') },
    { name: t('tabs.upcoming'), desc: t('orientation.upcomingDesc') },
    { name: t('tabs.settings'), desc: t('orientation.settingsDesc') },
  ];

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleDismiss}
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={[
          styles.container,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 32,
            opacity: fadeAnim,
          },
        ]}
      >
        <Text style={styles.headline}>{t('orientation.headline')}</Text>
        <View style={styles.tabList}>
          {tabs.map((tab, i) => (
            <View key={i} style={styles.tabRow}>
              <Text style={styles.tabName}>{tab.name}</Text>
              <Text style={styles.tabDesc}>{tab.desc}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.cta, { color: colors.accent }]}>
          {t('orientation.cta')}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 40,
    letterSpacing: -0.5,
  },
  tabList: {
    gap: 24,
    marginBottom: 56,
  },
  tabRow: {
    gap: 4,
  },
  tabName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  tabDesc: {
    fontSize: 15,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 22,
  },
  cta: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
});
