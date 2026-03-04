import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Group, GroupMember, Habit, DailyLog, Category } from '../types';

const generateId = () => Math.random().toString(36).substr(2, 9);
const generateCode = () => Math.random().toString(36).substr(2, 6).toUpperCase();

class Backend {
  async get<T>(key: string): Promise<T[]> {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async save(key: string, data: any): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }

  async signup(username: string, email: string, password?: string): Promise<User> {
    const users = await this.get<User>('users');
    if (users.find(u => u.email === email)) throw new Error('User already exists');
    const newUser: User = { id: generateId(), username, email, password };
    await this.save('users', [...users, newUser]);
    return newUser;
  }

  async login(email: string, password?: string): Promise<User> {
    const users = await this.get<User>('users');
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Invalid credentials');
    return user;
  }

  async createGroup(name: string, userId: string): Promise<Group> {
    const groups = await this.get<Group>('groups');
    const newGroup: Group = { id: generateId(), name, code: generateCode(), createdBy: userId };
    await this.save('groups', [...groups, newGroup]);

    // add user to group
    await this.joinGroup(newGroup.code, userId);
    return newGroup;
  }

  async joinGroup(code: string, userId: string): Promise<Group> {
    const groups = await this.get<Group>('groups');
    const group = groups.find(g => g.code === code);
    if (!group) throw new Error('Group not found');

    const members = await this.get<GroupMember>('members');
    if (!members.find(m => m.groupId === group.id && m.userId === userId)) {
      await this.save('members', [...members, { userId, groupId: group.id }]);
    }
    return group;
  }

  async getUserGroup(userId: string): Promise<Group | null> {
    const members = await this.get<GroupMember>('members');
    const memberRec = members.find(m => m.userId === userId);
    if (!memberRec) return null;
    const groups = await this.get<Group>('groups');
    return groups.find(g => g.id === memberRec.groupId) || null;
  }

  async getHabits(userId: string): Promise<Habit[]> {
    const habits = await this.get<Habit>('habits');
    return habits.filter(h => h.userId === userId);
  }

  async saveHabits(userId: string, habitsPayload: { category: Category; name: string }[]): Promise<Habit[]> {
    let habits = await this.get<Habit>('habits');
    // Remove old for this user, then save new
    habits = habits.filter(h => h.userId !== userId);
    const newHabits: Habit[] = habitsPayload.map(h => ({
      id: generateId(),
      userId,
      category: h.category,
      name: h.name,
    }));
    await this.save('habits', [...habits, ...newHabits]);
    return newHabits;
  }

  async getTodayLog(userId: string): Promise<DailyLog> {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const logs = await this.get<DailyLog>('logs');
    let log = logs.find(l => l.userId === userId && l.date === date);
    if (!log) {
      log = { id: generateId(), userId, date, completedHabitIds: [], totalPoints: 0 };
    }
    return log;
  }

  async toggleHabitCompletion(userId: string, habitId: string): Promise<DailyLog> {
    const date = new Date().toISOString().split('T')[0];
    const logs = await this.get<DailyLog>('logs');
    let logIndex = logs.findIndex(l => l.userId === userId && l.date === date);
    let log: DailyLog;

    if (logIndex === -1) {
      log = { id: generateId(), userId, date, completedHabitIds: [], totalPoints: 0 };
      logs.push(log);
      logIndex = logs.length - 1;
    } else {
      log = logs[logIndex];
    }

    const isCompleted = log.completedHabitIds.includes(habitId);
    if (isCompleted) {
      log.completedHabitIds = log.completedHabitIds.filter(id => id !== habitId);
      log.totalPoints -= 10;
    } else {
      log.completedHabitIds.push(habitId);
      log.totalPoints += 10;
    }

    logs[logIndex] = log;
    await this.save('logs', logs);
    return log;
  }

  async getLeaderboard(groupId: string): Promise<{ rank: number; username: string; totalPoints: number }[]> {
    const members = await this.get<GroupMember>('members');
    const groupUserIds = members.filter(m => m.groupId === groupId).map(m => m.userId);

    const logs = await this.get<DailyLog>('logs');
    const users = await this.get<User>('users');

    const boardMap: Record<string, number> = {};
    for (const uid of groupUserIds) boardMap[uid] = 0;

    for (const log of logs) {
      if (groupUserIds.includes(log.userId)) {
        boardMap[log.userId] += log.totalPoints;
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
      username: item.username,
      totalPoints: item.totalPoints,
    }));
  }
}

export const mockBackend = new Backend();
