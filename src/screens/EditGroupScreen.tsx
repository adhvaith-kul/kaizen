import React, { useState, useEffect } from 'react';
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
import { useGlobalAlert } from '../context/AlertContext';
import { backend } from '../services/backend';

export default function EditGroupScreen({ navigation, route }: any) {
  const { group } = route.params || {};
  const [groupName, setGroupName] = useState(group?.name || '');
  const [loading, setLoading] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [categories, setCategories] = useState<Category[]>(group?.settings?.allowedCategories || []);
  const [habitsPerCat, setHabitsPerCat] = useState<Partial<Record<Category, string>>>(
    Object.fromEntries(Object.entries(group?.settings?.habitsPerCategory || {}).map(([k, v]) => [k, String(v)]))
  );
  const [pointsPerCat, setPointsPerCat] = useState<Partial<Record<Category, string>>>(
    Object.fromEntries(Object.entries(group?.settings?.pointsPerCategory || {}).map(([k, v]) => [k, String(v)]))
  );
  const { user, refreshGroup, setActiveGroup } = useAuth();
  const { showAlert } = useGlobalAlert();

  useEffect(() => {
    backend.getCategories().then(cats => {
      const labels = cats.map(c => c.label);
      setAllCategories(labels);
      // Ensure current categories are in allCategories
      const current = group?.settings?.allowedCategories || [];
      const combined = Array.from(new Set([...labels, ...current]));
      setAllCategories(combined);
    });
  }, [group]);

  const handleUpdate = async () => {
    if (!user || !group) return;
    setLoading(true);
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

      const settings: GroupSettings = {
        allowedCategories: categories,
        habitsPerCategory: hpcMap,
        pointsPerCategory: ppcMap,
      };

      await backend.updateGroup(group.id, groupName, settings);
      await refreshGroup();

      // Update the active group in context if it was updated
      const updatedGroups = await backend.getUserGroups(user.id);
      const updatedGroup = updatedGroups.find(g => g.id === group.id);
      if (updatedGroup) setActiveGroup(updatedGroup);

      showAlert('Success', 'Squad settings updated! 🚀');
      navigation.goBack();
    } catch (e: any) {
      showAlert('💀 Yikes', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert('DELETE SQUAD?', 'This will delete the squad and all logs for everyone. This cannot be undone. 💀', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'DELETE',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await backend.deleteGroup(group.id);
            await refreshGroup();
            setActiveGroup(null);
            navigation.reset({
              index: 0,
              routes: [{ name: 'SquadsRoot' }],
            });
          } catch (e: any) {
            showAlert('Error', e.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
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
          contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Squad Settings ⚙️</Text>
          <Text style={styles.desc}>Customise your domain.</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>SQUAD NAME</Text>
            <TextInput
              style={styles.input}
              placeholder="Squad name"
              placeholderTextColor="#888"
              value={groupName}
              onChangeText={setGroupName}
            />

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

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate}>
              <Text style={styles.primaryBtnText}>SAVE CHANGES ✅</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>DELETE SQUAD 💀</Text>
          </TouchableOpacity>
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
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1, marginTop: 10 },
  desc: { fontSize: 16, color: '#A0A0B0', marginBottom: 40, fontWeight: '500' },
  card: {
    backgroundColor: '#1A1A24',
    padding: 20,
    borderRadius: 24,
    marginBottom: 20,
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
    marginTop: 10,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
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
  deleteBtn: {
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF3366',
    marginTop: 10,
  },
  deleteBtnText: { color: '#FF3366', fontSize: 14, fontWeight: '800', letterSpacing: 1 },
});
