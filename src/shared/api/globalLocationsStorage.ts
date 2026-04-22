import type { HexLocationData } from '@/entities/hex-map/types';
import { sanitizeHexLocationsRecord } from '@/entities/hex-map/sanitizeHexRecord';

const JSONBIN_LATEST = (binId: string) =>
  `https://api.jsonbin.io/v3/b/${binId}/latest`;
const JSONBIN_BIN = (binId: string) => `https://api.jsonbin.io/v3/b/${binId}`;

const DEV_SAVE_PATH = '/__dev/save-global-locations';

function readUrl(): string {
  const fromEnv = import.meta.env.VITE_GLOBAL_HEX_JSON_URL;
  if (fromEnv && fromEnv.length > 0) {
    return fromEnv;
  }
  return `${import.meta.env.BASE_URL}global-locations.json`;
}

export function canUseJsonBinForPublish(): boolean {
  const binId = import.meta.env.VITE_JSONBIN_BIN_ID?.trim();
  const masterKey = import.meta.env.VITE_JSONBIN_MASTER_KEY?.trim();
  return Boolean(binId && masterKey);
}

/** Запись в JSON разрешена только в dev (`npm run dev`). */
export function canPersistLocations(): boolean {
  return import.meta.env.DEV;
}

function jsonBinHeaders(forWrite: boolean): HeadersInit {
  const binId = import.meta.env.VITE_JSONBIN_BIN_ID?.trim();
  const masterKey = import.meta.env.VITE_JSONBIN_MASTER_KEY?.trim();
  if (!binId || !masterKey) {
    throw new Error('JSONBin не настроен');
  }
  const headers: Record<string, string> = {
    'X-Master-Key': masterKey,
  };
  if (forWrite) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function parseJsonBinRecord(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== 'object') {
    return {};
  }
  const wrapped = payload as Record<string, unknown>;
  const record = wrapped.record;
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return {};
  }
  return record as Record<string, unknown>;
}

export async function fetchGlobalHexLocations(): Promise<
  Record<string, HexLocationData>
> {
  if (canUseJsonBinForPublish()) {
    const binId = import.meta.env.VITE_JSONBIN_BIN_ID!.trim();
    const res = await fetch(JSONBIN_LATEST(binId), {
      headers: jsonBinHeaders(false),
    });
    if (!res.ok) {
      throw new Error(`JSONBin: не удалось загрузить (${res.status})`);
    }
    const json: unknown = await res.json();
    return sanitizeHexLocationsRecord(parseJsonBinRecord(json));
  }

  const res = await fetch(readUrl(), { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Глобальная карта: ошибка загрузки (${res.status})`);
  }
  const json: unknown = await res.json();
  if (!json || typeof json !== 'object' || Array.isArray(json)) {
    return {};
  }
  return sanitizeHexLocationsRecord(json as Record<string, unknown>);
}

async function putJsonBin(
  data: Record<string, HexLocationData>
): Promise<void> {
  const binId = import.meta.env.VITE_JSONBIN_BIN_ID!.trim();
  const res = await fetch(JSONBIN_BIN(binId), {
    method: 'PUT',
    headers: jsonBinHeaders(true),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      text ? `JSONBin: ${text.slice(0, 200)}` : `JSONBin: ошибка ${res.status}`
    );
  }
}

async function putDevPublicFile(
  data: Record<string, HexLocationData>
): Promise<void> {
  const res = await fetch(DEV_SAVE_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      text ? text.slice(0, 200) : `Ошибка записи в public (${res.status})`
    );
  }
}

export async function putGlobalHexLocations(
  data: Record<string, HexLocationData>
): Promise<void> {
  if (!import.meta.env.DEV) {
    throw new Error(
      'Сохранение локаций доступно только при запуске в режиме разработки (npm run dev)'
    );
  }
  if (canUseJsonBinForPublish()) {
    await putJsonBin(data);
    return;
  }
  await putDevPublicFile(data);
}
