import React, { useRef, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import * as Haptics from 'expo-haptics';

export type SwipeTab = {
  key: string;
  render: () => React.ReactNode;
};

type Props = {
  tabs: SwipeTab[];
  initialIndex?: number;
  renderTabBar: (args: {
    index: number;
    setIndex: (i: number) => void;
  }) => React.ReactNode;
};

export function SwipeTabs({ tabs, initialIndex = 0, renderTabBar }: Props) {
  const pagerRef = useRef<PagerView>(null);
  const [index, setIndexState] = useState(initialIndex);
  const lastHapticTime = useRef(0);
  const isTabPress = useRef(false);

  const triggerHaptic = useCallback(() => {
    const now = Date.now();
    if (now - lastHapticTime.current > 100) {
      lastHapticTime.current = now;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const setIndex = useCallback((i: number) => {
    if (i !== index) {
      isTabPress.current = true;
      triggerHaptic();
      setIndexState(i);
      pagerRef.current?.setPage(i);
    }
  }, [index, triggerHaptic]);

  const onPageSelected = useCallback((e: any) => {
    const newIndex = e.nativeEvent.position;
    if (newIndex !== index) {
      if (!isTabPress.current) {
        triggerHaptic();
      }
      isTabPress.current = false;
      setIndexState(newIndex);
    }
  }, [index, triggerHaptic]);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialIndex}
        onPageSelected={onPageSelected}
      >
        {tabs.map((t) => (
          <View key={t.key} style={styles.page}>
            {t.render()}
          </View>
        ))}
      </PagerView>
      {renderTabBar({ index, setIndex })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
