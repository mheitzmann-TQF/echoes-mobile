import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { useLocation } from '../lib/LocationContext';
import { useTranslation } from 'react-i18next';
import { fetchInterruption } from '../lib/api';
import { getInterruptionState, cacheInterruption } from '../lib/interruptionStore';

const TIMING = {
  baobabFadeIn: 700,
  baobabHold: 500,
  baobabFadeOut: 500,
  pauseBeforeSentence: 300,
  sentenceFadeIn: 500,
  sentenceHold: 4200,
  holdPause: 600,
  sentenceFadeOut: 600,
};

interface Props {
  onComplete: () => void;
}

export function InterruptionLayer({ onComplete }: Props) {
  const { colors } = useTheme();
  const { timezone } = useLocation();
  const { i18n } = useTranslation();
  
  const [message, setMessage] = useState<string | null>(null);
  const [showBaobab, setShowBaobab] = useState(true);
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
      const lang = i18n.language?.split('-')[0]?.toLowerCase() || 'en';
      
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
        Animated.timing(baobabOpacity, {
          toValue: 0,
          duration: TIMING.baobabFadeOut,
          useNativeDriver: true,
        }).start(() => {
          setShowBaobab(false);
          
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
          }, TIMING.pauseBeforeSentence);
        });
      }, TIMING.baobabHold);
    });
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {showBaobab && (
        <Animated.View style={{ opacity: baobabOpacity }}>
          <Image
            source={require('../assets/images/tqf-logo-round.png')}
            style={styles.baobab}
            resizeMode="contain"
          />
        </Animated.View>
      )}
      
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
  baobab: {
    width: 120,
    height: 120,
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
