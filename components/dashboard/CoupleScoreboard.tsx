'use client';

import { motion } from 'framer-motion';
import { AppConfig, WeeklyStat } from '@/lib/types/models';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface CoupleScoreboardProps {
  appConfig: AppConfig;
  weeklyStat: WeeklyStat | null;
  p1Habits: number;
  p2Habits: number;
  p1Today: number;
  p2Today: number;
}

export function CoupleScoreboard({
  appConfig,
  weeklyStat,
  p1Habits,
  p2Habits,
  p1Today,
  p2Today,
}: CoupleScoreboardProps) {
  const p1 = appConfig.partner1;
  const p2 = appConfig.partner2;
  const p1Points = weeklyStat?.partner1.totalPoints ?? 0;
  const p2Points = weeklyStat?.partner2.totalPoints ?? 0;
  const p1Pct = p1Habits > 0 ? (p1Today / p1Habits) * 100 : 0;
  const p2Pct = p2Habits > 0 ? (p2Today / p2Habits) * 100 : 0;
  const maxPoints = Math.max(p1Points, p2Points, 1);

  const isP1Leading = p1Points > p2Points;
  const isP2Leading = p2Points > p1Points;
  const isTied = p1Points === p2Points;
  const leader = isP1Leading ? p1 : isP2Leading ? p2 : null;
  const noPointsYet = p1Points === 0 && p2Points === 0;

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
                background: `linear-gradient(135deg, ${leader.avatarColor}28 0%, ${leader.avatarColor}12 100%)`,
                border: `1px solid ${leader.avatarColor}40`,
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
              <span className="font-black" style={{ color: leader!.avatarColor }}>
                {leader!.name}
              </span>{' '}
              va ganando esta semana
            </p>
          </>
        )}
      </motion.div>

      {/* Side-by-side partner cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { partner: p1, points: p1Points, habits: p1Habits, today: p1Today, pct: p1Pct, isLeading: isP1Leading },
          { partner: p2, points: p2Points, habits: p2Habits, today: p2Today, pct: p2Pct, isLeading: isP2Leading },
        ].map(({ partner, points, habits, today, pct, isLeading }) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 flex flex-col items-center gap-3 relative overflow-hidden"
            style={{
              background: isLeading
                ? `linear-gradient(160deg, ${partner.avatarColor}22 0%, #1A1A24 60%)`
                : '#1A1A24',
              border: isLeading
                ? `1px solid ${partner.avatarColor}50`
                : '1px solid rgba(255,255,255,0.05)',
              boxShadow: isLeading ? `0 0 24px ${partner.avatarColor}20` : 'none',
            }}
          >
            {/* Avatar inside ring */}
            <div className="relative">
              <ProgressRing percentage={pct} size={72} strokeWidth={5} color={partner.avatarColor} />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">
                {partner.avatarEmoji}
              </div>
            </div>

            <p className="text-white font-bold text-sm text-center leading-tight">
              {partner.name}
            </p>

            {/* Weekly points — prominent */}
            <div className="flex flex-col items-center gap-0.5">
              <span
                className="text-4xl font-black tabular-nums leading-none"
                style={{ color: partner.avatarColor }}
              >
                {points}
              </span>
              <span className="text-[10px] text-gray-500 font-medium">pts semana</span>
            </div>

            <p className="text-gray-600 text-[10px] tabular-nums">
              {today}/{habits} hoy
            </p>
          </motion.div>
        ))}
      </div>

      {/* Progress bars comparison */}
      <div className="bg-[#1A1A24] rounded-2xl p-4 space-y-3">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">
          Comparativa semanal
        </p>
        {[
          { partner: p1, points: p1Points },
          { partner: p2, points: p2Points },
        ].map(({ partner, points }) => (
          <div key={partner.id} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{partner.avatarEmoji}</span>
                <span className="text-sm text-gray-300 font-medium">{partner.name}</span>
              </div>
              <span className="text-sm font-black tabular-nums" style={{ color: partner.avatarColor }}>
                {points}
              </span>
            </div>
            <div className="h-2.5 bg-[#22223A] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: partner.avatarColor }}
                initial={{ width: 0 }}
                animate={{ width: `${(points / maxPoints) * 100}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
