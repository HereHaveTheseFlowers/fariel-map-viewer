import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Axial,
  HexLocationData,
  MapInkPoint,
} from "@/entities/hex-map/types";
import { axialKey, parseAxialKey } from "@/entities/hex-map/types";
import {
  defaultInkStrokeColor,
  toColorInputValue,
} from "@/entities/hex-map/inkStroke";
import { HexMapView } from "@/features/hex-map/components/HexMapView";
import { LocationsSidebar } from "@/features/hex-map/components/LocationsSidebar";
import { LocationEditDialog } from "@/features/hex-map/components/LocationEditDialog";
import { useGlobalHexLocations } from "@/features/hex-map/useGlobalHexLocations";

const isDev = import.meta.env.DEV;

function App() {
  const {
    globalLocations,
    loadGlobalError,
    setGlobalAndPersist,
    canPersistLocations,
  } = useGlobalHexLocations();

  const [editingAxial, setEditingAxial] = useState<Axial | null>(null);
  const [inkDrawMode, setInkDrawMode] = useState(false);
  const [editingInkStrokes, setEditingInkStrokes] = useState<MapInkPoint[][]>(
    []
  );
  const [editingInkColor, setEditingInkColor] = useState(defaultInkStrokeColor);
  const [hoveredSidebarLocationKey, setHoveredSidebarLocationKey] = useState<
    string | null
  >(null);
  const inkSessionKeyRef = useRef<string | null>(null);

  const onHexClick = useCallback(
    (key: string) => {
      if (!isDev || editingAxial !== null) {
        return;
      }
      const axial = parseAxialKey(key);
      if (!axial) {
        return;
      }
      setEditingAxial(axial);
    },
    [editingAxial]
  );

  const editingKey = editingAxial !== null ? axialKey(editingAxial) : null;

  useEffect(() => {
    if (editingKey === null) {
      inkSessionKeyRef.current = null;
      return;
    }
    if (inkSessionKeyRef.current === editingKey) {
      return;
    }
    inkSessionKeyRef.current = editingKey;
    const loc = globalLocations[editingKey];
    setEditingInkStrokes(loc?.inkStrokes ?? []);
    setEditingInkColor(toColorInputValue(loc?.inkStrokeColor));
    setInkDrawMode(false);
  }, [editingKey, globalLocations]);

  const displayLocations = useMemo(() => {
    if (editingKey === null) {
      return globalLocations;
    }
    const prev = globalLocations[editingKey];
    const ink = editingInkStrokes.length > 0 ? editingInkStrokes : undefined;
    return {
      ...globalLocations,
      [editingKey]: {
        name: prev?.name ?? "",
        description: prev?.description ?? "",
        terrainType: prev?.terrainType ?? "plain",
        openedInSession: prev?.openedInSession ?? 1,
        explorationStatus: prev?.explorationStatus ?? "unexplored",
        dangerLevel: prev?.dangerLevel ?? "low",
        inkStrokeColor:
          editingInkColor === defaultInkStrokeColor
            ? undefined
            : editingInkColor,
        inkStrokes: ink,
      },
    };
  }, [editingKey, editingInkStrokes, globalLocations]);

  const onInkStrokesDraftChange = useCallback((next: MapInkPoint[][]) => {
    setEditingInkStrokes(next);
  }, []);

  const initialEditing =
    editingKey !== null ? globalLocations[editingKey] ?? null : null;

  return (
    <div className="app-root">
      <header className="app-header">
        <h1 className="app-title">Карта долины Реорит - ДнД в ИЦ</h1>
        {loadGlobalError !== null && (
          <p className="app-banner app-banner--warn" role="status">
            {loadGlobalError}
          </p>
        )}
      </header>
      <div className="app-map-layout">
        <HexMapView
          locations={displayLocations}
          externalHoveredKey={hoveredSidebarLocationKey}
          onHexClick={isDev ? onHexClick : undefined}
          inkDrawMode={inkDrawMode && editingAxial !== null}
          inkStrokesDraft={editingInkStrokes}
          onInkStrokesDraftChange={onInkStrokesDraftChange}
          inkPreviewColor={editingInkColor}
        />
        <LocationsSidebar
          locations={displayLocations}
          hoveredLocationKey={hoveredSidebarLocationKey}
          onHoveredLocationKeyChange={setHoveredSidebarLocationKey}
        />
      </div>
      {isDev && (
        <LocationEditDialog
          key={editingKey ?? "closed"}
          axial={editingAxial ?? { q: 0, r: 0 }}
          initial={initialEditing}
          open={editingAxial !== null}
          canPersist={canPersistLocations}
          inkDrawMode={inkDrawMode}
          onInkDrawModeChange={setInkDrawMode}
          onClearInk={() => setEditingInkStrokes([])}
          inkColor={editingInkColor}
          onInkColorChange={setEditingInkColor}
          onClose={() => setEditingAxial(null)}
          onSave={async (data: HexLocationData) => {
            if (!editingAxial) {
              return;
            }
            const payload: HexLocationData = {
              ...data,
              inkStrokes:
                editingInkStrokes.length > 0 ? editingInkStrokes : undefined,
              ...(editingInkColor !== defaultInkStrokeColor
                ? { inkStrokeColor: editingInkColor }
                : {}),
            };
            const key = axialKey(editingAxial);
            await setGlobalAndPersist({
              ...globalLocations,
              [key]: payload,
            });
          }}
          onClear={async () => {
            if (!editingAxial) {
              return;
            }
            const key = axialKey(editingAxial);
            const next = { ...globalLocations };
            delete next[key];
            await setGlobalAndPersist(next);
          }}
        />
      )}
    </div>
  );
}

export default App;
