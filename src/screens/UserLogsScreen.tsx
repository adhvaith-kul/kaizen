import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { backend } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import { useTabNavigation } from '../context/TabNavigationContext';

export default function UserLogsScreen({ route, navigation }: any) {
  const { userId, username, groupId, groupName } = route.params;
  const { user } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<any[]>([]);
  const [collapsedDates, setCollapsedDates] = useState<{ [key: string]: boolean }>({});
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const toggleCollapsed = (dateStr: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsedDates(prev => ({
      ...prev,
      [dateStr]: !prev[dateStr],
    }));
  };

  const headerOpacity = scrollY.interpolate({
    inputRange: [50, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      setLoading(true);

      const loadData = async () => {
        try {
          const userFeed = await backend.getUserFeed(userId, groupId);
          if (isActive) {
            setFeed(userFeed);
            setLoading(false);
          }
        } catch (err) {
          console.error(err);
          if (isActive) setLoading(false);
        }
      };

      loadData();
      return () => {
        isActive = false;
      };
    }, [userId, groupId])
  );

  const handleLike = async (post: any) => {
    if (!user) return;
    try {
      if (post.isLiked) {
        await backend.unlikeLog(user.id, post.id);
      } else {
        await backend.likeLog(user.id, post.id);
      }
      setFeed(prev =>
        prev.map(p =>
          p.id === post.id
            ? { ...p, isLiked: !post.isLiked, likesCount: post.isLiked ? p.likesCount - 1 : p.likesCount + 1 }
            : p
        )
      );
    } catch (e) {
      console.error('Like failed:', e);
    }
  };

  const handleSuspect = async (post: any) => {
    if (!user) return;
    try {
      if (post.isSuspected) {
        await backend.unsuspectLog(user.id, post.id);
      } else {
        await backend.suspectLog(user.id, post.id);
      }
      const updatedPost = await backend.getPostDetail(user.id, post.id);
      if (updatedPost) {
        setFeed(prev => prev.map(p => (p.id === post.id ? { ...p, ...updatedPost } : p)));
      }
    } catch (e) {
      console.error('Suspect failed:', e);
    }
  };

  const handlePressUser = (id: string, name: string) => {
    if (user?.id === id) {
      setActiveTab('ProfileTab');
    } else {
      navigation.navigate('UserDetail', { userId: id, username: name });
    }
  };

  const sectionData = React.useMemo(() => {
    const sections: { [key: string]: any[] } = {};
    feed.forEach(log => {
      const dateObj = new Date(log.timestamp);
      // Format: "March 8, 2026"
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (!sections[dateStr]) sections[dateStr] = [];
      sections[dateStr].push(log);
    });
    return Object.keys(sections).map(key => ({
      title: key,
      data: collapsedDates[key] ? [] : sections[key],
    }));
  }, [feed, collapsedDates]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#FFF" />
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>LOGS</Text>
          <Text style={styles.headerSubtitle}>
            @{username}
            {groupName ? ` | ${groupName}` : ''}
          </Text>
        </View>

        <View style={{ width: 80 }} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <Loader style={{ marginTop: 50 }} />
        ) : (
          <Animated.SectionList
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
            })}
            scrollEventThrottle={16}
            sections={sectionData}
            keyExtractor={item => item.id}
            ListHeaderComponent={() => (
              <View style={styles.listHeader}>
                <Text style={styles.sectionTitle}>ACTIVITY HISTORY</Text>
              </View>
            )}
            renderSectionHeader={({ section: { title } }) => (
              <TouchableOpacity activeOpacity={0.7} onPress={() => toggleCollapsed(title)} style={styles.dateHeader}>
                <Text style={styles.dateHeaderText}>{title}</Text>
                <Ionicons name={collapsedDates[title] ? 'chevron-down' : 'chevron-up'} size={16} color="#A0A0B0" />
              </TouchableOpacity>
            )}
            renderItem={({ item }) => (
              <PostCard
                post={item as any}
                onLike={() => handleLike(item)}
                onSuspect={() => handleSuspect(item)}
                onOpenComments={() => navigation.navigate('PostDetail', { logId: (item as any).id })}
                onPressUser={handlePressUser}
              />
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No logs found for this user. 🍃</Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1 },
  topBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
    zIndex: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  backBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12, letterSpacing: 1, marginLeft: -4 },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: '#C2FF05',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#444',
    letterSpacing: 3,
  },
  emptyState: {
    paddingTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  dateHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#15151A',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A24',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateHeaderText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
