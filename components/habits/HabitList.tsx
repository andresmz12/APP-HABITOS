'use client';

import { motion } from 'framer-motion';
import { Habit, HabitCompletion } from '@/lib/types/models';
import { HabitCard } from './HabitCard';
import { Sparkles } from 'lucide-react';

interface HabitListProps {
  habits: Habit[];
  completions: HabitCompletion[];
  onEdit?: (habit: Habit) => void;
  loading?: boolean;
  partnerColor: string;
}

export function HabitList({ habits, completions, onEdit, loading, partnerColor }: HabitListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[68px] bg-[#1A1A24] rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (habits.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 gap-3"
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
          style={{ backgroundColor: partnerColor + '22' }}
        >
          <Sparkles size={28} style={{ color: partnerColor }} />
        </div>
        <p className="text-gray-400 text-sm font-medium">No tienes hábitos aún</p>
        <p className="text-gray-600 text-xs text-center">
          Toca el botón + para agregar tu primer hábito
        </p>
      </motion.div>
    );
  }

  const completionMap = new Map<string, HabitCompletion>(
    completions.map((c) => [c.habitId, c])
  );

  return (
    <motion.div
      className="space-y-2"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {habits.map((habit) => (
        <motion.div
          key={habit.id}
          variants={{
            hidden: { opacity: 0, y: 8 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <HabitCard
            habit={habit}
            completion={completionMap.get(habit.id) ?? null}
            onEdit={onEdit ? () => onEdit(habit) : undefined}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
