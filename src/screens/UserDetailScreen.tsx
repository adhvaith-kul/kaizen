import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { backend } from '../services/backend';
import { DailyLog, Habit } from '../types';

export default function UserDetailScreen({ route, navigation }: any) {
  const { userId, username } = route.params;
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([backend.getUserLogs(userId), backend.getAllHabits(userId)])
      .then(([logsData, habitsData]) => {
        setLogs(logsData || []);
        setHabits(habitsData || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [userId]);

  const toggleExpand = (logId: string) => {
    setExpandedLogId(prev => (prev === logId ? null : logId));
  };

  const renderLog = ({ item }: { item: DailyLog }) => {
    const isExpanded = expandedLogId === item.id;

    return (
      <TouchableOpacity style={styles.logCard} activeOpacity={0.8} onPress={() => toggleExpand(item.id)}>
        <View style={styles.logHeader}>
          <Text style={styles.logDate}>{item.date}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.logPoints}>{item.totalPoints} pts</Text>
            <Text style={styles.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
          </View>
        </View>
        <Text style={styles.logDetails}>
          {item.completedHabitIds.length} habit{item.completedHabitIds.length === 1 ? '' : 's'} completed
        </Text>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {item.completedHabitIds.length > 0 ? (
              item.completedHabitIds.map(id => {
                const h = habits.find(habit => habit.id === id);
                return (
                  <View key={id} style={styles.completedHabitRow}>
                    <Text style={styles.habitCategory}>{h ? h.category.toUpperCase() : '?'}</Text>
                    <Text style={[styles.habitName, !h && { color: '#666', fontStyle: 'italic' }]}>
                      {h ? h.name : '(Habit changed or deleted)'}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noHabitsText}>No habits tracked this day</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            <Text style={{ color: '#C2FF05' }}>{username}</Text>'s Log
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#C2FF05" size="large" style={{ marginTop: 50 }} />
        ) : logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No logs yet 🍃</Text>
          </View>
        ) : (
          <FlatList
            data={logs}
            keyExtractor={item => item.id}
            renderItem={renderLog}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, padding: 20 },
  header: { marginBottom: 30, marginTop: 10 },
  backBtn: { alignSelf: 'flex-start', marginBottom: 15, padding: 5 },
  backBtnText: { color: '#888', fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#666', fontSize: 18, fontWeight: '700' },
  logCard: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  logDate: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  logPoints: { color: '#C2FF05', fontSize: 16, fontWeight: '900', marginRight: 8 },
  expandIcon: { color: '#666', fontSize: 12 },
  logDetails: { color: '#A0A0B0', fontSize: 14, fontWeight: '600' },
  expandedContent: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  completedHabitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  habitCategory: {
    fontSize: 10,
    color: '#888',
    fontWeight: '800',
    width: 65,
    letterSpacing: 0.5,
  },
  habitName: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
    flex: 1,
  },
  noHabitsText: {
    color: '#666',
    fontStyle: 'italic',
    fontSize: 14,
  },
});
