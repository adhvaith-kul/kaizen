import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { backend } from '../services/backend';

export default function GroupScreen({ navigation }: any) {
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const { user, refreshGroup, logout } = useAuth();

  const handleCreate = async () => {
    if (!user) return;
    try {
      await backend.createGroup(groupName, user.id);
      await refreshGroup();
    } catch (e: any) {
      Alert.alert('💀 Yikes', e.message);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    try {
      await backend.joinGroup(groupCode, user.id);
      await refreshGroup();
    } catch (e: any) {
      Alert.alert('💀 Yikes', e.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>squad goals 🤝</Text>
        <Text style={styles.desc}>either start a new wave or ride one.</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>START A SQUAD</Text>
          <TextInput
            style={styles.input}
            placeholder="squad name. be creative."
            placeholderTextColor="#888"
            onChangeText={setGroupName}
          />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
            <Text style={styles.primaryBtnText}>CREATE 🔥</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.orText}>--- or literally just ---</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>JOIN THE BOYS / GIRLS</Text>
          <TextInput
            style={styles.input}
            placeholder="secret code here👀"
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

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            logout().then(() => navigation.navigate('Login'));
          }}>
          <Text style={styles.logoutBtnText}>i'm out (logout) ✌️</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E11' },
  content: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 36, fontWeight: '900', color: '#FFF', letterSpacing: -1, textAlign: 'center' },
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
  logoutBtn: { marginTop: 30, padding: 18, alignItems: 'center' },
  logoutBtnText: { color: '#FF3366', fontSize: 14, fontWeight: '700' },
});
