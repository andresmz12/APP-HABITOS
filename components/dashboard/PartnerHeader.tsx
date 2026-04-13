'use client';

import { Partner } from '@/lib/types/models';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressRing } from '@/components/ui/ProgressRing';

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

  return (
    <div className="flex items-center gap-4 p-4 bg-[#1A1A24] rounded-2xl">
      <Avatar
        emoji={partner.avatarEmoji}
        color={partner.avatarColor}
        name={partner.name}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-lg leading-tight">{partner.name}</p>
        <p className="text-gray-500 text-xs mt-0.5">
          {completedToday} de {totalHabits} hábitos hoy
        </p>
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className="text-sm font-bold"
            style={{ color: partner.avatarColor }}
          >
            {weeklyPoints}
          </span>
          <span className="text-gray-600 text-xs">pts esta semana</span>
        </div>
      </div>
      <ProgressRing
        percentage={percentage}
        size={64}
        strokeWidth={5}
        color={partner.avatarColor}
        label={`${Math.round(percentage)}%`}
      />
    </div>
  );
}
