import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { useFocusEffect } from '@react-navigation/native';

export default function ProfileScreen({ navigation }: any) {
  const { user, logout, groups } = useAuth();
  const [stats, setStats] = useState({ totalHabits: 0, totalDaysLogged: 0 });
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      if (user) {
        backend.getProfileStats(user.id).then(s => {
          if (isActive) {
            setStats(s);
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
      <View style={styles.container}>
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

        <View style={styles.spacer} />

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout().then(() => navigation.navigate('Login'));
          }}>
          <Text style={styles.logoutBtnText}>LOGOUT ✌️</Text>
        </TouchableOpacity>
      </View>
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
  backBtn: {
    padding: 10,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 40,
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
  spacer: {
    flex: 1,
  },
  logoutBtn: {
    backgroundColor: '#FF3366',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 80, // Pad for bottom tabs
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
