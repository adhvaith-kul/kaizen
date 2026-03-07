import React from 'react';

export const TabNavigationContext = React.createContext<{
  activeTab: string;
  setActiveTab: (tab: string) => void;
  resetStack: (tab: string) => void;
} | null>(null);

export const useTabNavigation = () => {
  const ctx = React.useContext(TabNavigationContext);
  if (!ctx) throw new Error('useTabNavigation must be used within NavigationProvider');
  return ctx;
};
