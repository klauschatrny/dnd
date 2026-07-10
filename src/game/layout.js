// Geometria das paredes (dados puros, sem Three.js) para permitir teste de
// conectividade. As paredes EXTERNAS são derivadas dos limites do mapa; as paredes
// INTERNAS (partições com vãos de porta) vêm de `map.walls` — cada mapa declara as
// suas, o que permite plantas diferentes por level. Os vãos devem ficar fora dos
// cruzamentos entre partições, senão uma parede bloqueia o vão da outra e ilha o cômodo.

export const PLAYER_RADIUS = 0.32;
export const WALL_T = 0.06; // meia-espessura padrão das paredes (para autorar map.walls)
const T = WALL_T;

/**
 * Retângulos das paredes {cx,cz,hx,hz}: externas (dos limites) + internas (map.walls).
 * @param {object} map
 */
export function buildWalls(map) {
  const { minX, maxX, minZ, maxZ } = map.bounds;
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  const external = [
    { cx, cz: minZ, hx: w / 2, hz: T },
    { cx, cz: maxZ, hx: w / 2, hz: T },
    { cx: minX, cz, hx: T, hz: d / 2 },
    { cx: maxX, cz, hx: T, hz: d / 2 },
  ];

  return external.concat(map.walls ?? []);
}

/** Converte um retângulo de parede em AABB {minX,maxX,minZ,maxZ}. */
export function wallToAABB(wd) {
  return {
    minX: wd.cx - wd.hx,
    maxX: wd.cx + wd.hx,
    minZ: wd.cz - wd.hz,
    maxZ: wd.cz + wd.hz,
  };
}

/** Colisores (AABBs) do mapa. */
export function buildColliders(map) {
  return buildWalls(map).map(wallToAABB);
}
