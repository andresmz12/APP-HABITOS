'use client';

import { useState } from 'react';
import { useSession } from '@/lib/hooks/useSession';
import { useCoupleSummary } from '@/lib/hooks/useCoupleSummary';
import { getCurrentWeekKey, formatWeekRange, getPrevWeekKey, getNextWeekKey } from '@/lib/utils/dates';
import { CoupleScoreboard } from '@/components/dashboard/CoupleScoreboard';
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar';
import { SharedCalendarPlanner } from '@/components/dashboard/SharedCalendarPlanner';
import { BottomNav } from '@/components/ui/BottomNav';
import { Card } from '@/components/ui/Card';
import { Calendar, Heart, ChevronLeft, ChevronRight, Copy, Check } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export default function TogetherPage() {
  const { user, loading: sessionLoading } = useSession();
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey());
  const isCurrentWeek = weekKey === getCurrentWeekKey();
  const { summary, loading: summaryLoading } = useCoupleSummary(weekKey);
  const [copied, setCopied] = useState(false);

  if (sessionLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0F0F14] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  function handleCopy() {
    if (!user?.pairCode) return;
    navigator.clipboard?.writeText(user.pairCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  // Not paired yet — show the code to share
  if (!user.coupleId) {
    return (
      <div className="min-h-screen bg-[#0F0F14] pb-24 flex flex-col items-center justify-center px-6 gap-6 text-center">
        <Heart size={40} className="text-pink-400" fill="currentColor" />
        <div>
          <h1 className="text-white text-xl font-black mb-1.5">Aún no tienes pareja vinculada</h1>
          <p className="text-gray-500 text-sm">Comparte este código para que se una a tu cuenta</p>
        </div>
        <button
          onClick={handleCopy}
          className="w-full max-w-xs flex items-center justify-center gap-3 py-6 rounded-2xl bg-[#1A1A24] border border-violet-500/30"
        >
          <span className="text-3xl font-black text-white tracking-[0.3em]">{user.pairCode}</span>
          {copied ? <Check size={20} className="text-green-400" /> : <Copy size={18} className="text-gray-500" />}
        </button>
        <BottomNav />
      </div>
    );
  }

  const me = summary?.me;
  const partner = summary?.partner;

  return (
    <div className="min-h-screen bg-[#0F0F14] pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header with dual-partner gradient */}
        <div
          className="px-4 pt-12 pb-5"
          style={{
            background: `radial-gradient(ellipse 140% 160px at 20% 0%, ${user.avatarColor}18 0%, transparent 60%),
                         radial-gradient(ellipse 140% 160px at 80% 0%, ${partner?.user.avatarColor ?? user.avatarColor}18 0%, transparent 60%)`,
          }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Avatar color={user.avatarColor} name={user.name} size="md" />
            <Heart size={16} className="text-pink-400" fill="currentColor" />
            {partner && <Avatar color={partner.user.avatarColor} name={partner.user.name} size="md" />}
          </div>

          <div className="text-center">
            <h1 className="text-white text-2xl font-black leading-none">
              {user.name} {partner && <>&amp; {partner.user.name}</>}
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
          {summaryLoading || !me || !partner ? (
            <div className="h-64 bg-[#1A1A24] rounded-2xl animate-pulse" />
          ) : (
            <CoupleScoreboard me={me} partner={partner} />
          )}

          {/* Weekly calendar per person */}
          {me && (
            <Card className="space-y-5">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Días completados
              </p>

              {[me, ...(partner ? [partner] : [])].map((side) => (
                <div key={side.user.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Avatar color={side.user.avatarColor} name={side.user.name} size="sm" />
                    <span className="text-sm text-gray-300 font-semibold">{side.user.name}</span>
                    <span className="text-xs text-gray-600 ml-auto">
                      {side.weekCompletions.length} completaciones
                    </span>
                  </div>
                  <WeeklyCalendar
                    weekKey={weekKey}
                    habits={side.habits}
                    completions={side.weekCompletions}
                    color={side.user.avatarColor}
                  />
                </div>
              ))}
            </Card>
          )}

          {/* Combined plan calendar with per-person filter */}
          {me && (
            <Card className="space-y-4 !bg-[#121218] !rounded-3xl border border-white/[0.04]">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Calendario de la pareja
                </p>
                <p className="text-gray-600 text-xs mt-0.5">
                  Vean lo que cada uno tiene, juntos o por separado
                </p>
              </div>
              <SharedCalendarPlanner
                viewerId={user.id}
                mode="couple"
                participants={[
                  { id: user.id, name: user.name, avatarColor: user.avatarColor },
                  ...(partner ? [{ id: partner.user.id, name: partner.user.name, avatarColor: partner.user.avatarColor }] : []),
                ]}
              />
            </Card>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
