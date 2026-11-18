import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

interface Props {
  missing: string[];
  onFix: () => void;
}

export default function HabitGateOverlay({ missing, onFix }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>SETUP REQUIRED</Text>
        </View>

        <Text style={styles.title}>Squad Requirements Pending</Text>
        <Text style={styles.desc}>
          This squad has habit criteria that are not yet configured. Complete your habit loadout to unlock this group.
        </Text>

        <View style={styles.missingList}>
          {missing.map((m) => (
            <View key={m} style={styles.missingRow}>
              <View style={styles.missingIndicator} />
              <Text style={styles.missingText}>{m}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={onFix} activeOpacity={0.85}>
          <Text style={styles.btnText}>Configure Habits</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>You can still switch squads or navigate to your profile.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: 120,
    backgroundColor: colors.background,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radii.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  badge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.lavenderBorder,
    marginBottom: spacing.md,
  },
  badgeText: {
    color: colors.lavender,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.silver,
    letterSpacing: -0.3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  missingList: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  missingIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.mochaLight,
  },
  missingText: {
    color: colors.silver,
    fontSize: 14,
    fontWeight: '500',
  },
  btn: {
    backgroundColor: colors.mocha,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxl,
    borderRadius: radii.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.mochaLight,
    marginBottom: spacing.md,
  },
  btnText: {
    color: colors.silver,
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '400',
    textAlign: 'center',
  },
});
