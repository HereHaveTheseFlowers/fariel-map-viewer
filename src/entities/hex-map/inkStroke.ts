/** Matches the app accent; used when `inkStrokeColor` is omitted. */
export const defaultInkStrokeColor = '#d4a84b';

export function resolveInkStrokeColor(value: string | undefined | null): string {
  if (typeof value !== 'string') {
    return defaultInkStrokeColor;
  }
  const s = value.trim();
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
  return defaultInkStrokeColor;
}

/** `#hex` gets a slight transparency; `rgb` / `rgba` stay as authored. */
export function inkStrokeSvgAttrs(color: string): {
  stroke: string;
  strokeOpacity?: number;
} {
  const c = resolveInkStrokeColor(color);
  if (/^#/.test(c)) {
    return { stroke: c, strokeOpacity: 0.92 };
  }
  return { stroke: c };
}

export function inkPreviewSvgAttrs(color: string): {
  stroke: string;
  strokeOpacity?: number;
} {
  const c = resolveInkStrokeColor(color);
  if (/^#/.test(c)) {
    return { stroke: c, strokeOpacity: 0.95 };
  }
  return { stroke: c };
}

/** Value for `<input type="color" />` (requires `#rrggbb`). */
export function toColorInputValue(stored: string | undefined): string {
  const c = resolveInkStrokeColor(stored);
  if (/^#[0-9a-fA-F]{6}$/i.test(c)) {
    return c.toLowerCase();
  }
  if (/^#[0-9a-fA-F]{3}$/i.test(c)) {
    const a = c.slice(1);
    return `#${a[0]}${a[0]}${a[1]}${a[1]}${a[2]}${a[2]}`.toLowerCase();
  }
  return defaultInkStrokeColor;
}
