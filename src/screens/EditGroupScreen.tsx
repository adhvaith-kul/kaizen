import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useGlobalAlert } from '../context/AlertContext';
import { backend } from '../services/backend';
import Loader from '../components/Loader';
import { Category, GroupSettings } from '../types';
import { colors, radii, spacing } from '../theme';

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

      const updatedGroups = await backend.getUserGroups(user.id);
      const updatedGroup = updatedGroups.find(g => g.id === group.id);
      if (updatedGroup) setActiveGroup(updatedGroup);

      showAlert('Success', 'Squad settings updated.');
      navigation.goBack();
    } catch (e: any) {
      showAlert('Notice', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    showAlert('Delete Squad', 'This will delete the squad and all logs permanently. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
            showAlert('Notice', e.message);
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 60, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Squad Settings</Text>
          <Text style={styles.desc}>Manage squad structure and category requirements.</Text>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>SQUAD NAME</Text>
              <TouchableOpacity
                style={styles.shareBtnInline}
                onPress={() => backend.shareSquadInvite(group)}
                activeOpacity={0.7}>
                <Ionicons name="share-outline" size={13} color={colors.lavenderText} style={{ marginRight: 4 }} />
                <Text style={styles.shareBtnTextInline}>Share Invite</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Squad name"
              placeholderTextColor={colors.textMuted}
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
                  placeholder="Custom category..."
                  placeholderTextColor={colors.textMuted}
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
                  <Text style={styles.newCatBtnText}>Add</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.settingsLabel}>REQUIREMENTS & POINTS</Text>
              {categories.length === 0 ? (
                <Text style={styles.subtleNote}>Select a category first</Text>
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

            <TouchableOpacity style={styles.primaryBtn} onPress={handleUpdate} activeOpacity={0.8}>
              <Text style={styles.primaryBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.7}>
            <Text style={styles.deleteBtnText}>Delete Squad</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
  },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginTop: spacing.xs,
  },
  desc: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.lavenderText,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  shareBtnInline: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mochaSurface,
    borderWidth: 1,
    borderColor: colors.mochaBorder,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  shareBtnTextInline: {
    color: colors.lavenderText,
    fontWeight: '600',
    fontSize: 11,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    color: colors.textPrimary,
    fontSize: 15,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  primaryBtn: {
    backgroundColor: colors.mocha,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  primaryBtnText: {
    color: colors.platinum,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  settingsContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  settingsLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: spacing.sm,
    letterSpacing: 1.2,
  },
  subtleNote: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: spacing.md,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  badgeActive: {
    backgroundColor: colors.mocha,
    borderColor: colors.mochaLight,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  badgeTextActive: {
    color: colors.platinum,
    fontWeight: '700',
  },
  newCatRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: 8,
  },
  newCatInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.sm,
    color: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  newCatBtn: {
    backgroundColor: colors.mochaSurface,
    borderWidth: 1,
    borderColor: colors.mochaBorder,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: radii.sm,
  },
  newCatBtnText: {
    color: colors.lavenderText,
    fontWeight: '600',
    fontSize: 12,
  },
  hpcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  hpcLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  hpcInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  smallInputGroup: { alignItems: 'center' },
  smallInputLabel: {
    color: colors.textMuted,
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  hpcInput: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    width: 52,
    textAlign: 'center',
    fontWeight: '600',
  },
  deleteBtn: {
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.danger,
    marginTop: spacing.xs,
  },
  deleteBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
