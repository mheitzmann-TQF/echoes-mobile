import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Pause } from 'lucide-react-native';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';
import Paywall from './Paywall';

interface PausedOverlayProps {
  section: 'pulse' | 'learn' | 'upcoming';
}

const sectionToNamespace: Record<string, string> = {
  pulse: 'field',
  learn: 'learn',
  upcoming: 'upcoming'
};

export default function PausedOverlay({ section }: PausedOverlayProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [paywallVisible, setPaywallVisible] = useState(false);

  const namespace = sectionToNamespace[section];
  const pausedTitle = t(`${namespace}.paused`);
  const pausedMessage = t(`${namespace}.pausedMessage`);
  const continueText = t('common.continue');

  return (
    <>
      <View style={[styles.overlay, { backgroundColor: colors.background }]}>
        <View style={styles.content}>
          <View style={[styles.iconContainer, { backgroundColor: colors.surfaceHighlight }]}>
            <Pause size={32} color={colors.textSecondary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>{pausedTitle}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{pausedMessage}</Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.text }]}
            onPress={() => setPaywallVisible(true)}
            data-testid={`button-continue-${section}`}
          >
            <Text style={[styles.buttonText, { color: colors.background }]}>{continueText}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={paywallVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPaywallVisible(false)}
      >
        <Paywall
          onClose={() => setPaywallVisible(false)}
          onSubscribed={() => setPaywallVisible(false)}
        />
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: 320,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 32,
  },
  button: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
