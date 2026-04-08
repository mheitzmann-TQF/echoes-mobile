import React, { forwardRef } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

interface ShareCardProps {
  tagline?: string;
}

const ShareCard = forwardRef<View, ShareCardProps>(({ tagline }, ref) => {
  return (
    <View
      ref={ref}
      style={styles.container}
      collapsable={false}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/tqf-logo-1024-rnd.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.title}>The Quiet Frame</Text>
      <Text style={styles.tagline}>{tagline || 'a small app about being present'}</Text>

      <View style={styles.badgeRow}>
        <Image
          source={require('../assets/images/badge-app-store.png')}
          style={styles.badgeApple}
          resizeMode="contain"
        />
        <Image
          source={require('../assets/images/badge-google-play.png')}
          style={styles.badgeGoogle}
          resizeMode="contain"
        />
      </View>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  container: {
    width: 1080,
    height: 1080,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
  },
  logoContainer: {
    width: 320,
    height: 320,
    borderRadius: 160,
    overflow: 'hidden',
    marginBottom: 48,
  },
  logo: {
    width: 320,
    height: 320,
  },
  title: {
    fontSize: 64,
    fontWeight: '300',
    color: '#ffffff',
    letterSpacing: 2,
    marginBottom: 16,
  },
  tagline: {
    fontSize: 32,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
    fontStyle: 'italic',
    marginBottom: 72,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  badgeApple: {
    width: 220,
    height: 66,
  },
  badgeGoogle: {
    width: 248,
    height: 66,
  },
});

export default ShareCard;
