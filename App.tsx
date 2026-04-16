import React from 'react';
import { AuthProvider } from './src/context/AuthContext';
import { AlertProvider, GlobalAlert } from './src/context/AlertContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AlertProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      {/*
        GlobalAlert is rendered HERE — as a sibling to AppNavigator, completely
        outside the NavigationContainer. This matches the boopd pattern and is
        the fix for PWA/Expo Web: the Modal is at the absolute root of the React
        tree so it has no stacking context from navigation screens blocking it.
      */}
      <GlobalAlert />
    </AlertProvider>
  );
}
