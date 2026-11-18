import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';
import HabitGateOverlay from '../components/HabitGateOverlay';
import { SkeletonLeaderboardRow } from '../components/Skeleton';
import GlassView from '../components/GlassView';
import { Habit } from '../types';
import { colors, radii, spacing } from '../theme';

function getMissingRequirements(habits: Habit[], group: any): string[] {
  const settings = group?.settings;
  if (!settings?.allowedCategories?.length) return [];

  const missing: string[] = [];
  for (const cat of settings.allowedCategories) {
    const required = Number(settings.habitsPerCategory?.[cat] ?? 1);
    const current = habits.filter((h) => h.category === cat).length;
    if (current < required) {
      missing.push(`${cat} (${current}/${required})`);
    }
  }
  return missing;
}

export default function LeaderboardScreen({ navigation }: any) {
  const { group, user } = useAuth();
  const [board, setBoard] = useState<
    { rank: number; userId: string; username: string; avatarUrl?: string; totalPoints: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [missingHabits, setMissingHabits] = useState<string[]>([]);

  const fetchData = useCallback(async () => {
    if (!group || !user) return;
    setLoading(true);
    try {
      const [b, habits] = await Promise.all([backend.getLeaderboard(group.id), backend.getHabits(user.id, group.id)]);
      setBoard(b);
      setMissingHabits(getMissingRequirements(habits, group));
    } catch (e) {
      console.error('[LeaderboardScreen] fetchData error:', e);
    }
    setLoading(false);
    setInitialLoad(false);
  }, [group, user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const formatRank = (rank: number) => {
    return rank < 10 ? `0${rank}` : `${rank}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {initialLoad && <Loader fullScreen />}

      <GlassView variant="raw" intensity={50} tint="dark" specularBorder={false} style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Squads</Text>
        </TouchableOpacity>
        <View style={styles.topBarActions}>
          {group && (
            <GlassView variant="capsule" intensity={50} tint="dark">
              <TouchableOpacity style={styles.actionPill} onPress={() => backend.shareSquadInvite(group)}>
                <Text style={styles.actionPillText}>Share Invite</Text>
              </TouchableOpacity>
            </GlassView>
          )}
          {group?.createdBy === user?.id && (
            <GlassView variant="capsule" intensity={50} tint="dark" style={{ marginLeft: spacing.xs }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('EditGroup', { group })}
                style={[styles.actionPill, styles.actionPillAccent]}>
                <Text style={[styles.actionPillText, { color: colors.lavender }]}>Settings</Text>
              </TouchableOpacity>
            </GlassView>
          )}
        </View>
      </GlassView>

      <View style={styles.header}>
        <Text style={styles.title}>{group?.name}</Text>
        <Text style={styles.subtitle}>PERFORMANCE STANDINGS</Text>
      </View>

      {initialLoad ? (
        <View style={styles.container}>
          <SkeletonLeaderboardRow />
          <SkeletonLeaderboardRow />
          <SkeletonLeaderboardRow />
          <SkeletonLeaderboardRow />
        </View>
      ) : missingHabits.length > 0 ? (
        <HabitGateOverlay missing={missingHabits} onFix={() => navigation.navigate('HabitSetup')} />
      ) : (
        <>
          <View style={styles.container}>
            <FlatList
              data={board}
              keyExtractor={(item) => item.username}
              refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.lavender} />}
              contentContainerStyle={{ paddingBottom: 130 }}
              renderItem={({ item }) => {
                const isMe = item.username === user?.username;
                const isTopRank = item.rank === 1;

                return (
                  <TouchableOpacity
                    style={[styles.row, isMe && styles.myRow, isTopRank && styles.topRankRow]}
                    activeOpacity={0.75}
                    onPress={() =>
                      navigation.navigate('UserLogs', {
                        userId: item.userId,
                        username: item.username,
                        groupId: group?.id,
                        groupName: group?.name,
                      })
                    }>
                    <View style={styles.rankContainer}>
                      <Text style={[styles.rankText, isTopRank && styles.rankTextTop]}>{formatRank(item.rank)}</Text>
                    </View>

                    <Image
                      source={{
                        uri:
                          item.avatarUrl ||
                          `https://api.dicebear.com/9.x/micah/png?seed=${item.username}&backgroundColor=6F4E37&radius=50`,
                      }}
                      style={styles.avatar}
                    />

                    <View style={styles.userInfo}>
                      <Text style={[styles.username, isMe && styles.myUsername]}>
                        {item.username} {isMe ? '(You)' : ''}
                      </Text>
                      <Text style={styles.points}>{item.totalPoints} pts</Text>
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionPill: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionPillAccent: {
    borderColor: colors.lavenderBorder,
  },
  actionPillText: {
    color: colors.silver,
    fontSize: 12,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.lavenderMuted,
    letterSpacing: 2,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  myRow: {
    borderColor: colors.mochaLight,
    backgroundColor: colors.surfaceElevated,
  },
  topRankRow: {
    borderColor: colors.lavenderBorder,
  },
  rankContainer: {
    width: 32,
    alignItems: 'flex-start',
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textMuted,
  },
  rankTextTop: {
    color: colors.lavender,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.silver,
  },
  myUsername: {
    color: colors.silverLight,
  },
  points: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.lavender,
  },
});
