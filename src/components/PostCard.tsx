import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: any;
  onLike: (post: any) => void;
  onSuspect: (post: any) => void;
  onOpenComments: (postId: string) => void;
  onPressUser?: (userId: string, username: string) => void;
}
export default function PostCard({ post, onLike, onSuspect, onOpenComments, onPressUser }: PostCardProps) {
  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onPressUser?.(post.userId, post.username)}>
          <Image
            source={{
              uri:
                post.avatarUrl ||
                `https://api.dicebear.com/9.x/micah/png?seed=${post.username}&backgroundColor=C2FF05&radius=50`,
            }}
            style={styles.postAvatar}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postHeaderInfo} onPress={() => onPressUser?.(post.userId, post.username)}>
          <Text style={styles.postUsername}>{post.username}</Text>
          <Text style={styles.postSquadName}>{post.groupName}</Text>
        </TouchableOpacity>
        <Text style={styles.postDate}>
          {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })}
        </Text>
      </View>

      <View style={styles.imageContainer}>
        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>{getCategoryEmoji(post.category)}</Text>
            <Text style={styles.placeholderText}>Logged Without Photo</Text>
          </View>
        )}
      </View>

      <View style={styles.socialBar}>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.socialBtn} onPress={() => onLike(post)}>
            <Ionicons
              name={post.isLiked ? 'thumbs-up' : 'thumbs-up-outline'}
              size={24}
              color={post.isLiked ? '#C2FF05' : '#FFF'}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.socialBtn} onPress={() => onSuspect(post)}>
            <Ionicons
              name={post.isSuspected ? 'thumbs-down' : 'thumbs-down-outline'}
              size={24}
              color={post.isSuspected ? '#FF3366' : '#888'}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.socialBtn} onPress={() => onOpenComments(post.id)}>
          <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <Text style={styles.likesText}>
          {post.likesCount} {post.likesCount === 1 ? 'like' : 'likes'}
        </Text>
        {post.suspectsCount > 0 && (
          <>
            <View style={styles.statDot} />
            <Text style={[styles.suspectsText, post.isDisqualified && { color: '#FF3366' }]}>
              {post.suspectsCount} {post.suspectsCount === 1 ? 'flag' : 'flags'}
            </Text>
          </>
        )}
      </View>

      <View style={styles.postFooter}>
        <View style={[styles.habitBadge, post.isDisqualified && styles.disqualifiedBadge]}>
          <Text style={[styles.habitBadgeText, post.isDisqualified && styles.disqualifiedBadgeText]}>
            {post.isDisqualified ? 'DISQUALIFIED' : post.category.toUpperCase()}
          </Text>
        </View>

        {post.isDisqualified && (
          <View style={styles.disqualifiedWarning}>
            <Ionicons name="warning" size={16} color="#FF3366" />
            <Text style={styles.disqualifiedWarningText}>Flagged by squad as suspicious activity.</Text>
          </View>
        )}

        <Text style={[styles.postContent, post.isDisqualified && styles.disqualifiedText]}>
          <Text style={styles.postUsernameSmall} onPress={() => onPressUser?.(post.userId, post.username)}>
            {post.username}
          </Text>{' '}
          crushed their{' '}
          <Text style={[styles.habitName, post.isDisqualified && styles.disqualifiedHabitName]}>{post.habitName}</Text>{' '}
          goal! 🔥
        </Text>

        {post.caption ? (
          <Text style={[styles.captionText, post.isDisqualified && styles.disqualifiedText]}>
            <Text style={styles.postUsernameSmall} onPress={() => onPressUser?.(post.userId, post.username)}>
              {post.username}
            </Text>{' '}
            {post.caption}
          </Text>
        ) : null}

        {!post.isDisqualified && (
          <View style={styles.commentsPreview}>
            {post.commentsCount > 2 && (
              <TouchableOpacity onPress={() => onOpenComments(post.id)}>
                <Text style={styles.viewAllComments}>View all {post.commentsCount} comments</Text>
              </TouchableOpacity>
            )}
            {post.commentsPreview?.map((c: any, idx: number) => (
              <Text key={idx} style={styles.commentPreviewText}>
                <Text style={styles.commentUsername}>{c.username}</Text> {c.text}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
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
  post: {
    marginBottom: 40,
    backgroundColor: '#0E0E11',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
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
    justifyContent: 'space-between',
    paddingHorizontal: 13, // 16 - (30-24)/2 to align icons visually
    paddingTop: 12,
    paddingBottom: 8,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  socialBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#666',
    marginHorizontal: 10,
    alignSelf: 'center',
  },
  likesText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
  },
  suspectsText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '700',
  },
  postFooter: {
    paddingHorizontal: 16,
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
    marginBottom: 4,
  },
  postUsernameSmall: { fontWeight: '800', color: '#FFF' },
  habitName: { fontWeight: '800', color: '#C2FF05' },
  disqualifiedText: {
    color: '#555',
    textDecorationLine: 'line-through',
  },
  disqualifiedHabitName: {
    color: '#555',
  },
  disqualifiedBadge: {
    backgroundColor: '#241313',
    borderColor: '#FF336644',
  },
  disqualifiedBadgeText: {
    color: '#FF3366',
  },
  disqualifiedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  disqualifiedWarningText: {
    color: '#FF3366',
    fontSize: 12,
    fontWeight: '700',
  },
  captionText: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentsPreview: {
    marginTop: 6,
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
});
