import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  FlatList,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { DailyLog, HabitComment as Comment } from '../types';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';

const SQUAD_COLORS = ['#C2FF05', '#FF3366', '#00E5FF', '#B388FF', '#FF9100'];

const dicebearUri = (seed: string) =>
  `https://api.dicebear.com/9.x/micah/png?seed=${seed}&backgroundColor=C2FF05&radius=50`;

export default function ProfileScreen({ navigation }: any) {
  const { user, groups, refreshUser, logout } = useAuth();
  const [stats, setStats] = useState({ totalHabits: 0, totalDaysLogged: 0 });
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

      Promise.all([backend.getProfileStats(user.id), backend.getUserLogs(user.id), backend.getUserFeed(user.id)]).then(
        ([s, logs, feedData]) => {
          if (!isActive) return;
          setStats(s);
          setFeed(feedData);

          const dates = generateLast7Days();
          logs.forEach(log => {
            const day = dates.find(d => d.date === log.date);
            if (day) {
              day.squadData[log.groupId] = (day.squadData[log.groupId] || 0) + 1;
              day.total += 1;
            }
          });

          const highestTotal = Math.max(...dates.map(d => d.total), 1);
          setMaxTotal(highestTotal);
          setGraphData(dates);
          setLoading(false);
        }
      );

      return () => {
        isActive = false;
      };
    }, [user])
  );

  // ── Avatar picking ────────────────────────────────────────────────────────────

  const handlePickImage = async (fromCamera: boolean) => {
    let result: ImagePicker.ImagePickerResult;

    if (fromCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera access is required to take a photo.');
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
        Alert.alert('Permission needed', 'Photo library access is required to choose a photo.');
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
    setPickerVisible(false); // Close modal before uploading starts
    try {
      const publicUrl = await backend.uploadProfilePicture(uri, user.id);
      await backend.updateUserAvatar(user.id, publicUrl);
      await refreshUser();
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message || 'Something went wrong. Please try again.');
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
      {/* ── FIXED STICKY HEADER ── */}
      <View style={styles.fixedHeader}>
        <View style={styles.headerLeftContainer}>
          <Animated.View style={[styles.stickyLeft, { opacity: stickyOpacity, position: 'absolute', left: 0 }]}>
            <Text style={styles.stickyUsername} numberOfLines={1}>
              @{user?.username}
            </Text>
          </Animated.View>
          <Animated.View style={{ opacity: logoOpacity }}>
            <Text style={styles.logo}>KAIZEN</Text>
          </Animated.View>
        </View>

        <View style={styles.fixedHeaderRight}>
          <TouchableOpacity
            style={styles.headerLogoutBtn}
            onPress={() => {
              logout().then(() => navigation.navigate('Login'));
            }}>
            <Ionicons name="log-out-outline" size={18} color="#FF3366" />
            <Text style={styles.logoutText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}>
        <View style={styles.topContent}>
          <View style={styles.profileSection}>
            {/* Avatar with camera overlay */}
            <TouchableOpacity onPress={showAvatarOptions} activeOpacity={0.85} style={styles.avatarContainer}>
              <Image source={{ uri: avatarUri }} style={styles.avatar} />

              {/* Dim overlay while uploading */}
              {uploading && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator color="#C2FF05" size="large" />
                </View>
              )}

              {/* Camera badge */}
              {!uploading && (
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.username}>@{user?.username}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.sectionTitle}>LIFETIME STATS</Text>

            {loading ? (
              <Loader style={{ marginVertical: 20 }} />
            ) : (
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.totalHabits}</Text>
                  <Text style={styles.statLabel}>HABITS DONE</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{stats.totalDaysLogged}</Text>
                  <Text style={styles.statLabel}>DAYS LOGGED</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{groups.length}</Text>
                  <Text style={styles.statLabel}>ACTIVE SQUADS</Text>
                </View>
              </View>
            )}
          </View>

          {/* --- HABIT GRAPH --- */}
          <View style={styles.graphSection}>
            <Text style={styles.sectionTitle}>LAST 7 DAYS</Text>
            {loading ? (
              <Loader style={{ marginVertical: 40 }} />
            ) : (
              <>
                <View style={styles.chartRow}>
                  {graphData.map((day, idx) => (
                    <View key={idx} style={styles.barColumn}>
                      <Text style={styles.barValue}>{day.total > 0 ? day.total : ''}</Text>
                      <View style={styles.barWrapper}>
                        {/* Empty state bar */}
                        {day.total === 0 && (
                          <View style={[styles.barSegment, { height: '5%', backgroundColor: '#2A2A35' }]} />
                        )}

                        {/* Stacked bars */}
                        {Object.entries(day.squadData).map(([groupId, count]: [string, any]) => {
                          const heightRatio = count / maxTotal;
                          const groupIndex = groups.findIndex(g => g.id === groupId);
                          const color = SQUAD_COLORS[groupIndex % SQUAD_COLORS.length] || '#FFF';
                          return (
                            <View
                              key={groupId}
                              style={[styles.barSegment, { height: `${heightRatio * 100}%`, backgroundColor: color }]}
                            />
                          );
                        })}
                      </View>
                      <Text style={[styles.barLabel, idx === 6 && { color: '#C2FF05', fontWeight: '900' }]}>
                        {day.displayDate}
                      </Text>
                    </View>
                  ))}
                </View>

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
              </>
            )}
          </View>
        </View>

        {feed.length > 0 && (
          <View style={styles.feedSection}>
            <Text style={[styles.sectionTitle, { paddingHorizontal: 20 }]}>YOUR POSTS</Text>
            {feed.map(item => (
              <PostCard key={item.id} post={item} onLike={handleLike} onOpenComments={handleOpenComments} />
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* ── CUSTOM IMAGE PICKER MODAL ───────────────────────── */}
      <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setPickerVisible(false)}>
          <View style={styles.pickerSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>MANAGE PROFILE PHOTO</Text>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                setPickerVisible(false);
                setViewVisible(true);
              }}>
              <Text style={styles.sheetOptionEmoji}>👁️</Text>
              <Text style={styles.sheetOptionText}>View Profile Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => handlePickImage(true)}>
              <Text style={styles.sheetOptionEmoji}>📸</Text>
              <Text style={styles.sheetOptionText}>Take a Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetOption} onPress={() => handlePickImage(false)}>
              <Text style={styles.sheetOptionEmoji}>🖼️</Text>
              <Text style={styles.sheetOptionText}>Choose from Library</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sheetCancel} onPress={() => setPickerVisible(false)}>
              <Text style={styles.sheetCancelText}>CANCEL</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── FULL SCREEN VIEW MODAL ─────────────────────────── */}
      <Modal visible={viewVisible} transparent animationType="fade" onRequestClose={() => setViewVisible(false)}>
        <TouchableOpacity style={styles.viewOverlay} activeOpacity={1} onPress={() => setViewVisible(false)}>
          <Image source={{ uri: avatarUri }} style={styles.fullImage} resizeMode="contain" />
          <TouchableOpacity style={styles.closeViewBtn} onPress={() => setViewVisible(false)}>
            <Text style={styles.closeViewText}>CLOSE</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── COMMENTS MODAL ───────────────────────── */}
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
  container: { flex: 1 },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 60,
    backgroundColor: '#0E0E11',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
    zIndex: 10,
  },
  headerLeftContainer: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  stickyLeft: {
    zIndex: 2,
  },
  fixedHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stickyUsername: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  topContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A24',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  logoutText: {
    color: '#FF3366',
    fontWeight: '800',
    fontSize: 12,
    marginLeft: 6,
    letterSpacing: 1,
  },
  feedSection: {},
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#888',
    marginBottom: 20,
    letterSpacing: 1.5,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A24',
    borderWidth: 3,
    borderColor: '#C2FF05',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C2FF05',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  cameraIcon: {
    fontSize: 14,
  },
  username: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  statsCard: {
    marginBottom: 40,
  },
  graphSection: {
    marginBottom: 40,
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
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 1,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: 12,
    height: 120,
    backgroundColor: '#121217',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
    marginVertical: 8,
  },
  barSegment: {
    width: '100%',
    minHeight: 2,
  },
  barValue: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '800',
    height: 16,
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#A0A0B0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  spacer: {
    height: 20,
  },
  logoutBtn: {
    backgroundColor: '#FF3366',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: '#1A1A24',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#2A2A35',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 24,
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22222E',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  sheetOptionEmoji: {
    fontSize: 20,
    marginRight: 16,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  sheetCancel: {
    marginTop: 8,
    padding: 20,
    alignItems: 'center',
  },
  sheetCancelText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FF3366',
    letterSpacing: 1,
  },
  viewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeViewBtn: {
    position: 'absolute',
    top: 50,
    right: 30,
    padding: 10,
  },
  closeViewText: {
    color: '#FFF',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 12,
  },
  // Comments Modal Styles
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContentComments: {
    backgroundColor: '#121217',
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  modalHeaderComments: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A35',
  },
  modalHandleComments: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginBottom: 8,
  },
  modalTitleComments: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  closeBtnComments: { position: 'absolute', right: 20, top: 15 },
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
