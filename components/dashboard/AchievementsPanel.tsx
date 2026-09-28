'use client';

import { useAchievements } from '@/lib/hooks/useAchievements';
import { cn } from '@/lib/utils/cn';

export function AchievementsPanel() {
  const { badges, loading } = useAchievements();
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  if (loading) {
    return <div className="h-24 bg-[#1A1A24] rounded-2xl animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        {unlockedCount} de {badges.length} logros desbloqueados
      </p>
      <div className="grid grid-cols-4 gap-2.5">
        {badges.map((badge) => (
          <div
            key={badge.id}
            title={badge.description}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-2xl py-3 px-1.5 text-center transition-all',
              badge.unlocked ? 'bg-gradient-to-b from-violet-600/20 to-transparent border border-violet-500/30' : 'bg-[#1A1A24] border border-transparent'
            )}
          >
            <span className={cn('text-2xl', !badge.unlocked && 'grayscale opacity-25')}>{badge.icon}</span>
            <span className={cn('text-[9px] font-semibold leading-tight', badge.unlocked ? 'text-gray-200' : 'text-gray-700')}>
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
