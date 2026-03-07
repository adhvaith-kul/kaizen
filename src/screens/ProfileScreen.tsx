import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { useFocusEffect } from '@react-navigation/native';
import { DailyLog } from '../types';

const SQUAD_COLORS = ['#C2FF05', '#FF3366', '#00E5FF', '#B388FF', '#FF9100'];

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, groups } = useAuth();
  const [stats, setStats] = useState({ totalHabits: 0, totalDaysLogged: 0 });
  const [graphData, setGraphData] = useState<any[]>([]);
  const [maxTotal, setMaxTotal] = useState(1);
  const [loading, setLoading] = useState(true);

  const generateLast7Days = () => {
    const dates = [];
    const istOffset = 5.5 * 60 * 60 * 1000;
    const now = Date.now();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now + istOffset - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
      dates.push({ date: dateStr, displayDate, squadData: {} as Record<string, number>, total: 0 });
    }
    return dates;
  };

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (user) {
        Promise.all([
          backend.getProfileStats(user.id),
          backend.getUserLogs(user.id), // Fetch logs across all groups
        ]).then(([s, logs]) => {
          if (isActive) {
            setStats(s);

            // Process Graph Data
            const dates = generateLast7Days();
            logs.forEach(log => {
              const day = dates.find(d => d.date === log.date);
              if (day && log.completedHabitIds) {
                const count = log.completedHabitIds.length;
                if (count > 0) {
                  day.squadData[log.groupId] = (day.squadData[log.groupId] || 0) + count;
                  day.total += count;
                }
              }
            });

            const highestTotal = Math.max(...dates.map(d => d.total), 1);
            setMaxTotal(highestTotal);
            setGraphData(dates);

            setLoading(false);
          }
        });
      }

      return () => {
        isActive = false;
      };
    }, [user])
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header} />

        <View style={styles.profileSection}>
          <Image
            source={{
              uri: `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=C2FF05&radius=50`,
            }}
            style={styles.avatar}
          />
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.cardTitle}>LIFETIME STATS 🏆</Text>

          {loading ? (
            <ActivityIndicator color="#C2FF05" style={{ marginVertical: 20 }} />
          ) : (
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalHabits}</Text>
                <Text style={styles.statLabel}>HABITS DONE</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{stats.totalDaysLogged}</Text>
                <Text style={styles.statLabel}>DAYS LOGGED</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{groups.length}</Text>
                <Text style={styles.statLabel}>ACTIVE SQUADS</Text>
              </View>
            </View>
          )}
        </View>

        {/* --- HABIT GRAPH --- */}
        <View style={styles.graphCard}>
          <Text style={styles.cardTitle}>LAST 7 DAYS</Text>
          {loading ? (
            <ActivityIndicator color="#C2FF05" style={{ marginVertical: 40 }} />
          ) : (
            <>
              <View style={styles.chartRow}>
                {graphData.map((day, idx) => (
                  <View key={idx} style={styles.barColumn}>
                    <Text style={styles.barValue}>{day.total > 0 ? day.total : ''}</Text>
                    <View style={styles.barWrapper}>
                      {/* Empty state bar */}
                      {day.total === 0 && (
                        <View style={[styles.barSegment, { height: '5%', backgroundColor: '#2A2A35' }]} />
                      )}

                      {/* Stacked bars */}
                      {Object.entries(day.squadData).map(([groupId, count]: [string, any]) => {
                        const heightRatio = count / maxTotal;
                        const groupIndex = groups.findIndex(g => g.id === groupId);
                        const color = SQUAD_COLORS[groupIndex % SQUAD_COLORS.length] || '#FFF';
                        return (
                          <View
                            key={groupId}
                            style={[styles.barSegment, { height: `${heightRatio * 100}%`, backgroundColor: color }]}
                          />
                        );
                      })}
                    </View>
                    <Text style={[styles.barLabel, idx === 6 && { color: '#C2FF05', fontWeight: '900' }]}>
                      {day.displayDate}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.legendContainer}>
                {groups.map((g, idx) => (
                  <View key={g.id} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: SQUAD_COLORS[idx % SQUAD_COLORS.length] }]} />
                    <Text style={styles.legendText}>{g.name}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout().then(() => navigation.navigate('Login'));
          }}>
          <Text style={styles.logoutBtnText}>LOGOUT ✌️</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, padding: 20 },
  header: {
    marginBottom: 20,
    marginTop: 10,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1A1A24',
    borderWidth: 3,
    borderColor: '#C2FF05',
    marginBottom: 16,
  },
  username: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 14,
    color: '#888',
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#2A2A35',
    marginBottom: 20,
  },
  graphCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 24,
    padding: 24,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A35',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B388FF',
    marginBottom: 20,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#666',
    letterSpacing: 1,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 180,
    marginBottom: 20,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barWrapper: {
    width: 12,
    height: 120,
    backgroundColor: '#121217',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#222',
    marginVertical: 8,
  },
  barSegment: {
    width: '100%',
    minHeight: 2, // minimum height so standard bars show
  },
  barValue: {
    fontSize: 12,
    color: '#FFF',
    fontWeight: '800',
    height: 16,
  },
  barLabel: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#2A2A35',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  legendColor: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    color: '#A0A0B0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  spacer: {
    height: 20,
  },
  logoutBtn: {
    backgroundColor: '#FF3366',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  logoutBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
