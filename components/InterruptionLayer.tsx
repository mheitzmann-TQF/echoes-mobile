import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { useLocation } from '../lib/LocationContext';
import { fetchInterruption, InterruptionResponse } from '../lib/api';
import { 
  getInterruptionState, 
  processInterruption, 
  InterruptionTier,
  InterruptionState 
} from '../lib/interruptionStore';

interface TierConfig {
  fadeInDuration: number;
  holdDuration: number;
  fadeOutDuration: number;
  maxOpacity: number;
  fontSize: number;
}

const TIER_CONFIGS: Record<InterruptionTier, TierConfig> = {
  0: {
    fadeInDuration: 250,
    holdDuration: 1650,
    fadeOutDuration: 750,
    maxOpacity: 1,
    fontSize: 18,
  },
  1: {
    fadeInDuration: 180,
    holdDuration: 650,
    fadeOutDuration: 425,
    maxOpacity: 1,
    fontSize: 17,
  },
  2: {
    fadeInDuration: 120,
    holdDuration: 200,
    fadeOutDuration: 285,
    maxOpacity: 0.75,
    fontSize: 16,
  },
};

interface Props {
  onComplete: () => void;
}

export function InterruptionLayer({ onComplete }: Props) {
  const { colors } = useTheme();
  const { language, timezone } = useLocation();
  
  const [message, setMessage] = useState<string | null>(null);
  const [tier, setTier] = useState<InterruptionTier>(0);
  const [showText, setShowText] = useState(false);
  
  const baobabOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    loadInterruption();
  }, []);
  
  async function loadInterruption() {
    Animated.timing(baobabOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
    
    let interruptionData: InterruptionResponse | null = null;
    let finalTier: InterruptionTier = 2;
    let finalMessage: string | null = null;
    
    try {
      const tz = timezone || 'America/New_York';
      const lang = language || 'en';
      
      interruptionData = await fetchInterruption(lang, tz);
      
      if (interruptionData && interruptionData.message && interruptionData.signature) {
        const result = await processInterruption(
          interruptionData.signature,
          interruptionData.message,
          interruptionData.interruption_type
        );
        finalTier = result.tier;
        finalMessage = interruptionData.message;
        console.log('[Interruption] Tier:', finalTier, 'Signature:', interruptionData.signature);
      } else {
        const cachedState = await getInterruptionState();
        if (cachedState.cached_message) {
          finalMessage = cachedState.cached_message;
          finalTier = 2;
          console.log('[Interruption] Using cached message (offline fallback)');
        }
      }
    } catch (error) {
      console.log('[Interruption] Error, checking cache:', error);
      const cachedState = await getInterruptionState();
      if (cachedState.cached_message) {
        finalMessage = cachedState.cached_message;
        finalTier = 2;
      }
    }
    
    if (!finalMessage) {
      console.log('[Interruption] No message available, skipping');
      setTimeout(() => {
        Animated.timing(baobabOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => onComplete());
      }, 800);
      return;
    }
    
    setMessage(finalMessage);
    setTier(finalTier);
    
    const config = TIER_CONFIGS[finalTier];
    
    setTimeout(() => {
      setShowText(true);
      
      Animated.timing(textOpacity, {
        toValue: config.maxOpacity,
        duration: config.fadeInDuration,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(textOpacity, {
              toValue: 0,
              duration: config.fadeOutDuration,
              useNativeDriver: true,
            }),
            Animated.timing(baobabOpacity, {
              toValue: 0,
              duration: config.fadeOutDuration,
              useNativeDriver: true,
            }),
          ]).start(() => {
            onComplete();
          });
        }, config.holdDuration);
      });
    }, 300);
  }
  
  const config = TIER_CONFIGS[tier];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={[styles.content, { opacity: baobabOpacity }]}>
        <Image
          source={require('../assets/images/tqf-logo-round.png')}
          style={styles.baobab}
          resizeMode="contain"
        />
        
        {showText && message && (
          <Animated.Text
            style={[
              styles.message,
              {
                color: colors.text,
                opacity: textOpacity,
                fontSize: config.fontSize,
              },
            ]}
          >
            {message}
          </Animated.Text>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  baobab: {
    width: 120,
    height: 120,
    marginBottom: 40,
  },
  message: {
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.3,
    maxWidth: 320,
  },
});

export default InterruptionLayer;
