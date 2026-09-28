export interface BadgeDef {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export const BADGE_DEFS: BadgeDef[] = [
  { id: 'first_habit', label: 'El comienzo', description: 'Crea tu primer hábito', icon: '🌱' },
  { id: 'first_complete', label: 'Primer paso', description: 'Completa un hábito por primera vez', icon: '✅' },
  { id: 'streak_3', label: 'Constancia', description: 'Racha de 3 días seguidos', icon: '🔥' },
  { id: 'streak_7', label: 'Una semana completa', description: 'Racha de 7 días seguidos', icon: '⚡' },
  { id: 'streak_30', label: 'Imparable', description: 'Racha de 30 días seguidos', icon: '💎' },
  { id: 'streak_100', label: 'Leyenda', description: 'Racha de 100 días seguidos', icon: '👑' },
  { id: 'completions_25', label: 'En marcha', description: '25 hábitos completados en total', icon: '🚀' },
  { id: 'completions_100', label: 'Centenario', description: '100 hábitos completados en total', icon: '🏆' },
  { id: 'paired', label: 'En equipo', description: 'Vincula tu cuenta con tu pareja', icon: '💜' },
  { id: 'planner', label: 'Organizado', description: 'Agrega tu primer pendiente al calendario', icon: '🗓️' },
];

export interface BadgeStatus extends BadgeDef {
  unlocked: boolean;
}

export function computeBadges(stats: {
  habitsCreated: number;
  totalCompletions: number;
  streak: number;
  isPaired: boolean;
  hasTasks: boolean;
}): BadgeStatus[] {
  const unlockedIds = new Set<string>();
  if (stats.habitsCreated > 0) unlockedIds.add('first_habit');
  if (stats.totalCompletions > 0) unlockedIds.add('first_complete');
  if (stats.streak >= 3) unlockedIds.add('streak_3');
  if (stats.streak >= 7) unlockedIds.add('streak_7');
  if (stats.streak >= 30) unlockedIds.add('streak_30');
  if (stats.streak >= 100) unlockedIds.add('streak_100');
  if (stats.totalCompletions >= 25) unlockedIds.add('completions_25');
  if (stats.totalCompletions >= 100) unlockedIds.add('completions_100');
  if (stats.isPaired) unlockedIds.add('paired');
  if (stats.hasTasks) unlockedIds.add('planner');

  return BADGE_DEFS.map((def) => ({ ...def, unlocked: unlockedIds.has(def.id) }));
}
