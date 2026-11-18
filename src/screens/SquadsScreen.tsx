import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTabNavigation } from '../context/TabNavigationContext';
import { colors, radii, spacing } from '../theme';

export default function SquadsScreen({ navigation }: any) {
  const { user, groups, setActiveGroup, refreshGroup } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const [loading, setLoading] = useState(false);
  const scrollRef = React.useRef<any>(null);
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
          <Text style={styles.motto}>SQUAD DIRECTORY</Text>
        </View>
        <TouchableOpacity onPress={() => setActiveTab('ProfileTab')}>
          <Image
            source={{
              uri:
                user?.avatarUrl ||
                `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=6F4E37&radius=50`,
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
            refreshing={loading}
            onRefresh={handleRefresh}
            tintColor={colors.lavender}
            colors={[colors.mocha]}
            progressBackgroundColor={colors.surfaceElevated}
            progressViewOffset={20}
          />
        }
        contentContainerStyle={{ paddingTop: spacing.lg, paddingBottom: 110, flexGrow: 1 }}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>YOUR SQUADS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Group')} activeOpacity={0.7}>
              <Text style={styles.addLink}>+ Join or Create</Text>
            </TouchableOpacity>
          </View>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Active Squads</Text>
              <Text style={styles.emptySubtext}>
                Join an existing squad with an invite code or establish a new team.
              </Text>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => navigation.navigate('Group')}
                activeOpacity={0.8}>
                <Text style={styles.createBtnText}>Join or Create Squad</Text>
              </TouchableOpacity>
            </View>
          ) : (
            groups.map((g) => (
              <TouchableOpacity
                key={g.id}
                style={styles.groupCard}
                onPress={() => handleGroupSelect(g)}
                activeOpacity={0.75}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{g.name}</Text>
                  <Text style={styles.groupCode}>CODE: {g.code}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: 3,
  },
  motto: {
    fontSize: 8,
    fontWeight: '600',
    color: colors.lavenderMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  section: {
    marginBottom: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  addLink: {
    color: colors.lavender,
    fontWeight: '600',
    fontSize: 13,
  },
  emptyState: {
    backgroundColor: colors.surface,
    padding: spacing.xxxl,
    borderRadius: radii.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.silver,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 18,
  },
  createBtn: {
    backgroundColor: colors.mocha,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.mochaLight,
  },
  createBtnText: {
    color: colors.silver,
    fontSize: 13,
    fontWeight: '600',
  },
  groupCard: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupInfo: { flex: 1 },
  groupName: {
    fontSize: 16,
    color: colors.silver,
    fontWeight: '600',
    marginBottom: 2,
  },
  groupCode: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    letterSpacing: 1,
  },
});
