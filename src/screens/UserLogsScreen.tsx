import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, LayoutAnimation } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { backend } from '../services/backend';
import { useAuth } from '../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';
import Loader from '../components/Loader';
import PostCard from '../components/PostCard';
import { SkeletonPostCard } from '../components/Skeleton';
import GlassView from '../components/GlassView';
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
      count: sections[key].length,
      data: collapsedDates[key] ? [] : sections[key],
    }));
  }, [feed, collapsedDates]);

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <GlassView variant="raw" intensity={50} tint="dark" specularBorder={false} style={styles.topBar}>
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
      </GlassView>

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
            renderSectionHeader={({ section }: any) => {
              const isCollapsed = !!collapsedDates[section.title];
              return (
                <View style={styles.dateHeaderContainer}>
                  <TouchableOpacity
                    activeOpacity={0.75}
                    onPress={() => toggleCollapsed(section.title)}
                    style={[styles.dateHeaderCard, !isCollapsed && styles.dateHeaderCardExpanded]}>
                    <View style={styles.dateHeaderLeft}>
                      <View style={[styles.calendarIconBubble, !isCollapsed && styles.calendarIconBubbleActive]}>
                        <Ionicons
                          name="calendar-outline"
                          size={14}
                          color={!isCollapsed ? colors.lavender : colors.textMuted}
                        />
                      </View>
                      <Text style={[styles.dateHeaderText, !isCollapsed && styles.dateHeaderTextActive]}>
                        {section.title}
                      </Text>
                    </View>

                    <View style={styles.dateHeaderRight}>
                      <View style={styles.logCountBadge}>
                        <Text style={styles.logCountText}>
                          {section.count} {section.count === 1 ? 'log' : 'logs'}
                        </Text>
                      </View>
                      <View style={styles.chevronCircle}>
                        <Ionicons
                          name={isCollapsed ? 'chevron-down' : 'chevron-up'}
                          size={14}
                          color={!isCollapsed ? colors.lavender : colors.textMuted}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            }}
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
    borderBottomWidth: 0,
    backgroundColor: 'transparent',
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
  dateHeaderContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    backgroundColor: colors.background,
  },
  dateHeaderCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  dateHeaderCardExpanded: {
    borderColor: colors.lavenderBorder,
    backgroundColor: colors.surfaceElevated,
  },
  dateHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  calendarIconBubbleActive: {
    backgroundColor: 'rgba(230, 224, 240, 0.15)',
  },
  dateHeaderText: {
    color: colors.silver,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dateHeaderTextActive: {
    color: colors.silverLight,
  },
  dateHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  logCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.lavenderMuted,
  },
  chevronCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
