import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useGlobalAlert } from '../context/AlertContext';
import { backend } from '../services/backend';
import { Habit, DailyLog } from '../types';
import Loader from '../components/Loader';
import HabitGateOverlay from '../components/HabitGateOverlay';
import { colors, radii, spacing } from '../theme';

function getMissingRequirements(habits: Habit[], group: any): string[] {
  const settings = group?.settings;
  if (!settings?.allowedCategories?.length) return [];
  const missing: string[] = [];
  for (const cat of settings.allowedCategories) {
    const required = Number(settings.habitsPerCategory?.[cat] ?? 1);
    const current = habits.filter((h) => h.category === cat).length;
    if (current < required) missing.push(`${cat} (${current}/${required})`);
  }
  return missing;
}

export default function DashboardScreen({ navigation }: any) {
  const { user, group } = useAuth();
  const { showAlert } = useGlobalAlert();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [missingHabits, setMissingHabits] = useState<string[]>([]);
  const [rank, setRank] = useState<number | string>('-');
  const [vibeScore, setVibeScore] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');

  const fetchData = useCallback(async () => {
    if (!user || !group) return;
    setLoading(true);
    try {
      const uHabits = await backend.getHabits(user.id, group.id);
      setHabits(uHabits);
      setMissingHabits(getMissingRequirements(uHabits, group));

      const uLogs = await backend.getTodayLog(user.id, group.id);
      setLogs(uLogs);

      const board = await backend.getLeaderboard(group.id);
      const me = board.find((b) => b.userId === user.id);
      setRank(me?.rank || '-');
      setVibeScore(me?.totalPoints || 0);
    } catch (e) {}
    setLoading(false);
    setInitialLoad(false);
  }, [user, group]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const toggle = async (habitId: string) => {
    if (!user || !group) return;
    const existingLog = logs.find((l) => l.habitId === habitId);
    const isCompleted = !!existingLog;
    const habit = habits.find((h) => h.id === habitId);
    const points =
      habit && group?.settings?.pointsPerCategory?.[habit.category]
        ? group.settings.pointsPerCategory[habit.category]
        : 10;

    if (!isCompleted) {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('Permission Required', 'Camera access is required to record photo verification.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
      });

      if (result.canceled) return;

      setPendingImage(result.assets[0].uri);
      setPendingHabitId(habitId);
      setCaptionText('');
    } else {
      showAlert(
        'Revoke Completion',
        `Reverting this habit will remove the logged proof and deduct ${points} points.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm Revocation',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const newLogs = await backend.toggleHabitCompletion(user.id, group.id, habitId, undefined);
              setLogs(newLogs);
              if (group) {
                backend.getLeaderboard(group.id).then((board) => {
                  const me = board.find((b) => b.userId === user?.id);
                  setRank(me?.rank || '-');
                  setVibeScore(me?.totalPoints || 0);
                });
              }
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  const submitWithCaption = async () => {
    if (!user || !group || !pendingHabitId || !pendingImage) return;
    setPendingImage(null);
    setPendingHabitId(null);
    setLoading(true);
    const newLogs = await backend.toggleHabitCompletion(
      user.id,
      group.id,
      pendingHabitId,
      pendingImage,
      captionText.trim() || undefined
    );
    setLogs(newLogs);
    setCaptionText('');
    if (group) {
      backend.getLeaderboard(group.id).then((board) => {
        const me = board.find((b) => b.userId === user?.id);
        setRank(me?.rank || '-');
        setVibeScore(me?.totalPoints || 0);
      });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading && initialLoad && <Loader fullScreen />}

      {!initialLoad && missingHabits.length > 0 && (
        <HabitGateOverlay missing={missingHabits} onFix={() => navigation.navigate('HabitSetup')} />
      )}

      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={colors.lavender} />}
        contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=6F4E37&radius=50`,
              }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.greeting}>{user?.username}</Text>
              <Text style={styles.title}>Daily Performance</Text>
            </View>
          </View>
          {group && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupCodeLabel}>SQUAD CODE</Text>
              <Text style={styles.groupCode}>{group.code}</Text>
            </View>
          )}
        </View>

        {/* Metrics Row */}
        <View style={styles.statsContainer}>
          <View style={styles.statBoxPrimary}>
            <Text style={styles.statLabelPrimary}>DISCIPLINE SCORE</Text>
            <Text style={styles.statValuePrimary}>{vibeScore}</Text>
          </View>
          <TouchableOpacity style={styles.statBoxSecondary} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.statLabelSecondary}>SQUAD RANK</Text>
            <Text style={styles.statValueSecondary}>#{rank}</Text>
          </TouchableOpacity>
        </View>

        {/* Habits Section */}
        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TODAY'S OBJECTIVES</Text>
            <TouchableOpacity onPress={() => navigation.navigate('HabitSetup')} activeOpacity={0.7}>
              <Text style={styles.editLink}>Edit Loadout</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No Active Habits</Text>
              <Text style={styles.emptySubtext}>Configure your squad loadout to start recording progress.</Text>
            </View>
          ) : (
            habits.map((h) => {
              const habitLog = logs.find((l) => l.habitId === h.id);
              const isCompleted = !!habitLog;
              const imageUrl = habitLog?.imageUrl;
              return (
                <View key={h.id} style={[styles.habitCard, isCompleted && styles.habitCardDone]}>
                  <View style={styles.habitInfo}>
                    <Text style={styles.habitCategory}>{h.category.toUpperCase()}</Text>
                    <Text style={[styles.habitName, isCompleted && styles.habitNameDone]}>{h.name}</Text>
                  </View>
                  {isCompleted && imageUrl && (
                    <TouchableOpacity onPress={() => setSelectedImage(imageUrl)} activeOpacity={0.8}>
                      <Image source={{ uri: imageUrl }} style={styles.habitThumbnail} />
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => toggle(h.id)} activeOpacity={0.8}>
                    <View style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
                      {isCompleted && <Ionicons name="checkmark" size={18} color={colors.primaryText} />}
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>View Leaderboard Standings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal visible={!!selectedImage} transparent={true} animationType="fade" onRequestClose={() => setSelectedImage(null)}>
        <TouchableOpacity style={styles.modalBg} activeOpacity={1} onPress={() => setSelectedImage(null)}>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>

      {/* Caption Modal */}
      <Modal
        visible={!!pendingImage}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setPendingImage(null);
          setPendingHabitId(null);
        }}>
        <KeyboardAvoidingView
          style={styles.captionModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.captionModalContent}>
            <View style={styles.captionModalHeader}>
              <Text style={styles.captionModalTitle}>Attach Note</Text>
              <TouchableOpacity
                onPress={() => {
                  setPendingImage(null);
                  setPendingHabitId(null);
                }}>
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {pendingImage && (
              <Image source={{ uri: pendingImage }} style={styles.captionPreviewImage} resizeMode="cover" />
            )}

            <TextInput
              style={styles.captionInput}
              placeholder="Add verification notes (optional)..."
              placeholderTextColor={colors.textMuted}
              value={captionText}
              onChangeText={setCaptionText}
              multiline
              maxLength={200}
              autoFocus
            />

            <View style={styles.captionActions}>
              <TouchableOpacity
                style={styles.captionSkipBtn}
                onPress={() => {
                  setCaptionText('');
                  submitWithCaption();
                }}>
                <Text style={styles.captionSkipText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.captionPostBtn} onPress={submitWithCaption}>
                <Text style={styles.captionPostText}>Log Proof</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg },
  topBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xl,
    marginTop: spacing.xs,
  },
  greeting: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    marginBottom: 2,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: -0.3,
  },
  groupBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  groupCodeLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  groupCode: {
    fontSize: 13,
    color: colors.lavender,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  statBoxPrimary: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabelPrimary: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  statValuePrimary: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primaryText,
    letterSpacing: -1,
  },
  statBoxSecondary: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabelSecondary: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  statValueSecondary: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: -1,
  },
  habitsSection: {
    marginBottom: spacing.xxl,
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
  editLink: {
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
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  habitCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitCardDone: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },
  habitInfo: { flex: 1 },
  habitCategory: {
    fontSize: 10,
    color: colors.lavenderMuted,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 1,
  },
  habitName: {
    fontSize: 15,
    color: colors.silver,
    fontWeight: '600',
  },
  habitNameDone: {
    color: colors.textMuted,
  },
  habitThumbnail: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: {
    backgroundColor: colors.mocha,
    borderColor: colors.mochaLight,
  },
  actionSection: {
    marginTop: spacing.sm,
    paddingBottom: 40,
  },
  primaryBtn: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryBtnText: {
    color: colors.silver,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  captionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(19, 14, 11, 0.82)',
    justifyContent: 'flex-end',
  },
  captionModalContent: {
    backgroundColor: colors.surfaceElevated,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  captionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  captionModalTitle: {
    color: colors.silver,
    fontSize: 16,
    fontWeight: '600',
  },
  captionPreviewImage: {
    width: '100%',
    height: 180,
    borderRadius: radii.md,
    marginBottom: spacing.lg,
  },
  captionInput: {
    color: colors.silver,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
    fontSize: 14,
  },
  captionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.md,
  },
  captionSkipBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  captionSkipText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
  },
  captionPostBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radii.md,
  },
  captionPostText: {
    color: colors.primaryText,
    fontSize: 14,
    fontWeight: '700',
  },
});
