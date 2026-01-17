import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import EchoCard from './EchoCard';
import { Echo } from '../lib/api';
import { useTheme } from '../lib/ThemeContext';
import { useTranslation } from 'react-i18next';

interface EchoStackProps {
  echoes: Echo[];
  currentIndex: number;
  onSwipeDown: () => void;
  onSwipeUp: () => void;
  selectedMetric?: string;
}

export default function EchoStack({ echoes, currentIndex, onSwipeDown, onSwipeUp, selectedMetric }: EchoStackProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  // Always show all echoes - no filtering
  const visibleEchoes = echoes.slice(currentIndex, currentIndex + 3);
  const hasMoreCards = currentIndex < echoes.length - 1;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>{t('today.echoes')}</Text>
      
      <View style={styles.stackContainer}>
        {visibleEchoes.length > 0 ? (
          visibleEchoes.map((echo, index) => (
            <EchoCard
              key={echo.id}
              echo={echo}
              index={index}
              totalCards={visibleEchoes.length}
              onSwipeDown={onSwipeDown}
              onSwipeUp={onSwipeUp}
            />
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('today.allEchoesReceived')}</Text>
          </View>
        )}
      </View>
      
      {visibleEchoes.length > 0 && (
        <View style={styles.swipeHint}>
          {hasMoreCards ? (
            <>
              <ChevronDown size={18} color={colors.textTertiary} />
              <Text style={[styles.swipeHintText, { color: colors.textTertiary }]}>
                {t('today.swipeDown')} · {currentIndex + 1}/{echoes.length}
              </Text>
            </>
          ) : (
            <Text style={[styles.swipeHintText, { color: colors.textTertiary }]}>
              {currentIndex + 1}/{echoes.length}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    marginBottom: 24,
  },
  label: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  stackContainer: {
    height: 360,
    alignItems: 'center',
  },
  swipeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 8,
    gap: 6,
  },
  swipeHintText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    height: 420,
    width: '90%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
  },
  ctaButton: {
    marginHorizontal: 20,
    marginTop: 32,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 15,
  },
});
