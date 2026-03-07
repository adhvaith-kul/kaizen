export type Category = string;

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
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
  groupId: string; // which group's log this is
  date: string; // YYYY-MM-DD
  completedHabitIds: string[];
  habitImageUrls: Record<string, string>;
}
