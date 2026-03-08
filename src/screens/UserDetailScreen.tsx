import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { backend } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import { HabitComment as Comment } from '../types';

export default function UserDetailScreen({ route, navigation }: any) {
  const { userId, username } = route.params;
  const { user, group } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalHabits: 0, totalDaysLogged: 0, totalSquads: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followingLoading, setFollowingLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [feed, setFeed] = useState<any[]>([]);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const headerOpacity = scrollY.interpolate({
    inputRange: [50, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);

      const loadData = async () => {
        try {
          const [userData, userStats, followingStatus, userFeed] = await Promise.all([
            backend.getUser(userId),
            backend.getProfileStats(userId),
            user ? backend.isFollowing(user.id, userId) : Promise.resolve(false),
            backend.getUserFeed(userId),
          ]);

          if (isActive) {
            setAvatarUrl(userData?.avatarUrl || null);
            setStats(userStats);
            setIsFollowing(followingStatus);
            setFeed(userFeed);
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
          if (isActive) setLoading(false);
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [userId, group?.id, user?.id])
  );

  const handleFollowToggle = async () => {
    if (!user || followingLoading) return;
    setFollowingLoading(true);
    try {
      if (isFollowing) {
        await backend.unfollowUser(user.id, userId);
        setIsFollowing(false);
      } else {
        await backend.followUser(user.id, userId);
        setIsFollowing(true);
      }
    } catch (e) {
      console.error('Follow toggle failed:', e);
    } finally {
      setFollowingLoading(false);
    }
  };

  const handleLike = async (post: any) => {
    if (!user) return;
    try {
      if (post.isLiked) {
        await backend.unlikeLog(user.id, post.id);
      } else {
        await backend.likeLog(user.id, post.id);
      }
      setFeed(prev =>
        prev.map(p =>
          p.id === post.id
            ? { ...p, isLiked: !post.isLiked, likesCount: post.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
            : p
        )
      );
    } catch (e) {
      console.error('Like failed:', e);
    }
  };

  const handleSuspect = async (post: any) => {
    if (!user) return;
    try {
      if (post.isSuspected) {
        await backend.unsuspectLog(user.id, post.id);
      } else {
        await backend.suspectLog(user.id, post.id);
      }
      const updatedPost = await backend.getPostDetail(user.id, post.id);
      if (updatedPost) {
        setFeed(prev => prev.map(p => (p.id === post.id ? { ...p, ...updatedPost } : p)));
      }
    } catch (e) {
      console.error('Suspect failed:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.stickyHeaderContent, { opacity: headerOpacity }]}>
          <Text style={styles.stickyUsername}>@{username}</Text>
          <Text style={styles.stickyStat}>
            {stats.totalHabits} {stats.totalHabits === 1 ? 'HABIT' : 'HABITS'} • {stats.totalDaysLogged}{' '}
            {stats.totalDaysLogged === 1 ? 'DAY' : 'DAYS'} • {stats.totalSquads}{' '}
            {stats.totalSquads === 1 ? 'SQUAD' : 'SQUADS'}
          </Text>
        </Animated.View>

        <View style={{ width: 80 }} />
      </View>
      <View style={styles.container}>
        {loading ? (
          <Loader style={{ marginTop: 50 }} />
        ) : (
          <Animated.FlatList
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}
            scrollEventThrottle={16}
            data={feed}
            keyExtractor={item => item.id}
            ListHeaderComponent={() => (
              <View>
                <View style={styles.header}>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedImage(
                        avatarUrl ||
                          `https://api.dicebear.com/9.x/micah/png?seed=${username}&backgroundColor=C2FF05&radius=50`
                      )
                    }>
                    <Image
                      source={{
                        uri:
                          avatarUrl ||
                          `https://api.dicebear.com/9.x/micah/png?seed=${username}&backgroundColor=C2FF05&radius=50`,
                      }}
                      style={styles.headerAvatar}
                    />
                  </TouchableOpacity>
                  <View style={styles.headerInfo}>
                    <View style={styles.usernameRow}>
                      <Text style={styles.title}>@{username}</Text>
                      {user && user.id !== userId && (
                        <TouchableOpacity
                          style={[styles.followBtn, isFollowing && styles.followingBtn]}
                          onPress={handleFollowToggle}
                          disabled={followingLoading}>
                          {followingLoading ? (
                            <ActivityIndicator size="small" color={isFollowing ? '#888' : '#000'} />
                          ) : (
                            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                              {isFollowing ? 'FOLLOWING' : 'FOLLOW'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.miniStats}>
                      <View style={styles.miniStatItem}>
                        <Text style={styles.miniStatValue}>{stats.totalHabits}</Text>
                        <Text style={styles.miniStatLabel}>{stats.totalHabits === 1 ? 'HABIT' : 'HABITS'}</Text>
                      </View>
                      <View style={styles.miniStatDivider} />
                      <View style={styles.miniStatItem}>
                        <Text style={styles.miniStatValue}>{stats.totalDaysLogged}</Text>
                        <Text style={styles.miniStatLabel}>{stats.totalDaysLogged === 1 ? 'DAY' : 'DAYS'}</Text>
                      </View>
                      <View style={styles.miniStatDivider} />
                      <View style={styles.miniStatItem}>
                        <Text style={styles.miniStatValue}>{stats.totalSquads}</Text>
                        <Text style={styles.miniStatLabel}>{stats.totalSquads === 1 ? 'SQUAD' : 'SQUADS'}</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {feed.length > 0 && <Text style={styles.sectionTitle}>ACTIVITY</Text>}
              </View>
            )}
            renderItem={({ item }) => (
              <PostCard
                post={item}
                onLike={() => handleLike(item)}
                onSuspect={() => handleSuspect(item)}
                onOpenComments={() => navigation.navigate('PostDetail', { logId: item.id })}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No activity yet 🍃</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>

      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setSelectedImage(null)}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1 },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1, marginLeft: -4 },
  stickyHeaderContent: {
    alignItems: 'center',
    flex: 1,
  },
  stickyUsername: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stickyStat: {
    color: '#C2FF05',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 1,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 30, marginTop: 10, paddingHorizontal: 20 },
  headerAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#C2FF05',
    marginRight: 15,
  },
  title: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  headerInfo: { flex: 1 },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  followBtn: {
    backgroundColor: '#C2FF05',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  followingBtn: {
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: '#2A2A35',
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
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStatItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  miniStatValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
  },
  miniStatLabel: {
    color: '#666',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  miniStatDivider: {
    width: 1,
    height: 10,
    backgroundColor: '#2A2A35',
    marginRight: 15,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 2,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 18, fontWeight: '700' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
