import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Animated, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { backend } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import { SkeletonPostCard } from '../components/Skeleton';
import { useTabNavigation } from '../context/TabNavigationContext';
import { colors, radii, spacing } from '../theme';

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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>LOGS</Text>
          <Text style={styles.headerSubtitle}>
            @{username}
            {groupName ? ` · ${groupName}` : ''}
          </Text>
        </View>

        <View style={{ width: 60 }} />
      </View>

      <View style={styles.container}>
        {loading ? (
          <View style={{ paddingHorizontal: spacing.md, paddingTop: spacing.md }}>
            <SkeletonPostCard />
            <SkeletonPostCard />
          </View>
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
                <Ionicons name={collapsedDates[title] ? 'chevron-down' : 'chevron-up'} size={14} color={colors.textMuted} />
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
                <Text style={styles.emptyText}>No logs found for this user.</Text>
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
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.background,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
  headerContent: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  headerSubtitle: {
    color: colors.lavenderText,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  listHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
  },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  dateHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateHeaderText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
