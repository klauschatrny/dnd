// Geometria das paredes (dados puros, sem Three.js) para permitir teste de
// conectividade. As paredes EXTERNAS são derivadas dos limites do mapa; as paredes
// INTERNAS (partições com vãos de porta) vêm de `map.walls` — cada mapa declara as
// suas, o que permite plantas diferentes por level. Os vãos devem ficar fora dos
// cruzamentos entre partições, senão uma parede bloqueia o vão da outra e ilha o cômodo.

export const PLAYER_RADIUS = 0.32;
export const WALL_T = 0.06; // meia-espessura padrão das paredes (para autorar map.walls)
const T = WALL_T;

/**
 * Limites em que o jogador anda. Com exterior, é a clareira externa; sem, o próprio
 * imóvel. (As paredes da casa continuam derivadas de `map.bounds`.)
 */
export function worldBounds(map) {
  return map.exterior?.bounds ?? map.bounds;
}

/**
 * Segmenta uma parede de perímetro deixando vãos (aberturas) — ex.: a porta da
 * frente. `orient='x'` = parede vertical (x fixo, varia z); `'z'` = horizontal.
 */
function sideSegments(fixed, spanMin, spanMax, openings, orient) {
  const gaps = openings.map((o) => [o.from, o.to]).sort((a, b) => a[0] - b[0]);
  const segs = [];
  let cursor = spanMin;
  for (const [f, t] of gaps) {
    if (f > cursor) segs.push([cursor, Math.min(f, spanMax)]);
    cursor = Math.max(cursor, t);
  }
  if (cursor < spanMax) segs.push([cursor, spanMax]);
  return segs.map(([a, b]) => {
    const c = (a + b) / 2;
    const half = (b - a) / 2;
    return orient === 'x' ? { cx: fixed, cz: c, hx: T, hz: half } : { cx: c, cz: fixed, hx: half, hz: T };
  });
}

/**
 * Retângulos das paredes {cx,cz,hx,hz}: externas (dos limites, com aberturas de
 * `map.openings`) + internas (map.walls).
 * @param {object} map
 */
export function buildWalls(map) {
  const { minX, maxX, minZ, maxZ } = map.bounds;
  const openings = map.openings ?? [];
  const onSide = (s) => openings.filter((o) => o.side === s);

  const external = [
    ...sideSegments(minZ, minX, maxX, onSide('north'), 'z'),
    ...sideSegments(maxZ, minX, maxX, onSide('south'), 'z'),
    ...sideSegments(minX, minZ, maxZ, onSide('west'), 'x'),
    ...sideSegments(maxX, minZ, maxZ, onSide('east'), 'x'),
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
