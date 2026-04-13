'use client';

import { Partner } from '@/lib/types/models';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Trophy, Zap } from 'lucide-react';

interface PartnerHeaderProps {
  partner: Partner;
  completedToday: number;
  totalHabits: number;
  weeklyPoints: number;
}

export function PartnerHeader({
  partner,
  completedToday,
  totalHabits,
  weeklyPoints,
}: PartnerHeaderProps) {
  const percentage = totalHabits > 0 ? (completedToday / totalHabits) * 100 : 0;
  const allDone = totalHabits > 0 && completedToday >= totalHabits;

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4"
      style={{
        background: `linear-gradient(135deg, ${partner.avatarColor}18 0%, ${partner.avatarColor}08 100%)`,
        border: `1px solid ${partner.avatarColor}28`,
      }}
    >
      {/* Avatar inside progress ring */}
      <div className="relative flex-shrink-0">
        <ProgressRing
          percentage={percentage}
          size={72}
          strokeWidth={5}
          color={partner.avatarColor}
        />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {partner.avatarEmoji}
        </div>
        {allDone && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
            style={{ backgroundColor: partner.avatarColor }}
          >
            ✓
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-white font-bold text-base leading-tight truncate">
            {partner.name}
          </p>
          {allDone && <span className="text-base">🎉</span>}
        </div>

        <p className="text-gray-500 text-xs mt-0.5">
          {totalHabits === 0
            ? 'Sin hábitos todavía'
            : allDone
            ? '¡Todos completados!'
            : `${completedToday} de ${totalHabits} hábitos hoy`}
        </p>

        {/* Points + streak row */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1">
            <Zap size={12} style={{ color: partner.avatarColor }} />
            <span
              className="text-sm font-black tabular-nums"
              style={{ color: partner.avatarColor }}
            >
              {weeklyPoints}
            </span>
            <span className="text-gray-600 text-[10px]">pts</span>
          </div>
          <span className="text-gray-700 text-[10px]">esta semana</span>
        </div>
      </div>

      {/* Percentage label */}
      <div className="flex-shrink-0 text-right">
        <span
          className="text-2xl font-black tabular-nums"
          style={{ color: percentage === 100 ? partner.avatarColor : 'rgba(255,255,255,0.15)' }}
        >
          {Math.round(percentage)}
        </span>
        <span className="text-gray-600 text-xs block -mt-0.5">%</span>
      </div>
    </div>
  );
}
