import type { TerrainType } from '@/entities/hex-map/types';

const terrainFill: Record<TerrainType, string> = {
  forest: 'rgba(34, 139, 34, 0.22)',
  mountain: 'rgba(139, 90, 43, 0.28)',
  plain: 'rgba(154, 205, 50, 0.18)',
  water: 'rgba(30, 144, 255, 0.28)',
  snow: 'rgba(255, 255, 255, 0.32)',
  wasteland: 'rgba(139, 115, 85, 0.32)',
  settlement: 'rgba(218, 165, 32, 0.28)',
  other: 'rgba(128, 128, 128, 0.16)',
};

export function terrainOverlayColor(terrain: TerrainType): string {
  return terrainFill[terrain];
}
