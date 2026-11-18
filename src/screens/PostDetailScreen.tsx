import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import Loader from '../components/Loader';
import { HabitComment as Comment } from '../types';
import PostCard from '../components/PostCard';
import { useTabNavigation } from '../context/TabNavigationContext';
import { colors, radii, spacing } from '../theme';

export default function PostDetailScreen({ route, navigation }: any) {
  const { logId } = route.params;
  const { user } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Comments State
  const [commentsVisible, setCommentsVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchPost = async () => {
    if (!user) return;
    try {
      const data = await backend.getPostDetail(user.id, logId);
      setPost(data);
    } catch (e) {
      console.error('Failed to fetch post detail:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [logId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPost();
  };

  const handleLike = async (item: any) => {
    if (!user) return;
    try {
      if (item.isLiked) {
        await backend.unlikeLog(user.id, item.id);
      } else {
        await backend.likeLog(user.id, item.id);
      }
      setPost((prev: any) => ({
        ...prev,
        isLiked: !prev.isLiked,
        likesCount: prev.isLiked ? prev.likesCount - 1 : prev.likesCount + 1,
      }));
    } catch (e) {
      console.error('Like failed:', e);
    }
  };

  const handleSuspect = async (item: any) => {
    if (!user) return;
    try {
      if (item.isSuspected) {
        await backend.unsuspectLog(user.id, item.id);
      } else {
        await backend.suspectLog(user.id, item.id);
      }
      const updatedPost = await backend.getPostDetail(user.id, item.id);
      setPost(updatedPost);
    } catch (e) {
      console.error('Suspect failed:', e);
    }
  };

  const handleOpenComments = async (postId: string) => {
    setCommentsVisible(true);
    try {
      const data = await backend.getComments(postId);
      setComments(data);
    } catch (e) {
      console.error('Failed to fetch comments:', e);
    }
  };

  const postComment = async () => {
    if (!user || !post || !newComment.trim()) return;
    setCommenting(true);
    try {
      await backend.addComment(user.id, post.id, newComment);
      setNewComment('');
      const data = await backend.getComments(post.id);
      setComments(data);
      const updatedPost = await backend.getPostDetail(user.id, post.id);
      setPost(updatedPost);
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

  if (loading && !refreshing) {
    return <Loader fullScreen />;
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Verification</Text>
          <View style={{ width: 60 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Record not found or has been removed.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lavender} />}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}>
        <PostCard
          post={post}
          onLike={handleLike}
          onSuspect={handleSuspect}
          onOpenComments={handleOpenComments}
          onPressUser={handlePressUser}
        />
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
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.silver,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 60,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  container: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
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
