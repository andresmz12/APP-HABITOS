import {
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp,
  onSnapshot,
} from 'firebase/firestore';
import { habitsCol, habitRef } from './firestore';
import { Habit, PartnerId } from '../types/models';

export function subscribeToHabits(
  partnerId: PartnerId,
  callback: (habits: Habit[]) => void,
  onError?: (err: Error) => void
): () => void {
  const q = query(
    habitsCol(),
    where('partnerId', '==', partnerId),
    where('isArchived', '==', false),
    orderBy('sortOrder', 'asc')
  );

  return onSnapshot(
    q,
    (snap) => {
      const habits = snap.docs.map((d) => ({ ...d.data(), id: d.id } as Habit));
      callback(habits);
    },
    onError
  );
}

export async function createHabit(
  partnerId: PartnerId,
  data: Omit<Habit, 'id' | 'createdAt' | 'sortOrder' | 'isArchived' | 'partnerId'>
): Promise<string> {
  const existing = await getDocs(query(habitsCol(), where('partnerId', '==', partnerId)));
  const sortOrder = existing.size;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = await addDoc(habitsCol(), {
    ...data,
    partnerId,
    isArchived: false,
    sortOrder,
    createdAt: serverTimestamp(),
  } as any);
  return ref.id;
}

export async function updateHabit(
  habitId: string,
  data: Partial<Pick<Habit, 'name' | 'icon' | 'frequencyType' | 'frequencyDays'>>
): Promise<void> {
  await updateDoc(habitRef(habitId), data);
}

export async function deleteHabit(habitId: string): Promise<void> {
  await updateDoc(habitRef(habitId), { isArchived: true });
}
