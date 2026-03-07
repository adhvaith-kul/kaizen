import React, { useEffect, useState, useCallback } from 'react';
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
import { useScrollToTop } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import Loader from '../components/Loader';
import { useTabNavigation } from '../context/TabNavigationContext';
import { HabitComment as Comment } from '../types';
import PostCard from '../components/PostCard';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const scrollRef = React.useRef<ScrollView>(null);
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

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

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
      // Optimistic Update
      setFeed(prev =>
        prev.map(p =>
          p.id === post.id
            ? { ...p, isLiked: !post.isLiked, likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1 }
            : p
        )
      );
    } catch (e) {
      console.error('Like failed:', e);
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
      // Refresh comments
      const data = await backend.getComments(activePostId);
      setComments(data);
      // Update feed count & previews
      const updatedFeed = await backend.getFeed(user.id);
      setFeed(updatedFeed);
    } catch (e) {
      console.error('Failed to post comment:', e);
    } finally {
      setCommenting(false);
    }
  };

  if (loading && !refreshing) {
    return <Loader fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.logo}>KAIZEN</Text>
        <TouchableOpacity onPress={() => setActiveTab('ProfileTab')}>
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

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            style={{ zIndex: 10 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C2FF05"
            colors={['#C2FF05']}
            progressBackgroundColor="#1A1A24"
            progressViewOffset={20}
          />
        }
        contentContainerStyle={{ paddingBottom: 100, flexGrow: 1 }}>
        {feed.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Feed is empty.</Text>
            <Text style={styles.emptySubtext}>Join a squad and start your grind to see updates here!</Text>
            <TouchableOpacity style={styles.squadBtn} onPress={() => setActiveTab('SquadsTab')}>
              <Text style={styles.squadBtnText}>FIND A SQUAD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          feed.map(item => (
            <PostCard key={item.id} post={item} onLike={handleLike} onOpenComments={handleOpenComments} />
          ))
        )}
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
                  <Image
                    source={{
                      uri:
                        item.avatarUrl ||
                        `https://api.dicebear.com/9.x/micah/png?seed=${item.username}&backgroundColor=C2FF05&radius=50`,
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2FF05',
  },
  container: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  squadBtn: {
    backgroundColor: '#C2FF05',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  squadBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

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
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
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
