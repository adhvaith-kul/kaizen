import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { Category } from '../types';
import Loader from '../components/Loader';
import { DEFAULT_CATEGORY_LABELS, CATEGORY_EMOJI_MAP } from '../config/categories';

// Fallback used only until DB categories are loaded
const FALLBACK_CATEGORIES: Category[] = DEFAULT_CATEGORY_LABELS;

export default function HabitSetupScreen({ route, navigation }: any) {
  const { user, group, refreshGroup, setActiveGroup } = useAuth();

  const pendingGroupJoin = route?.params?.pendingGroupJoin;
  const pendingGroupCreate = route?.params?.pendingGroupCreate;
  const isPending = !!(pendingGroupJoin || pendingGroupCreate);

  let activeCategories = FALLBACK_CATEGORIES;
  if (pendingGroupJoin) {
    activeCategories = pendingGroupJoin.settings?.allowedCategories || FALLBACK_CATEGORIES;
  } else if (pendingGroupCreate) {
    activeCategories = pendingGroupCreate.categories || FALLBACK_CATEGORIES;
  } else if (group) {
    activeCategories = group.settings?.allowedCategories || FALLBACK_CATEGORIES;
  }

  const [habits, setHabits] = useState<Record<Category, string>>({});
  const [saving, setSaving] = useState(false);
  const [dbEmojiMap, setDbEmojiMap] = useState<Record<string, string>>(CATEGORY_EMOJI_MAP);

  // Load categories and their emojis from DB
  useEffect(() => {
    backend.getCategories().then(cats => {
      setDbEmojiMap(Object.fromEntries(cats.map(c => [c.label, c.emoji])));
    });
  }, []);

  useEffect(() => {
    if (user && group && !isPending) {
      backend.getHabits(user.id, group.id).then(userHabits => {
        const hRec: Record<Category, string> = {};
        activeCategories.forEach((c: string) => {
          hRec[c] = '';
        });
        userHabits.forEach(h => {
          if (activeCategories.includes(h.category)) {
            hRec[h.category] = h.name;
          }
        });
        setHabits(hRec);
      });
    }
  }, [user, group, isPending]);

  const handleSave = async () => {
    setSaving(true);
    if (!user) return;
    if (!isPending && !group) return;

    const payload = activeCategories
      .map((c: string) => ({ category: c, name: habits[c] || '' }))
      .filter(h => h.name.trim() !== '');

    if (payload.length === 0) {
      Alert.alert('💀 Bruh', 'You gotta enter at least one habit.');
      return;
    }

    try {
      let targetGroupId = group?.id;

      if (pendingGroupJoin) {
        const joinedGroup = await backend.joinGroup(pendingGroupJoin.code, user.id);
        targetGroupId = joinedGroup.id;
        await backend.saveHabits(user.id, targetGroupId, payload);
        await refreshGroup();
        setActiveGroup(joinedGroup);
        Alert.alert('W', 'You joined the squad and habits are locked in 🔒');
        navigation.reset({
          index: 2,
          routes: [{ name: 'Home' }, { name: 'Leaderboard' }, { name: 'Dashboard' }],
        });
      } else if (pendingGroupCreate) {
        const newGroup = await backend.createGroup(pendingGroupCreate.name, user.id, {
          allowedCategories: pendingGroupCreate.categories,
          habitsPerCategory: pendingGroupCreate.habitsPerCategory,
          pointsPerCategory: pendingGroupCreate.pointsPerCategory,
        });
        targetGroupId = newGroup.id;
        await backend.saveHabits(user.id, targetGroupId, payload);
        await refreshGroup();
        setActiveGroup(newGroup);
        Alert.alert('W', 'Squad created and habits locked in 🔒');
        navigation.reset({
          index: 2,
          routes: [{ name: 'Home' }, { name: 'Leaderboard' }, { name: 'Dashboard' }],
        });
      } else if (group) {
        await backend.saveHabits(user.id, group.id, payload);
        Alert.alert('W', 'Habits updated 🔒');
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Dashboard');
        }
      }
    } catch (e: any) {
      Alert.alert('💀 Yikes', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {saving && <Loader fullScreen />}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={styles.title}>
            Choose your <Text style={{ color: '#B388FF' }}>weapons</Text>
          </Text>
          <Text style={styles.desc}>Lock in one daily habit per category. Keep it realistic, no cap.</Text>

          {activeCategories.map((cat: string) => (
            <View key={cat} style={styles.field}>
              <View style={styles.labelContainer}>
                <Text style={styles.labelEmoji}>{dbEmojiMap[cat] || '✨'}</Text>
                <Text style={styles.label}>{cat.toUpperCase()}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder={`e.g., what's your ${cat.toLowerCase()} move?`}
                placeholderTextColor="#666"
                value={habits[cat]}
                onChangeText={val => setHabits({ ...habits, [cat]: val })}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
            <Text style={styles.primaryBtnText}>LOCK IN 🔒</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0E0E11' },
  container: { flex: 1, paddingHorizontal: 20 },
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backBtn: { alignSelf: 'flex-start', padding: 5, marginLeft: -5 },
  backBtnText: { color: '#888', fontWeight: '800', letterSpacing: 1 },
  title: { fontSize: 32, fontWeight: '900', color: '#FFF', letterSpacing: -1, marginBottom: 8, marginTop: 10 },
  desc: { fontSize: 16, color: '#A0A0B0', marginBottom: 30, fontWeight: '500' },
  field: { marginBottom: 20 },
  labelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  labelEmoji: { fontSize: 18, marginRight: 8 },
  label: { fontSize: 14, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  input: {
    backgroundColor: '#1A1A24',
    color: '#FFF',
    fontSize: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A35',
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#B388FF',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#B388FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
});
