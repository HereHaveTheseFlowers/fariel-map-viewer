export type TerrainType =
  | 'forest'
  | 'mountain'
  | 'plain'
  | 'water'
  | 'snow'
  | 'wasteland'
  | 'settlement'
  | 'other';

/** Степень изученности гекса. */
export type LocationExplorationStatus =
  | 'partial'
  | 'unexplored'
  | 'explored';

/** Уровень опасности локации. */
export type LocationDangerLevel =
  | 'low'
  | 'medium'
  | 'high'
  | 'deadly';

export type Axial = {
  q: number;
  r: number;
};

/** Point in map pixel space (same as SVG viewBox over the world image). */
export type MapInkPoint = {
  x: number;
  y: number;
};

export type HexLocationData = {
  name: string;
  description: string;
  terrainType: TerrainType;
  /** Номер сессии, в которой локация впервые открыта (целое число ≥ 1). */
  openedInSession: number;
  explorationStatus: LocationExplorationStatus;
  dangerLevel: LocationDangerLevel;
  /** Freehand strokes drawn on the map for this hex (each stroke is a polyline). */
  inkStrokes?: MapInkPoint[][];
  /** Stroke color (`#rrggbb` or `rgb` / `rgba`). Omitted → theme default. */
  inkStrokeColor?: string;
};

export function axialKey(axial: Axial): string {
  return `${axial.q},${axial.r}`;
}

export function parseAxialKey(key: string): Axial | null {
  const parts = key.split(',');
  if (parts.length !== 2) {
    return null;
  }
  const q = Number(parts[0]);
  const r = Number(parts[1]);
  if (!Number.isFinite(q) || !Number.isFinite(r)) {
    return null;
  }
  return { q, r };
}
