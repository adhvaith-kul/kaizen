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
import { useScrollToTop } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { backend } from '../services/backend';

export default function SquadsScreen({ navigation }: any) {
  const { user, groups, setActiveGroup, refreshGroup } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const [loading, setLoading] = useState(false);
  const scrollRef = React.useRef<ScrollView>(null);
  useScrollToTop(scrollRef);

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
      <View style={styles.fixedHeader}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>KAIZEN</Text>
          <Text style={styles.motto}>SELF-IMPROVEMENT. GAMIFIED.</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('ProfileTab')}>
          <Image
            source={{
              uri:
                user?.avatarUrl ||
                `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=C2FF05&radius=50`,
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.container}
        alwaysBounceVertical={true}
        refreshControl={
          <RefreshControl
            style={{ zIndex: 10 }}
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor="#C2FF05"
            colors={['#C2FF05']}
            progressBackgroundColor="#1A1A24"
            progressViewOffset={20}
          />
        }
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100, flexGrow: 1 }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR SQUADS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Group')}>
              <Text style={styles.addLink}>+ Join/Create</Text>
            </TouchableOpacity>
          </View>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Lonely out here... 🏜️</Text>
              <Text style={styles.emptySubtext}>Join a squad or create your own.</Text>
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
  container: { flex: 1 },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 60,
    backgroundColor: '#0E0E11',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 1.5,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  motto: {
    fontSize: 8,
    fontWeight: '900',
    color: '#C2FF05',
    letterSpacing: 0.5,
    marginTop: -2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2FF05',
  },
  section: { marginBottom: 30, paddingHorizontal: 16 },
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
