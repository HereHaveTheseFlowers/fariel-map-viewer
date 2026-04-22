import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  HexLocationData,
  LocationDangerLevel,
  LocationExplorationStatus,
  MapInkPoint,
} from "@/entities/hex-map/types";
import { parseAxialKey } from "@/entities/hex-map/types";
import { HexSvgLayer } from "@/features/hex-map/components/HexSvgLayer";
import { HexTooltip } from "@/features/hex-map/components/HexTooltip";
import { axialToPixel } from "@/entities/hex-map/hexGeometry";
import {
  defaultViewAxial,
  defaultViewScale,
  mapImageHeightPx,
  mapImageSrc,
  mapImageWidthPx,
} from "@/entities/hex-map/mapConfig";
import { defaultInkStrokeColor } from "@/entities/hex-map/inkStroke";
import { dangerAccentColor } from "@/entities/hex-map/dangerLevelUi";
import { explorationAccentColor } from "@/entities/hex-map/explorationStatusUi";

type HexMapViewProps = {
  locations: Record<string, HexLocationData>;
  externalHoveredKey?: string | null;
  /** Если не задан — клик по гексу не открывает редактор (например, production). */
  onHexClick?: (key: string) => void;
  inkDrawMode?: boolean;
  inkStrokesDraft?: MapInkPoint[][];
  onInkStrokesDraftChange?: (next: MapInkPoint[][]) => void;
  /** Color of the stroke currently being drawn (map preview). */
  inkPreviewColor?: string;
};

const explorationLabel: Record<LocationExplorationStatus, string> = {
  unexplored: "Не исследована",
  partial: "Частично исследована",
  explored: "Исследована",
};

const dangerLabel: Record<LocationDangerLevel, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
  deadly: "Смертельно",
};

/** Доля от натурального размера карты; меньше — сильнее отдаление (вся карта на экране). */
const minScale = 0.12;
const maxScale = 2.8;
const dragThresholdPx = 8;
const inkMinDistPx = 1.5;
const inkMinDistSq = inkMinDistPx * inkMinDistPx;

type PointerDragState = {
  pointerId: number;
  startX: number;
  startY: number;
  originTx: number;
  originTy: number;
  hexKeyAtDown: string | null;
  maxDistSq: number;
  isPanning: boolean;
};

type InkDrawPointerState = {
  pointerId: number;
};

function clientToMapPoint(
  clientX: number,
  clientY: number,
  viewportEl: HTMLDivElement,
  translateX: number,
  translateY: number,
  scaleVal: number
): MapInkPoint {
  const rect = viewportEl.getBoundingClientRect();
  const mx = clientX - rect.left;
  const my = clientY - rect.top;
  return {
    x: (mx - translateX) / scaleVal,
    y: (my - translateY) / scaleVal,
  };
}

export function HexMapView({
  locations,
  externalHoveredKey = null,
  onHexClick,
  inkDrawMode = false,
  inkStrokesDraft = [],
  onInkStrokesDraftChange,
  inkPreviewColor = defaultInkStrokeColor,
}: HexMapViewProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const worldRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<PointerDragState | null>(null);
  const inkDrawRef = useRef<InkDrawPointerState | null>(null);
  const inkStrokeRef = useRef<MapInkPoint[] | null>(null);
  const inkStrokesDraftRef = useRef(inkStrokesDraft);
  const scaleRef = useRef(defaultViewScale);
  const translateXRef = useRef(0);
  const translateYRef = useRef(0);
  const [scale, setScale] = useState(defaultViewScale);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);

  const [mapHoveredKey, setMapHoveredKey] = useState<string | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [previewInkStroke, setPreviewInkStroke] = useState<
    MapInkPoint[] | null
  >(null);

  const zoomAtClientPoint = useCallback(
    (clientX: number, clientY: number, nextScale: number) => {
      const el = viewportRef.current;
      if (!el) {
        scaleRef.current = nextScale;
        setScale(nextScale);
        return;
      }
      const rect = el.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const sx = scaleRef.current;
      const tx = translateXRef.current;
      const ty = translateYRef.current;
      const worldX = (mx - tx) / sx;
      const worldY = (my - ty) / sx;
      const newTx = mx - worldX * nextScale;
      const newTy = my - worldY * nextScale;
      scaleRef.current = nextScale;
      translateXRef.current = newTx;
      translateYRef.current = newTy;
      setScale(nextScale);
      setTranslateX(newTx);
      setTranslateY(newTy);
    },
    []
  );

  useEffect(() => {
    scaleRef.current = scale;
    translateXRef.current = translateX;
    translateYRef.current = translateY;
  }, [scale, translateX, translateY]);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) {
      return;
    }
    const onWheel = (e: WheelEvent) => {
      if (dragRef.current?.isPanning) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.9 : 1.1;
      const cur = scaleRef.current;
      const next = Math.min(maxScale, Math.max(minScale, cur * factor));
      if (Math.abs(next - cur) < 1e-6) {
        return;
      }
      zoomAtClientPoint(e.clientX, e.clientY, next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAtClientPoint]);

  const applyDefaultView = useCallback(() => {
    const el = viewportRef.current;
    const world = worldRef.current;
    if (!el) {
      return;
    }
    world?.style.removeProperty("transform");
    const rect = el.getBoundingClientRect();
    const { x: wx, y: wy } = axialToPixel(defaultViewAxial);
    const tx = rect.width / 2 - wx * defaultViewScale;
    const ty = rect.height / 2 - wy * defaultViewScale;
    scaleRef.current = defaultViewScale;
    translateXRef.current = tx;
    translateYRef.current = ty;
    setScale(defaultViewScale);
    setTranslateX(tx);
    setTranslateY(ty);
  }, []);

  useLayoutEffect(() => {
    applyDefaultView();
  }, [applyDefaultView]);

  const onViewportPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) {
        return;
      }
      const vp = viewportRef.current;
      if (!vp) {
        return;
      }
      const allowPanWithShift = inkDrawMode && e.shiftKey;
      if (inkDrawMode && !allowPanWithShift) {
        const p = clientToMapPoint(
          e.clientX,
          e.clientY,
          vp,
          translateXRef.current,
          translateYRef.current,
          scaleRef.current
        );
        inkDrawRef.current = { pointerId: e.pointerId };
        inkStrokeRef.current = [p];
        setPreviewInkStroke([p]);
        vp.setPointerCapture(e.pointerId);
        return;
      }
      const hexEl = (e.target as Element).closest("[data-hex-key]");
      const hexKey = hexEl?.getAttribute("data-hex-key") ?? null;
      dragRef.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        originTx: translateXRef.current,
        originTy: translateYRef.current,
        hexKeyAtDown: hexKey,
        maxDistSq: 0,
        isPanning: false,
      };
      vp.setPointerCapture(e.pointerId);
    },
    [inkDrawMode]
  );

  const onViewportPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ink = inkDrawRef.current;
      if (ink && e.pointerId === ink.pointerId) {
        const vp = viewportRef.current;
        if (!vp) {
          return;
        }
        const p = clientToMapPoint(
          e.clientX,
          e.clientY,
          vp,
          translateXRef.current,
          translateYRef.current,
          scaleRef.current
        );
        const prev = inkStrokeRef.current;
        if (!prev?.length) {
          inkStrokeRef.current = [p];
          setPreviewInkStroke([p]);
          return;
        }
        const last = prev[prev.length - 1];
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        if (dx * dx + dy * dy < inkMinDistSq) {
          return;
        }
        const next = [...prev, p];
        inkStrokeRef.current = next;
        setPreviewInkStroke(next);
        return;
      }
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) {
        return;
      }
      const vp = viewportRef.current;
      if (!vp) {
        return;
      }
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      d.maxDistSq = Math.max(d.maxDistSq, dx * dx + dy * dy);
      const th = dragThresholdPx * dragThresholdPx;
      if (!d.isPanning && d.maxDistSq >= th) {
        d.isPanning = true;
        vp.classList.add("hex-map__viewport--grabbing");
      }
      if (d.isPanning) {
        const world = worldRef.current;
        if (world) {
          const tx = d.originTx + dx;
          const ty = d.originTy + dy;
          world.style.transform = `translate(${tx}px, ${ty}px) scale(${scaleRef.current})`;
        }
      }
    },
    []
  );

  const endPointerDrag = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const ink = inkDrawRef.current;
      if (ink && e.pointerId === ink.pointerId) {
        const vp = viewportRef.current;
        vp?.releasePointerCapture(e.pointerId);
        inkDrawRef.current = null;
        const stroke = inkStrokeRef.current;
        inkStrokeRef.current = null;
        setPreviewInkStroke(null);
        if (stroke && stroke.length >= 2 && onInkStrokesDraftChange) {
          onInkStrokesDraftChange([...inkStrokesDraftRef.current, stroke]);
        }
        return;
      }
      const d = dragRef.current;
      if (!d || e.pointerId !== d.pointerId) {
        return;
      }
      const vp = viewportRef.current;
      vp?.releasePointerCapture(e.pointerId);
      const th = dragThresholdPx * dragThresholdPx;
      const isTap = d.maxDistSq < th && !d.isPanning;
      if (d.isPanning) {
        const dx = e.clientX - d.startX;
        const dy = e.clientY - d.startY;
        const tx = d.originTx + dx;
        const ty = d.originTy + dy;
        translateXRef.current = tx;
        translateYRef.current = ty;
        setTranslateX(tx);
        setTranslateY(ty);
        worldRef.current?.style.removeProperty("transform");
      }
      if (isTap && d.hexKeyAtDown && onHexClick) {
        onHexClick(d.hexKeyAtDown);
      }
      dragRef.current = null;
      vp?.classList.remove("hex-map__viewport--grabbing");
    },
    [onHexClick, onInkStrokesDraftChange]
  );

  const resetView = useCallback(() => {
    applyDefaultView();
  }, [applyDefaultView]);

  const highlightedKey = externalHoveredKey ?? mapHoveredKey;

  const tooltipData = (() => {
    if (!mapHoveredKey || !pointer) {
      return null;
    }
    const axial = parseAxialKey(mapHoveredKey);
    const coordsLabel = axial ? `Гекс q=${axial.q}, r=${axial.r}` : "Гекс";
    const loc = locations[mapHoveredKey];
    const title = loc?.name?.trim() ? loc.name : "Без названия";
    const description = loc?.description?.trim() ? loc.description : "";
    const metaLines =
      loc !== undefined ? [`Сессия: ${loc.openedInSession}`] : undefined;
    const explorationLine =
      loc !== undefined
        ? {
            valueLabel: explorationLabel[loc.explorationStatus],
            accentColor: explorationAccentColor[loc.explorationStatus],
          }
        : undefined;
    const dangerLine =
      loc !== undefined
        ? {
            valueLabel: dangerLabel[loc.dangerLevel],
            accentColor: dangerAccentColor[loc.dangerLevel],
          }
        : undefined;
    return {
      clientX: pointer.x,
      clientY: pointer.y,
      title,
      description,
      coordsLabel,
      metaLines,
      explorationLine,
      dangerLine,
    };
  })();

  useEffect(() => {
    inkStrokesDraftRef.current = inkStrokesDraft;
  }, [inkStrokesDraft]);

  useEffect(() => {
    if (!inkDrawMode) {
      inkDrawRef.current = null;
      inkStrokeRef.current = null;
      const id = window.setTimeout(() => {
        setPreviewInkStroke(null);
      }, 0);
      return () => window.clearTimeout(id);
    }
  }, [inkDrawMode]);

  return (
    <div className="hex-map">
      <div className="hex-map__toolbar">
        <button
          type="button"
          className="hex-btn hex-btn--small"
          onClick={resetView}
        >
          Сброс вида
        </button>
        {inkDrawMode ? (
          <span className="hex-map__ink-hint">
            Рисуйте по карте. Удерживайте Shift — сдвиг карты.
          </span>
        ) : null}
      </div>
      <div
        ref={viewportRef}
        className={
          inkDrawMode
            ? "hex-map__viewport hex-map__viewport--ink"
            : "hex-map__viewport"
        }
        onPointerDown={onViewportPointerDown}
        onPointerMove={onViewportPointerMove}
        onPointerUp={endPointerDrag}
        onPointerCancel={endPointerDrag}
      >
        <div
          ref={worldRef}
          className="hex-map__world"
          style={{
            transform: `translate(${translateX}px, ${translateY}px) scale(${scale})`,
            transformOrigin: "0 0",
            width: mapImageWidthPx,
            height: mapImageHeightPx,
          }}
        >
          <div
            className="hex-map__sheet"
            style={{ width: mapImageWidthPx, height: mapImageHeightPx }}
          >
            <img
              className="hex-map__image"
              src={mapImageSrc}
              width={mapImageWidthPx}
              height={mapImageHeightPx}
              alt="Карта долины Реорит - ДнД в ИЦ"
              draggable={false}
            />
            <HexSvgLayer
              locations={locations}
              hoveredKey={highlightedKey}
              onHoverKeyChange={setMapHoveredKey}
              onPointerClientMove={(x, y) => setPointer({ x, y })}
              previewInkStroke={previewInkStroke}
              previewInkColor={inkPreviewColor}
            />
          </div>
        </div>
      </div>
      {tooltipData ? <HexTooltip {...tooltipData} /> : null}
    </div>
  );
}
