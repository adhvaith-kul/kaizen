import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { User } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';
import { useTabNavigation } from '../context/TabNavigationContext';
import { colors, radii, spacing } from '../theme';

const dicebearUri = (seed: string) =>
  `https://api.dicebear.com/9.x/micah/png?seed=${seed}&backgroundColor=6F4E37&radius=50`;

export default function FriendsScreen({ navigation, route }: any) {
  const isTabBarPage = route.params?.isTab;
  const { user } = useAuth();
  const { setActiveTab: setGlobalActiveTab } = useTabNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [followers, setFollowers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'following' | 'followers' | 'search'>('following');
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [followingData, followersData] = await Promise.all([
        backend.getFollowing(user.id),
        backend.getFollowers(user.id),
      ]);
      setFollowing(followingData);
      setFollowers(followersData);
    } catch (e) {
      console.error('Failed to fetch network data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setActiveTab('search');
      const delayDebounceFn = setTimeout(async () => {
        if (!user) return;
        setLoading(true);
        try {
          const results = await backend.searchUsers(searchQuery, user.id);
          setSearchResults(results);
        } catch (e) {
          console.error('Search failed:', e);
        } finally {
          setLoading(false);
        }
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    } else if (activeTab === 'search') {
      setActiveTab('following');
      setSearchResults([]);
    }
  }, [searchQuery, user]);

  const handleFollowToggle = async (targetUser: User) => {
    if (!user) return;
    const isCurrentlyFollowing = following.some((u) => u.id === targetUser.id);
    try {
      if (isCurrentlyFollowing) {
        await backend.unfollowUser(user.id, targetUser.id);
        setFollowing((prev) => prev.filter((u) => u.id !== targetUser.id));
      } else {
        await backend.followUser(user.id, targetUser.id);
        setFollowing((prev) => [...prev, targetUser]);
      }
    } catch (e) {
      console.error('Follow toggle failed:', e);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isFollowing = following.some((u) => u.id === item.id);
    const isMe = user?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.userCard}
        activeOpacity={0.75}
        onPress={() => {
          if (isMe) {
            setGlobalActiveTab('ProfileTab');
          } else {
            navigation.navigate('UserDetail', { userId: item.id, username: item.username });
          }
        }}>
        <Image source={{ uri: item.avatarUrl || dicebearUri(item.username) }} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.username}>@{item.username}</Text>
          <Text style={styles.email} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        {!isMe && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={() => handleFollowToggle(item)}
            activeOpacity={0.8}>
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const currentData = activeTab === 'following' ? following : activeTab === 'followers' ? followers : searchResults;

  return (
    <SafeAreaView style={styles.safeArea}>
      {isTabBarPage ? (
        <View style={styles.mainHeader}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>KAIZEN</Text>
            <Text style={styles.motto}>DISCIPLINE NETWORK</Text>
          </View>
          <TouchableOpacity onPress={() => setGlobalActiveTab('ProfileTab')}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=6F4E37&radius=50`,
              }}
              style={styles.headerAvatar}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Network</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={16} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isTabBarPage ? 'Search members...' : 'Search members...'}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {!isTabBarPage && (
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'following' && styles.activeTab]}
              onPress={() => {
                setActiveTab('following');
                setSearchQuery('');
              }}>
              <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                Following ({following.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
              onPress={() => {
                setActiveTab('followers');
                setSearchQuery('');
              }}>
              <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                Followers ({followers.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && currentData.length === 0 ? (
          <Loader style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={(item) => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  {activeTab === 'search'
                    ? 'No members matching query'
                    : activeTab === 'following'
                    ? 'You are not following any members yet'
                    : 'No members following you yet'}
                </Text>
                {activeTab !== 'search' && (
                  <Text style={styles.emptySubtext}>Search for teammates to expand your network.</Text>
                )}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  mainHeader: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: 3,
  },
  motto: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.lavenderMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.silver,
  },
  container: { flex: 1, padding: spacing.lg },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    color: colors.silver,
    fontSize: 14,
    fontWeight: '400',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  activeTab: {
    backgroundColor: colors.surfaceElevated,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
  },
  activeTabText: {
    color: colors.silver,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: spacing.md,
  },
  userInfo: { flex: 1 },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.silver,
  },
  email: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  followBtn: {
    backgroundColor: colors.mocha,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.mochaLight,
  },
  followingBtn: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  followBtnText: {
    color: colors.silver,
    fontSize: 12,
    fontWeight: '600',
  },
  followingBtnText: {
    color: colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.silver,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
