'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import { Habit, HabitCompletion } from '@/lib/types/models';
import { toggleCompletion } from '@/lib/firebase/completions';
import { cn } from '@/lib/utils/cn';
import { PARTNER_COLORS } from '@/lib/utils/constants';

interface HabitCardProps {
  habit: Habit;
  completion: HabitCompletion | null;
  onEdit?: () => void;
}

export function HabitCard({ habit, completion, onEdit }: HabitCardProps) {
  const [loading, setLoading] = useState(false);
  const [showPoints, setShowPoints] = useState(false);
  const isCompleted = !!completion;
  const color = PARTNER_COLORS[habit.partnerId].primary;

  async function handleToggle() {
    if (loading) return;
    setLoading(true);
    try {
      await toggleCompletion(habit, completion);
      if (!isCompleted) {
        setShowPoints(true);
        setTimeout(() => setShowPoints(false), 1500);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      layout
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl transition-colors',
        isCompleted ? 'bg-[#1e1e2a]' : 'bg-[#1A1A24]'
      )}
    >
      {/* Emoji icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ backgroundColor: isCompleted ? color + '22' : 'rgba(255,255,255,0.05)' }}
      >
        {habit.icon}
      </div>

      {/* Name + frequency */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'font-medium text-sm truncate',
            isCompleted ? 'line-through opacity-50' : 'text-white'
          )}
        >
          {habit.name}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          {habit.frequencyType === 'daily'
            ? 'Todos los días'
            : `${habit.frequencyDays} días/semana`}
        </p>
      </div>

      {/* Edit button */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="w-7 h-7 rounded-lg bg-[#22223A] flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
        >
          <Pencil size={12} />
        </button>
      )}

      {/* Check button */}
      <div className="relative flex-shrink-0">
        <AnimatePresence>
          {showPoints && (
            <motion.span
              key="points"
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold"
              style={{ color }}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -16 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
            >
              +1
            </motion.span>
          )}
        </AnimatePresence>
        <motion.button
          onClick={handleToggle}
          disabled={loading}
          whileTap={{ scale: 0.85 }}
          className={cn(
            'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200',
            isCompleted
              ? 'border-transparent'
              : 'border-[#3a3a5a] hover:border-gray-400'
          )}
          style={
            isCompleted
              ? { backgroundColor: color, borderColor: color }
              : {}
          }
        >
          {isCompleted && <Check size={16} color="white" strokeWidth={3} />}
        </motion.button>
      </div>
    </motion.div>
  );
}
