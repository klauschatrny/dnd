// Geometria das paredes do apartamento (dados puros, sem Three.js) para permitir
// teste de conectividade. Os vãos das partições internas ficam FORA do cruzamento
// central — caso contrário cada parede bloquearia o vão da outra e ilharia cômodos.

export const PLAYER_RADIUS = 0.32;
const T = 0.06; // meia-espessura das paredes

/**
 * Retângulos das paredes {cx,cz,hx,hz} a partir dos limites do mapa.
 * @param {object} map
 */
export function buildWalls(map) {
  const { minX, maxX, minZ, maxZ } = map.bounds;
  const w = maxX - minX;
  const d = maxZ - minZ;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  return [
    // Paredes externas
    { cx, cz: minZ, hx: w / 2, hz: T },
    { cx, cz: maxZ, hx: w / 2, hz: T },
    { cx: minX, cz, hx: T, hz: d / 2 },
    { cx: maxX, cz, hx: T, hz: d / 2 },

    // Partição vertical (x=0), com dois vãos: z∈(-2.2,-1.0) e z∈(1.0,2.2)
    { cx: 0, cz: -3.35, hx: T, hz: 1.15 },
    { cx: 0, cz: 0, hx: T, hz: 1.0 },
    { cx: 0, cz: 3.35, hx: T, hz: 1.15 },

    // Partição horizontal (z=0), com dois vãos: x∈(-4.5,-3.3) e x∈(3.3,4.5)
    { cx: -5.25, cz: 0, hx: 0.75, hz: T },
    { cx: 0, cz: 0, hx: 3.3, hz: T },
    { cx: 5.25, cz: 0, hx: 0.75, hz: T },
  ];
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
