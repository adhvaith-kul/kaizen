import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { SkeletonPostCard } from '../components/Skeleton';
import { colors, radii, spacing } from '../theme';

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
    inputRange: [40, 90],
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
      setFeed((prev) =>
        prev.map((p) =>
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
        setFeed((prev) => prev.map((p) => (p.id === post.id ? { ...p, ...updatedPost } : p)));
      }
    } catch (e) {
      console.error('Suspect failed:', e);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <Animated.View style={[styles.stickyHeaderContent, { opacity: headerOpacity }]}>
          <Text style={styles.stickyUsername}>@{username}</Text>
          <Text style={styles.stickyStat}>
            {stats.totalHabits} habits • {stats.totalDaysLogged} days
          </Text>
        </Animated.View>

        <View style={{ width: 60 }} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
            <SkeletonPostCard />
            <SkeletonPostCard />
          </View>
        ) : (
          <Animated.FlatList
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}
            scrollEventThrottle={16}
            data={feed}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={() => (
              <View>
                <View style={styles.header}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() =>
                      setSelectedImage(
                        avatarUrl ||
                          `https://api.dicebear.com/9.x/micah/png?seed=${username}&backgroundColor=6F4E37&radius=50`
                      )
                    }>
                    <Image
                      source={{
                        uri:
                          avatarUrl ||
                          `https://api.dicebear.com/9.x/micah/png?seed=${username}&backgroundColor=6F4E37&radius=50`,
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
                          disabled={followingLoading}
                          activeOpacity={0.8}>
                          {followingLoading ? (
                            <ActivityIndicator size="small" color={colors.silver} />
                          ) : (
                            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
                              {isFollowing ? 'Following' : 'Follow'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={styles.miniStats}>
                      <View style={styles.miniStatItem}>
                        <Text style={styles.miniStatValue}>{stats.totalHabits}</Text>
                        <Text style={styles.miniStatLabel}>HABITS</Text>
                      </View>
                      <View style={styles.miniStatDivider} />
                      <View style={styles.miniStatItem}>
                        <Text style={styles.miniStatValue}>{stats.totalDaysLogged}</Text>
                        <Text style={styles.miniStatLabel}>DAYS</Text>
                      </View>
                      <View style={styles.miniStatDivider} />
                      <View style={styles.miniStatItem}>
                        <Text style={styles.miniStatValue}>{stats.totalSquads}</Text>
                        <Text style={styles.miniStatLabel}>SQUADS</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {feed.length > 0 && <Text style={styles.sectionTitle}>ACTIVITY LOG</Text>}
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
                <Text style={styles.emptyText}>No activity recorded yet</Text>
              </View>
            )}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
    backgroundColor: colors.surface,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 13,
  },
  stickyHeaderContent: {
    alignItems: 'center',
    flex: 1,
  },
  stickyUsername: {
    color: colors.silver,
    fontSize: 14,
    fontWeight: '600',
  },
  stickyStat: {
    color: colors.lavenderMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: -0.3,
  },
  headerInfo: { flex: 1 },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  followBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  followingBtn: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
  },
  followBtnText: {
    color: colors.primaryText,
    fontSize: 11,
    fontWeight: '700',
  },
  followingBtnText: {
    color: colors.textMuted,
  },
  miniStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniStatItem: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  miniStatValue: {
    color: colors.silver,
    fontSize: 14,
    fontWeight: '700',
  },
  miniStatLabel: {
    color: colors.textMuted,
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  miniStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.borderSubtle,
    marginRight: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    padding: spacing.xl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
});
