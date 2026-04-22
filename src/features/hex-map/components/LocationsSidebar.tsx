import { useMemo } from "react";
import type { HexLocationData } from "@/entities/hex-map/types";

type LocationsSidebarProps = {
  locations: Record<string, HexLocationData>;
  hoveredLocationKey: string | null;
  onHoveredLocationKeyChange: (key: string | null) => void;
};

export function LocationsSidebar({
  locations,
  hoveredLocationKey,
  onHoveredLocationKeyChange,
}: LocationsSidebarProps) {
  const items = useMemo(() => {
    return Object.entries(locations)
      .map(([key, data]) => ({ key, data }))
      .sort((a, b) => {
        const nameA = a.data.name.trim() || "Без названия";
        const nameB = b.data.name.trim() || "Без названия";
        const cmp = nameA.localeCompare(nameB, "ru");
        if (cmp !== 0) {
          return cmp;
        }
        return a.key.localeCompare(b.key);
      });
  }, [locations]);

  return (
    <aside className="locations-sidebar" aria-label="Список локаций на карте">
      <h2 className="locations-sidebar__title">Открытые Локации</h2>
      <ul className="locations-sidebar__list" role="list">
        {items.map(({ key, data }) => (
          <li
            key={key}
            className="locations-sidebar__item"
            onPointerEnter={() => {
              onHoveredLocationKeyChange(key);
            }}
            onPointerLeave={() => {
              onHoveredLocationKeyChange(null);
            }}
            aria-current={hoveredLocationKey === key ? "true" : undefined}
          >
            <span className="locations-sidebar__name">
              {data.name.trim() || "Без названия"}
            </span>
            <span className="locations-sidebar__coords">{key}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
