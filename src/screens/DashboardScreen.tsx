import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/MockBackend';
import { Habit, DailyLog } from '../types';

export default function DashboardScreen({ navigation }: any) {
  const { user, group, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [rank, setRank] = useState<number | string>('-');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uHabits = await mockBackend.getHabits(user.id);
      setHabits(uHabits);

      const uLog = await mockBackend.getTodayLog(user.id);
      setLog(uLog);

      if (group) {
        const board = await mockBackend.getLeaderboard(group.id);
        const myRank = board.find(b => b.username === user.username)?.rank || '-';
        setRank(myRank);
      }
    } catch (e) {}
    setLoading(false);
  }, [user, group]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggle = async (habitId: string) => {
    if (!user) return;
    const newLog = await mockBackend.toggleHabitCompletion(user.id, habitId);
    setLog(newLog);
    // Refresh rank silently
    if (group) {
      mockBackend.getLeaderboard(group.id).then(board => {
        const myRank = board.find(b => b.username === user?.username)?.rank || '-';
        setRank(myRank);
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#C2FF05" />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>sup, {user?.username} 👋</Text>
            <Text style={styles.title}>
              your <Text style={{ color: '#C2FF05' }}>grind</Text>
            </Text>
          </View>
          {group && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupCodeLabel}>SQUAD CODE</Text>
              <Text style={styles.groupCode}>{group.code}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: '#B388FF' }]}>
            <Text style={styles.statLabel}>VIBE SCORE</Text>
            <Text style={styles.statValue}>{log?.totalPoints || 0}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statBox, { backgroundColor: '#1A1A24', borderWidth: 1, borderColor: '#333' }]}
            onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={[styles.statLabel, { color: '#888' }]}>SQUAD RANK</Text>
            <Text style={[styles.statValue, { color: '#FFF' }]}>#{rank}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S MISSION</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HabitSetup')}>
              <Text style={styles.editLink}>edit ⚙️</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>crickets... 🦗</Text>
              <Text style={styles.emptySubtext}>set up your habits to start winning.</Text>
            </View>
          ) : (
            habits.map(h => {
              const isCompleted = log?.completedHabitIds.includes(h.id);
              return (
                <TouchableOpacity
                  key={h.id}
                  style={[styles.habitCard, isCompleted && styles.habitCardDone]}
                  onPress={() => toggle(h.id)}
                  activeOpacity={0.8}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitCategory}>{h.category.toUpperCase()}</Text>
                    <Text style={[styles.habitName, isCompleted && styles.habitNameDone]}>{h.name}</Text>
                  </View>
                  <View style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
                    <Text style={styles.checkIcon}>{isCompleted ? '🔥' : ''}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.primaryBtnText}>VIEW LEADERBOARD 🏆</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.ghostBtn} onPress={logout}>
            <Text style={styles.ghostBtnText}>GHOST OUT (LOGOUT) 👻</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, padding: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    marginTop: 10,
  },
  greeting: { fontSize: 16, color: '#A0A0B0', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  groupBadge: {
    backgroundColor: '#1A1A24',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  groupCodeLabel: { fontSize: 10, color: '#888', fontWeight: '800', marginBottom: 2 },
  groupCode: { fontSize: 16, color: '#FF3366', fontWeight: '900', letterSpacing: 2 },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 35 },
  statBox: { flex: 1, padding: 20, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '800', color: '#000', marginBottom: 8, letterSpacing: 1 },
  statValue: { fontSize: 40, fontWeight: '900', color: '#000', letterSpacing: -2 },
  habitsSection: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#666', letterSpacing: 1.5 },
  editLink: { color: '#C2FF05', fontWeight: '700', fontSize: 14 },
  emptyState: {
    backgroundColor: '#1A1A24',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888', fontWeight: '500' },
  habitCard: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  habitCardDone: { borderColor: '#C2FF05', backgroundColor: '#121A0F' },
  habitInfo: { flex: 1 },
  habitCategory: { fontSize: 10, color: '#A0A0B0', fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  habitName: { fontSize: 18, color: '#FFF', fontWeight: '700' },
  habitNameDone: { textDecorationLine: 'line-through', color: '#666' },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0E0E11',
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: { backgroundColor: '#C2FF05', borderColor: '#C2FF05' },
  checkIcon: { fontSize: 16 },
  actionSection: { marginTop: 10 },
  primaryBtn: { backgroundColor: '#333', padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 15 },
  primaryBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  ghostBtn: { padding: 15, alignItems: 'center' },
  ghostBtnText: { color: '#FF3366', fontSize: 14, fontWeight: '700' },
});
