import { Timestamp } from 'firebase/firestore';

export type PartnerId = 'partner1' | 'partner2';

export interface Partner {
  id: PartnerId;
  name: string;
  avatarColor: string;
  avatarEmoji: string;
  notificationTime: string; // "HH:mm"
  notificationsEnabled: boolean;
  fcmToken?: string;
}

export interface AppConfig {
  coupleId: string;
  isOnboardingComplete: boolean;
  currentWeekKey: string;
  partner1: Partner;
  partner2: Partner;
  createdAt: Timestamp;
}

export type FrequencyType = 'daily' | 'custom';

export interface Habit {
  id: string;
  partnerId: PartnerId;
  name: string;
  icon: string;
  frequencyType: FrequencyType;
  frequencyDays: number; // 7 for daily, 1-6 for custom
  isArchived: boolean;
  sortOrder: number;
  createdAt: Timestamp;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  partnerId: PartnerId;
  completedAt: Timestamp;
  dateKey: string; // "2025-04-13"
  weekKey: string; // "2025-W15"
  pointsEarned: number;
}

export interface PartnerWeeklyStat {
  totalPoints: number;
  totalCompletions: number;
}

export interface WeeklyStat {
  weekKey: string;
  weekStart: Timestamp;
  partner1: PartnerWeeklyStat;
  partner2: PartnerWeeklyStat;
  finalizedAt?: Timestamp;
}
