'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useSession } from '@/lib/hooks/useSession';
import { useHabits } from '@/lib/hooks/useHabits';
import { useTodayCompletions } from '@/lib/hooks/useCompletions';
import { PartnerHeader } from '@/components/dashboard/PartnerHeader';
import { HabitList } from '@/components/habits/HabitList';
import { HabitForm } from '@/components/habits/HabitForm';
import { Habit } from '@/lib/types/models';
import { BottomNav } from '@/components/ui/BottomNav';

export default function HomePage() {
  const router = useRouter();
  const { user, loading: sessionLoading } = useSession();
  const [addOpen, setAddOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const { habits, loading: habitsLoading, weeklyLimitReached, streak, weeklyPoints } = useHabits();
  const { completions } = useTodayCompletions();

  useEffect(() => {
    if (!sessionLoading && !user) router.replace('/onboarding');
  }, [sessionLoading, user, router]);

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const accentColor = user.avatarColor;

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      {/* Header */}
      <div
        className="px-4 pt-12 pb-5"
        style={{
          background: `radial-gradient(ellipse 100% 180px at 50% 0%, ${accentColor}1a 0%, transparent 100%)`,
        }}
      >
        <div className="mb-4">
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest">
            Hábitos de
          </p>
          <h1 className="text-white text-2xl font-black mt-0.5 leading-none">
            {user.name}
          </h1>
        </div>

        {/* Stats card */}
        <PartnerHeader
          user={user}
          completedToday={completions.length}
          totalHabits={habits.length}
          weeklyPoints={weeklyPoints}
          streak={streak}
        />
      </div>

      {/* Habits section */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Hábitos de hoy
          </h2>
          {habits.length > 0 && (
            <span className="text-xs text-gray-600 tabular-nums">
              {completions.length}/{habits.length}
            </span>
          )}
        </div>

        <HabitList
          habits={habits}
          completions={completions}
          onEdit={(h) => setEditHabit(h)}
          loading={habitsLoading}
          partnerColor={accentColor}
        />
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setAddOpen(true)}
        whileTap={{ scale: 0.88 }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-20"
        style={{
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
          boxShadow: `0 8px 24px ${accentColor}55`,
        }}
      >
        <Plus size={26} color="white" strokeWidth={2.5} />
      </motion.button>

      {/* Add habit modal */}
      <HabitForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        weeklyLimitReached={weeklyLimitReached}
      />

      {/* Edit habit modal — key forces remount when editing a different habit */}
      <HabitForm
        key={editHabit?.id ?? 'edit'}
        open={!!editHabit}
        onClose={() => setEditHabit(null)}
        editHabit={editHabit ?? undefined}
        weeklyLimitReached={weeklyLimitReached}
      />

      <BottomNav />
    </div>
  );
}
