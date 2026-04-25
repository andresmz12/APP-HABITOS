'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/stores/appStore';
import { useHabits } from '@/lib/hooks/useHabits';
import { useTodayCompletions, useWeekCompletions } from '@/lib/hooks/useCompletions';
import { useWeeklyStats } from '@/lib/hooks/useWeeklyStats';
import { getCurrentWeekKey, formatWeekRange, getPrevWeekKey, getNextWeekKey } from '@/lib/utils/dates';
import { CoupleScoreboard } from '@/components/dashboard/CoupleScoreboard';
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Calendar, Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export default function TogetherPage() {
  const { appConfig } = useAppStore();
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey());
  const isCurrentWeek = weekKey === getCurrentWeekKey();
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

  const p1 = appConfig.partner1;
  const p2 = appConfig.partner2;

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      {/* Header with dual-partner gradient */}
      <div
        className="px-4 pt-12 pb-5"
        style={{
          background: `radial-gradient(ellipse 140% 160px at 20% 0%, ${p1.avatarColor}18 0%, transparent 60%),
                       radial-gradient(ellipse 140% 160px at 80% 0%, ${p2.avatarColor}18 0%, transparent 60%)`,
        }}
      >
        {/* Both partners with heart */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <Avatar emoji={p1.avatarEmoji} color={p1.avatarColor} name={p1.name} size="md" />
          <Heart size={16} className="text-pink-400" fill="currentColor" />
          <Avatar emoji={p2.avatarEmoji} color={p2.avatarColor} name={p2.name} size="md" />
        </div>

        <div className="text-center">
          <h1 className="text-white text-2xl font-black leading-none">
            {p1.name} &amp; {p2.name}
          </h1>
          <div className="flex items-center justify-center gap-2 mt-1.5">
            <button
              onClick={() => setWeekKey(getPrevWeekKey(weekKey))}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex items-center gap-1.5">
              <Calendar size={11} className="text-gray-600" />
              <p className="text-gray-400 text-xs font-medium min-w-[120px] text-center">
                {formatWeekRange(weekKey)}
                {isCurrentWeek && <span className="ml-1.5 text-violet-400">·&nbsp;esta semana</span>}
              </p>
            </div>
            <button
              onClick={() => !isCurrentWeek && setWeekKey(getNextWeekKey(weekKey))}
              disabled={isCurrentWeek}
              className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-90 disabled:opacity-25 disabled:pointer-events-none"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
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
        <Card className="space-y-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            Días completados
          </p>

          {[
            { partner: p1, habits: p1Habits, completions: p1Week },
            { partner: p2, habits: p2Habits, completions: p2Week },
          ].map(({ partner, habits, completions }) => (
            <div key={partner.id} className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                  style={{ backgroundColor: partner.avatarColor + '25', border: `1px solid ${partner.avatarColor}50` }}
                >
                  {partner.avatarEmoji}
                </div>
                <span className="text-sm text-gray-300 font-semibold">{partner.name}</span>
                <span className="text-xs text-gray-600 ml-auto">
                  {completions.length} completaciones
                </span>
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
