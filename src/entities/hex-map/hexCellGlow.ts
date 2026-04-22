import type {
  LocationDangerLevel,
  LocationExplorationStatus,
} from '@/entities/hex-map/types';

/**
 * Свечение гекса: совмещает «интерес» (статус исследования) и угрозу.
 * Чем меньше исследовано — тем ярче второй слой (интерес для игрока).
 */
const explorationGlow: Record<LocationExplorationStatus, string> = {
  unexplored:
    'drop-shadow(0 0 18px rgba(192, 132, 252, 0.58)) drop-shadow(0 0 22px rgba(250, 204, 21, 0.32))',
  partial: 'drop-shadow(0 0 12px rgba(56, 189, 248, 0.48))',
  explored: 'drop-shadow(0 0 6px rgba(148, 163, 184, 0.2))',
};

const dangerGlowRest: Record<LocationDangerLevel, string> = {
  low: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.5))',
  medium: 'drop-shadow(0 0 10px rgba(251, 191, 36, 0.52))',
  high: 'drop-shadow(0 0 12px rgba(251, 146, 60, 0.55))',
  deadly: 'drop-shadow(0 0 14px rgba(248, 113, 113, 0.65))',
};

const dangerGlowHover: Record<LocationDangerLevel, string> = {
  low: 'drop-shadow(0 0 10px rgba(74, 222, 128, 0.58))',
  medium: 'drop-shadow(0 0 11px rgba(251, 191, 36, 0.62))',
  high: 'drop-shadow(0 0 13px rgba(251, 146, 60, 0.68))',
  deadly: 'drop-shadow(0 0 16px rgba(248, 113, 113, 0.78))',
};

const hoverGoldRing = 'drop-shadow(0 0 10px rgba(250, 204, 21, 0.4))';

export function buildHexLocationGlowFilter(
  danger: LocationDangerLevel,
  exploration: LocationExplorationStatus,
  isHovered: boolean
): string {
  const e = explorationGlow[exploration];
  const d = isHovered ? dangerGlowHover[danger] : dangerGlowRest[danger];
  const parts = [e, d];
  if (isHovered) {
    parts.push(hoverGoldRing);
  }
  return parts.join(' ');
}
