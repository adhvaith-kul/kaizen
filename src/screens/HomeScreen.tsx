import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';

export default function HomeScreen({ navigation }: any) {
  const { user, groups, setActiveGroup, refreshGroup } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshGroup();
    setLoading(false);
  };

  const handleGroupSelect = (g: any) => {
    setActiveGroup(g);
    navigation.navigate('Leaderboard');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={handleRefresh} tintColor="#C2FF05" />}
        contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>good to see you,</Text>
            <Text style={styles.title}>{user?.username}</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Image
              source={{
                uri: `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=C2FF05&radius=50`,
              }}
              style={styles.avatar}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR SQUADS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Group')}>
              <Text style={styles.addLink}>+ join/create</Text>
            </TouchableOpacity>
          </View>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>lonely out here... 🏜️</Text>
              <Text style={styles.emptySubtext}>join a squad or create your own.</Text>
            </View>
          ) : (
            groups.map(g => (
              <TouchableOpacity
                key={g.id}
                style={styles.groupCard}
                onPress={() => handleGroupSelect(g)}
                activeOpacity={0.8}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  <Text style={styles.groupCode}>{g.code}</Text>
                </View>
                <Text style={styles.arrowIcon}>👉</Text>
              </TouchableOpacity>
            ))
          )}
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
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 10,
  },
  greeting: { fontSize: 16, color: '#A0A0B0', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A24',
    borderWidth: 2,
    borderColor: '#C2FF05',
  },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#666', letterSpacing: 1.5 },
  addLink: { color: '#FF3366', fontWeight: '700', fontSize: 14 },
  emptyState: {
    backgroundColor: '#1A1A24',
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A35',
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888', fontWeight: '500' },
  groupCard: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 20, color: '#FFF', fontWeight: '800', marginBottom: 4 },
  groupCode: { fontSize: 12, color: '#A0A0B0', fontWeight: '700', letterSpacing: 1 },
  arrowIcon: { fontSize: 24 },
});
