import { supabase } from './supabaseClient';
import { User, Group, Habit, DailyLog, Category, GroupSettings, HabitComment as Comment } from '../types';
import { CategoryMeta, DEFAULT_CATEGORIES } from '../config/categories';

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

    const { data, error } = await supabase.from('users').insert({ username, email, password }).select().single();
    if (error) throw new Error(error.message);
    return { ...data, avatarUrl: data.avatar_url ?? undefined };
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
    const { data: group, error: groupErr } = await supabase.from('groups').select('*').eq('code', code).maybeSingle();
    if (groupErr) throw new Error(groupErr.message);
    if (!group) throw new Error('Group not found');
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

  async getHabits(userId: string, groupId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .neq('active', false);
    if (error) throw new Error(error.message);
    return data.map(h => ({ id: h.id, userId: h.user_id, groupId: h.group_id, category: h.category, name: h.name }));
  }

  async getAllHabits(userId: string, groupId: string): Promise<Habit[]> {
    const { data, error } = await supabase.from('habits').select('*').eq('user_id', userId).eq('group_id', groupId);
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
      .update({ active: false })
      .eq('user_id', userId)
      .eq('group_id', groupId)
      .neq('active', false);

    const { data, error } = await supabase
      .from('habits')
      .insert(
        habitsPayload.map(h => ({
          user_id: userId,
          group_id: groupId,
          category: h.category,
          name: h.name,
          active: true,
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
      .eq('date', date);

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
    imageUri?: string
  ): Promise<DailyLog[]> {
    const todayLogs = await this.getTodayLog(userId, groupId);
    const existingLog = todayLogs.find(l => l.habitId === habitId);

    const d = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDateObj = new Date(d.getTime() + istOffset);
    const date = istDateObj.toISOString().split('T')[0];

    // Points logic
    const { data: groupData } = await supabase.from('groups').select('*').eq('id', groupId).single();
    const { data: habitObj } = await supabase.from('habits').select('*').eq('id', habitId).single();

    let pointsDelta = 0;
    if (groupData && habitObj) {
      const ptsPerCat = groupData.settings?.pointsPerCategory || {};
      const pts = Number(ptsPerCat[habitObj.category] || 10);
      pointsDelta = existingLog ? -pts : pts;
    }

    if (existingLog) {
      const { error } = await supabase.from('logs').delete().eq('id', existingLog.id);
      if (error) throw new Error(error.message);
    } else {
      let publicUrl = undefined;
      if (imageUri) {
        publicUrl = await this.uploadHabitImage(imageUri, userId, habitId, date);
      }
      const { error } = await supabase
        .from('logs')
        .insert({ user_id: userId, group_id: groupId, habit_id: habitId, date, image_url: publicUrl });
      if (error) throw new Error(error.message);
    }

    // Update global points
    if (pointsDelta !== 0) {
      const { data: memberData } = await supabase
        .from('members')
        .select('total_points')
        .eq('user_id', userId)
        .eq('group_id', groupId)
        .single();

      const currentPoints = memberData?.total_points || 0;
      await supabase
        .from('members')
        .update({ total_points: currentPoints + pointsDelta })
        .eq('user_id', userId)
        .eq('group_id', groupId);
    }

    return this.getTodayLog(userId, groupId);
  }

  async likeLog(userId: string, logId: string): Promise<void> {
    const { error } = await supabase
      .from('likes')
      .upsert({ user_id: userId, log_id: logId }, { onConflict: 'user_id, log_id' });
    if (error) throw new Error(error.message);
  }

  async unlikeLog(userId: string, logId: string): Promise<void> {
    const { error } = await supabase.from('likes').delete().eq('user_id', userId).eq('log_id', logId);
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
    const { data: members } = await supabase.from('members').select('user_id, total_points').eq('group_id', groupId);
    if (!members || members.length === 0) return [];

    const userIds = members.map(m => m.user_id);
    const { data: users } = await supabase.from('users').select('id, username, avatar_url').in('id', userIds);

    const board = members.map(m => ({
      userId: m.user_id,
      username: users?.find(u => u.id === m.user_id)?.username || 'Unknown',
      avatarUrl: users?.find(u => u.id === m.user_id)?.avatar_url ?? undefined,
      totalPoints: m.total_points || 0,
    }));

    board.sort((a, b) => b.totalPoints - a.totalPoints);
    return board.map((item, index) => ({ rank: index + 1, ...item }));
  }

  async getUserLogs(userId: string, groupId?: string): Promise<DailyLog[]> {
    let query = supabase.from('logs').select('*').eq('user_id', userId);
    if (groupId) query = query.eq('group_id', groupId);
    const { data: logs, error } = await query.order('date', { ascending: false });

    if (error) throw new Error(error.message);
    return (logs || []).map(d => ({
      id: d.id,
      userId: d.user_id,
      groupId: d.group_id,
      habitId: d.habit_id,
      date: d.date,
      imageUrl: d.image_url,
      createdAt: d.created_at,
    }));
  }

  async getProfileStats(userId: string): Promise<{ totalHabits: number; totalDaysLogged: number }> {
    const { data: logs } = await supabase.from('logs').select('date').eq('user_id', userId);
    if (!logs) return { totalHabits: 0, totalDaysLogged: 0 };

    const distinctDays = new Set(logs.map(l => l.date)).size;
    return { totalHabits: logs.length, totalDaysLogged: distinctDays };
  }

  async getFeed(userId: string): Promise<any[]> {
    const { data: memberOf } = await supabase.from('members').select('group_id').eq('user_id', userId);
    if (!memberOf || memberOf.length === 0) return [];
    const groupIds = memberOf.map(m => m.group_id);

    const { data: logs, error } = await supabase
      .from('logs')
      .select(
        `
        *,
        users(username, avatar_url),
        groups(name),
        habits(name, category),
        likes(user_id),
        comments(id, text, user_id, created_at, users(username))
      `
      )
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error || !logs) return [];

    return logs.map(log => ({
      id: log.id,
      userId: log.user_id,
      username: log.users.username,
      avatarUrl: log.users.avatar_url,
      groupName: log.groups.name,
      groupId: log.group_id,
      habitName: log.habits.name,
      category: log.habits.category,
      imageUrl: log.image_url,
      date: log.date,
      timestamp: new Date(log.created_at).getTime(),
      likesCount: log.likes?.length || 0,
      commentsCount: log.comments?.length || 0,
      isLiked: log.likes?.some((l: any) => l.user_id === userId),
      commentsPreview: (log.comments || [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-2)
        .map((c: any) => ({
          username: c.users.username,
          text: c.text,
        })),
    }));
  }

  async getPostDetail(userId: string, logId: string): Promise<any | null> {
    const { data: log, error } = await supabase
      .from('logs')
      .select(
        `
        *,
        users(username, avatar_url),
        groups(name),
        habits(name, category),
        likes(user_id),
        comments(id, text, user_id, created_at, users(username))
      `
      )
      .eq('id', logId)
      .single();

    if (error || !log) return null;

    return {
      id: log.id,
      userId: log.user_id,
      username: log.users.username,
      avatarUrl: log.users.avatar_url,
      groupName: log.groups.name,
      groupId: log.group_id,
      habitName: log.habits.name,
      category: log.habits.category,
      imageUrl: log.image_url,
      date: log.date,
      timestamp: new Date(log.created_at).getTime(),
      likesCount: log.likes?.length || 0,
      commentsCount: log.comments?.length || 0,
      isLiked: log.likes?.some((l: any) => l.user_id === userId),
      commentsPreview: (log.comments || [])
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        .slice(-2)
        .map((c: any) => ({
          username: c.users.username,
          text: c.text,
        })),
    };
  }
}

export const backend = new Backend();
