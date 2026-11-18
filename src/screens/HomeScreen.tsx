import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useScrollToTop, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import Loader from '../components/Loader';
import { useTabNavigation } from '../context/TabNavigationContext';
import { HabitComment as Comment } from '../types';
import PostCard from '../components/PostCard';
import { SkeletonPostCard } from '../components/Skeleton';
import { colors, radii, spacing } from '../theme';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const scrollRef = React.useRef<any>(null);
  useScrollToTop(scrollRef);

  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comments State
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    try {
      const data = await backend.getFeed(user.id);
      setFeed(data);
    } catch (e) {
      console.error('Failed to fetch feed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
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
            ? { ...p, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 }
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
      const updatedFeed = await backend.getFeed(user.id);
      setFeed(updatedFeed);
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setCommenting(false);
    }
  };

  const handlePressUser = (id: string, name: string) => {
    if (user?.id === id) {
      setActiveTab('ProfileTab');
    } else {
      navigation.navigate('UserDetail', { userId: id, username: name });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>KAIZEN</Text>
          <Text style={styles.motto}>DISCIPLINE & HABIT MASTERY</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('ProfileTab')}>
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

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.lavender}
            colors={[colors.mocha]}
            progressBackgroundColor={colors.surfaceElevated}
            progressViewOffset={20}
          />
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110, flexGrow: 1 }}>
        {loading && !refreshing ? (
          <>
            <SkeletonPostCard />
            <SkeletonPostCard />
            <SkeletonPostCard />
          </>
        ) : feed.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Feed is quiet.</Text>
            <Text style={styles.emptySubtext}>Join a squad or add habits to begin tracking collective discipline.</Text>
            <TouchableOpacity style={styles.squadBtn} onPress={() => setActiveTab('SquadsTab')}>
              <Text style={styles.squadBtnText}>Explore Squads</Text>
            </TouchableOpacity>
          </View>
        ) : (
          feed.map((item) => (
            <PostCard
              key={item.id}
              post={item}
              onLike={handleLike}
              onSuspect={handleSuspect}
              onOpenComments={handleOpenComments}
              onPressUser={handlePressUser}
            />
          ))
        )}
      </ScrollView>

      {/* Comments Drawer */}
      <Modal
        visible={commentsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCommentsVisible(false)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setCommentsVisible(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setCommentsVisible(false)} style={styles.closeBtn}>
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
                  No comments yet.
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  container: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: spacing.xxl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.silver,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    lineHeight: 20,
  },
  squadBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
  },
  squadBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surfaceElevated,
    height: '70%',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    color: colors.silver,
    fontWeight: '600',
    fontSize: 15,
  },
  closeBtn: {
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
    backgroundColor: colors.primary,
    borderRadius: radii.sm,
    marginLeft: spacing.sm,
  },
  postCommentBtnText: {
    color: colors.primaryText,
    fontWeight: '700',
    fontSize: 12,
  },
});
