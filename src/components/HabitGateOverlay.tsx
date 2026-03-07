import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  missing: string[];
  onFix: () => void;
}

export default function HabitGateOverlay({ missing, onFix }: Props) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.icon}>🔐</Text>
        <Text style={styles.title}>Loadout Incomplete</Text>
        <Text style={styles.desc}>
          Your squad has requirements you haven't met yet. Lock in your habits to unlock the group.
        </Text>

        <View style={styles.missingList}>
          {missing.map(m => (
            <View key={m} style={styles.missingRow}>
              <Text style={styles.missingDot}>✗</Text>
              <Text style={styles.missingText}>{m}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.btn} onPress={onFix} activeOpacity={0.85}>
          <Text style={styles.btnText}>SET UP HABITS 🔒</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>You can still switch squads or go to your profile</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 120, // Keep it above the bottom navbar
    backgroundColor: '#0E0E11',
  },
  card: {
    width: '100%',
    backgroundColor: '#1A1A24',
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: '#FF3366',
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  icon: {
    fontSize: 52,
    marginBottom: 14,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    color: '#A0A0B0',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 22,
  },
  missingList: {
    width: '100%',
    backgroundColor: '#0E0E11',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 10,
    borderWidth: 1,
    borderColor: '#2A2A35',
  },
  missingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  missingDot: {
    color: '#FF3366',
    fontSize: 14,
    fontWeight: '900',
    width: 16,
  },
  missingText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  btn: {
    backgroundColor: '#FF3366',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#FF3366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 16,
  },
  btnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  hint: {
    color: '#555',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});
