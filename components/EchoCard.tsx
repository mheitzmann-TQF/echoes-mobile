import { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Share, Modal } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Svg, Path, Circle } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';
import { X, Moon, Sun, Globe, Drama, Leaf, Sparkles, ChevronDown } from 'lucide-react-native';
import { DEBUG_GESTURES } from '../lib/debug';
import { useTranslation } from 'react-i18next';

const gestureDebug = (...args: any[]) => {
  console.log('[GESTURE]', ...args);
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 280;

const MAX_TRANSLATE_Y = 200;
const SWIPE_THRESHOLD = 80;

const clamp = (value: number, min: number, max: number): number => {
  'worklet';
  return Math.max(min, Math.min(max, value));
};

const safeNumber = (value: number, fallback: number = 0): number => {
  'worklet';
  return Number.isFinite(value) ? value : fallback;
};

interface EchoCardProps {
  echo: {
    id: string;
    type: string;
    title: string;
    message: string;
    background_theme: string;
    explanation?: string;
    source_metrics?: string[];
  };
  index: number;
  totalCards: number;
  onSwipeDown?: () => void;
  onSwipeUp?: () => void;
}

// Icons
function ShareIcon({ color = '#FFFFFF' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M16 6 12 2 8 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 2v13" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

function InfoIcon({ color = '#FFFFFF' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} stroke={color} strokeWidth={2} />
      <Path d="M12 16v-4" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
      <Path d="M12 8h.01" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </Svg>
  );
}

const getTypeIcon = (type: string, color: string): React.ReactNode => {
  const size = 16;
  switch (type) {
    case 'lunar_guidance':
      return <Moon size={size} color={color} />;
    case 'solar_rhythm':
      return <Sun size={size} color={color} />;
    case 'global_consciousness':
      return <Globe size={size} color={color} />;
    case 'cultural_rhythms':
      return <Drama size={size} color={color} />;
    case 'ancestral_echo':
      return <Leaf size={size} color={color} />;
    default:
      return <Sparkles size={size} color={color} />;
  }
};

const getTypeLabelKey = (type: string): string => {
  switch (type) {
    case 'lunar_guidance':
      return 'today.lunarWisdom';
    case 'solar_rhythm':
      return 'today.solarRhythm';
    case 'global_consciousness':
      return 'today.globalPulseTag';
    case 'cultural_rhythms':
      return 'today.culturalEcho';
    case 'ancestral_echo':
      return 'today.ancestralVoice';
    default:
      return 'today.echo';
  }
};

const getTypeAccentColor = (type: string): string => {
  switch (type) {
    case 'lunar_guidance':
      return '#9b87f5'; // purple for lunar
    case 'solar_rhythm':
      return '#f5a623'; // golden for solar
    case 'global_consciousness':
      return '#4ecdc4'; // teal for consciousness
    case 'cultural_rhythms':
      return '#e74c3c'; // red for cultural
    case 'ancestral_wisdom':
    case 'ancestral_echo':
      return '#27ae60'; // green for ancestral
    default:
      return '#6366f1'; // indigo default
  }
};

const getMetricDescription = (metric: string): string => {
  const descriptions: Record<string, string> = {
    'Lunar': 'Based on the current lunar phase and its energetic influence',
    'Solar': 'Derived from solar positioning and circadian rhythms',
    'Coherence': 'Generated from global coherence and consciousness metrics',
    'Geomagnetism': 'Influenced by geomagnetic activity and earth resonance',
    'Cultural': 'Aligned with cultural calendars and celebrations',
    'Ancestral': 'Rooted in ancestral wisdom and traditional knowledge',
  };
  return descriptions[metric] || `Sourced from ${metric} data`;
};

export default function EchoCard({
  echo,
  index,
  totalCards,
  onSwipeDown,
  onSwipeUp,
}: EchoCardProps) {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const translateY = useSharedValue(0);
  const updateCount = useSharedValue(0);
  const isActive = index === 0;
  const [showWhyModal, setShowWhyModal] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${echo.title}\n\n${echo.message}\n\n— Echoes by The Quiet Frame\nthequietframe.com`,
        title: t('today.shareEcho'),
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const accentColor = getTypeAccentColor(echo.type);

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .activeOffsetY([-15, 15])
    .failOffsetX([-20, 20])
    .onBegin(() => {
      updateCount.value = 0;
      if (DEBUG_GESTURES) {
        runOnJS(gestureDebug)('BEGIN', { isActive, index });
      }
    })
    .onUpdate((event) => {
      const safeTranslationY = safeNumber(event.translationY, 0);
      const clampedY = clamp(safeTranslationY, -MAX_TRANSLATE_Y, MAX_TRANSLATE_Y);
      
      updateCount.value = updateCount.value + 1;
      
      if (DEBUG_GESTURES && updateCount.value % 10 === 0) {
        runOnJS(gestureDebug)('UPDATE', {
          count: updateCount.value,
          clampedY,
        });
      }
      translateY.value = clampedY;
    })
    .onEnd((event) => {
      const safeTranslationY = safeNumber(event.translationY, 0);
      const clampedY = clamp(safeTranslationY, -MAX_TRANSLATE_Y, MAX_TRANSLATE_Y);
      const absY = Math.abs(clampedY);
      const shouldSwipe = absY > SWIPE_THRESHOLD;
      const direction = clampedY > 0 ? 'down' : 'up';
      
      if (DEBUG_GESTURES) {
        runOnJS(gestureDebug)('END', {
          rawTranslationY: event.translationY,
          clampedY,
          threshold: SWIPE_THRESHOLD,
          willSwipe: shouldSwipe,
          direction,
        });
      }
      
      if (shouldSwipe) {
        if (direction === 'down' && onSwipeDown) {
          runOnJS(onSwipeDown)();
        } else if (direction === 'up' && onSwipeUp) {
          runOnJS(onSwipeUp)();
        }
      }
      translateY.value = withSpring(0);
    })
    .onFinalize(() => {
      if (DEBUG_GESTURES) {
        runOnJS(gestureDebug)('FINALIZE', { index });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const safeIndex = safeNumber(index, 0);
    
    const scale = interpolate(
      safeIndex,
      [0, 1, 2],
      [1, 0.95, 0.9],
      Extrapolation.CLAMP
    );

    const stackOffsetY = interpolate(
      safeIndex,
      [0, 1, 2],
      [0, 10, 20],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      safeIndex,
      [0, 1, 2, 3],
      [1, 0.8, 0.6, 0],
      Extrapolation.CLAMP
    );

    const safeTranslateY = safeNumber(translateY.value, 0);
    const clampedTranslateY = clamp(safeTranslateY, -MAX_TRANSLATE_Y, MAX_TRANSLATE_Y);

    const safeScale = safeNumber(scale, 1);
    const safeStackOffsetY = safeNumber(stackOffsetY, 0);
    const safeOpacity = safeNumber(opacity, 1);
    const finalTranslateY = isActive ? clampedTranslateY + safeStackOffsetY : safeStackOffsetY;

    return {
      transform: [
        { translateY: safeNumber(finalTranslateY, 0) },
        { scale: safeScale },
      ],
      opacity: safeOpacity,
      zIndex: totalCards - safeIndex,
    };
  });

  const cardBackgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, animatedStyle, { backgroundColor: cardBackgroundColor, borderColor: accentColor, borderLeftWidth: 4 }]}>
          <View style={styles.content}>
            <View style={[styles.typeBadge, { backgroundColor: colors.surfaceHighlight }]}>
              <View style={styles.typeIcon}>{getTypeIcon(echo.type, colors.text)}</View>
              <Text style={[styles.typeLabel, { color: colors.text }]}>{t(getTypeLabelKey(echo.type))}</Text>
            </View>

            <View style={styles.messageContainer}>
              <Text 
                style={[styles.message, { color: colors.text }]}
                numberOfLines={4}
                adjustsFontSizeToFit={false}
              >
                {echo.message}
              </Text>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.title, { color: colors.textSecondary }]}>{echo.title}</Text>
            </View>
          </View>

          {/* Actions Toolbar */}
          <View style={[styles.actions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <ShareIcon color={colors.textTertiary} />
              <Text style={[styles.actionText, { color: colors.textTertiary }]}>{t('today.share')}</Text>
            </TouchableOpacity>

            {/* Swipe indicator */}
            {totalCards > 1 && (
              <View style={styles.swipeIndicator}>
                <ChevronDown size={16} color={colors.textTertiary} />
                <Text style={[styles.swipeIndicatorText, { color: colors.textTertiary }]}>
                  {index + 1}/{totalCards}
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.actionButton} onPress={() => setShowWhyModal(true)}>
              <InfoIcon color={colors.textTertiary} />
              <Text style={[styles.actionText, { color: colors.textTertiary }]}>{t('today.why')}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Why Modal */}
      <Modal
        visible={showWhyModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWhyModal(false)}
      >
        <TouchableOpacity 
          style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.85)' }]}
          activeOpacity={1}
          onPress={() => setShowWhyModal(false)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t('today.whyThisEcho')}</Text>
              <TouchableOpacity onPress={() => setShowWhyModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricDescription, { color: colors.textSecondary }]}>
                  {echo.explanation || t('today.echoExplanation')}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#000000',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeIcon: {
    marginRight: 6,
  },
  typeLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 8,
    width: '100%',
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'left',
    lineHeight: 22,
    flexWrap: 'wrap',
    flexShrink: 1,
  },
  footer: {
    alignItems: 'flex-start',
    gap: 4,
  },
  title: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  swipeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    opacity: 0.7,
  },
  swipeIndicatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    maxHeight: '80%',
    borderWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricsContainer: {
    gap: 0,
  },
  metricItem: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
