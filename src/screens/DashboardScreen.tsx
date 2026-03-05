import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  SafeAreaView,
  Alert,
  Image,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { Habit, DailyLog } from '../types';

export default function DashboardScreen({ navigation }: any) {
  const { user, group, logout } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [log, setLog] = useState<DailyLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [rank, setRank] = useState<number | string>('-');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const uHabits = await backend.getHabits(user.id);
      setHabits(uHabits);

      const uLog = await backend.getTodayLog(user.id);
      setLog(uLog);

      if (group) {
        const board = await backend.getLeaderboard(group.id);
        const myRank = board.find(b => b.username === user.username)?.rank || '-';
        setRank(myRank);
      }
    } catch (e) {}
    setLoading(false);
  }, [user, group]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const toggle = async (habitId: string) => {
    if (!user) return;
    const isCompleted = log?.completedHabitIds.includes(habitId);
    const habit = habits.find(h => h.id === habitId);
    const points =
      habit && group?.settings?.pointsPerCategory?.[habit.category]
        ? group.settings.pointsPerCategory[habit.category]
        : 10;

    if (!isCompleted) {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission needed', 'You need camera permissions to upload proof of your habit.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.5,
      });

      if (result.canceled) return;

      setLoading(true);
      const newLog = await backend.toggleHabitCompletion(user.id, habitId, result.assets[0].uri, points);
      setLog(newLog);

      if (group) {
        backend.getLeaderboard(group.id).then(board => {
          const myRank = board.find(b => b.username === user?.username)?.rank || '-';
          setRank(myRank);
        });
      }
      setLoading(false);
    } else {
      Alert.alert(
        'Undo Completion?',
        `Are you sure? This will delete your photo proof and subtract ${points} points from your vibe score.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Undo',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const newLog = await backend.toggleHabitCompletion(user.id, habitId, undefined, points);
              setLog(newLog);
              if (group) {
                backend.getLeaderboard(group.id).then(board => {
                  const myRank = board.find(b => b.username === user?.username)?.rank || '-';
                  setRank(myRank);
                });
              }
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <View>
            <Text style={styles.greeting}>Sup, {user?.username} 👋</Text>
            <Text style={styles.title}>
              Your <Text style={{ color: '#C2FF05' }}>Grind</Text>
            </Text>
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
            <Text style={styles.statValue}>{log?.totalPoints || 0}</Text>
          </View>
          <TouchableOpacity
            style={[styles.statBox, { backgroundColor: '#1A1A24', borderWidth: 1, borderColor: '#333' }]}
            onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={[styles.statLabel, { color: '#888' }]}>SQUAD RANK</Text>
            <Text style={[styles.statValue, { color: '#FFF' }]}>#{rank}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.habitsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              TODAY'S MISSION{' '}
              {log?.date
                ? `(${new Date(log.date).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })})`
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
              const isCompleted = log?.completedHabitIds.includes(h.id);
              const imageUrl = log?.habitImageUrls?.[h.id];
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
          <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.navigate('Leaderboard')}>
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
  greeting: { fontSize: 16, color: '#A0A0B0', fontWeight: '600', marginBottom: 4 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1 },
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
});
