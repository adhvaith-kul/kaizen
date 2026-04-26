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
import { useGlobalAlert } from '../context/AlertContext';
import * as Linking from 'expo-linking';
import { backend } from '../services/backend';
import { StatusBar, Text, View, StyleSheet, Animated, Dimensions, TouchableOpacity, Platform } from 'react-native';

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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
        onPress={() => handlePress('ChallengesTab', 'ChallengesTab')}>
        <Text style={{ fontSize: 20 }}>🏆</Text>
        <Text style={[styles.navLabel, { color: activeTab === 'ChallengesTab' ? '#C2FF05' : '#888' }]}>CHALLENGES</Text>
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

// ── PWA DEEP LINK INTERCEPT ───────────────────────────────────────
// We intercept the link BEFORE React Navigation inits to avoid "Not Found"
// errors if the user is not logged in / the screens aren't mounted.
let initialWebUrl: string | null = null;
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  initialWebUrl = window.location.href;
  if (window.location.pathname.includes('/join/')) {
    window.history.replaceState({}, '', '/');
  }
}
// ──────────────────────────────────────────────────────────────────

function DeepLinkHandler() {
  const { user, groups, setActiveGroup } = useAuth();
  const { showAlert } = useGlobalAlert();
  const navigation = useNavigation<any>();

  // Use refs so async callbacks always read the latest values,
  // avoiding stale-closure bugs when groups load after the timeout fires.
  const groupsRef = React.useRef(groups);
  groupsRef.current = groups;
  const processedRef = React.useRef(false);

  React.useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url || !user) return;

      let code = '';

      // Fallback manual parse for web, as Linking.parse can strip paths in edge cases
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
        // Normalize: strip trailing slash/query params, uppercase for case-insensitive match
        code = code.split('?')[0].split('/')[0].toUpperCase();
        // Consume the initial web URL so we don't re-trigger it endlessly
        initialWebUrl = null;
        processedRef.current = true;

        try {
          const groupToJoin = await backend.getGroupByCode(code);
          // Read latest groups from ref (may have loaded while the API call was in-flight)
          const currentGroups = groupsRef.current;
          const alreadyJoined = currentGroups.some(g => g.id === groupToJoin.id);

          if (alreadyJoined) {
            // Already in the squad — jump straight to standings
            const existingGroup = currentGroups.find(g => g.id === groupToJoin.id);
            if (existingGroup) setActiveGroup(existingGroup);

            navigation.navigate('MainTabs', {
              screen: 'SquadsTab',
              params: {
                screen: 'Leaderboard',
              },
            });
          } else {
            // Not a member yet — prompt to join
            showAlert('Join Squad? 🤝', `Do you want to join "${groupToJoin.name}"?`, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'JOIN',
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
          showAlert('Invite Failed', `Couldn't find an active squad for code: ${code}.`);
          console.log('[DeepLinkHandler] Join error:', e.message);
        }
      }
    };

    // Delay processing slightly to ensure MainTabs has mounted after login
    const processInitialUrl = () => {
      if (processedRef.current) return; // Already handled — don't fire again
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

    // Standard listener (handles links opened while app is already running)
    const sub = Linking.addEventListener('url', event => handleUrl(event.url));

    // Web: catch browser back/forward navigation
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
      <NavigationContainer theme={VibeTheme}>
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
