import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import GroupScreen from '../screens/GroupScreen';
import HabitSetupScreen from '../screens/HabitSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, group } = useAuth();
  const [loading, setLoading] = React.useState(false); // Can add real loading state later

  if (loading) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        ) : !group ? (
          <Stack.Screen name="Group" component={GroupScreen} />
        ) : (
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="HabitSetup" component={HabitSetupScreen} options={{ presentation: 'modal' }} />
            <Stack.Screen name="Leaderboard" component={LeaderboardScreen} options={{ presentation: 'modal' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
