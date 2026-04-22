import type { LocationExplorationStatus } from '@/entities/hex-map/types';

/** Цвет подписи статуса: сильнее для малоисследованных (интерес к походу). */
export const explorationAccentColor: Record<LocationExplorationStatus, string> = {
  unexplored: '#d8b4fe',
  partial: '#7dd3fc',
  explored: '#94a3b8',
};
