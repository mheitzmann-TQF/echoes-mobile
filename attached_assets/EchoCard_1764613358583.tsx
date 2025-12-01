import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CARD_HEIGHT = 480;

interface EchoCardProps {
  echo: {
    id: string;
    type: string;
    title: string;
    message: string;
    background_theme: string;
  };
  index: number;
  totalCards: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
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

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.card, animatedStyle]}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeEmoji}>{getTypeEmoji(echo.type)}</Text>
          <Text style={styles.typeLabel}>{getTypeLabel(echo.type)}</Text>
        </View>

        <View style={styles.messageContainer}>
          <Text style={styles.message}>{echo.message}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.title}>{echo.title}</Text>
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
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 20,
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
  },
  messageContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 34,
  },
  footer: {
    alignItems: 'center',
  },
  title: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '400',
  },
});
