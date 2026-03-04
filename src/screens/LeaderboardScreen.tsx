import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/MockBackend';

export default function LeaderboardScreen() {
  const { group, user } = useAuth();
  const [board, setBoard] = useState<{ rank: number; username: string; totalPoints: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (group) {
      setLoading(true);
      const b = await mockBackend.getLeaderboard(group.id);
      setBoard(b);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [group]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{group?.name} Leaderboard</Text>

      <FlatList
        data={board}
        keyExtractor={item => item.username}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} />}
        renderItem={({ item }) => (
          <View style={[styles.row, item.username === user?.username && styles.myRow]}>
            <Text style={styles.rank}>#{item.rank}</Text>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.points}>{item.totalPoints} pts</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderColor: '#eee' },
  myRow: { backgroundColor: '#eef' },
  rank: { width: 50, fontSize: 18, fontWeight: 'bold' },
  username: { flex: 1, fontSize: 16 },
  points: { fontSize: 16, fontWeight: '500', color: '#4caf50' },
});
