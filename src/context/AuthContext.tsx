import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Group } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from '../services/backend';

interface AuthContextType {
  user: User | null;
  group: Group | null;
  login: (email: string, pass: string) => Promise<void>;
  signup: (username: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshGroup: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('currentUser').then(id => {
      if (id) {
        backend.getUser(id).then(u => {
          if (u) {
            setUser(u);
            backend.getUserGroup(u.id).then(g => setGroup(g));
          }
        });
      }
    });
  }, []);

  const login = async (email: string, pass: string) => {
    const u = await backend.login(email, pass);
    setUser(u);
    await AsyncStorage.setItem('currentUser', u.id);
    const g = await backend.getUserGroup(u.id);
    setGroup(g);
  };

  const signup = async (username: string, email: string, pass: string) => {
    const u = await backend.signup(username, email, pass);
    setUser(u);
    await AsyncStorage.setItem('currentUser', u.id);
    const g = await backend.getUserGroup(u.id);
    setGroup(g);
  };

  const logout = async () => {
    setUser(null);
    setGroup(null);
    await AsyncStorage.removeItem('currentUser');
  };

  const refreshGroup = async () => {
    if (user) {
      const g = await backend.getUserGroup(user.id);
      setGroup(g);
    }
  };

  return (
    <AuthContext.Provider value={{ user, group, login, signup, logout, refreshGroup }}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
