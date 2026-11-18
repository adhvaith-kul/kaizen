import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import GlassView from './GlassView';
import { colors, radii, spacing } from '../theme';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

interface PostCardProps {
  post: any;
  onLike: (post: any) => void;
  onSuspect: (post: any) => void;
  onOpenComments: (postId: string) => void;
  onPressUser?: (userId: string, username: string) => void;
}

export default function PostCard({ post, onLike, onSuspect, onOpenComments, onPressUser }: PostCardProps) {
  const formattedDate = new Date(post.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

  return (
    <View style={styles.post}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onPressUser?.(post.userId, post.username)}>
          <Image
            source={{
              uri:
                post.avatarUrl ||
                `https://api.dicebear.com/9.x/micah/png?seed=${post.username}&backgroundColor=6F4E37&radius=50`,
            }}
            style={styles.postAvatar}
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.postHeaderInfo} onPress={() => onPressUser?.(post.userId, post.username)}>
          <Text style={styles.postUsername}>{post.username}</Text>
          {post.groupName ? <Text style={styles.postSquadName}>{post.groupName}</Text> : null}
        </TouchableOpacity>
        <Text style={styles.postDate}>{formattedDate}</Text>
      </View>

      {/* Main Proof Asset */}
      <View style={styles.imageContainer}>
        {post.imageUrl ? (
          <View style={styles.imageWrapper}>
            <Image source={{ uri: post.imageUrl }} style={styles.postImage} resizeMode="cover" />
            <GlassView variant="capsule" intensity={65} tint="dark" style={styles.floatingBadge}>
              <Text style={styles.floatingBadgeText}>{post.habitName}</Text>
            </GlassView>
          </View>
        ) : (
          <View style={styles.textProofContainer}>
            <GlassView variant="capsule" intensity={50} tint="dark" style={styles.categoryPill}>
              <Text style={styles.categoryPillText}>{post.category.toUpperCase()}</Text>
            </GlassView>
            <Text style={styles.textProofHabit}>{post.habitName}</Text>
            <Text style={styles.textProofNote}>Verified Completion</Text>
          </View>
        )}
      </View>

      {/* Action Toolbar */}
      <View style={styles.socialBar}>
        <View style={styles.actionGroup}>
          <TouchableOpacity
            style={[styles.actionBtn, post.isLiked && styles.actionBtnActive]}
            onPress={() => onLike(post)}
            activeOpacity={0.7}>
            <Ionicons
              name={post.isLiked ? 'heart' : 'heart-outline'}
              size={18}
              color={post.isLiked ? colors.lavender : colors.textSecondary}
            />
            <Text style={[styles.actionCount, post.isLiked && styles.actionCountActive]}>{post.likesCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, post.isSuspected && styles.actionBtnFlagged]}
            onPress={() => onSuspect(post)}
            activeOpacity={0.7}>
            <Ionicons
              name={post.isSuspected ? 'flag' : 'flag-outline'}
              size={17}
              color={post.isSuspected ? colors.danger : colors.textMuted}
            />
            {post.suspectsCount > 0 && (
              <Text style={[styles.actionCount, post.isSuspected && { color: colors.danger }]}>
                {post.suspectsCount}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => onOpenComments(post.id)} activeOpacity={0.7}>
            <Ionicons name="chatbubble-outline" size={17} color={colors.textSecondary} />
            <Text style={styles.actionCount}>{post.commentsCount || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Post Details & Narrative */}
      <View style={styles.postFooter}>
        {post.isDisqualified && (
          <View style={styles.disqualifiedBadge}>
            <Text style={styles.disqualifiedBadgeText}>DISQUALIFIED BY SQUAD REVIEW</Text>
          </View>
        )}

        <Text style={[styles.postContent, post.isDisqualified && styles.disqualifiedText]}>
          <Text style={styles.postUsernameSmall} onPress={() => onPressUser?.(post.userId, post.username)}>
            {post.username}
          </Text>{' '}
          completed <Text style={styles.habitName}>{post.habitName}</Text>
        </Text>

        {post.caption ? (
          <Text style={[styles.captionText, post.isDisqualified && styles.disqualifiedText]}>{post.caption}</Text>
        ) : null}

        {/* Recent Comments Preview */}
        {!post.isDisqualified && post.commentsPreview && post.commentsPreview.length > 0 && (
          <View style={styles.commentsPreview}>
            {post.commentsCount > 2 && (
              <TouchableOpacity onPress={() => onOpenComments(post.id)}>
                <Text style={styles.viewAllComments}>View all {post.commentsCount} comments</Text>
              </TouchableOpacity>
            )}
            {post.commentsPreview.map((c: any, idx: number) => (
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

const styles = StyleSheet.create({
  post: {
    marginBottom: spacing.xxxl,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  postHeaderInfo: { flex: 1 },
  postUsername: {
    color: colors.silver,
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  postSquadName: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
    marginTop: 1,
  },
  postDate: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
  },
  imageContainer: {
    width: '100%',
    height: WINDOW_WIDTH - 32,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  floatingBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: 14,
  },
  floatingBadgeText: {
    color: colors.silver,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textProofContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  categoryPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  categoryPillText: {
    color: colors.lavenderMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  textProofHabit: {
    color: colors.silver,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  textProofNote: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
  },
  socialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  actionBtnActive: {
    borderColor: colors.lavenderBorder,
    backgroundColor: colors.lavenderSubtle,
  },
  actionBtnFlagged: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSubtle,
  },
  actionCount: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionCountActive: {
    color: colors.lavender,
  },
  postFooter: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  postContent: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  postUsernameSmall: {
    fontWeight: '600',
    color: colors.silver,
  },
  habitName: {
    fontWeight: '600',
    color: colors.lavender,
  },
  disqualifiedText: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  disqualifiedBadge: {
    backgroundColor: colors.dangerSubtle,
    borderColor: colors.danger,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  disqualifiedBadgeText: {
    color: colors.danger,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  captionText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
    marginBottom: spacing.xs,
  },
  commentsPreview: {
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    paddingTop: spacing.sm,
  },
  viewAllComments: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  commentPreviewText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 2,
  },
  commentUsername: {
    fontWeight: '600',
    color: colors.silver,
  },
});
