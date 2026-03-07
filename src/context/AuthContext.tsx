import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Group } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { backend } from '../services/backend';

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
    AsyncStorage.getItem('currentUser').then(id => {
      if (id) {
        backend.getUser(id).then(u => {
          if (u) {
            setUser(u);
            backend.getUserGroup(u.id).then(g => setGroup(g));
            backend.getUserGroups(u.id).then(gs => setGroups(gs));
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
