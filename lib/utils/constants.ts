import { PartnerId } from '../types/models';

export const PARTNER_IDS: PartnerId[] = ['partner1', 'partner2'];

export const PARTNER_COLORS: Record<PartnerId, { primary: string; light: string; muted: string }> = {
  partner1: {
    primary: '#6C63FF',
    light: '#8B85FF',
    muted: 'rgba(108,99,255,0.15)',
  },
  partner2: {
    primary: '#FF6B9D',
    light: '#FF8FB5',
    muted: 'rgba(255,107,157,0.15)',
  },
};

export const AVATAR_COLORS = [
  '#6C63FF', '#FF6B9D', '#4ADE80', '#FACC15',
  '#38BDF8', '#F97316', '#A78BFA', '#34D399',
];

export const HABIT_EMOJIS = [
  '🏃', '🧘', '💪', '🚴', '🏊', '🥗', '💧', '😴',
  '📚', '✍️', '🎯', '🧠', '💼', '🎨', '🎵', '🗣️',
  '🌱', '🌞', '🧹', '💊', '🙏', '❤️', '👫', '🌿',
  '☕', '🍎', '🚶', '🏋️', '🎸', '📝',
];

export const DAY_NAMES_SHORT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
export const DAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
