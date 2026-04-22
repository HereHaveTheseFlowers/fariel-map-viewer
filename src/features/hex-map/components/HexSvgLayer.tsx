import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
  type ReactElement,
} from 'react';
import type { HexLocationData, MapInkPoint } from '@/entities/hex-map/types';
import { buildHexLocationGlowFilter } from '@/entities/hex-map/hexCellGlow';
import { axialKey } from '@/entities/hex-map/types';
import { buildHexGrid, axialToPixel, hexPolygonPoints } from '@/entities/hex-map/hexGeometry';
import { terrainOverlayColor } from '@/entities/hex-map/terrainColors';
import {
  mapImageHeightPx,
  mapImageWidthPx,
} from '@/entities/hex-map/mapConfig';
import {
  inkPreviewSvgAttrs,
  inkStrokeSvgAttrs,
  resolveInkStrokeColor,
} from '@/entities/hex-map/inkStroke';

function strokeToPointsAttr(stroke: MapInkPoint[]): string {
  return stroke.map((p) => `${p.x},${p.y}`).join(' ');
}

const HexMapCell = memo(function HexMapCell({
  hexKey,
  points,
  fill,
  stroke,
  strokeWidth,
  cellClassName,
  glowStyle,
  onHoverKeyChange,
}: {
  hexKey: string;
  points: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cellClassName: string;
  glowStyle: CSSProperties | undefined;
  onHoverKeyChange: (key: string | null) => void;
}) {
  return (
    <polygon
      points={points}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      className={cellClassName}
      style={glowStyle}
      data-hex-key={hexKey}
      onPointerEnter={() => {
        onHoverKeyChange(hexKey);
      }}
      onPointerLeave={() => {
        onHoverKeyChange(null);
      }}
    />
  );
});

type HexSvgLayerProps = {
  locations: Record<string, HexLocationData>;
  hoveredKey: string | null;
  onHoverKeyChange: (key: string | null) => void;
  onPointerClientMove: (clientX: number, clientY: number) => void;
  /** In-progress stroke while drawing (map coordinates). */
  previewInkStroke: MapInkPoint[] | null;
  /** Color for the in-progress stroke (same as active location). */
  previewInkColor: string;
};

export function HexSvgLayer({
  locations,
  hoveredKey,
  onHoverKeyChange,
  onPointerClientMove,
  previewInkStroke,
  previewInkColor,
}: HexSvgLayerProps) {
  const hexes = useMemo(() => buildHexGrid(), []);
  const hoveredKeyRef = useRef(hoveredKey);
  const pointerMoveRafRef = useRef<number | null>(null);
  const pendingPointerRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    hoveredKeyRef.current = hoveredKey;
  }, [hoveredKey]);

  const handleHoverKeyChange = useCallback(
    (key: string | null) => {
      hoveredKeyRef.current = key;
      onHoverKeyChange(key);
    },
    [onHoverKeyChange]
  );

  useEffect(() => {
    return () => {
      if (pointerMoveRafRef.current !== null) {
        cancelAnimationFrame(pointerMoveRafRef.current);
      }
    };
  }, []);

  const schedulePointerClientMove = useCallback(
    (clientX: number, clientY: number) => {
      pendingPointerRef.current = { x: clientX, y: clientY };
      if (pointerMoveRafRef.current !== null) {
        return;
      }
      pointerMoveRafRef.current = requestAnimationFrame(() => {
        pointerMoveRafRef.current = null;
        const pending = pendingPointerRef.current;
        if (pending !== null && hoveredKeyRef.current !== null) {
          onPointerClientMove(pending.x, pending.y);
        }
      });
    },
    [onPointerClientMove]
  );

  const onSvgPointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (hoveredKeyRef.current === null) {
        return;
      }
      schedulePointerClientMove(e.clientX, e.clientY);
    },
    [schedulePointerClientMove]
  );

  const inkElements = useMemo(() => {
    const out: ReactElement[] = [];
    let idx = 0;
    for (const [hexKey, data] of Object.entries(locations)) {
      const strokes = data.inkStrokes;
      if (!strokes?.length) {
        continue;
      }
      const paint = inkStrokeSvgAttrs(resolveInkStrokeColor(data.inkStrokeColor));
      for (const stroke of strokes) {
        if (stroke.length < 2) {
          continue;
        }
        out.push(
          <polyline
            key={`ink-${hexKey}-${idx}`}
            className="hex-ink-stroke"
            points={strokeToPointsAttr(stroke)}
            fill="none"
            stroke={paint.stroke}
            strokeOpacity={paint.strokeOpacity}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            pointerEvents="none"
          />
        );
        idx += 1;
      }
    }
    return out;
  }, [locations]);

  return (
    <svg
      className="hex-svg"
      width={mapImageWidthPx}
      height={mapImageHeightPx}
      viewBox={`0 0 ${mapImageWidthPx} ${mapImageHeightPx}`}
      role="presentation"
      onPointerMove={onSvgPointerMove}
    >
      {hexes.map((axial) => {
        const key = axialKey(axial);
        const { x, y } = axialToPixel(axial);
        const points = hexPolygonPoints(x, y);
        const data = locations[key];
        const isHovered = hoveredKey === key;
        const terrainFill = data
          ? terrainOverlayColor(data.terrainType)
          : 'transparent';
        const fill = isHovered ? 'rgba(234, 179, 8, 0.38)' : terrainFill;
        const stroke = isHovered
          ? 'rgba(250, 204, 21, 0.95)'
          : 'rgba(255, 255, 255, 0.28)';
        const strokeWidth = isHovered ? 2.2 : 1;
        const cellClassName = data ? 'hex-cell' : 'hex-cell hex-cell--no-danger';
        const glowFilter =
          data !== undefined
            ? buildHexLocationGlowFilter(
                data.dangerLevel,
                data.explorationStatus,
                isHovered
              )
            : undefined;

        return (
          <HexMapCell
            key={key}
            hexKey={key}
            points={points}
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            cellClassName={cellClassName}
            glowStyle={
              glowFilter !== undefined ? { filter: glowFilter } : undefined
            }
            onHoverKeyChange={handleHoverKeyChange}
          />
        );
      })}
      {inkElements}
      {previewInkStroke && previewInkStroke.length > 1 ? (
        <polyline
          className="hex-ink-stroke hex-ink-stroke--preview"
          points={strokeToPointsAttr(previewInkStroke)}
          fill="none"
          {...inkPreviewSvgAttrs(previewInkColor)}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          pointerEvents="none"
        />
      ) : null}
    </svg>
  );
}
