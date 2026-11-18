import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Group } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from '../services/backend';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  group: Group | null;
  groups: Group[];
  login: (email: string, pass: string) => Promise<void>;
  signup: (username: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshGroup: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setActiveGroup: (group: Group | null) => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const initAuth = async () => {
      const token = await api.getToken();
      if (token) {
        const currentUser = await backend.getMe();
        if (currentUser) {
          setUser(currentUser);
          await AsyncStorage.setItem('currentUser', currentUser.id);
          const [g, gs] = await Promise.all([
            backend.getUserGroup(currentUser.id),
            backend.getUserGroups(currentUser.id),
          ]);
          setGroup(g);
          setGroups(gs);
          return;
        } else {
          await api.setToken(null);
          await AsyncStorage.removeItem('currentUser');
        }
      }

      const id = await AsyncStorage.getItem('currentUser');
      if (id) {
        const u = await backend.getUser(id);
        if (u) {
          setUser(u);
          const [g, gs] = await Promise.all([
            backend.getUserGroup(u.id),
            backend.getUserGroups(u.id),
          ]);
          setGroup(g);
          setGroups(gs);
        }
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    const u = await backend.login(email, pass);
    setUser(u);
    await AsyncStorage.setItem('currentUser', u.id);
    const g = await backend.getUserGroup(u.id);
    setGroup(g);
    const gs = await backend.getUserGroups(u.id);
    setGroups(gs);
  };

  const signup = async (username: string, email: string, pass: string) => {
    const u = await backend.signup(username, email, pass);
    setUser(u);
    await AsyncStorage.setItem('currentUser', u.id);
    const g = await backend.getUserGroup(u.id);
    setGroup(g);
    const gs = await backend.getUserGroups(u.id);
    setGroups(gs);
  };

  const logout = async () => {
    setUser(null);
    setGroup(null);
    setGroups([]);
    await api.setToken(null);
    await AsyncStorage.removeItem('currentUser');
  };

  const refreshGroup = async () => {
    if (user) {
      const g = await backend.getUserGroup(user.id);
      setGroup(g);
      const gs = await backend.getUserGroups(user.id);
      setGroups(gs);
    }
  };

  const refreshUser = async () => {
    if (user) {
      const u = await backend.getUser(user.id);
      if (u) setUser(u);
    }
  };

  const setActiveGroup = (g: Group | null) => {
    setGroup(g);
  };

  return (
    <AuthContext.Provider
      value={{ user, group, groups, login, signup, logout, refreshGroup, refreshUser, setActiveGroup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
