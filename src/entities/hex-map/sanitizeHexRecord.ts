import type {
  HexLocationData,
  LocationDangerLevel,
  LocationExplorationStatus,
  MapInkPoint,
  TerrainType,
} from '@/entities/hex-map/types';
import { defaultInkStrokeColor } from '@/entities/hex-map/inkStroke';

const terrainValues: TerrainType[] = [
  'forest',
  'mountain',
  'plain',
  'water',
  'snow',
  'wasteland',
  'settlement',
  'other',
];

const explorationStatusValues: LocationExplorationStatus[] = [
  'partial',
  'unexplored',
  'explored',
];

const dangerLevelValues: LocationDangerLevel[] = [
  'low',
  'medium',
  'high',
  'deadly',
];

export function normalizeExplorationStatus(
  value: unknown
): LocationExplorationStatus {
  if (
    typeof value === 'string' &&
    explorationStatusValues.includes(value as LocationExplorationStatus)
  ) {
    return value as LocationExplorationStatus;
  }
  return 'unexplored';
}

export function normalizeDangerLevel(value: unknown): LocationDangerLevel {
  if (
    typeof value === 'string' &&
    dangerLevelValues.includes(value as LocationDangerLevel)
  ) {
    return value as LocationDangerLevel;
  }
  return 'low';
}

export function normalizeOpenedInSession(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    return 1;
  }
  const int = Math.floor(n);
  return int >= 1 ? int : 1;
}

export function normalizeTerrain(value: string): TerrainType {
  if (terrainValues.includes(value as TerrainType)) {
    return value as TerrainType;
  }
  return 'other';
}

function sanitizeInkStrokes(raw: unknown): MapInkPoint[][] | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!Array.isArray(raw)) {
    return undefined;
  }
  const strokes: MapInkPoint[][] = [];
  for (const item of raw) {
    if (!Array.isArray(item)) {
      continue;
    }
    const stroke: MapInkPoint[] = [];
    for (const p of item) {
      if (!p || typeof p !== 'object') {
        continue;
      }
      const rec = p as Record<string, unknown>;
      const x = Number(rec.x);
      const y = Number(rec.y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) {
        continue;
      }
      stroke.push({ x, y });
    }
    if (stroke.length > 0) {
      strokes.push(stroke);
    }
  }
  return strokes.length > 0 ? strokes : undefined;
}

function sanitizeInkStrokeColor(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) {
    return undefined;
  }
  if (typeof raw !== 'string') {
    return undefined;
  }
  const s = raw.trim();
  if (/^#[0-9a-fA-F]{3}$/.test(s) || /^#[0-9a-fA-F]{6}$/.test(s)) {
    return s;
  }
  if (
    /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}(?:\s*,\s*[\d.]+\s*)?\)$/.test(
      s
    )
  ) {
    return s;
  }
  return undefined;
}

export function isHexLocationData(value: unknown): value is HexLocationData {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const v = value as Record<string, unknown>;
  if (
    typeof v.name !== 'string' ||
    typeof v.description !== 'string' ||
    typeof v.terrainType !== 'string'
  ) {
    return false;
  }
  return true;
}

export function sanitizeHexLocationsRecord(
  raw: Record<string, unknown>
): Record<string, HexLocationData> {
  const next: Record<string, HexLocationData> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (isHexLocationData(val)) {
      const rec = val as Record<string, unknown>;
      const ink = sanitizeInkStrokes(val.inkStrokes as unknown);
      const inkColor = sanitizeInkStrokeColor(val.inkStrokeColor);
      next[key] = {
        name: val.name,
        description: val.description,
        terrainType: normalizeTerrain(val.terrainType),
        openedInSession: normalizeOpenedInSession(rec.openedInSession),
        explorationStatus: normalizeExplorationStatus(rec.explorationStatus),
        dangerLevel: normalizeDangerLevel(rec.dangerLevel),
        ...(ink ? { inkStrokes: ink } : {}),
        ...(inkColor && inkColor !== defaultInkStrokeColor
          ? { inkStrokeColor: inkColor }
          : {}),
      };
    }
  }
  return next;
}
