import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import Loader from '../components/Loader';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      Alert.alert('💀 Yikes', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading && <Loader fullScreen />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" bounces={false}>
          <View style={styles.header}>
            <Text style={styles.logo}>
              kai<Text style={styles.logoAccent}>zen</Text> ⚡️
            </Text>
            <Text style={styles.subtitle}>Lock in. Level up.</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email address (@)"
              placeholderTextColor="#888"
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password (shh...)"
              placeholderTextColor="#888"
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
            <Text style={styles.primaryBtnText}>ENTER THE VOID 🚀</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryBtn} onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.secondaryBtnText}>New here? Sign up ✨</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0E0E11' },
  content: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { marginBottom: 40, alignItems: 'center' },
  logo: { fontSize: 48, fontWeight: '900', color: '#FFF', letterSpacing: -2 },
  logoAccent: { color: '#C2FF05' },
  subtitle: { fontSize: 16, color: '#A0A0B0', marginTop: 8, fontWeight: '600' },
  inputContainer: { marginBottom: 30 },
  input: {
    backgroundColor: '#1A1A24',
    color: '#FFF',
    fontSize: 16,
    padding: 18,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A35',
    fontWeight: '500',
  },
  primaryBtn: {
    backgroundColor: '#C2FF05',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#C2FF05',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryBtnText: { color: '#000', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  secondaryBtn: { padding: 18, alignItems: 'center' },
  secondaryBtnText: { color: '#B388FF', fontSize: 14, fontWeight: '700' },
});
