import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { useLocation } from '../lib/LocationContext';
import { fetchInterruption } from '../lib/api';
import { getInterruptionState, cacheInterruption } from '../lib/interruptionStore';

const TIMING = {
  baobabFadeIn: 700,
  stillnessPause: 500,
  sentenceFadeIn: 350,
  sentenceHold: 1800,
  holdPause: 700,
  sentenceFadeOut: 600,
  tabsTransition: 350,
};

interface Props {
  onComplete: () => void;
}

export function InterruptionLayer({ onComplete }: Props) {
  const { colors } = useTheme();
  const { language, timezone } = useLocation();
  
  const [message, setMessage] = useState<string | null>(null);
  const [showText, setShowText] = useState(false);
  
  const baobabOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    runChoreography();
  }, []);
  
  async function runChoreography() {
    let interruptionMessage: string | null = null;
    
    try {
      const tz = timezone || 'America/New_York';
      const lang = language || 'en';
      
      const data = await fetchInterruption(lang, tz);
      
      if (data && data.success && data.message) {
        interruptionMessage = data.message;
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
    
    Animated.timing(baobabOpacity, {
      toValue: 1,
      duration: TIMING.baobabFadeIn,
      useNativeDriver: true,
    }).start(() => {
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
                Animated.timing(baobabOpacity, {
                  toValue: 0,
                  duration: TIMING.tabsTransition,
                  useNativeDriver: true,
                }).start(() => {
                  onComplete();
                });
              });
            }, TIMING.holdPause);
          }, TIMING.sentenceHold);
        });
      }, TIMING.stillnessPause);
    });
  }
  
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
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: 0.3,
    maxWidth: 320,
  },
});

export default InterruptionLayer;
