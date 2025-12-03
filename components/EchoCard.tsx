import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { Svg, Path, Circle } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 320;

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

function SaveIcon({ color = '#FFFFFF' }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
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

const getTypeEmoji = (type: string): string => {
  switch (type) {
    case 'lunar_guidance':
      return '🌙';
    case 'solar_rhythm':
      return '☀️';
    case 'global_consciousness':
      return '🌍';
    case 'cultural_rhythms':
      return '🎭';
    case 'ancestral_echo':
      return '🌿';
    default:
      return '✨';
  }
};

const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'lunar_guidance':
      return 'Lunar Wisdom';
    case 'solar_rhythm':
      return 'Solar Rhythm';
    case 'global_consciousness':
      return 'Global Pulse';
    case 'cultural_rhythms':
      return 'Cultural Echo';
    case 'ancestral_echo':
      return 'Ancestral Voice';
    default:
      return 'Echo';
  }
};

export default function EchoCard({
  echo,
  index,
  totalCards,
  onSwipeLeft,
  onSwipeRight,
}: EchoCardProps) {
  const { colors, theme } = useTheme();
  const translateX = useSharedValue(0);
  const isActive = index === 0;

  const panGesture = Gesture.Pan()
    .enabled(isActive)
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 100) {
        if (event.translationX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      index,
      [0, 1, 2],
      [1, 0.95, 0.9],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      index,
      [0, 1, 2],
      [0, 20, 40],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      index,
      [0, 1, 2, 3],
      [1, 0.8, 0.6, 0],
      Extrapolation.CLAMP
    );

    const rotate = interpolate(
      translateX.value,
      [-200, 0, 200],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: isActive ? translateX.value : 0 },
        { translateY },
        { scale },
        { rotate: `${rotate}deg` },
      ],
      opacity,
      zIndex: totalCards - index,
    };
  });

  // Determine card background color based on type or theme
  // We'll stick to theme colors for consistency
  const cardBackgroundColor = theme === 'dark' ? '#000000' : '#FFFFFF';
  const cardBorderColor = colors.border;

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle, { backgroundColor: cardBackgroundColor, borderColor: cardBorderColor }]}>
        <View style={styles.content}>
          <View style={[styles.typeBadge, { backgroundColor: colors.surfaceHighlight }]}>
            <Text style={styles.typeEmoji}>{getTypeEmoji(echo.type)}</Text>
            <Text style={[styles.typeLabel, { color: colors.text }]}>{getTypeLabel(echo.type)}</Text>
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
          <TouchableOpacity style={styles.actionButton}>
            <SaveIcon color={colors.textTertiary} />
            <Text style={[styles.actionText, { color: colors.textTertiary }]}>Save</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <ShareIcon color={colors.textTertiary} />
            <Text style={[styles.actionText, { color: colors.textTertiary }]}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <InfoIcon color={colors.textTertiary} />
            <Text style={[styles.actionText, { color: colors.textTertiary }]}>Why?</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </GestureDetector>
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
  typeEmoji: {
    fontSize: 16,
    marginRight: 6,
  },
  typeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'left',
    lineHeight: 34,
    letterSpacing: -0.5,
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
    justifyContent: 'space-between',
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
});
