import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';
import { Category } from '../types';
import Loader from '../components/Loader';

const ALL_CATEGORIES: Category[] = ['Health', 'Finance', 'Work', 'Upskill', 'Social'];

export default function GroupScreen({ navigation }: any) {
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>(ALL_CATEGORIES);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>(ALL_CATEGORIES);
  const [habitsPerCat, setHabitsPerCat] = useState<Partial<Record<Category, string>>>({
    Health: '1',
    Finance: '1',
    Work: '1',
    Upskill: '1',
    Social: '1',
  });
  const [pointsPerCat, setPointsPerCat] = useState<Partial<Record<Category, string>>>({
    Health: '10',
    Finance: '10',
    Work: '10',
    Upskill: '10',
    Social: '10',
  });
  const { user, refreshGroup, logout, setActiveGroup } = useAuth();

  const handleCreate = async () => {
    if (!user) return;
    try {
      if (!groupName.trim()) throw new Error('Enter a squad name');
      if (categories.length === 0) throw new Error('You must select at least one category');

      const hpcMap: Partial<Record<Category, number>> = {};
      const ppcMap: Partial<Record<Category, number>> = {};

      for (const cat of categories) {
        const val = parseInt(habitsPerCat[cat] || '1', 10);
        if (isNaN(val) || val < 1) throw new Error(`Habits for ${cat} must be at least 1`);
        hpcMap[cat] = val;

        const pts = parseInt(pointsPerCat[cat] || '10', 10);
        if (isNaN(pts) || pts < 1) throw new Error(`Points for ${cat} must be at least 1`);
        ppcMap[cat] = pts;
      }

      navigation.navigate('HabitSetup', {
        pendingGroupCreate: {
          name: groupName,
          categories,
          habitsPerCategory: hpcMap,
          pointsPerCategory: ppcMap,
        },
      });
    } catch (e: any) {
      Alert.alert('💀 Yikes', e.message);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const groupToJoin = await backend.getGroupByCode(groupCode);

      // Navigate to HabitSetup with this pending group
      navigation.navigate('HabitSetup', { pendingGroupJoin: groupToJoin });
    } catch (e: any) {
      Alert.alert('💀 Yikes', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && <Loader fullScreen />}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← BACK</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 60, flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Squad Goals 🤝</Text>
          <Text style={styles.desc}>Either start a new wave or ride one.</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>START A SQUAD</Text>
            <TextInput
              style={styles.input}
              placeholder="Squad name. Be creative."
              placeholderTextColor="#888"
              onChangeText={setGroupName}
            />

            <TouchableOpacity onPress={() => setShowSettings(!showSettings)} style={styles.settingsToggle}>
              <Text style={styles.settingsToggleText}>{showSettings ? '− Hide Settings' : '+ Advanced Settings'}</Text>
            </TouchableOpacity>

            {showSettings && (
              <View style={styles.settingsContainer}>
                <Text style={styles.settingsLabel}>ALLOWED CATEGORIES</Text>
                <View style={styles.badgesWrapper}>
                  {allCategories.map(cat => {
                    const isActive = categories.includes(cat);
                    return (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.badge, isActive && styles.badgeActive]}
                        onPress={() => {
                          if (isActive) setCategories(categories.filter(c => c !== cat));
                          else setCategories([...categories, cat]);
                        }}
                        activeOpacity={0.7}>
                        <Text style={[styles.badgeText, isActive && styles.badgeTextActive]}>{cat}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.newCatRow}>
                  <TextInput
                    style={styles.newCatInput}
                    placeholder="Add custom category..."
                    placeholderTextColor="#666"
                    value={newCategory}
                    onChangeText={setNewCategory}
                  />
                  <TouchableOpacity
                    style={styles.newCatBtn}
                    onPress={() => {
                      const trimmed = newCategory.trim();
                      if (trimmed && !allCategories.includes(trimmed)) {
                        setAllCategories([...allCategories, trimmed]);
                        setCategories([...categories, trimmed]);
                        setHabitsPerCat({ ...habitsPerCat, [trimmed]: '1' });
                        setPointsPerCat({ ...pointsPerCat, [trimmed]: '10' });
                        setNewCategory('');
                      }
                    }}>
                    <Text style={styles.newCatBtnText}>ADD +</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.settingsLabel}>HABITS & POINTS LIMITS</Text>
                {categories.length === 0 ? (
                  <Text style={{ color: '#666', fontSize: 12, fontStyle: 'italic' }}>Select a category first</Text>
                ) : (
                  categories.map(cat => (
                    <View key={`hpc-${cat}`} style={styles.hpcRow}>
                      <Text style={styles.hpcLabel} numberOfLines={1}>
                        {cat}
                      </Text>
                      <View style={styles.hpcInputs}>
                        <View style={styles.smallInputGroup}>
                          <Text style={styles.smallInputLabel}>Qty</Text>
                          <TextInput
                            style={styles.hpcInput}
                            value={habitsPerCat[cat]}
                            onChangeText={val => setHabitsPerCat({ ...habitsPerCat, [cat]: val })}
                            keyboardType="numeric"
                            maxLength={2}
                          />
                        </View>
                        <View style={styles.smallInputGroup}>
                          <Text style={styles.smallInputLabel}>Pts</Text>
                          <TextInput
                            style={styles.hpcInput}
                            value={pointsPerCat[cat]}
                            onChangeText={val => setPointsPerCat({ ...pointsPerCat, [cat]: val })}
                            keyboardType="numeric"
                            maxLength={3}
                          />
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
              <Text style={styles.primaryBtnText}>CREATE 🔥</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.orText}>--- or literally just ---</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>JOIN THE BOYS / GIRLS</Text>
            <TextInput
              style={styles.input}
              placeholder="Secret code here 👀"
              placeholderTextColor="#888"
              onChangeText={setGroupCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: '#FF3366', shadowColor: '#FF3366' }]}
              onPress={handleJoin}>
              <Text style={styles.primaryBtnText}>JOIN 🚀</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E11' },
  topBar: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 10 },
  backBtn: { alignSelf: 'flex-start', padding: 5, marginLeft: -5 },
  backBtnText: { color: '#888', fontWeight: '800', letterSpacing: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1, textAlign: 'center', marginTop: 10 },
  desc: { fontSize: 16, color: '#A0A0B0', textAlign: 'center', marginBottom: 40, fontWeight: '500' },
  card: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  cardTitle: { color: '#B388FF', fontSize: 14, fontWeight: '800', marginBottom: 16, letterSpacing: 1 },
  input: {
    backgroundColor: '#0E0E11',
    color: '#FFF',
    fontSize: 16,
    padding: 16,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#C2FF05',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#C2FF05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  orText: { textAlign: 'center', marginVertical: 20, fontWeight: '800', color: '#666', fontSize: 12, letterSpacing: 2 },
  settingsToggle: { marginBottom: 15 },
  settingsToggleText: { color: '#B388FF', fontSize: 14, fontWeight: '800' },
  settingsContainer: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#0E0E11',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingsLabel: { color: '#666', fontSize: 10, fontWeight: '800', marginBottom: 10, letterSpacing: 1 },
  badgesWrapper: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  badgeActive: { backgroundColor: '#C2FF05', borderColor: '#C2FF05' },
  badgeText: { color: '#A0A0B0', fontSize: 12, fontWeight: '700' },
  badgeTextActive: { color: '#000', fontWeight: '800' },
  newCatRow: { flexDirection: 'row', marginBottom: 20, gap: 10 },
  newCatInput: {
    flex: 1,
    backgroundColor: '#1A1A24',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 14,
  },
  newCatBtn: {
    backgroundColor: '#333',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderRadius: 12,
  },
  newCatBtnText: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  hpcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  hpcLabel: { color: '#FFF', fontSize: 14, fontWeight: '700', flex: 1, paddingRight: 10 },
  hpcInputs: { flexDirection: 'row', gap: 10 },
  smallInputGroup: { alignItems: 'center' },
  smallInputLabel: { color: '#666', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  hpcInput: {
    backgroundColor: '#0E0E11',
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    width: 60,
    textAlign: 'center',
    fontWeight: '700',
  },
});
