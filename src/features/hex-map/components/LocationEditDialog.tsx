import { useEffect, useId, useState } from 'react';
import type {
  Axial,
  HexLocationData,
  LocationDangerLevel,
  LocationExplorationStatus,
  TerrainType,
} from '@/entities/hex-map/types';
import { normalizeOpenedInSession } from '@/entities/hex-map/sanitizeHexRecord';
import { toColorInputValue } from '@/entities/hex-map/inkStroke';

const terrainOptions: { value: TerrainType; label: string }[] = [
  { value: 'plain', label: 'Равнина' },
  { value: 'forest', label: 'Лес' },
  { value: 'mountain', label: 'Горы' },
  { value: 'water', label: 'Вода' },
  { value: 'snow', label: 'Снег / лёд' },
  { value: 'wasteland', label: 'Пустошь' },
  { value: 'settlement', label: 'Поселение' },
  { value: 'other', label: 'Другое' },
];

const explorationOptions: {
  value: LocationExplorationStatus;
  label: string;
}[] = [
  { value: 'unexplored', label: 'Не исследована' },
  { value: 'partial', label: 'Частично исследована' },
  { value: 'explored', label: 'Исследована' },
];

const dangerOptions: { value: LocationDangerLevel; label: string }[] = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' },
  { value: 'deadly', label: 'Смертельно' },
];

type LocationEditDialogProps = {
  axial: Axial;
  initial: HexLocationData | null;
  open: boolean;
  canPersist: boolean;
  inkDrawMode: boolean;
  onInkDrawModeChange: (next: boolean) => void;
  onClearInk: () => void;
  inkColor: string;
  onInkColorChange: (hex: string) => void;
  onClose: () => void;
  onSave: (data: HexLocationData) => void | Promise<void>;
  onClear: () => void | Promise<void>;
};

export function LocationEditDialog({
  axial,
  initial,
  open,
  canPersist,
  inkDrawMode,
  onInkDrawModeChange,
  onClearInk,
  inkColor,
  onInkColorChange,
  onClose,
  onSave,
  onClear,
}: LocationEditDialogProps) {
  const titleId = useId();

  const [name, setName] = useState(() => initial?.name ?? '');
  const [description, setDescription] = useState(
    () => initial?.description ?? ''
  );
  const [terrainType, setTerrainType] = useState<TerrainType>(
    () => initial?.terrainType ?? 'plain'
  );
  const [openedInSession, setOpenedInSession] = useState(
    () => initial?.openedInSession ?? 1
  );
  const [explorationStatus, setExplorationStatus] =
    useState<LocationExplorationStatus>(
      () => initial?.explorationStatus ?? 'unexplored'
    );
  const [dangerLevel, setDangerLevel] = useState<LocationDangerLevel>(
    () => initial?.dangerLevel ?? 'low'
  );
  const [saving, setSaving] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className={
        inkDrawMode
          ? 'hex-dialog-backdrop hex-dialog-backdrop--pass-through'
          : 'hex-dialog-backdrop'
      }
      role="presentation"
    >
      <div
        className="hex-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="hex-dialog__header">
          <h2 id={titleId} className="hex-dialog__title">
            Локация ({axial.q}, {axial.r})
          </h2>
          <button
            type="button"
            className="hex-dialog__close"
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>
        <form
          className="hex-dialog__form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!canPersist) {
              return;
            }
            setFormError(null);
            setSaving(true);
            try {
              await onSave({
                name,
                description,
                terrainType,
                openedInSession: normalizeOpenedInSession(openedInSession),
                explorationStatus,
                dangerLevel,
              });
              onClose();
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Не удалось сохранить';
              setFormError(message);
            } finally {
              setSaving(false);
            }
          }}
        >
          <label className="hex-field">
            <span className="hex-field__label">Название</span>
            <input
              className="hex-field__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="hex-field">
            <span className="hex-field__label">Описание</span>
            <textarea
              className="hex-field__textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>
          <label className="hex-field">
            <span className="hex-field__label">Тип местности</span>
            <select
              className="hex-field__select"
              value={terrainType}
              onChange={(e) =>
                setTerrainType(e.target.value as TerrainType)
              }
            >
              {terrainOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="hex-field">
            <span className="hex-field__label">Открыта в сессии</span>
            <input
              className="hex-field__input"
              type="number"
              min={1}
              step={1}
              inputMode="numeric"
              value={openedInSession}
              onChange={(e) => {
                const v = e.target.value;
                if (v === '') {
                  setOpenedInSession(1);
                  return;
                }
                setOpenedInSession(normalizeOpenedInSession(v));
              }}
            />
          </label>
          <label className="hex-field">
            <span className="hex-field__label">Статус</span>
            <select
              className="hex-field__select"
              value={explorationStatus}
              onChange={(e) =>
                setExplorationStatus(
                  e.target.value as LocationExplorationStatus
                )
              }
            >
              {explorationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <label className="hex-field">
            <span className="hex-field__label">Уровень опасности</span>
            <select
              className="hex-field__select"
              value={dangerLevel}
              onChange={(e) =>
                setDangerLevel(e.target.value as LocationDangerLevel)
              }
            >
              {dangerOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <div className="hex-dialog__ink-block">
            <p className="hex-dialog__ink-title">Рисунок на карте</p>
            <label className="hex-field hex-field--inline-color">
              <span className="hex-field__label">Цвет линий</span>
              <input
                type="color"
                className="hex-field__color"
                value={toColorInputValue(inkColor)}
                onChange={(e) => onInkColorChange(e.target.value.toLowerCase())}
                aria-label="Цвет линий на карте"
              />
            </label>
            <p className="hex-dialog__hint">
              Включите режим и обведите область на карте. Каждое отпускание
              кнопки мыши — отдельная линия. Удерживайте Shift, чтобы сдвинуть
              карту.
            </p>
            <div className="hex-dialog__ink-actions">
              <button
                type="button"
                className={
                  inkDrawMode ? 'hex-btn hex-btn--primary' : 'hex-btn'
                }
                onClick={() => onInkDrawModeChange(!inkDrawMode)}
              >
                {inkDrawMode ? 'Закончить рисование' : 'Рисовать на карте'}
              </button>
              <button
                type="button"
                className="hex-btn"
                onClick={onClearInk}
              >
                Стереть все линии
              </button>
            </div>
          </div>

          {!canPersist && (
            <p className="hex-dialog__hint hex-dialog__hint--warn">
              Сохранение недоступно (ожидался режим разработки).
            </p>
          )}

          {formError !== null && (
            <p className="hex-dialog__hint hex-dialog__hint--error" role="alert">
              {formError}
            </p>
          )}

          <div className="hex-dialog__actions">
            <button
              type="submit"
              className="hex-btn hex-btn--primary"
              disabled={saving || !canPersist}
            >
              {saving ? 'Сохранение…' : 'Сохранить'}
            </button>
            <button
              type="button"
              className="hex-btn"
              disabled={clearing || !canPersist}
              onClick={async () => {
                setFormError(null);
                setClearing(true);
                try {
                  await onClear();
                  onClose();
                } catch (err) {
                  const message =
                    err instanceof Error ? err.message : 'Не удалось очистить';
                  setFormError(message);
                } finally {
                  setClearing(false);
                }
              }}
            >
              {clearing ? 'Очистка…' : 'Очистить гекс'}
            </button>
            <button type="button" className="hex-btn" onClick={onClose}>
              Отмена
            </button>
          </div>
        </form>
      </div>
      {!inkDrawMode ? (
        <div
          className="hex-dialog-backdrop__dim"
          role="presentation"
          aria-hidden="true"
          onClick={onClose}
        />
      ) : null}
    </div>
  );
}
