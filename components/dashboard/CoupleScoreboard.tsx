'use client';

import { motion } from 'framer-motion';
import { AppConfig, WeeklyStat } from '@/lib/types/models';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { PointsCounter } from './PointsCounter';
import { Flame } from 'lucide-react';

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

  return (
    <div className="space-y-4">
      {/* Side-by-side cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { partner: p1, points: p1Points, habits: p1Habits, today: p1Today, pct: p1Pct },
          { partner: p2, points: p2Points, habits: p2Habits, today: p2Today, pct: p2Pct },
        ].map(({ partner, points, habits, today, pct }) => (
          <motion.div
            key={partner.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A1A24] rounded-2xl p-4 flex flex-col items-center gap-3"
          >
            <Avatar
              emoji={partner.avatarEmoji}
              color={partner.avatarColor}
              name={partner.name}
              size="lg"
            />
            <p className="text-white font-semibold text-sm text-center">{partner.name}</p>
            <ProgressRing
              percentage={pct}
              size={72}
              strokeWidth={5}
              color={partner.avatarColor}
              label={`${Math.round(pct)}%`}
            />
            <p className="text-gray-500 text-[10px]">{today}/{habits} hoy</p>
            <PointsCounter
              value={points}
              color={partner.avatarColor}
              label="pts semana"
            />
          </motion.div>
        ))}
      </div>

      {/* Points bar comparison */}
      <div className="bg-[#1A1A24] rounded-2xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Comparativa
        </p>
        {[
          { partner: p1, points: p1Points },
          { partner: p2, points: p2Points },
        ].map(({ partner, points }) => (
          <div key={partner.id} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm">{partner.avatarEmoji}</span>
                <span className="text-sm text-gray-300">{partner.name}</span>
              </div>
              <span
                className="text-sm font-bold"
                style={{ color: partner.avatarColor }}
              >
                {points} pts
              </span>
            </div>
            <div className="h-2 bg-[#22223A] rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: partner.avatarColor }}
                initial={{ width: 0 }}
                animate={{ width: `${(points / maxPoints) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}

        {/* Who's winning */}
        {p1Points !== p2Points && (
          <div className="flex items-center gap-2 pt-1">
            <Flame size={14} className="text-orange-400" />
            <p className="text-xs text-gray-400">
              <span
                className="font-bold"
                style={{
                  color:
                    p1Points > p2Points ? p1.avatarColor : p2.avatarColor,
                }}
              >
                {p1Points > p2Points ? p1.name : p2.name}
              </span>{' '}
              va ganando esta semana
            </p>
          </div>
        )}
        {p1Points > 0 && p1Points === p2Points && (
          <p className="text-xs text-gray-400 text-center pt-1">
            ¡Empate! Los dos van igual 🤝
          </p>
        )}
      </div>
    </div>
  );
}
