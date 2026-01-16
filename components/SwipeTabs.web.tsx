import React from 'react';

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

export function SwipeTabs(_props: Props): React.ReactElement {
  throw new Error('SwipeTabs is not supported on web. Use Expo Router Tabs instead.');
}
