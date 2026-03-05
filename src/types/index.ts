export type Category = 'Health' | 'Finance' | 'Work' | 'Upskill' | 'Social';

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
}

export interface GroupSettings {
  allowedCategories: Category[];
  habitsPerCategory: Partial<Record<Category, number>>;
}

export interface Group {
  id: string;
  name: string;
  code: string;
  createdBy: string; // userId
  settings?: GroupSettings;
}

export interface GroupMember {
  userId: string;
  groupId: string;
}

export interface Habit {
  id: string;
  userId: string;
  category: Category;
  name: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completedHabitIds: string[];
  totalPoints: number;
}
