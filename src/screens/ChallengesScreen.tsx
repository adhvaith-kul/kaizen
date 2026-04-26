import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Image,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { Challenge, UserChallenge, Habit, DailyLog } from '../types';

const { width } = Dimensions.get('window');

export default function ChallengesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayLogs, setTodayLogs] = useState<DailyLog[]>([]);

  // Photo / Caption State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingHabitId, setPendingHabitId] = useState<string | null>(null);
  const [captionText, setCaptionText] = useState('');

  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const allChallenges = await backend.getChallenges();
      setChallenges(allChallenges);

      // Find 75 Hard or first challenge
      const seventyFiveHard = allChallenges.find(c => c.name.includes('75 Hard')) || allChallenges[0];
      
      if (seventyFiveHard) {
        const uc = await backend.syncChallengeStreak(user.id, seventyFiveHard.id);
        setUserChallenge(uc);

        if (uc) {
          const [h, l] = await Promise.all([
            backend.getChallengeHabits(user.id, seventyFiveHard.id),
            backend.getChallengeLogs(user.id, seventyFiveHard.id, new Date().toISOString().split('T')[0]),
          ]);
          setHabits(h);
          setTodayLogs(l);
        }
      }
    } catch (error) {
      console.error('Error loading challenges:', error);
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
    try {
      setLoading(true);
      await backend.joinChallenge(user.id, challengeId);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to join challenge');
    } finally {
      setLoading(false);
    }
  };

  const toggleHabit = async (habitId: string) => {
    if (!user || !userChallenge) return;
    const existingLog = todayLogs.find(l => l.habitId === habitId);

    if (!existingLog) {
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

      setPendingImage(result.assets[0].uri);
      setPendingHabitId(habitId);
      setCaptionText('');
    } else {
      Alert.alert(
        'Undo Completion?',
        'Are you sure you want to delete this proof?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Undo',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              const newLogs = await backend.toggleHabitCompletion(user.id, null, habitId);
              setTodayLogs(newLogs);
              await backend.syncChallengeStreak(user.id, userChallenge.challengeId);
              const uc = await backend.getUserChallenge(user.id, userChallenge.challengeId);
              setUserChallenge(uc);
              setLoading(false);
            },
          },
        ]
      );
    }
  };

  const submitWithCaption = async () => {
    if (!user || !userChallenge || !pendingHabitId || !pendingImage) return;
    const habitId = pendingHabitId;
    const image = pendingImage;
    const caption = captionText.trim() || undefined;

    setPendingImage(null);
    setPendingHabitId(null);
    setCaptionText('');
    setLoading(true);

    try {
      const newLogs = await backend.toggleHabitCompletion(user.id, null, habitId, image, caption);
      setTodayLogs(newLogs);
      
      if (newLogs.length === habits.length) {
        await backend.syncChallengeStreak(user.id, userChallenge.challengeId);
        const uc = await backend.getUserChallenge(user.id, userChallenge.challengeId);
        setUserChallenge(uc);
      }
    } catch (error) {
      console.error('Error submitting habit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !refreshing && todayLogs.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C2FF05" />
      </View>
    );
  }

  if (!userChallenge && challenges.length > 0) {
    const mainChallenge = challenges[0];
    return (
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C2FF05" />}
      >
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
          <TouchableOpacity 
            style={styles.joinButton}
            onPress={() => joinChallenge(mainChallenge.id)}
          >
            <Text style={styles.joinButtonText}>START CHALLENGE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!userChallenge) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#888' }}>No challenges available yet.</Text>
      </View>
    );
  }

  const progress = (userChallenge.currentStreak / 75) * 100;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C2FF05" />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>75 HARD</Text>
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>DAY {userChallenge.currentStreak}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.max(5, progress)}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Day 1</Text>
            <Text style={styles.progressLabel}>Day 75</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>TODAY'S TASKS</Text>
        <View style={styles.habitList}>
          {habits.map((habit) => {
            const habitLog = todayLogs.find(l => l.habitId === habit.id);
            const isDone = !!habitLog;
            const imageUrl = habitLog?.imageUrl;
            return (
              <View key={habit.id} style={[styles.habitItem, isDone && styles.habitItemDone]}>
                <TouchableOpacity 
                  style={styles.habitInfo}
                  onPress={() => toggleHabit(habit.id)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.habitNameText, isDone && styles.textStrikethrough]}>{habit.name}</Text>
                  <Text style={styles.habitCategory}>{habit.category}</Text>
                </TouchableOpacity>

                {isDone && imageUrl && (
                  <TouchableOpacity onPress={() => setSelectedImage(imageUrl)} activeOpacity={0.8}>
                    <Image source={{ uri: imageUrl }} style={styles.habitThumbnail} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => toggleHabit(habit.id)} activeOpacity={0.7}>
                  <View style={[styles.checkbox, isDone && styles.checkboxChecked]}>
                    {isDone && <Text style={{ color: '#000', fontSize: 12 }}>✓</Text>}
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {userChallenge.currentStreak === 0 && (
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              Streak reset! In 75 Hard, if you miss even one task, you start back at Day 1.
            </Text>
          </View>
        )}

        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>THE RULES</Text>
          <Text style={styles.ruleItem}>• Complete all 6 tasks every single day.</Text>
          <Text style={styles.ruleItem}>• If you miss one, your streak resets to 0.</Text>
          <Text style={styles.ruleItem}>• Reach Day 75 to complete the challenge.</Text>
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

      {loading && todayLogs.length > 0 && (
        <View style={styles.overlayLoader}>
          <ActivityIndicator size="large" color="#C2FF05" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 100,
    backgroundColor: '#0E0E11',
    minHeight: '100%',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0E0E11',
  },
  overlayLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(14, 14, 17, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  streakBadge: {
    backgroundColor: '#C2FF05',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  streakText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
  },
  challengeCard: {
    backgroundColor: '#1A1A23',
    borderRadius: 20,
    padding: 24,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  challengeName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#C2FF05',
    marginBottom: 8,
  },
  challengeDesc: {
    fontSize: 16,
    color: '#AAA',
    lineHeight: 22,
    marginBottom: 20,
  },
  habitStackPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  habitBadge: {
    backgroundColor: '#2A2A35',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  habitBadgeText: {
    color: '#EEE',
    fontSize: 12,
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#C2FF05',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#1A1A23',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#C2FF05',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    color: '#666',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#666',
    letterSpacing: 2,
    marginBottom: 16,
  },
  habitList: {
    gap: 12,
  },
  habitItem: {
    backgroundColor: '#1A1A23',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  habitItemDone: {
    borderColor: '#C2FF0522',
    backgroundColor: '#14141A',
  },
  habitInfo: {
    flex: 1,
  },
  habitNameText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textStrikethrough: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  habitCategory: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
  },
  habitThumbnail: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#0E0E11',
    borderWidth: 1,
    borderColor: '#333',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#C2FF05',
    borderColor: '#C2FF05',
  },
  warningBox: {
    backgroundColor: '#FF3B3022',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#FF3B3044',
  },
  warningText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  rulesCard: {
    marginTop: 40,
    backgroundColor: '#1A1A23',
    padding: 20,
    borderRadius: 20,
  },
  rulesTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 1,
  },
  ruleItem: {
    color: '#888',
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
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
