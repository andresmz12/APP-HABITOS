'use client';

import { WeekTrendPoint } from '@/lib/types/models';
import { getCurrentWeekKey } from '@/lib/utils/dates';

interface PointsTrendProps {
  trend: WeekTrendPoint[];
  myColor: string;
  partnerColor?: string;
}

export function PointsTrend({ trend, myColor, partnerColor }: PointsTrendProps) {
  const max = Math.max(1, ...trend.flatMap((t) => [t.myPoints, t.partnerPoints ?? 0]));
  const currentWeekKey = getCurrentWeekKey();

  return (
    <div className="flex items-end justify-between gap-2 h-20">
      {trend.map((point) => {
        const isCurrent = point.weekKey === currentWeekKey;
        return (
          <div key={point.weekKey} className="flex-1 flex flex-col items-center gap-1.5">
            <div className="w-full flex items-end justify-center gap-1 h-16">
              <div
                className="w-full max-w-[10px] rounded-full transition-all"
                style={{ height: `${Math.max(4, (point.myPoints / max) * 100)}%`, backgroundColor: myColor, opacity: isCurrent ? 1 : 0.5 }}
              />
              {point.partnerPoints !== null && (
                <div
                  className="w-full max-w-[10px] rounded-full transition-all"
                  style={{ height: `${Math.max(4, (point.partnerPoints / max) * 100)}%`, backgroundColor: partnerColor ?? '#8B85FF', opacity: isCurrent ? 1 : 0.5 }}
                />
              )}
            </div>
            <span className="text-[8px] text-gray-700">{point.weekKey.slice(5).replace('-', '/')}</span>
          </div>
        );
      })}
    </div>
  );
}
