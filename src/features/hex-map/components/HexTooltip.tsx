import { useLayoutEffect, useRef, useState } from "react";

type HexTooltipProps = {
  clientX: number;
  clientY: number;
  title: string;
  description: string;
  coordsLabel: string;
  /** Доп. строки под заголовком (например, сессия). */
  metaLines?: string[];
  /** Статус исследования: ярче, если не разведано (интерес к походу). */
  explorationLine?: { valueLabel: string; accentColor: string };
  /** Подпись «Уровень опасности» и значение с цветом и лёгким свечением. */
  dangerLine?: { valueLabel: string; accentColor: string };
};

const edgeMargin = 8;
const pointerPad = 14;

function guessedPosition(clientX: number, clientY: number) {
  const widthGuess = 400;
  const heightGuess = 140;
  const vw =
    typeof window !== "undefined" ? window.innerWidth : clientX + widthGuess;
  const vh =
    typeof window !== "undefined" ? window.innerHeight : clientY + heightGuess;

  let left = clientX + pointerPad;
  let top = clientY + pointerPad;
  if (left + widthGuess > vw - edgeMargin) {
    left = Math.max(edgeMargin, clientX - widthGuess - pointerPad);
  }
  if (top + heightGuess > vh - edgeMargin) {
    top = Math.max(edgeMargin, clientY - heightGuess - pointerPad);
  }

  return { left, top };
}

function tooltipLeftTopAfterMeasure(
  clientX: number,
  clientY: number,
  width: number,
  height: number,
  vw: number,
  vh: number,
) {
  let left = clientX + pointerPad;
  let top = clientY + pointerPad;

  if (left + width > vw - edgeMargin) {
    left = clientX - width - pointerPad;
  }
  if (top + height > vh - edgeMargin) {
    top = clientY - height - pointerPad;
  }

  left = Math.max(edgeMargin, Math.min(left, vw - width - edgeMargin));
  top = Math.max(edgeMargin, Math.min(top, vh - height - edgeMargin));

  return { left, top };
}

export function HexTooltip({
  clientX,
  clientY,
  title,
  description,
  coordsLabel,
  metaLines,
  explorationLine,
  dangerLine,
}: HexTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const guess = guessedPosition(clientX, clientY);
  const [{ left, top }, setCoords] = useState(guess);

  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!el || typeof window === "undefined") {
      return;
    }

    const { width, height } = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const next = tooltipLeftTopAfterMeasure(
      clientX,
      clientY,
      width,
      height,
      vw,
      vh,
    );
    setCoords((prev) => {
      if (prev.left === next.left && prev.top === next.top) {
        return prev;
      }
      return next;
    });
  }, [
    clientX,
    clientY,
    title,
    description,
    coordsLabel,
    metaLines,
    explorationLine,
    dangerLine,
  ]);

  return (
    <div
      ref={tooltipRef}
      className="hex-tooltip"
      style={{ left, top }}
      role="status"
      aria-live="polite"
    >
      <div className="hex-tooltip__coords">{coordsLabel}</div>
      <div className="hex-tooltip__title">{title}</div>
      {metaLines !== undefined && metaLines.length > 0 ? (
        <div className="hex-tooltip__meta">
          {metaLines.map((line, i) => (
            <div key={`${i}-${line}`}>{line}</div>
          ))}
        </div>
      ) : null}
      {explorationLine !== undefined ? (
        <div className="hex-tooltip__exploration">
          <span className="hex-tooltip__exploration-label">Статус: </span>
          <span
            className="hex-tooltip__exploration-value"
            style={{
              color: explorationLine.accentColor,
              textShadow: `0 0 12px ${explorationLine.accentColor}77`,
            }}
          >
            {explorationLine.valueLabel}
          </span>
        </div>
      ) : null}
      {dangerLine !== undefined ? (
        <div className="hex-tooltip__danger">
          <span className="hex-tooltip__danger-label">Уровень опасности: </span>
          <span
            className="hex-tooltip__danger-value"
            style={{
              color: dangerLine.accentColor,
              textShadow: `0 0 10px ${dangerLine.accentColor}66`,
            }}
          >
            {dangerLine.valueLabel}
          </span>
        </div>
      ) : null}
      {description ? (
        <p className="hex-tooltip__desc">{description}</p>
      ) : (
        <p className="hex-tooltip__desc hex-tooltip__desc--muted">
          Нет описания
        </p>
      )}
    </div>
  );
}
