'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowLeftRight } from 'lucide-react';
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
      {/* Header with partner color tint */}
      <div
        className="px-4 pt-12 pb-5"
        style={{
          background: `radial-gradient(ellipse 100% 180px at 50% 0%, ${partnerColor}1a 0%, transparent 100%)`,
        }}
      >
        {/* Partner switcher row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest">
              Hábitos de
            </p>
            <h1 className="text-white text-2xl font-black mt-0.5 leading-none">
              {partner.name}
            </h1>
          </div>

          {/* Switch partner button */}
          <button
            onClick={() => setActivePartner(otherPartnerId)}
            className="flex items-center gap-2 rounded-2xl px-3 py-2 active:scale-95 transition-transform border border-white/8"
            style={{ backgroundColor: `${partnerColor}15` }}
          >
            <Avatar
              emoji={otherPartner.avatarEmoji}
              color={otherPartner.avatarColor}
              name={otherPartner.name}
              size="sm"
            />
            <span className="text-gray-300 text-xs font-medium max-w-[64px] truncate">
              {otherPartner.name}
            </span>
            <ArrowLeftRight size={11} className="text-gray-500" />
          </button>
        </div>

        {/* Stats card */}
        <PartnerHeader
          partner={partner}
          completedToday={completions.length}
          totalHabits={habits.length}
          weeklyPoints={weeklyPoints}
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
          partnerColor={partnerColor}
        />
      </div>

      {/* FAB */}
      <motion.button
        onClick={() => setAddOpen(true)}
        whileTap={{ scale: 0.88 }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl z-20"
        style={{
          background: `linear-gradient(135deg, ${partnerColor}, ${partnerColor}bb)`,
          boxShadow: `0 8px 24px ${partnerColor}55`,
        }}
      >
        <Plus size={26} color="white" strokeWidth={2.5} />
      </motion.button>

      {/* Add habit modal */}
      <HabitForm
        open={addOpen}
        onClose={() => setAddOpen(false)}
        partnerId={activePartnerId}
      />

      {/* Edit habit modal — key forces remount when editing a different habit */}
      <HabitForm
        key={editHabit?.id ?? 'edit'}
        open={!!editHabit}
        onClose={() => setEditHabit(null)}
        partnerId={activePartnerId}
        editHabit={editHabit ?? undefined}
      />

      <BottomNav />
    </div>
  );
}
