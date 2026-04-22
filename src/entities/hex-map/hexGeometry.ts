import type { Axial } from '@/entities/hex-map/types';
import {
  hexGridOriginPx,
  hexRadiusPx,
  mapImageHeightPx,
  mapImageWidthPx,
} from '@/entities/hex-map/mapConfig';

const sqrt3 = Math.sqrt(3);

export function axialToPixel(axial: Axial): { x: number; y: number } {
  const { q, r } = axial;
  const x = hexRadiusPx * sqrt3 * (q + r / 2) + hexGridOriginPx.x;
  const y = hexRadiusPx * (3 / 2) * r + hexGridOriginPx.y;
  return { x, y };
}

export function pixelToAxial(x: number, y: number): Axial {
  const px = x - hexGridOriginPx.x;
  const py = y - hexGridOriginPx.y;
  const fracQ = (sqrt3 / 3) * px - (1 / 3) * py;
  const fracR = (2 / 3) * py;
  return axialRound(fracQ / hexRadiusPx, fracR / hexRadiusPx);
}

function axialRound(fracQ: number, fracR: number): Axial {
  const fracS = -fracQ - fracR;
  let q = Math.round(fracQ);
  let r = Math.round(fracR);
  const s = Math.round(fracS);
  const qDiff = Math.abs(q - fracQ);
  const rDiff = Math.abs(r - fracR);
  const sDiff = Math.abs(s - fracS);
  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  return { q, r };
}

export function hexPolygonPoints(centerX: number, centerY: number): string {
  const corners: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (-Math.PI / 2) + (i * Math.PI) / 3;
    const x = centerX + hexRadiusPx * Math.cos(angle);
    const y = centerY + hexRadiusPx * Math.sin(angle);
    corners.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return corners.join(' ');
}

export function buildHexGrid(): Axial[] {
  const result: Axial[] = [];
  const maxR =
    Math.ceil((mapImageHeightPx - hexGridOriginPx.y) / (hexRadiusPx * 1.5)) + 3;
  const maxQ =
    Math.ceil((mapImageWidthPx - hexGridOriginPx.x) / (hexRadiusPx * sqrt3)) + 3;
  for (let r = -3; r <= maxR; r++) {
    for (let q = -3; q <= maxQ; q++) {
      const { x, y } = axialToPixel({ q, r });
      if (
        x >= -hexRadiusPx &&
        x <= mapImageWidthPx + hexRadiusPx &&
        y >= -hexRadiusPx &&
        y <= mapImageHeightPx + hexRadiusPx
      ) {
        result.push({ q, r });
      }
    }
  }
  return result;
}
