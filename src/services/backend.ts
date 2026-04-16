import { Share } from 'react-native';
import * as Linking from 'expo-linking';
import { supabase } from './supabaseClient';
import { User, Group, Habit, DailyLog, Category, GroupSettings, HabitComment as Comment } from '../types';
import { CategoryMeta, DEFAULT_CATEGORIES } from '../config/categories';
import * as bcrypt from 'bcryptjs';

// Solve "neither webcryptoapi nor a crypto module is available" for Expo/React Native
bcrypt.setRandomFallback((len: number) => {
  const array = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    array[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(array);
});

const generateCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

class Backend {
  async getCategories(): Promise<CategoryMeta[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('label, emoji')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      // Fall back to static config if DB is unreachable or table is empty
      return DEFAULT_CATEGORIES;
    }
    return data.map(row => ({ label: row.label as Category, emoji: row.emoji }));
  }

  async signup(username: string, email: string, password?: string): Promise<User> {
    const { data: existing } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (existing) throw new Error('User already exists');

    // Hash the password before storing
    let hashedPassword = null;
    if (password && typeof password === 'string') {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const { data, error } = await supabase
      .from('users')
      .insert({ username, email, password: hashedPassword })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { ...data, avatarUrl: data.avatar_url ?? undefined };
  }

  async login(email: string, password?: string): Promise<User> {
    // Fetch user by email only — we compare the hash in-app
    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error('Invalid credentials');

    // Verify the password against the stored hash
    if (data.password && password) {
      const isMatch = await bcrypt.compare(String(password), String(data.password));
      if (!isMatch) throw new Error('Invalid credentials');
    } else if (password) {
      // User has no password set but one was provided
      throw new Error('Invalid credentials');
    }

    return { ...data, avatarUrl: data.avatar_url ?? undefined };
  }

  async getUser(id: string): Promise<User | null> {
    const { data } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (!data) return null;
    return { ...data, avatarUrl: data.avatar_url ?? undefined };
  }

  async uploadProfilePicture(uri: string, userId: string): Promise<string> {
    const ext = uri.substring(uri.lastIndexOf('.') + 1).split('?')[0] || 'jpg';
    const filename = `${userId}/avatar.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from('profile-images')
      .upload(filename, arrayBuffer, { upsert: true, contentType: blob.type || 'image/jpeg' });

    if (error) throw new Error(error.message);

    const { data: publicUrlData } = supabase.storage.from('profile-images').getPublicUrl(filename);
    return publicUrlData.publicUrl;
  }

  async updateUserAvatar(userId: string, avatarUrl: string): Promise<void> {
    const { error } = await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId);
    if (error) throw new Error(error.message);
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

  async getGroupByCode(code: string): Promise<Group> {
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('*')
      .eq('code', code)
      .is('deleted_at', null)
      .maybeSingle();
    if (groupErr) throw new Error(groupErr.message);
    if (!group) throw new Error('Group not found');
    return { id: group.id, name: group.name, code: group.code, createdBy: group.created_by, settings: group.settings };
  }

  async joinGroup(code: string, userId: string): Promise<Group> {
    const { data: group, error: groupErr } = await supabase
      .from('groups')
      .select('*')
      .eq('code', code)
      .is('deleted_at', null)
      .maybeSingle();
    if (groupErr) throw new Error(groupErr.message);
    if (!group) throw new Error('Group not found');

    const { error: memberErr } = await supabase
      .from('members')
      .upsert({ user_id: userId, group_id: group.id, deleted_at: null }, { onConflict: 'user_id, group_id' });
    if (memberErr) throw new Error(memberErr.message);

    return { id: group.id, name: group.name, code: group.code, createdBy: group.created_by, settings: group.settings };
  }

  async getUserGroups(userId: string): Promise<Group[]> {
    const { data: members } = await supabase
      .from('members')
      .select('group_id')
      .eq('user_id', userId)
      .is('deleted_at', null);
    if (!members || members.length === 0) return [];

    const groupIds = members.map(m => m.group_id);
    const { data: groups } = await supabase.from('groups').select('*').in('id', groupIds).is('deleted_at', null);
    if (!groups) return [];

    return groups.map(g => ({ id: g.id, name: g.name, code: g.code, createdBy: g.created_by, settings: g.settings }));
  }

  // Keeping this for backward compatibility or simple single-group logic if needed
  async getUserGroup(userId: string): Promise<Group | null> {
    const { data: member } = await supabase
      .from('members')
      .select('group_id')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .maybeSingle();
    if (!member) return null;

    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('id', member.group_id)
      .is('deleted_at', null)
      .maybeSingle();
    return group
      ? { id: group.id, name: group.name, code: group.code, createdBy: group.created_by, settings: group.settings }
      : null;
  }

  async updateGroup(groupId: string, name: string, settings: GroupSettings): Promise<void> {
    const { error } = await supabase.from('groups').update({ name, settings }).eq('id', groupId);
    if (error) throw new Error(error.message);
  }

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from('groups').update({ deleted_at: new Date().toISOString() }).eq('id', groupId);
    if (error) throw new Error(error.message);
  }

  async getHabits(userId: string, groupId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .is('deleted_at', null);
    if (error) throw new Error(error.message);
    return data.map(h => ({ id: h.id, userId: h.user_id, groupId: h.group_id, category: h.category, name: h.name }));
  }

  async getAllHabits(userId: string, groupId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .is('deleted_at', null);
    if (error) throw new Error(error.message);
    return data.map(h => ({ id: h.id, userId: h.user_id, groupId: h.group_id, category: h.category, name: h.name }));
  }

  async saveHabits(
    userId: string,
    groupId: string,
    habitsPayload: { category: Category; name: string }[]
  ): Promise<Habit[]> {
    await supabase
      .from('habits')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .is('deleted_at', null);

    const { data, error } = await supabase
      .from('habits')
      .insert(
        habitsPayload.map(h => ({
          user_id: userId,
          group_id: groupId,
          category: h.category,
          name: h.name,
          deleted_at: null,
        }))
      )
      .select();

    if (error) throw new Error(error.message);
    return data.map(h => ({ id: h.id, userId: h.user_id, groupId: h.group_id, category: h.category, name: h.name }));
  }

  async getTodayLog(userId: string, groupId: string): Promise<DailyLog[]> {
    const d = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(d.getTime() + istOffset);
    const date = istDateObj.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .eq('date', date)
      .is('deleted_at', null);

    if (error) throw new Error(error.message);
    return (data || []).map(d => ({
      id: d.id,
      userId: d.user_id,
      groupId: d.group_id,
      habitId: d.habit_id,
      date: d.date,
      imageUrl: d.image_url,
      createdAt: d.created_at,
    }));
  }

  async uploadHabitImage(uri: string, userId: string, habitId: string, date: string): Promise<string> {
    const ext = uri.substring(uri.lastIndexOf('.') + 1) || 'jpg';
    const filename = `${userId}/${date}/${habitId}.${ext}`;

    const response = await fetch(uri);
    const blob = await response.blob();
    const arrayBuffer = await new Response(blob).arrayBuffer();

    const { error } = await supabase.storage
      .from('habit-images')
      .upload(filename, arrayBuffer, { upsert: true, contentType: blob.type || 'image/jpeg' });

    if (error) throw new Error(error.message);

    const { data: publicUrlData } = supabase.storage.from('habit-images').getPublicUrl(filename);
    return publicUrlData.publicUrl;
  }

  async toggleHabitCompletion(
    userId: string,
    groupId: string,
    habitId: string,
    imageUri?: string,
    caption?: string
  ): Promise<DailyLog[]> {
    const todayLogs = await this.getTodayLog(userId, groupId);
    const existingLog = todayLogs.find(l => l.habitId === habitId);

    const d = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(d.getTime() + istOffset);
    const date = istDateObj.toISOString().split('T')[0];

    // Recalculate points after adding/removing log below

    if (existingLog) {
      const { error } = await supabase
        .from('logs')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', existingLog.id);
      if (error) throw new Error(error.message);
    } else {
      let publicUrl = undefined;
      if (imageUri) {
        publicUrl = await this.uploadHabitImage(imageUri, userId, habitId, date);
      }
      const { error } = await supabase.from('logs').insert({
        user_id: userId,
        group_id: groupId,
        habit_id: habitId,
        date,
        image_url: publicUrl,
        caption: caption || null,
      });
      if (error) throw new Error(error.message);
    }

    // Update points
    await this.recalculateUserPoints(userId, groupId);
    return this.getTodayLog(userId, groupId);
  }

  async suspectLog(userId: string, logId: string): Promise<void> {
    const { data: logData } = await supabase.from('logs').select('user_id, group_id').eq('id', logId).single();
    if (!logData) return;

    const { error } = await supabase
      .from('suspects')
      .upsert({ user_id: userId, log_id: logId, deleted_at: null }, { onConflict: 'user_id, log_id' });
    if (error) throw new Error(error.message);

    await this.recalculateUserPoints(logData.user_id, logData.group_id);
  }

  async unsuspectLog(userId: string, logId: string): Promise<void> {
    const { data: logData } = await supabase.from('logs').select('user_id, group_id').eq('id', logId).single();
    if (!logData) return;

    const { error } = await supabase
      .from('suspects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('log_id', logId);
    if (error) throw new Error(error.message);

    await this.recalculateUserPoints(logData.user_id, logData.group_id);
  }

  async recalculateUserPoints(userId: string, groupId: string): Promise<void> {
    try {
      const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single();
      const { data: members } = await supabase
        .from('members')
        .select('user_id')
        .eq('group_id', groupId)
        .is('deleted_at', null);

      const memberCount = (members || []).length;
      const ptsPerCat = groupData?.settings?.pointsPerCategory || {};

      const { data: logs } = await supabase
        .from('logs')
        .select('id, habits(category)')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .is('deleted_at', null);

      if (!logs || logs.length === 0) {
        await supabase
          .from('members')
          .update({ total_points: 0 })
          .eq('user_id', userId)
          .eq('group_id', groupId);
        return;
      }

      const logIds = logs.map((l: any) => l.id);
      const { data: suspects } = await supabase
        .from('suspects')
        .select('log_id, user_id, deleted_at')
        .in('log_id', logIds)
        .is('deleted_at', null);

      const suspectsByLog: Record<string, number> = {};
      for (const s of suspects || []) {
        suspectsByLog[s.log_id] = (suspectsByLog[s.log_id] || 0) + 1;
      }

      let totalPoints = 0;
      logs.forEach((log: any) => {
        const suspectsCount = suspectsByLog[log.id] || 0;
        const isDisqualified = memberCount > 0 && suspectsCount >= memberCount / 2;

        if (!isDisqualified) {
          const habData: any = log.habits;
          const category = (Array.isArray(habData) ? habData[0]?.category : habData?.category) || 'Health';
          const pts = Number(ptsPerCat[category] || 10);
          totalPoints += pts;
        }
      });

      const { error } = await supabase
        .from('members')
        .update({ total_points: totalPoints })
        .eq('user_id', userId)
        .eq('group_id', groupId);

      if (error) console.error('[recalculateUserPoints] Update error:', error.message);
    } catch (e) {
      console.error('[recalculateUserPoints] Error:', e);
    }
  }
  async recalculateGroupPoints(groupId: string): Promise<void> {
    try {
      const { data: members } = await supabase
        .from('members')
        .select('user_id')
        .eq('group_id', groupId)
        .is('deleted_at', null);
      if (!members) return;

      await Promise.all(members.map(m => this.recalculateUserPoints(m.user_id, groupId)));
    } catch (e) {
      console.error('[recalculateGroupPoints] Error:', e);
    }
  }
  async likeLog(userId: string, logId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .upsert({ user_id: userId, log_id: logId, deleted_at: null }, { onConflict: 'user_id, log_id' });
    if (error) throw new Error(error.message);
  }

  async unlikeLog(userId: string, logId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('log_id', logId);
    if (error) throw new Error(error.message);
  }

  async addComment(userId: string, logId: string, text: string): Promise<void> {
    const { error } = await supabase.from('comments').insert({ user_id: userId, log_id: logId, text });
    if (error) throw new Error(error.message);
  }

  async getComments(logId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('comments')
      .select('*, users(username, avatar_url)')
      .eq('log_id', logId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return (data || []).map(c => ({
      id: c.id,
      userId: c.user_id,
      username: c.users.username,
      avatarUrl: c.users.avatar_url,
      logId: c.log_id,
      text: c.text,
      createdAt: c.created_at,
    }));
  }

  async getLeaderboard(
    groupId: string
  ): Promise<{ rank: number; userId: string; username: string; avatarUrl?: string; totalPoints: number }[]> {
    // Force recalculate points for anyone in the group to fix stale values
    // For small squad sizes this is fast and corrects for membership changes
    await this.recalculateGroupPoints(groupId);

    const { data: members } = await supabase
      .from('members')
      .select('user_id, total_points, groups!inner(deleted_at)')
      .eq('group_id', groupId)
      .is('deleted_at', null)
      .is('groups.deleted_at', null);
    if (!members || members.length === 0) return [];

    const userIds = members.map(m => m.user_id);
    const { data: users } = await supabase.from('users').select('id, username, avatar_url').in('id', userIds);

    const board = members.map(m => ({
      userId: m.user_id,
      username: users?.find(u => u.id === m.user_id)?.username || 'Unknown',
      avatarUrl: users?.find(u => u.id === m.user_id)?.avatar_url ?? undefined,
      totalPoints: m.total_points || 0,
    }));

    // Sort: points descending, then username ascending for alphabetical tie-breaking
    board.sort((a, b) => b.totalPoints - a.totalPoints || a.username.localeCompare(b.username));

    // Standard competition ranking: 1,2,2,4 (tied players share a rank, next rank skips)
    let rank = 1;
    return board.map((item, index) => {
      if (index > 0 && item.totalPoints < board[index - 1].totalPoints) {
        rank = index + 1;
      }
      return { rank, ...item };
    });
  }

  async getUserLogs(userId: string, groupId?: string): Promise<DailyLog[]> {
    let query = supabase
      .from('logs')
      .select(
        `
        *,
        groups(members(user_id))
      `
      )
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (groupId) query = query.eq('group_id', groupId);
    const { data: logs, error } = await query.order('date', { ascending: false });

    if (error) throw new Error(error.message);
    if (!logs || logs.length === 0) return [];

    const logIds = logs.map((l: any) => l.id);
    const { data: suspects } = await supabase
      .from('suspects')
      .select('log_id, user_id, deleted_at')
      .in('log_id', logIds)
      .is('deleted_at', null);

    const suspectsByLog: Record<string, number> = {};
    for (const s of suspects || []) {
      suspectsByLog[s.log_id] = (suspectsByLog[s.log_id] || 0) + 1;
    }

    return logs.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      groupId: d.group_id,
      habitId: d.habit_id,
      date: d.date,
      imageUrl: d.image_url,
      createdAt: d.created_at,
      suspectsCount: suspectsByLog[d.id] || 0,
      isDisqualified:
        (suspectsByLog[d.id] || 0) >= (d.groups?.members?.length || 0) / 2,
    }));

  }

  async getProfileStats(
    userId: string
  ): Promise<{ totalHabits: number; totalDaysLogged: number; totalSquads: number }> {
    const [logsRes, squadsRes] = await Promise.all([
      supabase.from('logs').select('date').eq('user_id', userId).is('deleted_at', null),
      supabase.from('members').select('group_id').eq('user_id', userId).is('deleted_at', null),
    ]);

    const logs = logsRes.data || [];
    const squads = squadsRes.data || [];

    const distinctDays = new Set(logs.map(l => l.date)).size;
    return {
      totalHabits: logs.length,
      totalDaysLogged: distinctDays,
      totalSquads: squads.length,
    };
  }

  async getFeed(userId: string): Promise<any[]> {
    const { data: memberOf } = await supabase
      .from('members')
      .select('group_id, groups!inner(deleted_at)')
      .eq('user_id', userId)
      .is('groups.deleted_at', null);

    if (!memberOf || memberOf.length === 0) return [];
    const groupIds = memberOf.map(m => m.group_id);

    const [logsResult, suspectsResult] = await Promise.all([
      supabase
        .from('logs')
        .select(
          `
          *,
          users(username, avatar_url),
          groups(name, members(user_id)),
          habits(name, category),
          likes(user_id, deleted_at),
          comments(id, text, user_id, created_at, deleted_at, users(username))
        `
        )
        .in('group_id', groupIds)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('suspects')
        .select('log_id, user_id, deleted_at')
        .is('deleted_at', null),
    ]);

    const { data: logs, error } = logsResult;
    if (error || !logs) return [];

    const suspectsByLog: Record<string, { user_id: string; deleted_at: string | null }[]> = {};
    for (const s of suspectsResult.data || []) {
      if (!suspectsByLog[s.log_id]) suspectsByLog[s.log_id] = [];
      suspectsByLog[s.log_id].push(s);
    }

    return logs
      .filter(log => log.habits && log.users)
      .map(log => {
        const suspects = suspectsByLog[log.id] || [];
        const memberCount = log.groups?.members?.length || 0;
        return {
          id: log.id,
          userId: log.user_id,
          username: log.users.username,
          avatarUrl: log.users.avatar_url,
          groupName: log.groups?.name ?? '',
          groupId: log.group_id,
          habitName: log.habits?.name ?? 'Habit',
          category: log.habits?.category ?? 'Health',
          imageUrl: log.image_url,
          caption: log.caption,
          date: log.date,
          timestamp: new Date(log.created_at).getTime(),
          likesCount: log.likes?.filter((l: any) => !l.deleted_at).length || 0,
          suspectsCount: suspects.length,
          commentsCount: log.comments?.filter((c: any) => !c.deleted_at).length || 0,
          isLiked: log.likes?.some((l: any) => l.user_id === userId && !l.deleted_at),
          isSuspected: suspects.some(s => s.user_id === userId),
          isDisqualified: memberCount > 0 && suspects.length >= memberCount / 2,
          commentsPreview: (log.comments || [])
            .filter((c: any) => !c.deleted_at)
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(-2)
            .map((c: any) => ({
              username: c.users?.username ?? '',
              text: c.text,
            })),
        };
      });
  }

  async getUserFeed(userId: string, groupId?: string): Promise<any[]> {
    let query = supabase
      .from('logs')
      .select(
        `
        *,
        users(username, avatar_url),
        groups(name, members(user_id)),
        habits(name, category),
        likes(user_id, deleted_at),
        comments(id, text, user_id, created_at, deleted_at, users(username))
      `
      )
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (groupId) {
      query = query.eq('group_id', groupId);
    }

    const [logsResult, suspectsResult] = await Promise.all([
      query.order('created_at', { ascending: false }),
      supabase.from('suspects').select('log_id, user_id, deleted_at').is('deleted_at', null),
    ]);

    const { data: logs, error } = logsResult;
    if (error || !logs) return [];

    const suspectsByLog: Record<string, { user_id: string; deleted_at: string | null }[]> = {};
    for (const s of suspectsResult.data || []) {
      if (!suspectsByLog[s.log_id]) suspectsByLog[s.log_id] = [];
      suspectsByLog[s.log_id].push(s);
    }

    return logs
      .filter(log => log.habits && log.users)
      .map(log => {
        const suspects = suspectsByLog[log.id] || [];
        const memberCount = log.groups?.members?.length || 0;
        return {
          id: log.id,
          userId: log.user_id,
          username: log.users.username,
          avatarUrl: log.users.avatar_url,
          groupName: log.groups?.name ?? '',
          groupId: log.group_id,
          habitName: log.habits?.name ?? 'Habit',
          category: log.habits?.category ?? 'Health',
          imageUrl: log.image_url,
          caption: log.caption,
          date: log.date,
          timestamp: new Date(log.created_at).getTime(),
          likesCount: log.likes?.filter((l: any) => !l.deleted_at).length || 0,
          suspectsCount: suspects.length,
          commentsCount: log.comments?.filter((c: any) => !c.deleted_at).length || 0,
          isLiked: log.likes?.some((l: any) => l.user_id === userId && !l.deleted_at),
          isSuspected: suspects.some(s => s.user_id === userId),
          isDisqualified: memberCount > 0 && suspects.length >= memberCount / 2,
          commentsPreview: (log.comments || [])
            .filter((c: any) => !c.deleted_at)
            .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(-2)
            .map((c: any) => ({
              username: c.users?.username ?? '',
              text: c.text,
            })),
        };
      });
  }

  async getPostDetail(userId: string, logId: string): Promise<any | null> {
    const [logResult, suspectsResult] = await Promise.all([
      supabase
        .from('logs')
        .select(
          `
          *,
          users(username, avatar_url),
          groups(name, members(user_id)),
          habits(name, category),
          likes(user_id, deleted_at),
          comments(id, text, user_id, created_at, deleted_at, users(username))
        `
        )
        .eq('id', logId)
        .is('deleted_at', null)
        .single(),
      supabase
        .from('suspects')
        .select('log_id, user_id, deleted_at')
        .eq('log_id', logId)
        .is('deleted_at', null),
    ]);

    const { data: log, error } = logResult;
    if (error || !log) return null;

    const suspects = suspectsResult.data || [];
    const memberCount = log.groups?.members?.length || 0;

    return {
      id: log.id,
      userId: log.user_id,
      username: log.users?.username ?? 'Unknown',
      avatarUrl: log.users?.avatar_url,
      groupName: log.groups?.name ?? '',
      groupId: log.group_id,
      habitName: log.habits?.name ?? 'Habit',
      category: log.habits?.category ?? 'Health',
      imageUrl: log.image_url,
      date: log.date,
      timestamp: new Date(log.created_at).getTime(),
      likesCount: log.likes?.filter((l: any) => !l.deleted_at).length || 0,
      suspectsCount: suspects.length,
      commentsCount: log.comments?.filter((c: any) => !c.deleted_at).length || 0,
      isLiked: log.likes?.some((l: any) => l.user_id === userId && !l.deleted_at),
      isSuspected: suspects.some(s => s.user_id === userId),
      isDisqualified: memberCount > 0 && suspects.length >= memberCount / 2,
      commentsPreview: (log.comments || [])
        .filter((c: any) => !c.deleted_at)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-2)
        .map((c: any) => ({
          username: c.users?.username ?? '',
          text: c.text,
        })),
    };
  }

  // ── FOLLOWS / FRIENDS ─────────────────────────────────────────────

  async followUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId });
    if (error) throw new Error(error.message);
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', followingId);
    if (error) throw new Error(error.message);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  }

  async getFollowing(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('following:following_id(id, username, email, avatar_url)')
      .eq('follower_id', userId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.following.id,
      username: d.following.username,
      email: d.following.email,
      avatarUrl: d.following.avatar_url ?? undefined,
    }));
  }

  async getFollowers(userId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('follows')
      .select('follower:follower_id(id, username, email, avatar_url)')
      .eq('following_id', userId);

    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.follower.id,
      username: d.follower.username,
      email: d.follower.email,
      avatarUrl: d.follower.avatar_url ?? undefined,
    }));
  }

  async searchUsers(query: string, currentUserId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, email, avatar_url')
      .neq('id', currentUserId)
      .ilike('username', `%${query}%`)
      .is('deleted_at', null)
      .limit(20);

    if (error || !data) return [];
    return data.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      avatarUrl: u.avatar_url ?? undefined,
    }));
  }

  // ── SQUAD INVITE SHARE ──────────────────────────────────────────────

  async shareSquadInvite(group: Group): Promise<void> {
    const joinUrl = Linking.createURL(`join/${group.code}`);
    const message =
      `🏆 Join my squad "${group.name}" on KAIZEN!\n\n` +
      `Tap this link to join directly:\n${joinUrl}\n\n` +
      `Invite Code: ${group.code}`;

    await Share.share({
      message,
      title: `Join ${group.name} on KAIZEN`,
    });
  }
}

export const backend = new Backend();
