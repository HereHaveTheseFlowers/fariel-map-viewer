import type { Axial } from "@/entities/hex-map/types";

/** Размеры растровой карты (должны совпадать с world-map.webp). */
export const mapImageWidthPx = 7110;
export const mapImageHeightPx = 4000;

/**
 * Сетка изначально подгонялась под 1024×576; при смене разрешения сохраняем
 * те же пропорции (средний масштаб по ширине и высоте — стороны почти совпадают).
 */
const legacyBaseWidth = 1024;
const legacyBaseHeight = 576;
const layoutScale =
  (mapImageWidthPx / legacyBaseWidth + mapImageHeightPx / legacyBaseHeight) / 2;

/**
 * Доля от «базового» размера гекса. Меньше 1 — плотнее сетка на том же растре.
 * (Старый вариант соответствует 1.)
 */
const hexSizeFactor = 0.35;

/** Радиус гекса: расстояние от центра до вершины (pointy-top). */
export const hexRadiusPx = 26 * layoutScale * hexSizeFactor;

/** Смещение сетки: пиксель центра гекса (0,0). */
export const hexGridOriginPx = {
  x: 36 * layoutScale,
  y: 34 * layoutScale,
};

export const mapImageSrc = "/world-map.webp";

/** Стартовый кадр: гекс в центре экрана и базовый масштаб (чуть дальше, чем 1). */
export const defaultViewAxial: Axial = { q: 40, r: 12 };
export const defaultViewScale = 0.4;
