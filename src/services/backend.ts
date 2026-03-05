import { supabase } from './supabaseClient';
import { User, Group, Habit, DailyLog, Category, GroupSettings } from '../types';

const generateCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

class Backend {
  async signup(username: string, email: string, password?: string): Promise<User> {
    const { data: existing } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (existing) throw new Error('User already exists');

    const { data, error } = await supabase.from('users').insert({ username, email, password }).select().single();
    if (error) throw new Error(error.message);
    return data;
  }

  async login(email: string, password?: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password', password)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid credentials');
    return data;
  }

  async getUser(id: string): Promise<User | null> {
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    return data;
  }

  async createGroup(name: string, userId: string, settings?: GroupSettings): Promise<Group> {
    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name,
        code: generateCode(),
        created_by: userId,
        settings,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    await this.joinGroup(group.code, userId);
    return { id: group.id, name: group.name, code: group.code, createdBy: group.created_by, settings: group.settings };
  }

  async joinGroup(code: string, userId: string): Promise<Group> {
    const { data: group, error: groupErr } = await supabase.from('groups').select('*').eq('code', code).maybeSingle();
    if (groupErr) throw new Error(groupErr.message);
    if (!group) throw new Error('Group not found');

    const { error: memberErr } = await supabase
      .from('members')
      .upsert({ user_id: userId, group_id: group.id }, { onConflict: 'user_id, group_id' });
    if (memberErr) throw new Error(memberErr.message);

    return { id: group.id, name: group.name, code: group.code, createdBy: group.created_by, settings: group.settings };
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const { data: members } = await supabase.from('members').select('group_id').eq('user_id', userId);
    if (!members || members.length === 0) return [];

    const groupIds = members.map(m => m.group_id);
    const { data: groups } = await supabase.from('groups').select('*').in('id', groupIds);
    if (!groups) return [];

    return groups.map(g => ({ id: g.id, name: g.name, code: g.code, createdBy: g.created_by, settings: g.settings }));
  }

  // Keeping this for backward compatibility or simple single-group logic if needed
  async getUserGroup(userId: string): Promise<Group | null> {
    const { data: member } = await supabase.from('members').select('group_id').eq('user_id', userId).maybeSingle();
    if (!member) return null;

    const { data: group } = await supabase.from('groups').select('*').eq('id', member.group_id).maybeSingle();
    return group
      ? { id: group.id, name: group.name, code: group.code, createdBy: group.created_by, settings: group.settings }
      : null;
  }

  async getHabits(userId: string): Promise<Habit[]> {
    // Only return currently active habits
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId).neq('active', false);
    if (error) throw new Error(error.message);
    return data.map(h => ({ id: h.id, userId: h.user_id, category: h.category, name: h.name }));
  }

  async getAllHabits(userId: string): Promise<Habit[]> {
    // Returns both active and inactive habits
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId);
    if (error) throw new Error(error.message);
    return data.map(h => ({ id: h.id, userId: h.user_id, category: h.category, name: h.name }));
  }

  async saveHabits(userId: string, habitsPayload: { category: Category; name: string }[]): Promise<Habit[]> {
    // Soft delete existing habits instead of hard deletion to preserve history on User Detail Screen
    await supabase.from('habits').update({ active: false }).eq('user_id', userId).neq('active', false);

    const { data, error } = await supabase
      .from('habits')
      .insert(habitsPayload.map(h => ({ user_id: userId, category: h.category, name: h.name, active: true })))
      .select();

    if (error) throw new Error(error.message);
    return data.map(h => ({ id: h.id, userId: h.user_id, category: h.category, name: h.name }));
  }

  async getTodayLog(userId: string): Promise<DailyLog> {
    const d = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC + 5:30
    const istDateObj = new Date(d.getTime() + istOffset);
    const date = istDateObj.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .maybeSingle();

    if (data) {
      return {
        id: data.id,
        userId: data.user_id,
        date: data.date,
        completedHabitIds: data.completed_habit_ids,
        habitImageUrls: data.habit_image_urls || {},
        totalPoints: data.total_points,
      };
    }

    const { data: newLog, error: newErr } = await supabase
      .from('logs')
      .insert({
        user_id: userId,
        date,
        completed_habit_ids: [],
        total_points: 0,
      })
      .select()
      .single();

    if (newErr) throw new Error(newErr.message);
    return {
      id: newLog.id,
      userId: newLog.user_id,
      date: newLog.date,
      completedHabitIds: newLog.completed_habit_ids,
      habitImageUrls: newLog.habit_image_urls || {},
      totalPoints: newLog.total_points,
    };
  }

  async uploadHabitImage(uri: string, userId: string, habitId: string, date: string): Promise<string> {
    const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
    const filename = `${userId}/${date}/${habitId}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { data, error } = await supabase.storage
      .from('habit-images')
      .upload(filename, arrayBuffer, { upsert: true, contentType: blob.type || 'image/jpeg' });

    if (error) throw new Error(error.message);

    const { data: publicUrlData } = supabase.storage.from('habit-images').getPublicUrl(filename);
    return publicUrlData.publicUrl;
  }

  async toggleHabitCompletion(
    userId: string,
    habitId: string,
    imageUri?: string,
    points: number = 10
  ): Promise<DailyLog> {
    const log = await this.getTodayLog(userId);
    const isCompleted = log.completedHabitIds.includes(habitId);

    let nextCompleted = log.completedHabitIds;
    let nextImageUrls = { ...(log.habitImageUrls || {}) };
    let nextPoints = log.totalPoints;

    if (isCompleted) {
      nextCompleted = nextCompleted.filter(id => id !== habitId);
      delete nextImageUrls[habitId];
      nextPoints -= points;
    } else {
      nextCompleted = [...nextCompleted, habitId];
      if (imageUri) {
        try {
          const publicUrl = await this.uploadHabitImage(imageUri, userId, habitId, log.date);
          nextImageUrls[habitId] = publicUrl;
        } catch (e) {
          console.error('Failed to upload image:', e);
        }
      }
      nextPoints += points;
    }

    const { data, error } = await supabase
      .from('logs')
      .update({
        completed_habit_ids: nextCompleted,
        habit_image_urls: nextImageUrls,
        total_points: nextPoints,
      })
      .eq('id', log.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      userId: data.user_id,
      date: data.date,
      completedHabitIds: data.completed_habit_ids,
      habitImageUrls: data.habit_image_urls || {},
      totalPoints: data.total_points,
    };
  }

  async getLeaderboard(
    groupId: string
  ): Promise<{ rank: number; userId: string; username: string; totalPoints: number }[]> {
    const { data: members } = await supabase.from('members').select('user_id').eq('group_id', groupId);
    if (!members || members.length === 0) return [];

    const userIds = members.map(m => m.user_id);
    const { data: logs } = await supabase.from('logs').select('user_id, total_points').in('user_id', userIds);
    const { data: users } = await supabase.from('users').select('id, username').in('id', userIds);

    if (!users) return [];

    const boardMap: Record<string, number> = {};
    for (const uid of userIds) boardMap[uid] = 0;

    if (logs) {
      for (const log of logs) {
        boardMap[log.user_id] += log.total_points;
      }
    }

    const board = Object.keys(boardMap).map(uid => ({
      userId: uid,
      username: users.find(u => u.id === uid)?.username || 'Unknown',
      totalPoints: boardMap[uid],
    }));

    board.sort((a, b) => b.totalPoints - a.totalPoints);

    return board.map((item, index) => ({
      rank: index + 1,
      userId: item.userId,
      username: item.username,
      totalPoints: item.totalPoints,
    }));
  }

  async getUserLogs(userId: string): Promise<DailyLog[]> {
    const { data: logs, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return logs.map((log: any) => ({
      id: log.id,
      userId: log.user_id,
      date: log.date,
      completedHabitIds: log.completed_habit_ids,
      habitImageUrls: log.habit_image_urls || {},
      totalPoints: log.total_points,
    }));
  }

  async getProfileStats(userId: string): Promise<{ totalPoints: number; totalDaysLogged: number }> {
    const { data: logs } = await supabase.from('logs').select('total_points').eq('user_id', userId);
    if (!logs) return { totalPoints: 0, totalDaysLogged: 0 };

    let totalPoints = 0;
    for (const log of logs) {
      totalPoints += log.total_points;
    }
    return { totalPoints, totalDaysLogged: logs.length };
  }
}

export const backend = new Backend();
