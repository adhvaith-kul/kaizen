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

export default function PostDetailScreen({ route, navigation }: any) {
  const { logId } = route.params;
  const { user } = useAuth();
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
      // Optimistic Update
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
      // Refresh post detail
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
      // Refresh comments
      const data = await backend.getComments(post.id);
      setComments(data);
      // Update post detail
      const updatedPost = await backend.getPostDetail(user.id, post.id);
      setPost(updatedPost);
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setCommenting(false);
    }
  };

  if (loading && !refreshing) {
    return <Loader fullScreen />;
  }

  if (!post) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Post not found or has been deleted.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C2FF05" />}
        contentContainerStyle={{ paddingBottom: 100 }}>
        <PostCard post={post} onLike={handleLike} onSuspect={handleSuspect} onOpenComments={handleOpenComments} />
      </ScrollView>

      {/* Comments Modal */}
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
                <Ionicons name="close" size={24} color="#C2FF05" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={comments}
              keyExtractor={c => c.id}
              contentContainerStyle={{ padding: 20 }}
              renderItem={({ item }) => (
                <View style={styles.commentItem}>
                  <PostIcon item={item} />
                  <View style={styles.commentInfo}>
                    <Text style={styles.commentUser}>{item.username}</Text>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={() => (
                <Text style={{ color: '#666', textAlign: 'center', marginTop: 50 }}>
                  No comments yet. Be the first!
                </Text>
              )}
            />

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Add a comment..."
                placeholderTextColor="#666"
                value={newComment}
                onChangeText={setNewComment}
                multiline
              />
              <TouchableOpacity
                onPress={postComment}
                disabled={commenting || !newComment.trim()}
                style={[styles.postCommentBtn, !newComment.trim() && { opacity: 0.5 }]}>
                <Text style={styles.postCommentBtnText}>{commenting ? '...' : 'Post'}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function PostIcon({ item }: any) {
  return (
    <View style={styles.commentAvatarContainer}>
      <Ionicons name="person-circle" size={32} color="#444" />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  // Modal Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#121217',
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  closeBtn: { position: 'absolute', right: 20, top: 15 },
  commentItem: { flexDirection: 'row', marginBottom: 20 },
  commentAvatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentInfo: { flex: 1 },
  commentUser: { color: '#FFF', fontWeight: '700', fontSize: 13, marginBottom: 2 },
  commentText: { color: '#CCC', fontSize: 14, lineHeight: 18 },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
    backgroundColor: '#1A1A24',
  },
  commentInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
    paddingTop: 10,
    paddingBottom: 10,
  },
  postCommentBtn: { marginLeft: 10, paddingHorizontal: 15 },
  postCommentBtnText: { color: '#C2FF05', fontWeight: '900', fontSize: 14 },
});
