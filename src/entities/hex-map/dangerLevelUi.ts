import type { LocationDangerLevel } from '@/entities/hex-map/types';

/** Цвет подписи уровня опасности в тултипе (совпадает с палитрой слоя угрозы в hexCellGlow). */
export const dangerAccentColor: Record<LocationDangerLevel, string> = {
  low: '#4ade80',
  medium: '#fbbf24',
  high: '#fb923c',
  deadly: '#f87171',
};

