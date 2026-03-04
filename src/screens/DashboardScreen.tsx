import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/MockBackend';
import { Habit, DailyLog } from '../types';

export default function DashboardScreen({ navigation }: any) {
  const { user, group, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [rank, setRank] = useState<number | string>('-');

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [user, group]);

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
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text>Welcome, {user?.username}!</Text>
      </View>

      <View style={styles.scoreBoard}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>{log?.totalPoints || 0}</Text>
          <Text style={styles.scoreLabel}>Today's Points</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreValue}>#{rank}</Text>
          <Text style={styles.scoreLabel}>Current Rank</Text>
        </View>
      </View>

      <View style={styles.habitsSection}>
        <Text style={styles.sectionTitle}>Today's Habits</Text>
        {habits.length === 0 ? (
          <Text style={{ color: '#888' }}>No habits set up yet.</Text>
        ) : (
          habits.map(h => {
            const isCompleted = log?.completedHabitIds.includes(h.id);
            return (
              <TouchableOpacity key={h.id} style={styles.habitRow} onPress={() => toggle(h.id)}>
                <View style={[styles.checkbox, isCompleted && styles.checkedBox]}>
                  {isCompleted && <Text style={{ color: 'white' }}>✓</Text>}
                </View>
                <View>
                  <Text style={[styles.habitName, isCompleted && styles.checkedText]}>{h.name}</Text>
                  <Text style={styles.habitCategory}>{h.category}</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
        <Button title="Edit Habits" onPress={() => navigation.navigate('HabitSetup')} />
      </View>

      <View style={styles.actionsSection}>
        {group && <Text style={{ marginBottom: 10, textAlign: 'center' }}>Group Code: {group.code}</Text>}
        <Button title="Leaderboard" onPress={() => navigation.navigate('Leaderboard')} />
        <Button title="Logout" color="red" onPress={logout} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 20, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  scoreBoard: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  scoreBox: { alignItems: 'center', backgroundColor: '#eef', padding: 20, borderRadius: 10, width: '45%' },
  scoreValue: { fontSize: 28, fontWeight: 'bold' },
  scoreLabel: { fontSize: 14, color: '#555' },
  habitsSection: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    marginBottom: 10,
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: { backgroundColor: '#4caf50', borderColor: '#4caf50' },
  habitName: { fontSize: 16, fontWeight: '500' },
  checkedText: { textDecorationLine: 'line-through', color: '#999' },
  habitCategory: { fontSize: 12, color: '#777' },
  actionsSection: { marginBottom: 40 },
});
