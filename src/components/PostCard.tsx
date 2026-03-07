import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: any;
  onLike: (post: any) => void;
  onOpenComments: (postId: string) => void;
}

export default function PostCard({ post, onLike, onOpenComments }: PostCardProps) {
  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image
          source={{
            uri:
              post.avatarUrl ||
              `https://api.dicebear.com/9.x/micah/png?seed=${post.username}&backgroundColor=C2FF05&radius=50`,
          }}
          style={styles.postAvatar}
        />
        <View style={styles.postHeaderInfo}>
          <Text style={styles.postUsername}>{post.username}</Text>
          <Text style={styles.postSquadName}>{post.groupName}</Text>
        </View>
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
        <TouchableOpacity style={styles.socialBtn} onPress={() => onLike(post)}>
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={26}
            color={post.isLiked ? '#FF3366' : '#FFF'}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialBtn} onPress={() => onOpenComments(post.id)}>
          <Ionicons name="chatbubble-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <Text style={styles.likesText}>{post.likesCount} likes</Text>

      <View style={styles.postFooter}>
        <View style={styles.habitBadge}>
          <Text style={styles.habitBadgeText}>{post.category.toUpperCase()}</Text>
        </View>

        <Text style={styles.postContent}>
          <Text style={styles.postUsernameSmall}>{post.username}</Text> crushed their{' '}
          <Text style={styles.habitName}>{post.habitName}</Text> goal! 🔥
        </Text>

        {post.caption ? (
          <Text style={styles.captionText}>
            <Text style={styles.postUsernameSmall}>{post.username}</Text> {post.caption}
          </Text>
        ) : null}

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
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
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
    paddingHorizontal: 20,
  },
  postFooter: {
    paddingHorizontal: 20,
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
  captionText: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
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
});
