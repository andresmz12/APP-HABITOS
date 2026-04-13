'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useAppStore } from '@/lib/stores/appStore';
import { useHabits } from '@/lib/hooks/useHabits';
import { useTodayCompletions } from '@/lib/hooks/useCompletions';
import { useWeeklyStats } from '@/lib/hooks/useWeeklyStats';
import { getCurrentWeekKey } from '@/lib/utils/dates';
import { PARTNER_COLORS } from '@/lib/utils/constants';
import { PartnerHeader } from '@/components/dashboard/PartnerHeader';
import { HabitList } from '@/components/habits/HabitList';
import { HabitForm } from '@/components/habits/HabitForm';
import { Avatar } from '@/components/ui/Avatar';
import { Habit, PartnerId } from '@/lib/types/models';
import { BottomNav } from '@/components/ui/BottomNav';

export default function HomePage() {
  const { appConfig, activePartnerId, setActivePartner } = useAppStore();
  const [addOpen, setAddOpen] = useState(false);
  const [editHabit, setEditHabit] = useState<Habit | null>(null);

  const { habits, loading: habitsLoading } = useHabits(activePartnerId);
  const { completions } = useTodayCompletions(activePartnerId);
  const { stat } = useWeeklyStats(getCurrentWeekKey());

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const partner = appConfig[activePartnerId];
  const otherPartnerId: PartnerId = activePartnerId === 'partner1' ? 'partner2' : 'partner1';
  const otherPartner = appConfig[otherPartnerId];
  const weeklyPoints = stat?.[activePartnerId]?.totalPoints ?? 0;
  const partnerColor = partner.avatarColor;

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      {/* Header */}
      <div className="px-4 pt-12 pb-4 space-y-4">
        {/* Partner switcher row */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
              Viendo hábitos de
            </p>
            <h1 className="text-white text-xl font-bold mt-0.5">{partner.name}</h1>
          </div>
          {/* Switch to other partner */}
          <button
            onClick={() => setActivePartner(otherPartnerId)}
            className="flex items-center gap-2 bg-[#1A1A24] rounded-2xl px-3 py-2 hover:bg-[#22223A] transition-colors"
          >
            <Avatar
              emoji={otherPartner.avatarEmoji}
              color={otherPartner.avatarColor}
              name={otherPartner.name}
              size="sm"
            />
            <span className="text-gray-300 text-xs font-medium">{otherPartner.name}</span>
          </button>
        </div>

        {/* Today's summary card */}
        <PartnerHeader
          partner={partner}
          completedToday={completions.length}
          totalHabits={habits.length}
          weeklyPoints={weeklyPoints}
        />
      </div>

      {/* Habits */}
      <div className="px-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Hábitos de hoy
          </h2>
          <span className="text-xs text-gray-600">
            {completions.length}/{habits.length} completados
          </span>
        </div>

        <HabitList
          habits={habits}
          completions={completions}
          onEdit={(h) => setEditHabit(h)}
          loading={habitsLoading}
          partnerColor={partnerColor}
        />
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setAddOpen(true)}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-20"
        style={{ backgroundColor: PARTNER_COLORS[activePartnerId].primary }}
      >
        <Plus size={26} color="white" strokeWidth={2.5} />
      </motion.button>

      {/* Add habit modal */}
      <HabitForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        partnerId={activePartnerId}
      />

      {/* Edit habit modal */}
      <HabitForm
        open={!!editHabit}
        onClose={() => setEditHabit(null)}
        partnerId={activePartnerId}
        editHabit={editHabit ?? undefined}
      />

      <BottomNav />
    </div>
  );
}
