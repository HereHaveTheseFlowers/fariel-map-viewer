import { useCallback, useEffect, useState } from 'react';
import type { HexLocationData } from '@/entities/hex-map/types';
import {
  canPersistLocations,
  fetchGlobalHexLocations,
  putGlobalHexLocations,
} from '@/shared/api/globalLocationsStorage';

export function useGlobalHexLocations() {
  const [globalLocations, setGlobalLocations] = useState<
    Record<string, HexLocationData>
  >({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'ready'>(
    'idle'
  );

  const load = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const data = await fetchGlobalHexLocations();
      setGlobalLocations(data);
      setLoadState('ready');
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Не удалось загрузить общую карту';
      setLoadError(message);
      setLoadState('ready');
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(handle);
  }, [load]);

  const setGlobalAndPersist = useCallback(
    async (next: Record<string, HexLocationData>) => {
      await putGlobalHexLocations(next);
      setGlobalLocations(next);
    },
    []
  );

  return {
    globalLocations,
    loadGlobalError: loadError,
    globalLoadState: loadState,
    refetchGlobal: load,
    setGlobalAndPersist,
    canPersistLocations: canPersistLocations(),
  };
}
