import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { useLocation } from '../lib/LocationContext';
import { fetchInterruption } from '../lib/api';
import { getInterruptionState, cacheInterruption } from '../lib/interruptionStore';

const TIMING = {
  initialPause: 400,
  sentenceFadeIn: 500,
  sentenceHold: 2200,
  holdPause: 600,
  sentenceFadeOut: 600,
};

interface Props {
  onComplete: () => void;
}

export function InterruptionLayer({ onComplete }: Props) {
  const { colors } = useTheme();
  const { language, timezone } = useLocation();
  
  const [message, setMessage] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    runChoreography();
  }, []);
  
  async function runChoreography() {
    let interruptionMessage: string | null = null;
    
    try {
      const tz = timezone || 'America/New_York';
      const lang = language || 'en';
      
      console.log('[Interruption] Fetching with lang:', lang);
      const data = await fetchInterruption(lang, tz);
      
      if (data && data.success && data.message) {
        interruptionMessage = data.message;
        console.log('[Interruption] Message received:', interruptionMessage);
        await cacheInterruption(data.message, data.interruption_type);
      } else {
        const cachedState = await getInterruptionState();
        if (cachedState.cached_message) {
          interruptionMessage = cachedState.cached_message;
        }
      }
    } catch (error) {
      console.log('[Interruption] Fetch error, checking cache');
      const cachedState = await getInterruptionState();
      if (cachedState.cached_message) {
        interruptionMessage = cachedState.cached_message;
      }
    }
    
    if (!interruptionMessage) {
      console.log('[Interruption] No message available, completing immediately');
      onComplete();
      return;
    }
    
    setMessage(interruptionMessage);
    
    setTimeout(() => {
      setShowText(true);
      
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: TIMING.sentenceFadeIn,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          setTimeout(() => {
            Animated.timing(textOpacity, {
              toValue: 0,
              duration: TIMING.sentenceFadeOut,
              useNativeDriver: true,
            }).start(() => {
              onComplete();
            });
          }, TIMING.holdPause);
        }, TIMING.sentenceHold);
      });
    }, TIMING.initialPause);
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showText && message && (
        <Animated.Text
          style={[
            styles.message,
            {
              color: colors.text,
              opacity: textOpacity,
            },
          ]}
        >
          {message}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 18,
    fontStyle: 'normal',
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.3,
    maxWidth: 320,
  },
});

export default InterruptionLayer;
