'use client';

import { motion } from 'framer-motion';
import { CoupleSide } from '@/lib/types/models';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Avatar } from '@/components/ui/Avatar';
import { Flame } from 'lucide-react';

interface CoupleScoreboardProps {
  me: CoupleSide;
  partner: CoupleSide;
}

export function CoupleScoreboard({ me, partner }: CoupleScoreboardProps) {
  const mePct = me.habitsCount > 0 ? (me.todayCompletions / me.habitsCount) * 100 : 0;
  const partnerPct = partner.habitsCount > 0 ? (partner.todayCompletions / partner.habitsCount) * 100 : 0;
  const maxPoints = Math.max(me.points, partner.points, 1);

  const isMeLeading = me.points > partner.points;
  const isPartnerLeading = partner.points > me.points;
  const isTied = me.points === partner.points;
  const leader = isMeLeading ? me : isPartnerLeading ? partner : null;
  const noPointsYet = me.points === 0 && partner.points === 0;

  const sides = [
    { side: me, pct: mePct, isLeading: isMeLeading },
    { side: partner, pct: partnerPct, isLeading: isPartnerLeading },
  ];

  return (
    <div className="space-y-3">
      {/* Winner banner */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl px-5 py-3.5 flex items-center justify-center gap-2.5"
        style={
          leader
            ? {
                background: `linear-gradient(135deg, ${leader.user.avatarColor}28 0%, ${leader.user.avatarColor}12 100%)`,
                border: `1px solid ${leader.user.avatarColor}40`,
              }
            : { background: '#1A1A24', border: '1px solid rgba(255,255,255,0.06)' }
        }
      >
        {noPointsYet ? (
          <p className="text-gray-500 text-sm">Nadie tiene puntos aún esta semana</p>
        ) : isTied ? (
          <>
            <span className="text-xl">🤝</span>
            <p className="text-white font-bold text-sm">¡Empate! Los dos van igual</p>
          </>
        ) : (
          <>
            <span className="text-xl">👑</span>
            <p className="text-white font-semibold text-sm">
              <span className="font-black" style={{ color: leader!.user.avatarColor }}>
                {leader!.user.name}
              </span>{' '}
              va ganando esta semana
            </p>
          </>
        )}
      </motion.div>

      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        {sides.map(({ side, pct, isLeading }) => (
          <motion.div
            key={side.user.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden"
            style={{
              background: isLeading
                ? `linear-gradient(160deg, ${side.user.avatarColor}22 0%, #1A1A24 60%)`
                : '#1A1A24',
              border: isLeading
                ? `1px solid ${side.user.avatarColor}50`
                : '1px solid rgba(255,255,255,0.05)',
              boxShadow: isLeading ? `0 0 24px ${side.user.avatarColor}20` : 'none',
            }}
          >
            {/* Avatar inside ring */}
            <div className="relative">
              <ProgressRing percentage={pct} size={72} strokeWidth={5} color={side.user.avatarColor} />
              <div className="absolute inset-0 flex items-center justify-center">
                <Avatar color={side.user.avatarColor} name={side.user.name} size="md" />
              </div>
            </div>

            <p className="text-white font-bold text-sm text-center leading-tight">
              {side.user.name}
            </p>

            {/* Weekly points — prominent */}
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-4xl font-black tabular-nums leading-none"
                style={{ color: side.user.avatarColor }}
              >
                {side.points}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">pts semana</span>
            </div>

            <div className="flex items-center gap-2">
              <p className="text-gray-600 text-[10px] tabular-nums">
                {side.todayCompletions}/{side.habitsCount} hoy
              </p>
              {side.streak > 0 && (
                <span className="flex items-center gap-0.5 text-orange-400 text-[10px] font-bold">
                  <Flame size={10} fill="currentColor" />
                  {side.streak}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Progress bars comparison */}
      <div className="bg-[#1A1A24] rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          Comparativa semanal
        </p>
        {sides.map(({ side }) => (
          <div key={side.user.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar color={side.user.avatarColor} name={side.user.name} size="sm" />
                <span className="text-sm text-gray-300 font-medium">{side.user.name}</span>
              </div>
              <span className="text-sm font-black tabular-nums" style={{ color: side.user.avatarColor }}>
                {side.points}
              </span>
            </div>
            <div className="h-2.5 bg-[#22223A] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: side.user.avatarColor }}
                initial={{ width: 0 }}
                animate={{ width: `${(side.points / maxPoints) * 100}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
