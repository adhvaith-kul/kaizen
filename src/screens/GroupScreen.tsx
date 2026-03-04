import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { mockBackend } from '../services/MockBackend';

export default function GroupScreen({ navigation }: any) {
  const [groupName, setGroupName] = useState('');
  const [groupCode, setGroupCode] = useState('');
  const { user, refreshGroup } = useAuth();

  const handleCreate = async () => {
    if (!user) return;
    try {
      await mockBackend.createGroup(groupName, user.id);
      await refreshGroup();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleJoin = async () => {
    if (!user) return;
    try {
      await mockBackend.joinGroup(groupCode, user.id);
      await refreshGroup();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Group Setup</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Create a Group</Text>
        <TextInput style={styles.input} placeholder="Group Name" onChangeText={setGroupName} />
        <Button title="Create Group" onPress={handleCreate} />
      </View>

      <Text style={styles.orText}>- OR -</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Join a Group</Text>
        <TextInput
          style={styles.input}
          placeholder="Group Code"
          onChangeText={setGroupCode}
          autoCapitalize="characters"
        />
        <Button title="Join Group" onPress={handleJoin} />
      </View>

      <Button
        title="Logout"
        color="red"
        onPress={() => mockBackend.save('currentUser', null).then(() => navigation.navigate('Login'))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
  section: { marginBottom: 20, borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 10 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 15, borderRadius: 5 },
  orText: { textAlign: 'center', marginVertical: 10, fontWeight: 'bold' },
});
