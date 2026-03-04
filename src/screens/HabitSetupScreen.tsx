import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/MockBackend';
import { Category, Habit } from '../types';

const CATEGORIES: Category[] = ['Health', 'Finance', 'Work', 'Upskill', 'Social'];

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
      mockBackend.getHabits(user.id).then(userHabits => {
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
      Alert.alert('Error', 'Please enter at least one habit.');
      return;
    }

    try {
      await mockBackend.saveHabits(user.id, payload);
      Alert.alert('Success', 'Habits saved!');
      navigation.navigate('Dashboard');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Setup Your Habits</Text>
      <Text style={styles.desc}>Define one habit for each category (max 5).</Text>

      {CATEGORIES.map(cat => (
        <View key={cat} style={styles.field}>
          <Text style={styles.label}>{cat}</Text>
          <TextInput
            style={styles.input}
            placeholder={`e.g. ${cat} habit`}
            value={habits[cat]}
            onChangeText={val => setHabits({ ...habits, [cat]: val })}
          />
        </View>
      ))}

      <Button title="Save Habits" onPress={handleSave} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
  desc: { marginBottom: 20, color: '#666' },
  field: { marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
});
