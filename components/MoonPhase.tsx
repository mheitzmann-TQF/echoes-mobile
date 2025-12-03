import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { useTheme } from '../lib/ThemeContext';

interface MoonPhaseProps {
  phase: string;
  illumination: number;
  size?: number;
}

const getMoonPath = (phase: string, size: number): string => {
  const r = size / 2 - 2;
  const cx = size / 2;
  const cy = size / 2;

  switch (phase.toLowerCase().replace(/_/g, ' ')) {
    case 'new':
    case 'new moon':
      return '';
    case 'full':
    case 'full moon':
      return `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy} A ${r} ${r} 0 1 1 ${cx - r} ${cy}`;
    case 'first quarter':
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} L ${cx} ${cy - r}`;
    case 'last quarter':
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} L ${cx} ${cy - r}`;
    case 'waxing crescent':
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r * 0.3} ${r} 0 0 0 ${cx} ${cy - r}`;
    case 'waxing gibbous':
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r * 0.7} ${r} 0 0 1 ${cx} ${cy - r}`;
    case 'waning gibbous':
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${r * 0.7} ${r} 0 0 0 ${cx} ${cy - r}`;
    case 'waning crescent':
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${r * 0.3} ${r} 0 0 1 ${cx} ${cy - r}`;
    default:
      return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${r * 0.5} ${r} 0 0 1 ${cx} ${cy - r}`;
  }
};

const formatPhase = (phase: string): string => {
  return phase
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default function MoonPhase({ phase, illumination, size = 60 }: MoonPhaseProps) {
  const { colors } = useTheme();
  const moonPath = getMoonPath(phase, size);

  return (
    <View style={styles.container}>
      <View style={[styles.moonContainer, { width: size, height: size }]}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={size / 2 - 2}
            fill={colors.surfaceHighlight}
            stroke={colors.border}
            strokeWidth={1}
          />
          {moonPath && (
            <Path d={moonPath} fill={colors.text} />
          )}
        </Svg>
      </View>
      <Text style={[styles.phaseText, { color: colors.text }]}>{formatPhase(phase)}</Text>
      <Text style={[styles.illuminationText, { color: colors.textSecondary }]}>{Math.round(illumination * 100)}% illuminated</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  moonContainer: {
    marginBottom: 8,
  },
  phaseText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  illuminationText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
  },
});
