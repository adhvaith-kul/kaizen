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
  Dimensions,
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
import { useTabNavigation } from '../context/TabNavigationContext';
import { HabitComment as Comment } from '../types';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { setActiveTab } = useTabNavigation();
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
        <TouchableOpacity onPress={() => navigation.setParams({ openProfile: Date.now() })}>
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
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C2FF05" />}
        contentContainerStyle={{ paddingBottom: 100 }}>
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
            <View key={item.id} style={styles.post}>
              <View style={styles.postHeader}>
                <Image
                  source={{
                    uri:
                      item.avatarUrl ||
                      `https://api.dicebear.com/9.x/micah/png?seed=${item.username}&backgroundColor=C2FF05&radius=50`,
                  }}
                  style={styles.postAvatar}
                />
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.postUsername}>{item.username}</Text>
                  <Text style={styles.postSquadName}>{item.groupName}</Text>
                </View>
                <Text style={styles.postDate}>
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                </Text>
              </View>

              <View style={styles.imageContainer}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderEmoji}>{getCategoryEmoji(item.category)}</Text>
                    <Text style={styles.placeholderText}>Logged Without Photo</Text>
                  </View>
                )}
              </View>

              {/* Social Bar */}
              <View style={styles.socialBar}>
                <TouchableOpacity style={styles.socialBtn} onPress={() => handleLike(item)}>
                  <Ionicons
                    name={item.isLiked ? 'heart' : 'heart-outline'}
                    size={26}
                    color={item.isLiked ? '#FF3366' : '#FFF'}
                  />
                </TouchableOpacity>

                <TouchableOpacity style={styles.socialBtn} onPress={() => handleOpenComments(item.id)}>
                  <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.likesText}>{item.likesCount} likes</Text>

              <View style={styles.postFooter}>
                <View style={styles.habitBadge}>
                  <Text style={styles.habitBadgeText}>{item.category.toUpperCase()}</Text>
                </View>

                <Text style={styles.postContent}>
                  <Text style={styles.postUsernameSmall}>{item.username}</Text> crushed their{' '}
                  <Text style={styles.habitName}>{item.habitName}</Text> goal! 🔥
                </Text>

                {/* Comments Preview */}
                <View style={styles.commentsPreview}>
                  {item.commentsCount > 2 && (
                    <TouchableOpacity onPress={() => handleOpenComments(item.id)}>
                      <Text style={styles.viewAllComments}>View all {item.commentsCount} comments</Text>
                    </TouchableOpacity>
                  )}
                  {item.commentsPreview?.map((c: any, idx: number) => (
                    <Text key={idx} style={styles.commentPreviewText}>
                      <Text style={styles.commentUsername}>{c.username}</Text> {c.text}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
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

function getCategoryEmoji(cat: string) {
  const map: any = {
    Health: '💪',
    Productivity: '💼',
    Sleep: '😴',
    Diet: '🥗',
    Finance: '💸',
    Upskill: '🧠',
    Chores: '🧹',
  };
  return map[cat] || '✨';
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
  post: {
    marginBottom: 40,
    backgroundColor: '#0E0E11',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  postAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  postHeaderInfo: { flex: 1 },
  postUsername: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  postSquadName: { color: '#888', fontSize: 12, fontWeight: '500', marginTop: 1 },
  postDate: { color: '#666', fontSize: 12, fontWeight: '500' },
  imageContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH,
    backgroundColor: '#1A1A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 80, marginBottom: 10, opacity: 0.5 },
  placeholderText: { color: '#444', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  socialBar: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 18,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likesText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  postFooter: {
    paddingHorizontal: 15,
  },
  habitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1C12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#C2FF0522',
  },
  habitBadgeText: {
    color: '#C2FF05',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  postContent: {
    color: '#EEE',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  postUsernameSmall: { fontWeight: '800', color: '#FFF' },
  habitName: { fontWeight: '800', color: '#C2FF05' },

  // Comments Preview
  commentsPreview: {
    marginTop: 4,
  },
  viewAllComments: {
    color: '#888',
    fontSize: 14,
    marginBottom: 6,
    fontWeight: '500',
  },
  commentPreviewText: {
    color: '#EEE',
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 4,
  },
  commentUsername: {
    fontWeight: '800',
    color: '#FFF',
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
