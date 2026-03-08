export type Category = string;

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  avatarUrl?: string;
}

export interface GroupSettings {
  allowedCategories: Category[];
  habitsPerCategory: Partial<Record<Category, number>>;
  pointsPerCategory: Partial<Record<Category, number>>;
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
  groupId: string; // which group this habit belongs to
  category: Category;
  name: string;
}

export interface DailyLog {
  id: string;
  userId: string;
  groupId: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  imageUrl?: string;
  caption?: string;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
  suspectsCount?: number;
  isSuspected?: boolean;
  isDisqualified?: boolean;
}

export interface Like {
  id: string;
  userId: string;
  logId: string;
  createdAt: string;
}

export interface HabitComment {
  id: string;
  userId: string;
  username?: string;
  avatarUrl?: string;
  logId: string;
  text: string;
  createdAt: string;
}
