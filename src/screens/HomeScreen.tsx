import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import Loader from '../components/Loader';
import { useTabNavigation } from '../context/TabNavigationContext';

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    try {
      const data = await backend.getFeed(user.id);
      setFeed(data);
    } catch (e) {
      console.error('Failed to fetch feed:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchFeed();
  };

  if (loading && !refreshing) {
    return <Loader fullScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.logo}>KAIZEN</Text>
        <TouchableOpacity onPress={() => navigation.setParams({ openProfile: Date.now() })}>
          <Image
            source={{
              uri:
                user?.avatarUrl ||
                `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=C2FF05&radius=50`,
            }}
            style={styles.headerAvatar}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C2FF05" />}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {feed.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyText}>Feed is empty.</Text>
            <Text style={styles.emptySubtext}>Join a squad and start your grind to see updates here!</Text>
            <TouchableOpacity style={styles.squadBtn} onPress={() => setActiveTab('SquadsTab')}>
              <Text style={styles.squadBtnText}>FIND A SQUAD</Text>
            </TouchableOpacity>
          </View>
        ) : (
          feed.map(item => (
            <View key={item.id} style={styles.post}>
              {/* Post Header */}
              <View style={styles.postHeader}>
                <Image
                  source={{
                    uri:
                      item.avatarUrl ||
                      `https://api.dicebear.com/9.x/micah/png?seed=${item.username}&backgroundColor=C2FF05&radius=50`,
                  }}
                  style={styles.postAvatar}
                />
                <View style={styles.postHeaderInfo}>
                  <Text style={styles.postUsername}>{item.username}</Text>
                  <Text style={styles.postSquadName}>{item.groupName}</Text>
                </View>
                <Text style={styles.postDate}>
                  {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>

              {/* Post Image */}
              <View style={styles.imageContainer}>
                {item.imageUrl ? (
                  <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Text style={styles.placeholderEmoji}>{getCategoryEmoji(item.category)}</Text>
                    <Text style={styles.placeholderText}>Logged Without Photo</Text>
                  </View>
                )}
              </View>

              {/* Post Footer */}
              <View style={styles.postFooter}>
                <View style={styles.habitBadge}>
                  <Text style={styles.habitBadgeText}>{item.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.postContent}>
                  <Text style={styles.postUsernameSmall}>{item.username}</Text> crushed their{' '}
                  <Text style={styles.habitName}>{item.habitName}</Text> goal! 🔥
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function getCategoryEmoji(cat: string) {
  const map: any = {
    Health: '💪',
    Productivity: '💼',
    Sleep: '😴',
    Diet: '🥗',
    Finance: '💸',
    Upskill: '🧠',
    Chores: '🧹',
  };
  return map[cat] || '✨';
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
  },
  logo: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 2,
    fontStyle: 'italic',
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C2FF05',
  },
  container: { flex: 1 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 10 },
  emptySubtext: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  squadBtn: {
    backgroundColor: '#C2FF05',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 30,
  },
  squadBtnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
  post: {
    marginBottom: 20,
    backgroundColor: '#0E0E11',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  postHeaderInfo: { flex: 1 },
  postUsername: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  postSquadName: { color: '#888', fontSize: 11, fontWeight: '500' },
  postDate: { color: '#666', fontSize: 11, fontWeight: '500' },
  imageContainer: {
    width: WINDOW_WIDTH,
    height: WINDOW_WIDTH,
    backgroundColor: '#1A1A24',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: { fontSize: 80, marginBottom: 10, opacity: 0.5 },
  placeholderText: { color: '#444', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  postFooter: {
    padding: 12,
  },
  habitBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#1A1A24',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  habitBadgeText: {
    color: '#C2FF05',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  postContent: {
    color: '#EEE',
    fontSize: 14,
    lineHeight: 20,
  },
  postUsernameSmall: { fontWeight: '800', color: '#FFF' },
  habitName: { fontWeight: '800', color: '#C2FF05' },
});
