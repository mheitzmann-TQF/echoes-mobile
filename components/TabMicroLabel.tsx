import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../lib/ThemeContext';

export interface TabMicroLabelHandle {
  dismiss: () => void;
}

interface Props {
  seenKey: string;
  textKey: string;
}

export const TabMicroLabel = forwardRef<TabMicroLabelHandle, Props>(
  ({ seenKey, textKey }, ref) => {
    const { t } = useTranslation();
    const { colors } = useTheme();
    const [visible, setVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const dismissed = useRef(false);

    useEffect(() => {
      checkAndShow();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }, []);

    async function checkAndShow() {
      try {
        const val = await AsyncStorage.getItem(seenKey);
        if (val === 'true') return;
        await AsyncStorage.setItem(seenKey, 'true');
      } catch {}
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        timerRef.current = setTimeout(() => {
          fadeOut();
        }, 6000);
      });
    }

    function fadeOut() {
      if (dismissed.current) return;
      dismissed.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setVisible(false));
    }

    useImperativeHandle(ref, () => ({
      dismiss: fadeOut,
    }));

    if (!visible) return null;

    return (
      <Animated.Text
        style={[styles.label, { color: colors.textSecondary, opacity: fadeAnim }]}
      >
        {t(textKey)}
      </Animated.Text>
    );
  }
);

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginTop: -2,
    marginBottom: 16,
    letterSpacing: 0.1,
  },
});
