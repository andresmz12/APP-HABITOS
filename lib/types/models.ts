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
  partner1NotificationEmail?: string;
  partner2NotificationEmail?: string;
  notificationTimes: string; // comma-separated "HH:mm,HH:mm"
  createdAt: Date | string;
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
  createdAt: Date | string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  partnerId: PartnerId;
  completedAt: Date | string;
  dateKey: string; // "2025-04-13"
  weekKey: string; // "2025-W15"
  pointsEarned: number;
  photoUrl?: string;
}

export interface PartnerWeeklyStat {
  totalPoints: number;
  totalCompletions: number;
}

export interface WeeklyStat {
  weekKey: string;
  weekStart: Date | string;
  partner1: PartnerWeeklyStat;
  partner2: PartnerWeeklyStat;
  finalizedAt?: Date | string;
}
