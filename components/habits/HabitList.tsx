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
        className="flex flex-col items-center justify-center py-14 gap-4"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl shadow-lg"
          style={{
            backgroundColor: partnerColor + '18',
            border: `1px solid ${partnerColor}30`,
            boxShadow: `0 8px 32px ${partnerColor}20`,
          }}
        >
          <Sparkles size={32} style={{ color: partnerColor }} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-white font-bold text-base">¡Sin hábitos todavía!</p>
          <p className="text-gray-500 text-sm leading-relaxed max-w-[220px] mx-auto">
            Toca el botón{' '}
            <span className="font-bold" style={{ color: partnerColor }}>+</span>{' '}
            para agregar tu primer hábito
          </p>
        </div>
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
