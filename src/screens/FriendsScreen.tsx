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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { User } from '../types';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';
import { useTabNavigation } from '../context/TabNavigationContext';

const dicebearUri = (seed: string) =>
  `https://api.dicebear.com/9.x/micah/png?seed=${seed}&backgroundColor=C2FF05&radius=50`;

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
      console.error('Failed to fetch friends data:', e);
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
    const isCurrentlyFollowing = following.some(u => u.id === targetUser.id);
    try {
      if (isCurrentlyFollowing) {
        await backend.unfollowUser(user.id, targetUser.id);
        setFollowing(prev => prev.filter(u => u.id !== targetUser.id));
      } else {
        await backend.followUser(user.id, targetUser.id);
        setFollowing(prev => [...prev, targetUser]);
      }
    } catch (e) {
      console.error('Follow toggle failed:', e);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => {
    const isFollowing = following.some(u => u.id === item.id);
    const isMe = user?.id === item.id;

    return (
      <TouchableOpacity
        style={styles.userCard}
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
            onPress={() => handleFollowToggle(item)}>
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
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
            <Text style={styles.motto}>SELF-IMPROVEMENT. GAMIFIED.</Text>
          </View>
          <TouchableOpacity onPress={() => setGlobalActiveTab('ProfileTab')}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=C2FF05&radius=50`,
              }}
              style={styles.headerAvatar}
            />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>FRIENDS</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={isTabBarPage ? 'Search friends...' : 'Search users...'}
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#666" />
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
                FOLLOWING ({following.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
              onPress={() => {
                setActiveTab('followers');
                setSearchQuery('');
              }}>
              <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                FOLLOWERS ({followers.length})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && currentData.length === 0 ? (
          <Loader style={{ marginTop: 50 }} />
        ) : (
          <FlatList
            data={currentData}
            keyExtractor={item => item.id}
            renderItem={renderUserItem}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>{activeTab === 'search' ? '🔍' : '🍃'}</Text>
                <Text style={styles.emptyText}>
                  {activeTab === 'search'
                    ? 'No users found'
                    : activeTab === 'following'
                      ? "You aren't following anyone yet"
                      : 'No one is following you yet'}
                </Text>
                {activeTab !== 'search' && <Text style={styles.emptySubtext}>Search for friends to get started!</Text>}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: '#1A1A24',
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  mainHeader: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#0E0E11',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  motto: {
    fontSize: 8,
    fontWeight: '900',
    color: '#C2FF05',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2FF05',
  },
  headerTitle: { fontSize: 20, fontWeight: '900', color: '#FFF', letterSpacing: 1 },
  container: { flex: 1, padding: 16 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: '#2A2A35',
    marginBottom: 20,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 16, fontWeight: '600' },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#15151A',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#2A2A35',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 1,
  },
  activeTabText: {
    color: '#C2FF05',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    padding: 12,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#C2FF05',
    marginRight: 12,
  },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: '900', color: '#FFF' },
  email: { fontSize: 12, color: '#666', marginTop: 2 },
  followBtn: {
    backgroundColor: '#C2FF05',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  followingBtn: {
    backgroundColor: '#2A2A35',
    borderWidth: 1,
    borderColor: '#3A3A45',
  },
  followBtnText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  followingBtnText: {
    color: '#888',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyText: { color: '#FFF', fontSize: 18, fontWeight: '800', textAlign: 'center' },
  emptySubtext: { color: '#666', fontSize: 14, marginTop: 8, textAlign: 'center' },
});
