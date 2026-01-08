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
import { X, Moon, Sun, Globe, Drama, Leaf, Sparkles } from 'lucide-react-native';
import { DEBUG_GESTURES } from '../lib/debug';
import { useTranslation } from 'react-i18next';

const gestureDebug = (...args: any[]) => {
  console.log('[GESTURE]', ...args);
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 420;

const MAX_TRANSLATE_X = 300;
const MAX_ROTATION = 15;

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
    source_metrics?: string[];
  };
  index: number;
  totalCards: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
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
  onSwipeLeft,
  onSwipeRight,
}: EchoCardProps) {
  const { colors, theme } = useTheme();
  const { t } = useTranslation();
  const translateX = useSharedValue(0);
  const updateCount = useSharedValue(0);
  const isActive = index === 0;
  const [showWhyModal, setShowWhyModal] = useState(false);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `✨ ${echo.title}\n\n${echo.message}\n\n— From Echoes App`,
        title: 'Share Echo',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onBegin(() => {
      updateCount.value = 0;
      if (DEBUG_GESTURES) {
        runOnJS(gestureDebug)('BEGIN', { isActive, index });
      }
    })
    .onUpdate((event) => {
      const safeTranslationX = safeNumber(event.translationX, 0);
      const clampedX = clamp(safeTranslationX, -MAX_TRANSLATE_X, MAX_TRANSLATE_X);
      
      updateCount.value = updateCount.value + 1;
      
      if (DEBUG_GESTURES && updateCount.value % 10 === 0) {
        runOnJS(gestureDebug)('UPDATE', {
          count: updateCount.value,
          clampedX,
          translationY: event.translationY,
        });
      }
      translateX.value = clampedX;
    })
    .onEnd((event) => {
      const safeTranslationX = safeNumber(event.translationX, 0);
      const clampedX = clamp(safeTranslationX, -MAX_TRANSLATE_X, MAX_TRANSLATE_X);
      const absX = Math.abs(clampedX);
      const shouldSwipe = absX > 100;
      const direction = clampedX > 0 ? 'right' : 'left';
      
      if (DEBUG_GESTURES) {
        runOnJS(gestureDebug)('END', {
          rawTranslationX: event.translationX,
          clampedX,
          threshold: 100,
          willSwipe: shouldSwipe,
          direction,
        });
      }
      
      if (shouldSwipe) {
        if (direction === 'right' && onSwipeRight) {
          runOnJS(onSwipeRight)();
        } else if (direction === 'left' && onSwipeLeft) {
          runOnJS(onSwipeLeft)();
        }
      }
      translateX.value = withSpring(0);
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

    const translateY = interpolate(
      safeIndex,
      [0, 1, 2],
      [0, 20, 40],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      safeIndex,
      [0, 1, 2, 3],
      [1, 0.8, 0.6, 0],
      Extrapolation.CLAMP
    );

    const safeTranslateX = safeNumber(translateX.value, 0);
    const clampedTranslateX = clamp(safeTranslateX, -MAX_TRANSLATE_X, MAX_TRANSLATE_X);
    
    const rotate = interpolate(
      clampedTranslateX,
      [-MAX_TRANSLATE_X, 0, MAX_TRANSLATE_X],
      [-MAX_ROTATION, 0, MAX_ROTATION],
      Extrapolation.CLAMP
    );

    const safeScale = safeNumber(scale, 1);
    const safeTranslateY = safeNumber(translateY, 0);
    const safeOpacity = safeNumber(opacity, 1);
    const safeRotate = safeNumber(rotate, 0);
    const finalTranslateX = isActive ? clampedTranslateX : 0;

    return {
      transform: [
        { translateX: safeNumber(finalTranslateX, 0) },
        { translateY: safeTranslateY },
        { scale: safeScale },
        { rotate: `${safeRotate}deg` },
      ],
      opacity: safeOpacity,
      zIndex: totalCards - safeIndex,
    };
  });

  const cardBackgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';
  const cardBorderColor = colors.border;

  return (
    <>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.card, animatedStyle, { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor }]}>
          <View style={styles.content}>
            <View style={[styles.typeBadge, { backgroundColor: colors.surfaceHighlight }]}>
              <View style={styles.typeIcon}>{getTypeIcon(echo.type, colors.text)}</View>
              <Text style={[styles.typeLabel, { color: colors.text }]}>{t(getTypeLabelKey(echo.type))}</Text>
            </View>

            <View style={styles.messageContainer}>
              <Text style={[styles.message, { color: colors.text }]}>{echo.message}</Text>
            </View>

            <View style={styles.footer}>
              <Text style={[styles.title, { color: colors.textSecondary }]}>{echo.title}</Text>
            </View>
          </View>

          {/* Actions Toolbar */}
          <View style={[styles.actions, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <ShareIcon color={colors.textTertiary} />
              <Text style={[styles.actionText, { color: colors.textTertiary }]}>Share</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => setShowWhyModal(true)}>
              <InfoIcon color={colors.textTertiary} />
              <Text style={[styles.actionText, { color: colors.textTertiary }]}>Why?</Text>
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
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Why This Echo?</Text>
              <TouchableOpacity onPress={() => setShowWhyModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.metricsContainer}>
              {echo.source_metrics && echo.source_metrics.length > 0 ? (
                echo.source_metrics.map((metric, idx) => (
                  <View key={`${echo.id}-${metric}-${idx}`} style={[styles.metricItem, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.metricLabel, { color: colors.text }]}>{metric}</Text>
                    <Text style={[styles.metricDescription, { color: colors.textSecondary }]}>
                      {getMetricDescription(metric)}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.metricItem}>
                  <Text style={[styles.metricDescription, { color: colors.textTertiary }]}>
                    This echo was generated based on the current cosmic and terrestrial conditions at your location.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
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
    paddingVertical: 24,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 30,
    letterSpacing: -0.3,
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
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    width: '100%',
    zIndex: 1000,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 120,
    borderTopWidth: 1,
    maxHeight: '65%',
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
