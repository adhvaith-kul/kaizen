import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useGlobalAlert } from '../context/AlertContext';
import { backend } from '../services/backend';
import { HabitComment as Comment } from '../types';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import { Skeleton } from '../components/Skeleton';
import { colors, radii, spacing } from '../theme';

const SQUAD_COLORS = [colors.mocha, colors.lavender, colors.silver, colors.mochaLight, colors.lavenderMuted];

const dicebearUri = (seed: string) =>
  `https://api.dicebear.com/9.x/micah/png?seed=${seed}&backgroundColor=6F4E37&radius=50`;

export default function ProfileScreen({ navigation }: any) {
  const { user, groups, refreshUser, logout } = useAuth();
  const { showAlert } = useGlobalAlert();
  const [stats, setStats] = useState({ totalHabits: 0, totalDaysLogged: 0 });
  const [followStats, setFollowStats] = useState({ following: 0, followers: 0 });
  const [graphData, setGraphData] = useState<any[]>([]);
  const [maxTotal, setMaxTotal] = useState(1);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [viewVisible, setViewVisible] = useState(false);

  // Feed/Comments State
  const [feed, setFeed] = useState<any[]>([]);
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const scrollY = React.useRef(new Animated.Value(0)).current;

  const stickyOpacity = scrollY.interpolate({
    inputRange: [80, 150],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const logoOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const generateLast7Days = () => {
    const dates = [];
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now + istOffset - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
      dates.push({ date: dateStr, displayDate, squadData: {} as Record<string, number>, total: 0 });
    }
    return dates;
  };

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let isActive = true;
      setLoading(true);

      Promise.all([
        backend.getProfileStats(user.id),
        backend.getUserLogs(user.id),
        backend.getUserFeed(user.id),
        backend.getFollowing(user.id),
        backend.getFollowers(user.id),
      ]).then(([s, logs, feedData, following, followers]) => {
        if (!isActive) return;
        setStats(s);
        setFeed(feedData);
        setFollowStats({ following: following.length, followers: followers.length });

        const dates = generateLast7Days();
        logs.forEach((log) => {
          const day = dates.find((d) => d.date === log.date);
          if (day) {
            day.squadData[log.groupId] = (day.squadData[log.groupId] || 0) + 1;
            day.total += 1;
          }
        });

        const highestTotal = Math.max(...dates.map((d) => d.total), 1);
        setMaxTotal(highestTotal);
        setGraphData(dates);
        setLoading(false);
      });

      return () => {
        isActive = false;
      };
    }, [user])
  );

  const handlePickImage = async (fromCamera: boolean) => {
    let result: ImagePicker.ImagePickerResult;

    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Required', 'Camera access is required to take a photo.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permission Required', 'Photo library access is required to choose an image.');
        return;
      }
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
    }

    if (result.canceled || !result.assets?.[0]?.uri || !user) {
      setPickerVisible(false);
      return;
    }

    const uri = result.assets[0].uri;
    setUploading(true);
    setPickerVisible(false);
    try {
      const publicUrl = await backend.uploadProfilePicture(uri, user.id);
      await backend.updateUserAvatar(user.id, publicUrl);
      await refreshUser();
    } catch (e: any) {
      showAlert('Upload Failed', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const showAvatarOptions = () => {
    setPickerVisible(true);
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

  const handleOpenComments = async (postId: string) => {
    setActivePostId(postId);
    setCommentsVisible(true);
    try {
      const data = await backend.getComments(postId);
      setComments(data);
    } catch (e) {
      console.error('Failed to fetch comments:', e);
    }
  };

  const postComment = async () => {
    if (!user || !activePostId || !newComment.trim()) return;
    setCommenting(true);
    try {
      await backend.addComment(user.id, activePostId, newComment);
      setNewComment('');
      const data = await backend.getComments(activePostId);
      setComments(data);
      const updatedFeed = await backend.getUserFeed(user.id);
      setFeed(updatedFeed);
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setCommenting(false);
    }
  };

  const avatarUri = user?.avatarUrl || dicebearUri(user?.username || 'user');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.fixedHeader}>
        <View style={styles.headerLeftContainer}>
          <Animated.View style={[styles.stickyLeft, { opacity: stickyOpacity, position: 'absolute', left: 0 }]}>
            <Text style={styles.stickyUsername} numberOfLines={1}>
              @{user?.username}
            </Text>
          </Animated.View>
          <Animated.View style={{ opacity: logoOpacity }}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>KAIZEN</Text>
              <Text style={styles.motto}>PROFILE & METRICS</Text>
            </View>
          </Animated.View>
        </View>

        <View style={styles.fixedHeaderRight}>
          <TouchableOpacity
            style={styles.headerLogoutBtn}
            onPress={() => {
              logout().then(() => navigation.navigate('Login'));
            }}>
            <Ionicons name="log-out-outline" size={16} color={colors.textMuted} />
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 110 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}>
        <View style={styles.topContent}>
          <View style={styles.profileSection}>
            <TouchableOpacity onPress={showAvatarOptions} activeOpacity={0.85} style={styles.avatarContainer}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />

              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color={colors.lavender} size="small" />
                </View>
              )}

              {!uploading && (
                <View style={styles.cameraBadge}>
                  <Ionicons name="camera-outline" size={14} color={colors.silver} />
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.username}>@{user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>

            <TouchableOpacity style={styles.followStatsRow} onPress={() => navigation.navigate('Friends')} activeOpacity={0.75}>
              <View style={styles.followStatItem}>
                <Text style={styles.followStatValue}>{followStats.following}</Text>
                <Text style={styles.followStatLabel}>FOLLOWING</Text>
              </View>
              <View style={styles.followStatDivider} />
              <View style={styles.followStatItem}>
                <Text style={styles.followStatValue}>{followStats.followers}</Text>
                <Text style={styles.followStatLabel}>FOLLOWERS</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={colors.textMuted} style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>LIFETIME METRICS</Text>

            {loading ? (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Skeleton width={50} height={24} style={{ marginBottom: 6 }} />
                  <Skeleton width={70} height={10} />
                </View>
                <View style={styles.statBox}>
                  <Skeleton width={50} height={24} style={{ marginBottom: 6 }} />
                  <Skeleton width={70} height={10} />
                </View>
                <View style={styles.statBox}>
                  <Skeleton width={50} height={24} style={{ marginBottom: 6 }} />
                  <Skeleton width={70} height={10} />
                </View>
              </View>
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.totalHabits}</Text>
                  <Text style={styles.statLabel}>COMPLETIONS</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.totalDaysLogged}</Text>
                  <Text style={styles.statLabel}>DAYS RECORDED</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{groups.length}</Text>
                  <Text style={styles.statLabel}>ACTIVE SQUADS</Text>
                </View>
              </View>
            )}
          </View>

          {/* Habit Consistency Graph */}
          <View style={styles.graphSection}>
            <Text style={styles.sectionTitle}>7-DAY CONSISTENCY</Text>
            {loading ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.lg, height: 130, alignItems: 'flex-end' }}>
                {[50, 85, 40, 110, 75, 95, 60].map((h, i) => (
                  <View key={i} style={{ alignItems: 'center', width: 32 }}>
                    <Skeleton width={18} height={h} borderRadius={radii.sm} style={{ marginBottom: 8 }} />
                    <Skeleton width={18} height={10} borderRadius={radii.sm} />
                  </View>
                ))}
              </View>
            ) : (
              <>
                <View style={styles.chartRow}>
                  {graphData.map((day, idx) => (
                    <View key={idx} style={styles.barColumn}>
                      <Text style={styles.barValue}>{day.total > 0 ? day.total : ''}</Text>
                      <View style={styles.barWrapper}>
                        {day.total === 0 && (
                          <View style={[styles.barSegment, { height: '6%', backgroundColor: colors.surfaceHover }]} />
                        )}

                        {Object.entries(day.squadData).map(([groupId, count]: [string, any]) => {
                          const heightRatio = count / maxTotal;
                          const groupIndex = groups.findIndex((g) => g.id === groupId);
                          const color = SQUAD_COLORS[groupIndex % SQUAD_COLORS.length] || colors.mocha;
                          return (
                            <View
                              key={groupId}
                              style={[styles.barSegment, { height: `${heightRatio * 100}%`, backgroundColor: color }]}
                            />
                          );
                        })}
                      </View>
                      <Text style={[styles.barLabel, idx === 6 && { color: colors.lavender, fontWeight: '700' }]}>
                        {day.displayDate}
                      </Text>
                    </View>
                  ))}
                </View>

                {groups.length > 0 && (
                  <View style={styles.legendContainer}>
                    {groups.map((g, idx) => (
                      <View key={g.id} style={styles.legendItem}>
                        <View
                          style={[styles.legendColor, { backgroundColor: SQUAD_COLORS[idx % SQUAD_COLORS.length] }]}
                        />
                        <Text style={styles.legendText}>{g.name}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {feed.length > 0 && (
          <View style={styles.feedSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: spacing.lg }]}>PERSONAL ACTIVITY</Text>
            {feed.map((item) => (
              <PostCard
                key={item.id}
                post={item}
                onLike={handleLike}
                onSuspect={handleSuspect}
                onOpenComments={handleOpenComments}
              />
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* Avatar Options Modal */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>PROFILE PHOTO</Text>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setPickerVisible(false);
                setViewVisible(true);
              }}>
              <Text style={styles.sheetOptionText}>View Current Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => handlePickImage(true)}>
              <Text style={styles.sheetOptionText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => handlePickImage(false)}>
              <Text style={styles.sheetOptionText}>Choose from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setPickerVisible(false)}>
              <Text style={styles.sheetCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen View Modal */}
      <Modal visible={viewVisible} transparent animationType="fade" onRequestClose={() => setViewVisible(false)}>
        <TouchableOpacity style={styles.viewOverlay} activeOpacity={1} onPress={() => setViewVisible(false)}>
          <Image source={{ uri: avatarUri }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeViewBtn} onPress={() => setViewVisible(false)}>
            <Text style={styles.closeViewText}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Comments Drawer */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentsVisible(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setCommentsVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContentComments}>
            <View style={styles.modalHeaderComments}>
              <View style={styles.modalHandleComments} />
              <Text style={styles.modalTitleComments}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)} style={styles.closeBtnComments}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={(c) => c.id}
              contentContainerStyle={{ paddingVertical: spacing.lg, paddingHorizontal: spacing.lg }}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <Image
                    source={{
                      uri:
                        item.avatarUrl ||
                        `https://api.dicebear.com/9.x/micah/png?seed=${item.username}&backgroundColor=6F4E37&radius=50`,
                    }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentUser}>{item.username}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={{ color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 13 }}>
                  No comments recorded yet.
                </Text>
              )}
            />

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor={colors.textMuted}
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                onPress={postComment}
                disabled={commenting || !newComment.trim()}
                style={[styles.postCommentBtn, !newComment.trim() && { opacity: 0.4 }]}>
                <Text style={styles.postCommentBtnText}>{commenting ? '...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  headerLeftContainer: {
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
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
  stickyLeft: {
    zIndex: 2,
  },
  fixedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  stickyUsername: {
    color: colors.silver,
    fontSize: 16,
    fontWeight: '700',
  },
  topContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    color: colors.textSecondary,
    fontWeight: '500',
    fontSize: 12,
  },
  feedSection: {
    marginTop: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.md,
    letterSpacing: 1.5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(19, 14, 11, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 14,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.silver,
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  email: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '400',
    marginBottom: spacing.lg,
  },
  followStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  followStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  followStatValue: {
    color: colors.silver,
    fontSize: 13,
    fontWeight: '700',
  },
  followStatLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  followStatDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: spacing.md,
  },
  statsCard: {
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  graphSection: {
    marginBottom: spacing.xxl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.silver,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: spacing.md,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: 8,
    height: 90,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginVertical: spacing.xs,
  },
  barSegment: {
    width: '100%',
    minHeight: 2,
  },
  barValue: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    height: 14,
  },
  barLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
    marginBottom: spacing.xs,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.8)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  sheetTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  sheetOption: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  sheetOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.silver,
  },
  sheetCancel: {
    marginTop: spacing.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textMuted,
  },
  viewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '75%',
  },
  closeViewBtn: {
    position: 'absolute',
    top: 50,
    right: 24,
    padding: spacing.sm,
  },
  closeViewText: {
    color: colors.silver,
    fontWeight: '600',
    fontSize: 14,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContentComments: {
    backgroundColor: colors.surfaceElevated,
    height: '70%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeaderComments: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalHandleComments: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  modalTitleComments: {
    color: colors.silver,
    fontWeight: '600',
    fontSize: 15,
  },
  closeBtnComments: {
    position: 'absolute',
    right: spacing.lg,
    top: spacing.md,
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: spacing.md,
  },
  commentInfo: { flex: 1 },
  commentUser: {
    color: colors.silver,
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  commentText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  commentInput: {
    flex: 1,
    color: colors.silver,
    fontSize: 14,
    maxHeight: 90,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  postCommentBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.mocha,
    borderRadius: radii.sm,
    marginLeft: spacing.sm,
  },
  postCommentBtnText: {
    color: colors.silver,
    fontWeight: '600',
    fontSize: 12,
  },
});
