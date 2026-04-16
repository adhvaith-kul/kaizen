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
import { useAuth } from '../context/AuthContext';
import { useGlobalAlert } from '../context/AlertContext';
import { backend } from '../services/backend';
import { Habit, DailyLog } from '../types';
import Loader from '../components/Loader';
import HabitGateOverlay from '../components/HabitGateOverlay';

function getMissingRequirements(habits: Habit[], group: any): string[] {
  const settings = group?.settings;
  if (!settings?.allowedCategories?.length) return [];
  const missing: string[] = [];
  for (const cat of settings.allowedCategories) {
    const required = Number(settings.habitsPerCategory?.[cat] ?? 1);
    const current = habits.filter(h => h.category === cat).length;
    if (current < required) missing.push(`${cat} (${current}/${required})`);
  }
  return missing;
}

export default function DashboardScreen({ navigation }: any) {
  const { user, group, logout } = useAuth();
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
      const me = board.find(b => b.userId === user.id);
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
    const existingLog = logs.find(l => l.habitId === habitId);
    const isCompleted = !!existingLog;
    const habit = habits.find(h => h.id === habitId);
    const points =
      habit && group?.settings?.pointsPerCategory?.[habit.category]
        ? group.settings.pointsPerCategory[habit.category]
        : 10;

    if (!isCompleted) {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        showAlert('Permission needed', 'You need camera permissions to upload proof of your habit.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
      });

      if (result.canceled) return;

      // Show caption modal instead of submitting immediately
      setPendingImage(result.assets[0].uri);
      setPendingHabitId(habitId);
      setCaptionText('');
    } else {
      showAlert(
        'Undo Completion?',
        `Are you sure? This will delete your photo proof and subtract ${points} points from your vibe score.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Undo',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const newLogs = await backend.toggleHabitCompletion(user.id, group.id, habitId, undefined);
              setLogs(newLogs);
              if (group) {
                backend.getLeaderboard(group.id).then(board => {
                  const me = board.find(b => b.userId === user?.id);
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
      backend.getLeaderboard(group.id).then(board => {
        const me = board.find(b => b.userId === user?.id);
        setRank(me?.rank || '-');
        setVibeScore(me?.totalPoints || 0);
      });
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading && initialLoad && <Loader fullScreen />}
      {/* ── Blocking gate ──────────────────────────────── */}
      {!initialLoad && missingHabits.length > 0 && (
        <HabitGateOverlay missing={missingHabits} onFix={() => navigation.navigate('HabitSetup')} />
      )}
      {/* ────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor="#C2FF05" />}
        contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image
              source={{
                uri:
                  user?.avatarUrl ||
                  `https://api.dicebear.com/9.x/micah/png?seed=${user?.username}&backgroundColor=C2FF05&radius=50`,
              }}
              style={styles.headerAvatar}
            />
            <View>
              <Text style={styles.greeting}>Sup, {user?.username} 👋</Text>
              <Text style={styles.title}>
                Your <Text style={{ color: '#C2FF05' }}>Grind</Text>
              </Text>
            </View>
          </View>
          {group && (
            <View style={styles.groupBadge}>
              <Text style={styles.groupCodeLabel}>SQUAD CODE</Text>
              <Text style={styles.groupCode}>{group.code}</Text>
            </View>
          )}
        </View>

        <View style={styles.statsContainer}>
          <View style={[styles.statBox, { backgroundColor: '#B388FF' }]}>
            <Text style={styles.statLabel}>VIBE SCORE</Text>
            <Text style={styles.statValue}>{vibeScore}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statBox, { backgroundColor: '#1A1A24', borderWidth: 1, borderColor: '#333' }]}
            onPress={() => navigation.goBack()}>
            <Text style={[styles.statLabel, { color: '#888' }]}>SQUAD RANK</Text>
            <Text style={[styles.statValue, { color: '#FFF' }]}>#{rank}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              TODAY'S MISSION{' '}
              {logs.length > 0
                ? `(${new Date(logs[0].date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })})`
                : ''}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('HabitSetup')}>
              <Text style={styles.editLink}>Edit ⚙️</Text>
            </TouchableOpacity>
          </View>

          {habits.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Crickets... 🦗</Text>
              <Text style={styles.emptySubtext}>Set up your habits to start winning.</Text>
            </View>
          ) : (
            habits.map(h => {
              const habitLog = logs.find(l => l.habitId === h.id);
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
                      <Text style={styles.checkIcon}>{isCompleted ? '🔥' : ''}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryBtnText}>VIEW LEADERBOARD 🏆</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
              <Text style={styles.captionModalTitle}>Add a Caption</Text>
              <TouchableOpacity
                onPress={() => {
                  setPendingImage(null);
                  setPendingHabitId(null);
                }}>
                <Text style={styles.captionModalCancel}>✕</Text>
              </TouchableOpacity>
            </View>

            {pendingImage && (
              <Image source={{ uri: pendingImage }} style={styles.captionPreviewImage} resizeMode="cover" />
            )}

            <TextInput
              style={styles.captionInput}
              placeholder="Write a caption... (optional)"
              placeholderTextColor="#666"
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
                <Text style={styles.captionPostText}>Post 🔥</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backBtn: { alignSelf: 'flex-start', padding: 5, marginLeft: -5 },
  backBtnText: { color: '#888', fontWeight: '800', letterSpacing: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  greeting: { fontSize: 16, color: '#A0A0B0', fontWeight: '600', marginBottom: 2 },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#C2FF05',
    marginRight: 12,
  },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
  groupBadge: {
    backgroundColor: '#1A1A24',
    padding: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  groupCodeLabel: { fontSize: 10, color: '#888', fontWeight: '800', marginBottom: 2 },
  groupCode: { fontSize: 16, color: '#FF3366', fontWeight: '900', letterSpacing: 2 },
  statsContainer: { flexDirection: 'row', gap: 15, marginBottom: 35 },
  statBox: { flex: 1, padding: 20, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: '800', color: '#000', marginBottom: 8, letterSpacing: 1 },
  statValue: { fontSize: 40, fontWeight: '900', color: '#000', letterSpacing: -2 },
  habitsSection: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#666', letterSpacing: 1.5 },
  editLink: { color: '#C2FF05', fontWeight: '700', fontSize: 14 },
  emptyState: {
    backgroundColor: '#1A1A24',
    padding: 40,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  emptyText: { fontSize: 24, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#888', fontWeight: '500' },
  habitCard: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 20,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  habitCardDone: { borderColor: '#C2FF05', backgroundColor: '#121A0F' },
  habitInfo: { flex: 1 },
  habitCategory: { fontSize: 10, color: '#A0A0B0', fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  habitName: { fontSize: 18, color: '#FFF', fontWeight: '700' },
  habitNameDone: { textDecorationLine: 'line-through', color: '#666' },
  habitThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#0E0E11',
    borderWidth: 1,
    borderColor: '#333',
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#0E0E11',
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxDone: { backgroundColor: '#C2FF05', borderColor: '#C2FF05' },
  checkIcon: { fontSize: 16 },
  actionSection: { marginTop: 10, paddingBottom: 85 },
  primaryBtn: {
    backgroundColor: '#C2FF05',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#C2FF05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  captionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  captionModalContent: {
    backgroundColor: '#1A1A24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  captionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  captionModalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  captionModalCancel: {
    color: '#888',
    fontSize: 22,
    fontWeight: '700',
    padding: 4,
  },
  captionPreviewImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#0E0E11',
  },
  captionInput: {
    backgroundColor: '#0E0E11',
    borderRadius: 14,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#2A2A35',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  captionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  captionSkipBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#2A2A35',
    alignItems: 'center',
  },
  captionSkipText: {
    color: '#888',
    fontWeight: '800',
    fontSize: 15,
  },
  captionPostBtn: {
    flex: 2,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#C2FF05',
    alignItems: 'center',
  },
  captionPostText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
