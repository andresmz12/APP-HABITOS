import {
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { completionsCol, completionRef, weeklyStatRef } from './firestore';
import { Habit, HabitCompletion, PartnerId } from '../types/models';
import { getDayKey, getISOWeekKey } from '../utils/dates';
import { updateWeeklyStatPoints } from './weeklyStats';

export function subscribeToTodayCompletions(
  partnerId: PartnerId,
  callback: (completions: HabitCompletion[]) => void
): () => void {
  const dateKey = getDayKey(new Date());
  const q = query(
    completionsCol(),
    where('partnerId', '==', partnerId),
    where('dateKey', '==', dateKey)
  );

  return onSnapshot(q, (snap) => {
    const completions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as HabitCompletion));
    callback(completions);
  });
}

export function subscribeToWeekCompletions(
  partnerId: PartnerId,
  weekKey: string,
  callback: (completions: HabitCompletion[]) => void
): () => void {
  const q = query(
    completionsCol(),
    where('partnerId', '==', partnerId),
    where('weekKey', '==', weekKey)
  );

  return onSnapshot(q, (snap) => {
    const completions = snap.docs.map((d) => ({ ...d.data(), id: d.id } as HabitCompletion));
    callback(completions);
  });
}

export async function toggleCompletion(
  habit: Habit,
  existingCompletion: HabitCompletion | null
): Promise<void> {
  if (existingCompletion) {
    await deleteDoc(completionRef(existingCompletion.id));
    await updateWeeklyStatPoints(habit.partnerId, -1, habit.id);
  } else {
    const dateKey = getDayKey(new Date());
    const weekKey = getISOWeekKey(new Date());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await addDoc(completionsCol(), {
      habitId: habit.id,
      partnerId: habit.partnerId,
      completedAt: serverTimestamp(),
      dateKey,
      weekKey,
      pointsEarned: 1,
    } as any);
    await updateWeeklyStatPoints(habit.partnerId, 1, habit.id);
  }
}

// Unused weeklyStatRef import guard
void weeklyStatRef;
