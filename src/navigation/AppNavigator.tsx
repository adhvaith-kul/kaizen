import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  useNavigation,
  StackActions,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { useGlobalAlert } from '../context/AlertContext';
import * as Linking from 'expo-linking';
import { backend } from '../services/backend';
import { StatusBar, Text, View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors, radii, spacing, theme } from '../theme';

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
import UserLogsScreen from '../screens/UserLogsScreen';
import ChallengesScreen from '../screens/ChallengesScreen';

import { TabNavigationContext } from '../context/TabNavigationContext';

// ── NAVIGATORS ──────────────────────────────────────────────────
const Stack = createNativeStackNavigator();
const FeedStack = createNativeStackNavigator();
const SquadsStack = createNativeStackNavigator();
const FriendsStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();
const ChallengesStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function FeedStackScreen() {
  return (
    <FeedStack.Navigator screenOptions={{ headerShown: false }}>
      <FeedStack.Screen name="Home" component={HomeScreen} />
      <FeedStack.Screen name="UserDetail" component={UserDetailScreen} />
      <FeedStack.Screen name="PostDetail" component={PostDetailScreen} />
      <FeedStack.Screen name="Friends" component={FriendsScreen} />
      <FeedStack.Screen name="UserLogs" component={UserLogsScreen} />
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
      <SquadsStack.Screen name="UserLogs" component={UserLogsScreen} />
    </SquadsStack.Navigator>
  );
}

function FriendsStackScreen() {
  return (
    <FriendsStack.Navigator screenOptions={{ headerShown: false }}>
      <FriendsStack.Screen name="FriendsRoot" component={FriendsScreen} initialParams={{ isTab: true }} />
      <FriendsStack.Screen name="UserDetail" component={UserDetailScreen} />
      <FriendsStack.Screen name="PostDetail" component={PostDetailScreen} />
      <FriendsStack.Screen name="UserLogs" component={UserLogsScreen} />
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
      <ProfileStack.Screen name="UserLogs" component={UserLogsScreen} />
    </ProfileStack.Navigator>
  );
}

function ChallengesStackScreen() {
  return (
    <ChallengesStack.Navigator screenOptions={{ headerShown: false }}>
      <ChallengesStack.Screen name="ChallengesRoot" component={ChallengesScreen} />
    </ChallengesStack.Navigator>
  );
}

interface TabItemConfig {
  key: string;
  route: string;
  label: string;
}

const TABS: TabItemConfig[] = [
  { key: 'HomeTab', route: 'FeedTab', label: 'Feed' },
  { key: 'SquadsTab', route: 'SquadsTab', label: 'Squads' },
  { key: 'ChallengesTab', route: 'ChallengesTab', label: 'Challenges' },
  { key: 'FriendsTab', route: 'FriendsTab', label: 'Network' },
  { key: 'ProfileTab', route: 'ProfileTab', label: 'Profile' },
];

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
      {TABS.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            activeOpacity={0.7}
            onPress={() => handlePress(tab.key, tab.route)}>
            <View style={[styles.indicator, isActive && styles.indicatorActive]} />
            <Text style={[styles.navLabel, isActive ? styles.navLabelActive : styles.navLabelInactive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
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
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Tab.Navigator
          tabBar={(props) => {
            tabNavRef.current = props.navigation;
            return <CustomTabBar {...props} activeTab={activeTab} onTabPress={handleTabPress} />;
          }}
          screenOptions={{ headerShown: false }}>
          <Tab.Screen name="FeedTab" component={FeedStackScreen} />
          <Tab.Screen name="SquadsTab" component={SquadsStackScreen} />
          <Tab.Screen name="ChallengesTab" component={ChallengesStackScreen} />
          <Tab.Screen name="FriendsTab" component={FriendsStackScreen} />
          <Tab.Screen name="ProfileTab" component={ProfileStackScreen} />
        </Tab.Navigator>
      </View>
    </TabNavigationContext.Provider>
  );
}

const styles = StyleSheet.create({
  navBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    height: 80,
    paddingBottom: 24,
    paddingTop: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  indicator: {
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: 'transparent',
    marginBottom: 6,
  },
  indicatorActive: {
    backgroundColor: colors.lavender,
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  navLabelActive: {
    color: colors.silver,
  },
  navLabelInactive: {
    color: colors.textMuted,
  },
});

const KaizenTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.silver,
    border: colors.border,
  },
};

let initialWebUrl: string | null = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  initialWebUrl = window.location.href;
  if (window.location.pathname.includes('/join/')) {
    window.history.replaceState({}, '', '/');
  }
}

function DeepLinkHandler() {
  const { user, groups, setActiveGroup } = useAuth();
  const { showAlert } = useGlobalAlert();
  const navigation = useNavigation<any>();

  const groupsRef = React.useRef(groups);
  groupsRef.current = groups;
  const processedRef = React.useRef(false);

  React.useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !user) return;

      let code = '';

      if (Platform.OS === 'web' && url.includes('/join/')) {
        const parts = url.split('/join/');
        code = parts[parts.length - 1];
      } else {
        const fullUrl = url.includes('://') ? url : Linking.createURL(url);
        const parsed = Linking.parse(fullUrl);

        if (parsed.path?.includes('join/')) {
          code = parsed.path.split('join/')[1];
        } else if (parsed.queryParams?.code) {
          code = String(parsed.queryParams.code);
        }
      }

      if (code) {
        code = code.split('?')[0].split('/')[0].toUpperCase();
        initialWebUrl = null;
        processedRef.current = true;

        try {
          const groupToJoin = await backend.getGroupByCode(code);
          const currentGroups = groupsRef.current;
          const alreadyJoined = currentGroups.some((g) => g.id === groupToJoin.id);

          if (alreadyJoined) {
            const existingGroup = currentGroups.find((g) => g.id === groupToJoin.id);
            if (existingGroup) setActiveGroup(existingGroup);

            navigation.navigate('MainTabs', {
              screen: 'SquadsTab',
              params: {
                screen: 'Leaderboard',
              },
            });
          } else {
            showAlert('Join Squad', `Would you like to join "${groupToJoin.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Join',
                onPress: () => {
                  navigation.navigate('MainTabs', {
                    screen: 'SquadsTab',
                    params: {
                      screen: 'HabitSetup',
                      params: { pendingGroupJoin: groupToJoin },
                    },
                  });
                },
              },
            ]);
          }
        } catch (e: any) {
          showAlert('Invite Failed', `Could not find an active squad for code: ${code}.`);
          console.log('[DeepLinkHandler] Join error:', e.message);
        }
      }
    };

    const processInitialUrl = () => {
      if (processedRef.current) return;
      setTimeout(() => {
        if (processedRef.current) return;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          handleUrl(initialWebUrl || window.location.href);
        } else {
          Linking.getInitialURL().then(handleUrl);
        }
      }, 500);
    };

    if (user) {
      processInitialUrl();
    }

    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));

    let webSub: any;
    if (Platform.OS === 'web') {
      const handlePopState = () => handleUrl(window.location.href);
      window.addEventListener('popstate', handlePopState);
      webSub = { remove: () => window.removeEventListener('popstate', handlePopState) };
    }

    return () => {
      sub.remove();
      if (webSub) webSub.remove();
    };
  }, [user, groups, navigation, showAlert, setActiveGroup]);

  return null;
}

export default function AppNavigator() {
  const { user } = useAuth();

  return (
    <>
      <StatusBar barStyle="light-content" />
      <NavigationContainer theme={KaizenTheme}>
        <DeepLinkHandler />
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
