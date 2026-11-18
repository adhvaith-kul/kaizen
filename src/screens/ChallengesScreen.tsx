import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { useGlobalAlert } from '../context/AlertContext';
import { backend } from '../services/backend';
import { Challenge, UserChallenge, Habit, DailyLog } from '../types';
import { SkeletonChallengeCard } from '../components/Skeleton';
import { colors, radii, spacing } from '../theme';
import { Ionicons } from '@expo/vector-icons';

export default function ChallengesScreen() {
  const { user } = useAuth();
  const { showAlert } = useGlobalAlert();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      const allChallenges = await backend.getChallenges();
      setChallenges(allChallenges);

      const seventyFiveHard = allChallenges.find((c) => c.name === '75 Hard');
      if (seventyFiveHard) {
        const uc = await backend.syncChallengeStreak(user.id, seventyFiveHard.id);
        setUserChallenge(uc);

        if (uc) {
          const [challengeHabits, logs] = await Promise.all([
            backend.getChallengeHabits(user.id, seventyFiveHard.id),
            backend.getChallengeLogs(user.id, seventyFiveHard.id, new Date().toISOString().split('T')[0]),
          ]);
          setHabits(challengeHabits);
          setTodayLogs(logs);
        }
      }
    } catch (e: any) {
      console.error('[ChallengesScreen] load error:', e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;
    setActionLoading(true);
    try {
      await backend.joinChallenge(user.id, challengeId);
      await loadData();
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user || !userChallenge) return;

    const habitLog = todayLogs.find((l) => l.habitId === habitId);
    const isDone = !!habitLog;

    if (!isDone) {
      showAlert('Record Proof', 'Would you like to attach an image verification to this completion?', [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Check In Without Photo',
          onPress: async () => {
            setActionLoading(true);
            try {
              const newLogs = await backend.toggleHabitCompletion(user.id, null, habitId);
              setTodayLogs(newLogs);
              await backend.syncChallengeStreak(user.id, userChallenge.challengeId);
              const uc = await backend.getUserChallenge(user.id, userChallenge.challengeId);
              setUserChallenge(uc);
            } catch (e: any) {
              showAlert('Error', e.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              showAlert('Permission Required', 'Camera access is required to take photo proof.');
              return;
            }
            const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.5 });
            if (!res.canceled) {
              setPendingImage(res.assets[0].uri);
              setPendingHabitId(habitId);
              setCaptionText('');
            }
          },
        },
      ]);
    } else {
      showAlert('Undo Completion', 'Reverting this task will remove the check-in and associated proof.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Revocation',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const newLogs = await backend.toggleHabitCompletion(user.id, null, habitId);
              setTodayLogs(newLogs);
              await backend.syncChallengeStreak(user.id, userChallenge.challengeId);
              const uc = await backend.getUserChallenge(user.id, userChallenge.challengeId);
              setUserChallenge(uc);
            } catch (e: any) {
              showAlert('Error', e.message);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]);
    }
  };

  const submitWithCaption = async () => {
    if (!user || !userChallenge || !pendingHabitId || !pendingImage) return;
    const image = pendingImage;
    const caption = captionText.trim() || undefined;
    setPendingImage(null);
    setPendingHabitId(null);
    setCaptionText('');
    setActionLoading(true);

    try {
      const newLogs = await backend.toggleHabitCompletion(user.id, null, pendingHabitId, image, caption);
      setTodayLogs(newLogs);
      await backend.syncChallengeStreak(user.id, userChallenge.challengeId);
      const uc = await backend.getUserChallenge(user.id, userChallenge.challengeId);
      setUserChallenge(uc);
    } catch (e: any) {
      showAlert('Error', e.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>CHALLENGES</Text>
        <SkeletonChallengeCard />
        <SkeletonChallengeCard />
      </ScrollView>
    );
  }

  if (!userChallenge && challenges.length > 0) {
    const mainChallenge = challenges[0];
    return (
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lavender} />}>
        <Text style={styles.title}>CHALLENGES</Text>
        <View style={styles.challengeCard}>
          <Text style={styles.challengeName}>{mainChallenge.name}</Text>
          <Text style={styles.challengeDesc}>{mainChallenge.description}</Text>
          <View style={styles.habitStackPreview}>
            {mainChallenge.habits.map((h, i) => (
              <View key={i} style={styles.habitBadge}>
                <Text style={styles.habitBadgeText}>{h.name}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.joinButton} onPress={() => joinChallenge(mainChallenge.id)}>
            <Text style={styles.joinButtonText}>Enroll in Challenge</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!userChallenge) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>No challenges available yet.</Text>
      </View>
    );
  }

  const progress = (userChallenge.currentStreak / 75) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.lavender} />}>
        <View style={styles.header}>
          <Text style={styles.title}>75 HARD</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>DAY {userChallenge.currentStreak}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.max(4, progress)}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Day 01</Text>
            <Text style={styles.progressLabel}>Day 75</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>DAILY MANDATES</Text>
        <View style={styles.habitList}>
          {habits.map((habit) => {
            const habitLog = todayLogs.find((l) => l.habitId === habit.id);
            const isDone = !!habitLog;
            const imageUrl = habitLog?.imageUrl;
            return (
              <View key={habit.id} style={[styles.habitItem, isDone && styles.habitItemDone]}>
                <TouchableOpacity style={styles.habitInfo} onPress={() => toggleHabit(habit.id)} activeOpacity={0.7}>
                  <Text style={[styles.habitNameText, isDone && styles.textStrikethrough]}>{habit.name}</Text>
                  <Text style={styles.habitCategory}>{habit.category.toUpperCase()}</Text>
                </TouchableOpacity>

                {isDone && imageUrl && (
                  <TouchableOpacity onPress={() => setSelectedImage(imageUrl)} activeOpacity={0.8}>
                    <Image source={{ uri: imageUrl }} style={styles.habitThumbnail} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => toggleHabit(habit.id)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                    {isDone && <Ionicons name="checkmark" size={16} color={colors.primaryText} />}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {userChallenge.currentStreak === 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Streak reset. In 75 Hard, missing any single requirement resets progress to Day 1.
            </Text>
          </View>
        )}

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>PROTOCOL RULES</Text>
          <Text style={styles.ruleItem}>• Complete all mandated tasks every consecutive day.</Text>
          <Text style={styles.ruleItem}>• Missed items trigger an immediate streak reset.</Text>
          <Text style={styles.ruleItem}>• Reach Day 75 continuously to complete the protocol.</Text>
        </View>
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}>
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
              <Text style={styles.captionModalTitle}>Add Caption</Text>
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
              placeholder="Add observation notes (optional)..."
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

      {actionLoading && (
        <View style={styles.overlayLoader}>
          <ActivityIndicator size="large" color={colors.lavender} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingTop: 56,
    paddingBottom: 110,
    backgroundColor: colors.background,
    minHeight: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  overlayLoader: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(19, 14, 11, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: -0.3,
  },
  streakBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.lavenderBorder,
  },
  streakText: {
    color: colors.lavender,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 1,
  },
  challengeCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.silver,
    marginBottom: spacing.xs,
  },
  challengeDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  habitStackPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
  },
  habitBadge: {
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  habitBadgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: colors.mocha,
    height: 50,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mochaLight,
  },
  joinButtonText: {
    color: colors.silver,
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: spacing.xxl,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.mocha,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  progressLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },
  habitList: {
    gap: spacing.sm,
  },
  habitItem: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radii.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  habitItemDone: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },
  habitInfo: {
    flex: 1,
  },
  habitNameText: {
    color: colors.silver,
    fontSize: 14,
    fontWeight: '600',
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  habitCategory: {
    color: colors.lavenderMuted,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  habitThumbnail: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.mocha,
    borderColor: colors.mochaLight,
  },
  warningBox: {
    backgroundColor: colors.dangerSubtle,
    padding: spacing.md,
    borderRadius: radii.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.danger,
  },
  warningText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
  },
  rulesCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.md,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rulesTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.sm,
  },
  ruleItem: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
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
