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

    // Partição vertical (x=0), com dois vãos: z∈(-1,0) e z∈(1.6,2.6)
    { cx: 0, cz: -2.0, hx: T, hz: 1.0 },
    { cx: 0, cz: 0.8, hx: T, hz: 0.8 },
    { cx: 0, cz: 2.8, hx: T, hz: 0.2 },

    // Partição horizontal (z=1), com dois vãos: x∈(-3.1,-2.1) e x∈(2.1,3.1)
    { cx: -3.55, cz: 1, hx: 0.45, hz: T },
    { cx: 0, cz: 1, hx: 2.1, hz: T },
    { cx: 3.55, cz: 1, hx: 0.45, hz: T },
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
