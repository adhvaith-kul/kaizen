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
  const { user } = useAuth();
  const [habits, setHabits] = useState<Record<Category, string>>({
    Health: '',
    Finance: '',
    Work: '',
    Upskill: '',
    Social: '',
  });

  useEffect(() => {
    if (user) {
      backend.getHabits(user.id).then(userHabits => {
        const hRec = { ...habits };
        userHabits.forEach(h => {
          hRec[h.category] = h.name;
        });
        setHabits(hRec);
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const payload = CATEGORIES.map(c => ({ category: c, name: habits[c] })).filter(h => h.name.trim() !== '');
    if (payload.length === 0) {
      Alert.alert('💀 Bruh', 'you gotta enter at least one habit.');
      return;
    }

    try {
      await backend.saveHabits(user.id, payload);
      Alert.alert('W', 'habits locked in 🔒');
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={styles.title}>
            choose your <Text style={{ color: '#B388FF' }}>weapons</Text>
          </Text>
          <Text style={styles.desc}>lock in one daily habit per category. keep it realistic, no cap.</Text>

          {CATEGORIES.map(cat => (
            <View key={cat} style={styles.field}>
              <View style={styles.labelContainer}>
                <Text style={styles.labelEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                <Text style={styles.label}>{cat.toUpperCase()}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder={`e.g. what's your ${cat.toLowerCase()} move?`}
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
  container: { flex: 1, padding: 20 },
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
