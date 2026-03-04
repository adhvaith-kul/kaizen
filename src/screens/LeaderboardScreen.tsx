import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, SafeAreaView, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';

export default function LeaderboardScreen({ navigation }: any) {
  const { group, user } = useAuth();
  const [board, setBoard] = useState<{ rank: number; username: string; totalPoints: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (group) {
      setLoading(true);
      const b = await backend.getLeaderboard(group.id);
      setBoard(b);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [group]);

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '👑';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            hall of <Text style={{ color: '#FF3366' }}>fame</Text>
          </Text>
          <Text style={styles.subtitle}>{group?.name} SQUAD</Text>
        </View>

        <FlatList
          data={board}
          keyExtractor={item => item.username}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#FF3366" />}
          contentContainerStyle={{ paddingBottom: 140 }}
          renderItem={({ item }) => {
            const isMe = item.username === user?.username;
            return (
              <View style={[styles.row, isMe && styles.myRow]}>
                <View style={[styles.rankBadge, isMe && styles.myRankBadge]}>
                  <Text style={styles.rankText}>{getRankEmoji(item.rank)}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={[styles.username, isMe && styles.myUsername]}>
                    {item.username} {isMe ? '(you)' : ''}
                  </Text>
                  <Text style={styles.points}>{item.totalPoints} pts</Text>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* Floating Track Habits Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.trackBtnText}>TRACK HABITS 📝</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, padding: 20 },
  header: { alignItems: 'center', marginBottom: 30, marginTop: 10 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  subtitle: { fontSize: 14, fontWeight: '800', color: '#A0A0B0', letterSpacing: 2, marginTop: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A24',
    marginBottom: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  myRow: {
    backgroundColor: '#1D1324',
    borderColor: '#FF3366',
  },
  rankBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0E0E11',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  myRankBadge: {
    backgroundColor: '#FF3366',
    borderColor: '#FF3366',
  },
  rankText: { fontSize: 18, fontWeight: '800', color: '#FFF' },
  userInfo: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  username: { fontSize: 18, fontWeight: '700', color: '#FFF' },
  myUsername: { color: '#FF3366', fontWeight: '900' },
  points: { fontSize: 16, fontWeight: '800', color: '#C2FF05' },
  bottomBar: {
    position: 'absolute',
    bottom: 85, // Height of the Tab Navigation
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 20, // Reset since it's no longer the absolute bottom of SafeArea
    backgroundColor: 'rgba(14, 14, 17, 0.95)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#2A2A35',
  },
  trackBtn: {
    backgroundColor: '#C2FF05',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#C2FF05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  trackBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
