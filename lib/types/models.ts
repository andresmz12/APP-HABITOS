export interface User {
  id: string;
  name: string;
  username: string;
  avatarColor: string;
  notificationEmail?: string | null;
  reminderTime: string; // "HH:mm"
  notificationsEnabled: boolean;
  pairCode?: string | null;
  coupleId?: string | null;
}

export type FrequencyType = 'daily' | 'custom';

export interface Habit {
  id: string;
  userId: string;
  name: string;
  icon: string;
  frequencyType: FrequencyType;
  frequencyDays: number; // 7 for daily, 1-6 for custom
  isArchived: boolean;
  sortOrder: number;
  reminderEnabled: boolean;
  reminderTime?: string; // "HH:mm"
  createdAt: Date | string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: Date | string;
  dateKey: string; // "2025-04-13"
  weekKey: string; // "2025-04-13" (Sunday of that week)
  pointsEarned: number;
  photoUrl?: string;
}

export interface WeeklyTask {
  id: string;
  userId: string;
  weekKey: string;
  dateKey: string;
  time?: string | null; // "HH:mm"
  endTime?: string | null; // "HH:mm"
  text: string;
  done: boolean;
  seriesId?: string | null;
  createdAt: Date | string;
  user?: { id: string; name: string; avatarColor: string };
}

export interface CoupleNote {
  id: string;
  coupleId: string;
  authorId: string;
  text: string;
  createdAt: Date | string;
  author?: { id: string; name: string; avatarColor: string };
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface CoupleSide {
  user: { id: string; name: string; avatarColor: string };
  habits: Habit[];
  habitsCount: number;
  todayCompletions: number;
  weekCompletions: HabitCompletion[];
  points: number;
  totalCompletions: number;
  streak: number;
}

export interface WeekTrendPoint {
  weekKey: string;
  myPoints: number;
  partnerPoints: number | null;
}

export interface CoupleSummary {
  me: CoupleSide;
  partner: CoupleSide | null;
  pairCode?: string | null;
  trend: WeekTrendPoint[];
}
