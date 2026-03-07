import React from 'react';
import { NavigationContainer, DefaultTheme, useNavigation, CommonActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { StatusBar, Text, View, StyleSheet } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import GroupScreen from '../screens/GroupScreen';
import HabitSetupScreen from '../screens/HabitSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

import UserDetailScreen from '../screens/UserDetailScreen';

function HomeStackScreen({ onNestedChange }: { onNestedChange?: (nested: boolean) => void }) {
  return (
    <HomeStack.Navigator
      screenOptions={{ headerShown: false }}
      screenListeners={{
        state: (e: any) => {
          const routes = e.data?.state?.routes ?? [];
          onNestedChange?.(routes.length > 1);
        },
      }}>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Group" component={GroupScreen} />
      <HomeStack.Screen name="Dashboard" component={DashboardScreen} />
      <HomeStack.Screen name="HabitSetup" component={HabitSetupScreen} />
      <HomeStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <HomeStack.Screen name="UserDetail" component={UserDetailScreen} />
    </HomeStack.Navigator>
  );
}

import { Animated, Dimensions, TouchableOpacity } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

function MainTabs() {
  const [activeTab, setActiveTab] = React.useState('HomeTab');
  const [homeKey, setHomeKey] = React.useState(0);
  const [homeIsNested, setHomeIsNested] = React.useState(false);
  const profileAnim = React.useRef(new Animated.Value(0)).current;
  const homeAnim = React.useRef(new Animated.Value(0)).current;
  const navigation = useNavigation<any>();

  const handleTabPress = (tabName: string) => {
    if (tabName === 'ProfileTab') {
      if (activeTab === 'ProfileTab') return; // already here
      setActiveTab(tabName);

      // Slide Profile UP fast
      Animated.timing(profileAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else if (tabName === 'HomeTab') {
      if (activeTab === 'ProfileTab') {
        // We wipe the nested cache in the parent navigator to ensure a flawless reset
        navigation.dispatch((state: any) => {
          const routes = state.routes.map((r: any) => (r.name === 'MainTabs' ? { ...r, state: undefined } : r));
          return CommonActions.reset({ ...state, routes });
        });
        setHomeKey(k => k + 1);

        // ...then slide Profile DOWN tracking the fast duration
        setActiveTab(tabName);
        Animated.timing(profileAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        // ALREADY on HomeTab — only animate if we're nested inside a group screen
        if (!homeIsNested) return; // already at root HomeScreen, do nothing

        // Slide the entire stack DOWN to reveal a clone of Home underneath.
        Animated.timing(homeAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }).start(() => {
          // Clear nested navigator state cache so React Nav refuses to rehydrate Leaderboard
          navigation.dispatch((state: any) => {
            const routes = state.routes.map((r: any) => (r.name === 'MainTabs' ? { ...r, state: undefined } : r));
            return CommonActions.reset({ ...state, routes });
          });
          // Unmount and remount HomeStack cleanly
          setHomeKey(k => k + 1);
          setHomeIsNested(false);

          // Wait briefly for React to actually commit the new Home tree, avoiding the visual flash
          setTimeout(() => {
            homeAnim.setValue(0);
          }, 30);
        });
      }
    }
  };

  const profileTranslateY = profileAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E11' }}>
      {/* Background Clone of Home Screen - Only seen when the active stack slides down */}
      <View style={{ ...StyleSheet.absoluteFillObject, zIndex: 0, backgroundColor: '#0E0E11' }}>
        <HomeScreen navigation={navigation} />
      </View>

      {/* Foreground Home Stack - Slides down when escaping a group via tab bar */}
      <Animated.View style={{ flex: 1, zIndex: 1, transform: [{ translateY: homeAnim }] }}>
        <HomeStackScreen key={homeKey} onNestedChange={setHomeIsNested} />
      </Animated.View>

      {/* Profile View - Slides vertically over everything */}
      <Animated.View
        style={{
          ...StyleSheet.absoluteFillObject,
          transform: [{ translateY: profileTranslateY }],
          zIndex: 10,
          backgroundColor: '#0E0E11',
        }}>
        <ProfileScreen visible={activeTab === 'ProfileTab'} />
      </Animated.View>

      {/* Custom Bottom NavBar */}
      <View
        style={{
          backgroundColor: 'rgba(14, 14, 17, 0.95)',
          borderTopWidth: 1,
          borderTopColor: '#2A2A35',
          height: 85,
          paddingBottom: 30,
          paddingTop: 10,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          flexDirection: 'row',
          justifyContent: 'space-around',
        }}>
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center' }}
          activeOpacity={0.8}
          onPress={() => handleTabPress('HomeTab')}>
          <Text style={{ fontSize: 20 }}>🏠</Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '900',
              letterSpacing: 1,
              marginTop: 4,
              color: activeTab === 'HomeTab' ? '#C2FF05' : '#888',
            }}>
            HOME
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={{ flex: 1, alignItems: 'center' }}
          activeOpacity={0.8}
          onPress={() => handleTabPress('ProfileTab')}>
          <Text style={{ fontSize: 20 }}>👤</Text>
          <Text
            style={{
              fontSize: 10,
              fontWeight: '900',
              letterSpacing: 1,
              marginTop: 4,
              color: activeTab === 'ProfileTab' ? '#C2FF05' : '#888',
            }}>
            PROFILE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const VibeTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0E0E11',
  },
};

export default function AppNavigator() {
  const { user, group } = useAuth();
  const [loading, setLoading] = React.useState(false); // Can add real loading state later

  if (loading) return null;

  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={VibeTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Signup" component={SignupScreen} />
            </>
          ) : (
            <Stack.Screen name="MainTabs" component={MainTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
