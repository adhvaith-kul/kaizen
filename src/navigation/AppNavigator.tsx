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
import { StatusBar, Text, View, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GlassView from '../components/GlassView';
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
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
  isAvatar?: boolean;
}

const TABS: TabItemConfig[] = [
  { key: 'HomeTab', route: 'FeedTab', label: 'Feed', iconActive: 'home', iconInactive: 'home-outline' },
  { key: 'SquadsTab', route: 'SquadsTab', label: 'Squads', iconActive: 'people', iconInactive: 'people-outline' },
  { key: 'ChallengesTab', route: 'ChallengesTab', label: 'Challenges', iconActive: 'trophy', iconInactive: 'trophy-outline' },
  { key: 'FriendsTab', route: 'FriendsTab', label: 'Network', iconActive: 'search', iconInactive: 'search-outline' },
  { key: 'ProfileTab', route: 'ProfileTab', label: 'Profile', iconActive: 'person', iconInactive: 'person-outline', isAvatar: true },
];

function CustomTabBar({ state, navigation, activeTab, onTabPress }: any) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

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

  const bottomOffset = Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 20;
  const avatarUri =
    user?.avatarUrl ||
    `https://api.dicebear.com/9.x/micah/png?seed=${user?.username || 'user'}&backgroundColor=6F4E37&radius=50`;

  return (
    <View style={[styles.floatingNavContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
      <GlassView
        variant="capsule"
        intensity={85}
        tint="dark"
        borderRadius={30}
        specularBorder={true}
        specularColor="rgba(255, 255, 255, 0.16)"
        tintColor="rgba(25, 17, 13, 0.78)"
        style={styles.floatingNavBar}>
        <View style={styles.navRow}>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.navItem, isActive && !tab.isAvatar && styles.navItemActive]}
                activeOpacity={0.7}
                onPress={() => handlePress(tab.key, tab.route)}>
                {tab.isAvatar ? (
                  <View style={[styles.avatarRing, isActive && styles.avatarRingActive]}>
                    <Image source={{ uri: avatarUri }} style={styles.tabAvatar} />
                  </View>
                ) : (
                  <Ionicons
                    name={isActive ? tab.iconActive : tab.iconInactive}
                    size={22}
                    color={isActive ? colors.primary : colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </GlassView>
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
  floatingNavContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99,
  },
  floatingNavBar: {
    width: '90%',
    maxWidth: 350,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 16,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: '100%',
    paddingHorizontal: 8,
  },
  navItem: {
    width: 52,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  navItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  avatarRing: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRingActive: {
    borderColor: colors.primary,
  },
  tabAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
});

const KaizenTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
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
