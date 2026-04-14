'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import { Habit, HabitCompletion } from '@/lib/types/models';
import { toggleCompletion } from '@/lib/firebase/completions';
import { cn } from '@/lib/utils/cn';
import { PARTNER_COLORS } from '@/lib/utils/constants';
import { PhotoModal } from './PhotoModal';

interface HabitCardProps {
  habit: Habit;
  completion: HabitCompletion | null;
  onEdit?: () => void;
}

export function HabitCard({ habit, completion, onEdit }: HabitCardProps) {
  const [loading, setLoading] = useState(false);
  const [optimisticCompleted, setOptimisticCompleted] = useState<boolean | null>(null);
  const [showPoints, setShowPoints] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const isCompleted = optimisticCompleted !== null ? optimisticCompleted : !!completion;
  const color = PARTNER_COLORS[habit.partnerId].primary;

  async function handleToggle() {
    if (loading) return;

    // Un-completing: no photo needed
    if (isCompleted) {
      setOptimisticCompleted(false);
      setLoading(true);
      try {
        await toggleCompletion(habit, completion);
        setOptimisticCompleted(null);
      } catch {
        setOptimisticCompleted(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Completing: require photo
    setShowPhotoModal(true);
  }

  async function handlePhotoConfirm(photoUrl: string) {
    setShowPhotoModal(false);
    setOptimisticCompleted(true);
    setShowPoints(true);
    setTimeout(() => setShowPoints(false), 1500);
    setLoading(true);
    try {
      await toggleCompletion(habit, completion, photoUrl);
      setOptimisticCompleted(null);
    } catch {
      setOptimisticCompleted(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <motion.div
        layout
        className={cn(
          'flex items-center gap-3 p-4 rounded-2xl border transition-colors duration-200',
          isCompleted ? 'bg-[#1e1e2a] border-white/5' : 'bg-[#1A1A24] border-transparent'
        )}
      >
        {/* Emoji icon or photo thumbnail */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 overflow-hidden transition-colors duration-200"
          style={{ backgroundColor: isCompleted ? color + '22' : 'rgba(255,255,255,0.05)' }}
        >
          {isCompleted && completion?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={completion.photoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            habit.icon
          )}
        </div>

        {/* Name + frequency */}
        <div className="flex-1 min-w-0">
          <p className={cn(
            'font-semibold text-sm truncate transition-all duration-200',
            isCompleted ? 'line-through opacity-40 text-gray-300' : 'text-white'
          )}>
            {habit.name}
          </p>
          <p className="text-[11px] text-gray-600 mt-0.5">
            {habit.frequencyType === 'daily' ? 'Todos los días' : `${habit.frequencyDays} días/semana`}
          </p>
        </div>

        {/* Edit button */}
        {onEdit && (
          <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg bg-[#22223A] flex items-center justify-center text-gray-600 hover:text-gray-300 transition-colors flex-shrink-0"
          >
            <Pencil size={11} />
          </button>
        )}

        {/* Check button with +1 float */}
        <div className="relative flex-shrink-0">
          <AnimatePresence>
            {showPoints && (
              <motion.span
                key="points"
                className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold pointer-events-none"
                style={{ color }}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -14 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9 }}
              >
                +1
              </motion.span>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleToggle}
            disabled={loading}
            whileTap={{ scale: 0.82 }}
            className={cn(
              'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-200',
              isCompleted ? 'border-transparent' : 'border-[#3a3a5a] hover:border-[#5a5a7a]'
            )}
            style={isCompleted ? { backgroundColor: color, borderColor: color, boxShadow: `0 0 12px ${color}55` } : {}}
          >
            <AnimatePresence mode="wait">
              {isCompleted && (
                <motion.div
                  key="check"
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  <Check size={16} color="white" strokeWidth={3} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </motion.div>

      {showPhotoModal && (
        <PhotoModal
          habitName={habit.name}
          color={color}
          onConfirm={handlePhotoConfirm}
          onCancel={() => setShowPhotoModal(false)}
        />
      )}
    </>
  );
}
