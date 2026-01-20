import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { useTheme } from '../lib/ThemeContext';
import { ExternalLink } from 'lucide-react-native';
import type { DynamicWisdomCard as DynamicWisdomCardType } from '../lib/api';

interface Props {
  card: DynamicWisdomCardType;
}

export default function DynamicWisdomCard({ card }: Props) {
  const { colors } = useTheme();
  
  const accentColor = card.accentColor || '#8b5cf6';
  
  const handleLinkPress = () => {
    if (card.link?.url) {
      Linking.openURL(card.link.url);
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.accent, { backgroundColor: accentColor }]} />
      <View style={styles.content}>
        {card.icon && (
          <Text style={styles.icon}>{card.icon}</Text>
        )}
        <Text style={[styles.title, { color: colors.text }]}>{card.title}</Text>
        {card.subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{card.subtitle}</Text>
        )}
        <Text style={[styles.body, { color: colors.text }]}>{card.content}</Text>
        
        {card.link && (
          <TouchableOpacity 
            style={[styles.linkButton, { borderColor: accentColor }]}
            onPress={handleLinkPress}
            activeOpacity={0.7}
          >
            <Text style={[styles.linkText, { color: accentColor }]}>{card.link.label}</Text>
            <ExternalLink size={14} color={accentColor} style={styles.linkIcon} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  accent: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 20,
  },
  icon: {
    fontSize: 24,
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'left',
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'left',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
  },
  linkIcon: {
    marginLeft: 6,
  },
});
