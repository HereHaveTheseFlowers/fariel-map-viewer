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
  const pad = 14;
  const vw =
    typeof window !== 'undefined' ? window.innerWidth : clientX + 320;
  const vh =
    typeof window !== 'undefined' ? window.innerHeight : clientY + 200;
  const widthGuess = 280;
  const heightGuess = 120;
  let left = clientX + pad;
  let top = clientY + pad;
  if (left + widthGuess > vw - 8) {
    left = Math.max(8, clientX - widthGuess - pad);
  }
  if (top + heightGuess > vh - 8) {
    top = Math.max(8, clientY - heightGuess - pad);
  }

  return (
    <div
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
