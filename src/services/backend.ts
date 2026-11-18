import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import api from './api';
import { User, Group, Habit, DailyLog, Category, GroupSettings, HabitComment as Comment, Challenge, UserChallenge } from '../types';
import { CategoryMeta, DEFAULT_CATEGORIES } from '../config/categories';

class Backend {
  async getCategories(): Promise<CategoryMeta[]> {
    try {
      const data = await api.get('/api/categories');
      if (!data || data.length === 0) {
        return DEFAULT_CATEGORIES;
      }
      return data.map((row: any) => ({ label: row.label as Category, emoji: row.emoji }));
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  async signup(username: string, email: string, password?: string): Promise<User> {
    const res = await api.post('/api/auth/signup', { username, email, password });
    if (res.token) {
      await api.setToken(res.token);
    }
    return res.user;
  }

  async login(email: string, password?: string): Promise<User> {
    const res = await api.post('/api/auth/login', { email, password });
    if (res.token) {
      await api.setToken(res.token);
    }
    return res.user;
  }

  async getUser(id: string): Promise<User | null> {
    try {
      return await api.get(`/api/users/${id}`);
    } catch {
      return null;
    }
  }

  async uploadProfilePicture(uri: string, userId: string): Promise<string> {
    const ext = uri.substring(uri.lastIndexOf('.') + 1).split('?')[0] || 'jpg';
    const filename = `${userId}-avatar.${ext}`;
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const blobRes = await fetch(uri);
      const blob = await blobRes.blob();
      formData.append('image', blob, filename);
    } else {
      formData.append('image', {
        uri,
        name: filename,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      } as any);
    }
    formData.append('userId', userId);

    const res = await api.post('/api/upload/profile', formData);
    return res.publicUrl || res.url;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    await api.patch(`/api/users/${userId}/avatar`, { avatarUrl });
  }

  async createGroup(name: string, userId: string, settings?: GroupSettings): Promise<Group> {
    return await api.post('/api/groups', { name, userId, settings });
  }

  async getGroupByCode(code: string): Promise<Group> {
    return await api.get(`/api/groups/code/${code}`);
  }

  async joinGroup(code: string, userId: string): Promise<Group> {
    return await api.post('/api/groups/join', { code, userId });
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    return await api.get(`/api/groups/user/${userId}`);
  }

  async getUserGroup(userId: string): Promise<Group | null> {
    const groups = await this.getUserGroups(userId);
    return groups.length > 0 ? groups[0] : null;
  }

  async updateGroup(groupId: string, name: string, settings: GroupSettings): Promise<void> {
    await api.patch(`/api/groups/${groupId}`, { name, settings });
  }

  async deleteGroup(groupId: string): Promise<void> {
    await api.delete(`/api/groups/${groupId}`);
  }

  async getHabits(userId: string, groupId: string): Promise<Habit[]> {
    return await api.get(`/api/habits?userId=${userId}&groupId=${groupId}`);
  }

  async getAllHabits(userId: string, groupId: string): Promise<Habit[]> {
    return await this.getHabits(userId, groupId);
  }

  async saveHabits(
    userId: string,
    groupId: string,
    habitsPayload: { category: Category; name: string }[]
  ): Promise<Habit[]> {
    return await api.post('/api/habits', { userId, groupId, habits: habitsPayload });
  }

  async getTodayLog(userId: string, groupId?: string | null): Promise<DailyLog[]> {
    const url = `/api/logs/today?userId=${userId}${groupId ? `&groupId=${groupId}` : ''}`;
    return await api.get(url);
  }

  async uploadHabitImage(uri: string, userId: string, habitId: string, date: string): Promise<string> {
    const ext = uri.substring(uri.lastIndexOf('.') + 1).split('?')[0] || 'jpg';
    const filename = `${habitId}.${ext}`;
    const formData = new FormData();

    if (Platform.OS === 'web') {
      const blobRes = await fetch(uri);
      const blob = await blobRes.blob();
      formData.append('image', blob, filename);
    } else {
      formData.append('image', {
        uri,
        name: filename,
        type: `image/${ext === 'png' ? 'png' : 'jpeg'}`,
      } as any);
    }
    formData.append('userId', userId);
    formData.append('habitId', habitId);
    formData.append('date', date);

    const res = await api.post('/api/upload/habit', formData);
    return res.publicUrl || res.url;
  }

  async toggleHabitCompletion(
    userId: string,
    groupId: string | null,
    habitId: string,
    imageUri?: string,
    caption?: string
  ): Promise<DailyLog[]> {
    let publicUrl: string | undefined = undefined;
    if (imageUri) {
      const d = new Date();
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDateObj = new Date(d.getTime() + istOffset);
      const date = istDateObj.toISOString().split('T')[0];
      publicUrl = await this.uploadHabitImage(imageUri, userId, habitId, date);
    }

    return await api.post('/api/logs/toggle', {
      userId,
      groupId,
      habitId,
      imageUrl: publicUrl,
      caption,
    });
  }

  async suspectLog(userId: string, logId: string): Promise<void> {
    await api.post(`/api/logs/${logId}/suspect`, { userId });
  }

  async unsuspectLog(userId: string, logId: string): Promise<void> {
    await api.post(`/api/logs/${logId}/unsuspect`, { userId });
  }

  async recalculateUserPoints(userId: string, groupId: string): Promise<void> {
    // Handled on backend
  }

  async recalculateGroupPoints(groupId: string): Promise<void> {
    // Handled on backend
  }

  async likeLog(userId: string, logId: string): Promise<void> {
    await api.post(`/api/logs/${logId}/like`, { userId });
  }

  async unlikeLog(userId: string, logId: string): Promise<void> {
    await api.post(`/api/logs/${logId}/unlike`, { userId });
  }

  async addComment(userId: string, logId: string, text: string): Promise<void> {
    await api.post(`/api/logs/${logId}/comments`, { userId, text });
  }

  async getComments(logId: string): Promise<Comment[]> {
    return await api.get(`/api/logs/${logId}/comments`);
  }

  async getLeaderboard(
    groupId: string
  ): Promise<{ rank: number; userId: string; username: string; avatarUrl?: string; totalPoints: number }[]> {
    return await api.get(`/api/groups/${groupId}/leaderboard`);
  }

  async getUserLogs(userId: string, groupId?: string): Promise<DailyLog[]> {
    const url = `/api/users/${userId}/logs${groupId ? `?groupId=${groupId}` : ''}`;
    return await api.get(url);
  }

  async getProfileStats(
    userId: string
  ): Promise<{ totalHabits: number; totalDaysLogged: number; totalSquads: number }> {
    return await api.get(`/api/users/${userId}/stats`);
  }

  async getFeed(userId: string): Promise<any[]> {
    return await api.get(`/api/feed?userId=${userId}`);
  }

  async getUserFeed(userId: string, groupId?: string): Promise<any[]> {
    const url = `/api/users/${userId}/feed${groupId ? `?groupId=${groupId}` : ''}`;
    return await api.get(url);
  }

  async getPostDetail(userId: string, logId: string): Promise<any | null> {
    try {
      return await api.get(`/api/logs/${logId}?userId=${userId}`);
    } catch {
      return null;
    }
  }

  // ── FOLLOWS / FRIENDS ─────────────────────────────────────────────

  async followUser(followerId: string, followingId: string): Promise<void> {
    await api.post(`/api/users/${followerId}/follow/${followingId}`);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    await api.delete(`/api/users/${followerId}/follow/${followingId}`);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const res = await api.get(`/api/users/${followerId}/is-following/${followingId}`);
      return Boolean(res.isFollowing);
    } catch {
      return false;
    }
  }

  async getFollowing(userId: string): Promise<User[]> {
    return await api.get(`/api/users/${userId}/following`);
  }

  async getFollowers(userId: string): Promise<User[]> {
    return await api.get(`/api/users/${userId}/followers`);
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    return await api.get(`/api/users/search?q=${encodeURIComponent(query)}&currentUserId=${currentUserId}`);
  }

  // ── SQUAD INVITE SHARE ──────────────────────────────────────────────

  async shareSquadInvite(group: Group): Promise<void> {
    let joinUrl = '';

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      joinUrl = `${window.location.origin}/join/${group.code}`;
    } else {
      joinUrl = Linking.createURL(`join/${group.code}`);
    }

    const message =
      `Join my squad "${group.name}" on KAIZEN.\n\n` +
      `Tap this link to join directly:\n${joinUrl}\n\n` +
      `Invite Code: ${group.code}`;

    await Share.share({
      message,
      title: `Join ${group.name} on KAIZEN`,
    });
  }

  // ── CHALLENGES ──────────────────────────────────────────────────

  async getChallenges(): Promise<Challenge[]> {
    return await api.get('/api/challenges');
  }

  async getUserChallenge(userId: string, challengeId: string): Promise<UserChallenge | null> {
    return await api.get(`/api/challenges/${challengeId}/user/${userId}`);
  }

  async joinChallenge(userId: string, challengeId: string): Promise<UserChallenge> {
    return await api.post(`/api/challenges/${challengeId}/join`, { userId });
  }

  async getChallengeHabits(userId: string, challengeId: string): Promise<Habit[]> {
    return await api.get(`/api/challenges/${challengeId}/habits?userId=${userId}`);
  }

  async getChallengeLogs(userId: string, challengeId: string, date: string): Promise<DailyLog[]> {
    return await api.get(`/api/challenges/${challengeId}/logs?userId=${userId}&date=${date}`);
  }

  async syncChallengeStreak(userId: string, challengeId: string): Promise<UserChallenge> {
    return await api.post(`/api/challenges/${challengeId}/sync-streak`, { userId });
  }
}

export const backend = new Backend();
