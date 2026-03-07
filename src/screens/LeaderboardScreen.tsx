import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, SafeAreaView, TouchableOpacity, Image } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { useFocusEffect } from '@react-navigation/native';

export default function LeaderboardScreen({ navigation }: any) {
  const { group, user } = useAuth();
  const [board, setBoard] = useState<{ rank: number; userId: string; username: string; totalPoints: number }[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (group) {
      setLoading(true);
      const b = await backend.getLeaderboard(group.id);
      setBoard(b);
      setLoading(false);
    }
  }, [group]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const getRankEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return 'transparent';
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.homeBtn}>
          <Text style={styles.homeBtnText}>← HOME</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            Hall of <Text style={{ color: '#FF3366' }}>Fame</Text>
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
            const isTop3 = item.rank <= 3;
            const rankColor = getRankColor(item.rank);
            return (
              <TouchableOpacity
                style={[
                  styles.row,
                  isMe && styles.myRow,
                  isTop3 && { borderColor: rankColor, borderWidth: 1.5, backgroundColor: isMe ? '#1D1324' : '#1A1A24' },
                ]}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('UserDetail', { userId: item.userId, username: item.username })}>
                <View style={styles.rankContainer}>
                  <Text style={styles.rankText}>{getRankEmoji(item.rank)}</Text>
                </View>

                <Image
                  source={{
                    uri: `https://api.dicebear.com/9.x/micah/png?seed=${item.username}&backgroundColor=C2FF05&radius=50`,
                  }}
                  style={[styles.avatar, isTop3 && { borderColor: rankColor, borderWidth: 2 }]}
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

      {/* Floating Track Habits Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.trackBtn} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.trackBtnText}>Track Habits 📝</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  homeBtn: { alignSelf: 'flex-start', padding: 5, marginLeft: -5 },
  homeBtnText: { color: '#888', fontWeight: '800', letterSpacing: 1 },
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
  rankContainer: {
    width: 30,
    alignItems: 'center',
    marginRight: 10,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1A1A24',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#333',
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
