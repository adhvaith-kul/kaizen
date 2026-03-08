import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigation,
  StackActions,
  CommonActions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { StatusBar, Text, View, StyleSheet, Animated, Dimensions, TouchableOpacity } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import GroupScreen from '../screens/GroupScreen';
import HabitSetupScreen from '../screens/HabitSetupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import HomeScreen from '../screens/HomeScreen';
import SquadsScreen from '../screens/SquadsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import UserDetailScreen from '../screens/UserDetailScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import EditGroupScreen from '../screens/EditGroupScreen';
import FriendsScreen from '../screens/FriendsScreen';

import { TabNavigationContext } from '../context/TabNavigationContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── NAVIGATORS ──────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const FeedStack = createNativeStackNavigator();
const SquadsStack = createNativeStackNavigator();
const FriendsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function FeedStackScreen() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="Home" component={HomeScreen} />
      <FeedStack.Screen name="UserDetail" component={UserDetailScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedStack.Screen name="Friends" component={FriendsScreen} />
    </FeedStack.Navigator>
  );
}

function SquadsStackScreen() {
  return (
    <SquadsStack.Navigator screenOptions={{ headerShown: false }}>
      <SquadsStack.Screen name="SquadsRoot" component={SquadsScreen} />
      <SquadsStack.Screen name="Leaderboard" component={LeaderboardScreen} />
      <SquadsStack.Screen name="Dashboard" component={DashboardScreen} />
      <SquadsStack.Screen name="HabitSetup" component={HabitSetupScreen} />
      <SquadsStack.Screen name="Group" component={GroupScreen} />
      <SquadsStack.Screen name="UserDetail" component={UserDetailScreen} />
      <SquadsStack.Screen name="PostDetail" component={PostDetailScreen} />
      <SquadsStack.Screen name="EditGroup" component={EditGroupScreen} />
      <SquadsStack.Screen name="Friends" component={FriendsScreen} />
    </SquadsStack.Navigator>
  );
}

function FriendsStackScreen() {
  return (
    <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
      <FriendsStack.Screen name="FriendsRoot" component={FriendsScreen} initialParams={{ isTab: true }} />
      <FriendsStack.Screen name="UserDetail" component={UserDetailScreen} />
      <FriendsStack.Screen name="PostDetail" component={PostDetailScreen} />
    </FriendsStack.Navigator>
  );
}

function ProfileStackScreen() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileRoot" component={ProfileScreen} />
      <ProfileStack.Screen name="Friends" component={FriendsScreen} />
      <ProfileStack.Screen name="UserDetail" component={UserDetailScreen} />
      <ProfileStack.Screen name="PostDetail" component={PostDetailScreen} />
    </ProfileStack.Navigator>
  );
}

function CustomTabBar({ state, navigation, activeTab, onTabPress }: any) {
  const getTabKey = (name: string) => {
    return state.routes.find((r: any) => r.name === name)?.key;
  };

  const handlePress = (tabName: string, routeName: string) => {
    const key = getTabKey(routeName);
    if (key) {
      navigation.emit({
        type: 'tabPress',
        target: key,
        canPreventDefault: true,
      });
    }
    onTabPress(tabName);
  };

  return (
    <View style={styles.navBar}>
      <TouchableOpacity style={styles.navItem} activeOpacity={0.8} onPress={() => handlePress('HomeTab', 'FeedTab')}>
        <Text style={{ fontSize: 20 }}>🔥</Text>
        <Text style={[styles.navLabel, { color: activeTab === 'HomeTab' ? '#C2FF05' : '#888' }]}>HOME</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.8}
        onPress={() => handlePress('SquadsTab', 'SquadsTab')}>
        <Text style={{ fontSize: 20 }}>🤝</Text>
        <Text style={[styles.navLabel, { color: activeTab === 'SquadsTab' ? '#C2FF05' : '#888' }]}>SQUADS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.8}
        onPress={() => handlePress('FriendsTab', 'FriendsTab')}>
        <Text style={{ fontSize: 20 }}>👥</Text>
        <Text style={[styles.navLabel, { color: activeTab === 'FriendsTab' ? '#C2FF05' : '#888' }]}>FRIENDS</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.navItem}
        activeOpacity={0.8}
        onPress={() => handlePress('ProfileTab', 'ProfileTab')}>
        <Text style={{ fontSize: 20 }}>👤</Text>
        <Text style={[styles.navLabel, { color: activeTab === 'ProfileTab' ? '#C2FF05' : '#888' }]}>PROFILE</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainTabs() {
  const [activeTab, setActiveTab] = React.useState('HomeTab');
  const tabNavRef = React.useRef<any>(null);

  const handleTabPress = (tabName: string) => {
    if (activeTab === tabName) {
      // Double tap: Go back to the root of the active stack natively
      const state = tabNavRef.current?.getState();
      if (state) {
        let routeName = tabName;
        if (tabName === 'HomeTab') routeName = 'FeedTab';

        const targetTabRoute = state.routes.find((r: any) => r.name === routeName);
        if (targetTabRoute?.state && targetTabRoute.state.index > 0) {
          tabNavRef.current?.dispatch({
            ...StackActions.popToTop(),
            target: targetTabRoute.state.key,
          });
        }
      }
    } else {
      // Switch to tab, preserving previous state/stack depth
      setActiveTab(tabName);
      let routeName = tabName;
      if (tabName === 'HomeTab') routeName = 'FeedTab';
      tabNavRef.current?.navigate(routeName);
    }
  };

  const resetStack = (tabName: string) => {
    const state = tabNavRef.current?.getState();
    if (state) {
      let routeName = tabName;
      if (tabName === 'HomeTab') routeName = 'FeedTab';

      const targetTabRoute = state.routes.find((r: any) => r.name === routeName);
      if (targetTabRoute?.state && targetTabRoute.state.index > 0) {
        tabNavRef.current?.dispatch({
          ...StackActions.popToTop(),
          target: targetTabRoute.state.key,
        });
      }
    }
  };

  return (
    <TabNavigationContext.Provider value={{ activeTab, setActiveTab: handleTabPress, resetStack }}>
      <View style={{ flex: 1, backgroundColor: '#0E0E11' }}>
        <Tab.Navigator
          tabBar={props => {
            tabNavRef.current = props.navigation;
            return <CustomTabBar {...props} activeTab={activeTab} onTabPress={handleTabPress} />;
          }}
          screenOptions={{ headerShown: false }}>
          <Tab.Screen name="FeedTab" component={FeedStackScreen} />
          <Tab.Screen name="SquadsTab" component={SquadsStackScreen} />
          <Tab.Screen name="FriendsTab" component={FriendsStackScreen} />
          <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
        </Tab.Navigator>
      </View>
    </TabNavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  navBar: {
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
  },
  navItem: { flex: 1, alignItems: 'center' },
  navLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
});

const VibeTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0E0E11',
  },
};

export default function AppNavigator() {
  const { user } = useAuth();

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
