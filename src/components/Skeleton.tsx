import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, ViewStyle } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: ViewStyle | ViewStyle[];
}

/**
 * Base animated bone element with continuous shimmer pulse
 */
export function Skeleton({ width = '100%', height = 16, borderRadius = radii.sm, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [shimmer]);

  const backgroundColor = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.border],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: height as any,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton placeholder for PostCard in Home Feed & User Logs
 */
export function SkeletonPostCard() {
  return (
    <View style={styles.cardContainer}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Skeleton width={36} height={36} borderRadius={radii.full} />
        <View style={styles.headerInfo}>
          <Skeleton width={110} height={13} borderRadius={radii.sm} style={{ marginBottom: 6 }} />
          <Skeleton width={70} height={10} borderRadius={radii.sm} />
        </View>
        <Skeleton width={55} height={20} borderRadius={radii.sm} />
      </View>

      {/* Habit Title */}
      <Skeleton width="80%" height={16} borderRadius={radii.sm} style={{ marginTop: spacing.md, marginBottom: spacing.md }} />

      {/* Photo Box Placeholder */}
      <Skeleton width="100%" height={260} borderRadius={radii.md} style={{ marginBottom: spacing.md }} />

      {/* Action Footer */}
      <View style={styles.footerRow}>
        <View style={styles.actionPills}>
          <Skeleton width={52} height={26} borderRadius={radii.sm} style={{ marginRight: spacing.sm }} />
          <Skeleton width={52} height={26} borderRadius={radii.sm} />
        </View>
        <Skeleton width={36} height={12} borderRadius={radii.sm} />
      </View>
    </View>
  );
}

/**
 * Skeleton placeholder for Squad Card in SquadsScreen
 */
export function SkeletonSquadCard() {
  return (
    <View style={styles.cardContainer}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Skeleton width={140} height={18} borderRadius={radii.sm} style={{ marginBottom: 8 }} />
          <Skeleton width={90} height={11} borderRadius={radii.sm} />
        </View>
        <Skeleton width={70} height={28} borderRadius={radii.sm} />
      </View>
      <View style={{ marginTop: spacing.md, flexDirection: 'row', gap: 6 }}>
        <Skeleton width={60} height={18} borderRadius={radii.sm} />
        <Skeleton width={60} height={18} borderRadius={radii.sm} />
        <Skeleton width={60} height={18} borderRadius={radii.sm} />
      </View>
    </View>
  );
}

/**
 * Skeleton placeholder for ChallengesScreen
 */
export function SkeletonChallengeCard() {
  return (
    <View style={styles.cardContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
        <Skeleton width={80} height={14} borderRadius={radii.sm} />
        <Skeleton width={40} height={14} borderRadius={radii.sm} />
      </View>
      <Skeleton width="90%" height={20} borderRadius={radii.sm} style={{ marginBottom: spacing.sm }} />
      <Skeleton width="60%" height={12} borderRadius={radii.sm} style={{ marginBottom: spacing.lg }} />
      {/* Progress Bar Skeleton */}
      <Skeleton width="100%" height={8} borderRadius={radii.full} style={{ marginBottom: spacing.sm }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={50} height={10} borderRadius={radii.sm} />
        <Skeleton width={50} height={10} borderRadius={radii.sm} />
      </View>
    </View>
  );
}

/**
 * Skeleton placeholder for Leaderboard rankings
 */
export function SkeletonLeaderboardRow() {
  return (
    <View style={styles.leaderboardRow}>
      <Skeleton width={26} height={16} borderRadius={radii.sm} style={{ marginRight: spacing.md }} />
      <Skeleton width={38} height={38} borderRadius={radii.full} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Skeleton width={120} height={14} borderRadius={radii.sm} style={{ marginBottom: 6 }} />
        <Skeleton width={70} height={10} borderRadius={radii.sm} />
      </View>
      <Skeleton width={50} height={18} borderRadius={radii.sm} />
    </View>
  );
}

/**
 * Skeleton placeholder for Friends / Network user row
 */
export function SkeletonUserRow() {
  return (
    <View style={styles.userRow}>
      <Skeleton width={40} height={40} borderRadius={radii.full} style={{ marginRight: spacing.md }} />
      <View style={{ flex: 1 }}>
        <Skeleton width={110} height={14} borderRadius={radii.sm} style={{ marginBottom: 6 }} />
        <Skeleton width={80} height={10} borderRadius={radii.sm} />
      </View>
      <Skeleton width={75} height={28} borderRadius={radii.sm} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  actionPills: {
    flexDirection: 'row',
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
});
