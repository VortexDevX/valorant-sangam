export const MAP_POOL = [
  "abyss",
  "ascent",
  "bind",
  "breeze",
  "corrode",
  "fracture",
  "haven",
  "icebox",
  "lotus",
  "pearl",
  "split",
  "sunset",
] as const;

export type MapId = (typeof MAP_POOL)[number];

export interface MapMeta {
  id: MapId;
  label: string;
  imagePath: string;
}

export const MAPS: MapMeta[] = MAP_POOL.map((mapId) => ({
  id: mapId,
  label: mapId.charAt(0).toUpperCase() + mapId.slice(1),
  imagePath: `/maps/${mapId}.png`,
}));

export const MAP_LOOKUP = Object.fromEntries(
  MAPS.map((mapMeta) => [mapMeta.id, mapMeta]),
) as Record<MapId, MapMeta>;

export function isMapId(value: string): value is MapId {
  return MAP_POOL.includes(value as MapId);
}
