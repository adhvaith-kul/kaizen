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

const CATEGORIES: Category[] = ['Health', 'Finance', 'Work', 'Upskill', 'Social'];

const CATEGORY_EMOJIS: Record<Category, string> = {
  Health: '💪',
  Finance: '💸',
  Work: '💼',
  Upskill: '🧠',
  Social: '🥂',
};

export default function HabitSetupScreen({ navigation }: any) {
  const { user, group } = useAuth();
  const activeCategories = group?.settings?.allowedCategories?.length ? group.settings.allowedCategories : CATEGORIES;

  const [habits, setHabits] = useState<Record<Category, string>>({});

  useEffect(() => {
    if (user) {
      backend.getHabits(user.id).then(userHabits => {
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
  }, [user, group]);

  const handleSave = async () => {
    if (!user) return;
    const payload = activeCategories
      .map((c: string) => ({ category: c, name: habits[c] || '' }))
      .filter(h => h.name.trim() !== '');
    if (payload.length === 0) {
      Alert.alert('💀 Bruh', 'You gotta enter at least one habit.');
      return;
    }

    try {
      await backend.saveHabits(user.id, payload);
      Alert.alert('W', 'Habits locked in 🔒');
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Dashboard');
      }
    } catch (e: any) {
      Alert.alert('💀 Yikes', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
                <Text style={styles.labelEmoji}>{CATEGORY_EMOJIS[cat] || '✨'}</Text>
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
