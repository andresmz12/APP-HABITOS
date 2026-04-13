import {
  collection,
  doc,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './config';
import { AppConfig, Habit, HabitCompletion, WeeklyStat } from '../types/models';

export const appConfigRef = (): DocumentReference<AppConfig> =>
  doc(db, 'config', 'app') as DocumentReference<AppConfig>;

export const habitsCol = (): CollectionReference<Habit> =>
  collection(db, 'habits') as CollectionReference<Habit>;

export const habitRef = (habitId: string): DocumentReference<Habit> =>
  doc(db, 'habits', habitId) as DocumentReference<Habit>;

export const completionsCol = (): CollectionReference<HabitCompletion> =>
  collection(db, 'completions') as CollectionReference<HabitCompletion>;

export const completionRef = (completionId: string): DocumentReference<HabitCompletion> =>
  doc(db, 'completions', completionId) as DocumentReference<HabitCompletion>;

export const weeklyStatsCol = (): CollectionReference<WeeklyStat> =>
  collection(db, 'weeklyStats') as CollectionReference<WeeklyStat>;

export const weeklyStatRef = (weekKey: string): DocumentReference<WeeklyStat> =>
  doc(db, 'weeklyStats', weekKey) as DocumentReference<WeeklyStat>;
