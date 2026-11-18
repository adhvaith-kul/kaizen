import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useGlobalAlert } from '../context/AlertContext';
import { backend } from '../services/backend';
import Loader from '../components/Loader';
import { Category } from '../types';
import { DEFAULT_CATEGORY_LABELS } from '../config/categories';
import { colors, radii, spacing } from '../theme';

export default function HabitSetupScreen({ route, navigation }: any) {
  const { user, group, refreshGroup, setActiveGroup } = useAuth();
  const { showAlert } = useGlobalAlert();

  const pendingGroupJoin = route?.params?.pendingGroupJoin;
  const isPending = !!pendingGroupJoin;

  let activeCategories = DEFAULT_CATEGORY_LABELS;
  if (pendingGroupJoin) {
    activeCategories = pendingGroupJoin.settings?.allowedCategories || DEFAULT_CATEGORY_LABELS;
  } else if (group) {
    activeCategories = group.settings?.allowedCategories || DEFAULT_CATEGORY_LABELS;
  }

  const [habits, setHabits] = useState<Record<Category, string>>({});
  const [saving, setSaving] = useState(false);

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
      showAlert('Notice', 'Please specify at least one habit.');
      setSaving(false);
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
        showAlert('Success', 'Squad joined and daily habits confirmed.');
        navigation.reset({
          index: 2,
          routes: [{ name: 'SquadsRoot' }, { name: 'Leaderboard' }, { name: 'Dashboard' }],
        });
      } else if (group) {
        await backend.saveHabits(user.id, group.id, payload);
        showAlert('Success', 'Habits saved.');
        if (route.params?.fromCreateGroup) {
          navigation.reset({
            index: 2,
            routes: [{ name: 'SquadsRoot' }, { name: 'Leaderboard' }, { name: 'Dashboard' }],
          });
        } else if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Dashboard');
        }
      }
    } catch (e: any) {
      showAlert('Notice', e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {saving && <Loader fullScreen />}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
          <Text style={styles.title}>Define Habits</Text>
          <Text style={styles.desc}>
            Set one clear habit for each active category. You can update these at any time.
          </Text>

          {activeCategories.map((cat: string) => (
            <View key={cat} style={styles.field}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>{cat.toUpperCase()}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder={`Action for ${cat.toLowerCase()}`}
                placeholderTextColor={colors.textMuted}
                value={habits[cat]}
                onChangeText={val => setHabits({ ...habits, [cat]: val })}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.primaryBtn} onPress={handleSave} activeOpacity={0.8}>
            <Text style={styles.primaryBtnText}>Save Habits</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, paddingHorizontal: spacing.lg },
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 6,
    marginTop: spacing.xs,
  },
  desc: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xl,
    lineHeight: 20,
  },
  field: { marginBottom: spacing.lg },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.lavenderText,
    letterSpacing: 1.5,
  },
  input: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 15,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  primaryBtn: {
    backgroundColor: colors.mocha,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryBtnText: {
    color: colors.platinum,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
