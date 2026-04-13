'use client';

import { useAppStore } from '@/lib/stores/appStore';
import { useHabits } from '@/lib/hooks/useHabits';
import { useTodayCompletions, useWeekCompletions } from '@/lib/hooks/useCompletions';
import { useWeeklyStats } from '@/lib/hooks/useWeeklyStats';
import { getCurrentWeekKey, formatWeekRange } from '@/lib/utils/dates';
import { CoupleScoreboard } from '@/components/dashboard/CoupleScoreboard';
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Calendar } from 'lucide-react';

export default function TogetherPage() {
  const { appConfig } = useAppStore();
  const weekKey = getCurrentWeekKey();
  const { stat, loading: statLoading } = useWeeklyStats(weekKey);

  const { habits: p1Habits } = useHabits('partner1');
  const { habits: p2Habits } = useHabits('partner2');
  const { completions: p1Today } = useTodayCompletions('partner1');
  const { completions: p2Today } = useTodayCompletions('partner2');
  const { completions: p1Week } = useWeekCompletions('partner1', weekKey);
  const { completions: p2Week } = useWeekCompletions('partner2', weekKey);

  if (!appConfig) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      <div className="px-4 pt-12 pb-4 space-y-4">
        {/* Header */}
        <div>
          <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">
            Esta semana
          </p>
          <h1 className="text-white text-xl font-bold mt-0.5">
            Juntos
          </h1>
          <div className="flex items-center gap-1.5 mt-1">
            <Calendar size={12} className="text-gray-600" />
            <p className="text-gray-600 text-xs">{formatWeekRange(weekKey)}</p>
          </div>
        </div>

        {/* Scoreboard */}
        {statLoading ? (
          <div className="h-64 bg-[#1A1A24] rounded-2xl animate-pulse" />
        ) : (
          <CoupleScoreboard
            appConfig={appConfig}
            weeklyStat={stat}
            p1Habits={p1Habits.length}
            p2Habits={p2Habits.length}
            p1Today={p1Today.length}
            p2Today={p2Today.length}
          />
        )}

        {/* Weekly calendar per partner */}
        <Card className="space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Días completados
          </p>

          {[
            { partner: appConfig.partner1, habits: p1Habits, completions: p1Week },
            { partner: appConfig.partner2, habits: p2Habits, completions: p2Week },
          ].map(({ partner, habits, completions }) => (
            <div key={partner.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{partner.avatarEmoji}</span>
                <span className="text-sm text-gray-300 font-medium">{partner.name}</span>
              </div>
              <WeeklyCalendar
                weekKey={weekKey}
                habits={habits}
                completions={completions}
                color={partner.avatarColor}
              />
            </div>
          ))}
        </Card>
      </div>

      <BottomNav />
    </div>
  );
}
