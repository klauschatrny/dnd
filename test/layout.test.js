import { describe, it, expect } from 'vitest';
import { buildColliders, PLAYER_RADIUS, worldBounds } from '../src/game/layout.js';
import { MAPS } from '../src/domain/data/index.js';

// Flood-fill numa grade do piso para garantir que todos os cômodos são acessíveis
// a partir do spawn, considerando o raio de colisão do jogador. Trava o bug de
// vãos de porta mal posicionados que ilham cômodos. Roda para TODO mapa, então
// qualquer level novo é validado automaticamente ao ser adicionado.

const R = PLAYER_RADIUS;
const CELL = 0.1;

function makeBlocked(map, colliders) {
  const { minX, maxX, minZ, maxZ } = worldBounds(map);
  return (x, z) => {
    if (x < minX + R || x > maxX - R || z < minZ + R || z > maxZ - R) return true;
    for (const c of colliders) {
      if (x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R) return true;
    }
    return false;
  };
}

function reachableFrom(map, blocked, sx, sz) {
  const { minX, maxX, minZ, maxZ } = worldBounds(map);
  const cols = Math.round((maxX - minX) / CELL);
  const rows = Math.round((maxZ - minZ) / CELL);
  const key = (i, j) => `${i},${j}`;
  const toCell = (x, z) => [Math.round((x - minX) / CELL), Math.round((z - minZ) / CELL)];
  const toPos = (i, j) => [minX + i * CELL, minZ + j * CELL];

  const [si, sj] = toCell(sx, sz);
  const visited = new Set([key(si, sj)]);
  const queue = [[si, sj]];
  while (queue.length) {
    const [i, j] = queue.shift();
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ni = i + di;
      const nj = j + dj;
      if (ni < 0 || nj < 0 || ni > cols || nj > rows) continue;
      const k = key(ni, nj);
      if (visited.has(k)) continue;
      const [x, z] = toPos(ni, nj);
      if (blocked(x, z)) continue;
      visited.add(k);
      queue.push([ni, nj]);
    }
  }
  return visited;
}

for (const map of Object.values(MAPS)) {
  describe(`conectividade — ${map.id}`, () => {
    const colliders = buildColliders(map);
    const blocked = makeBlocked(map, colliders);
    // Com exterior, o spawn é na rua; sem, é dentro do imóvel.
    const [sx, , sz] = (map.exterior?.spawn ?? map.spawn).position;

    it('o ponto de spawn é caminhável', () => {
      expect(blocked(sx, sz)).toBe(false);
    });

    it('o centro de todos os cômodos é alcançável a partir do spawn', () => {
      const reachable = reachableFrom(map, blocked, sx, sz);
      const { minX, minZ } = worldBounds(map);
      const toKey = (x, z) => `${Math.round((x - minX) / CELL)},${Math.round((z - minZ) / CELL)}`;
      for (const room of map.rooms) {
        const rcx = (room.rect.minX + room.rect.maxX) / 2;
        const rcz = (room.rect.minZ + room.rect.maxZ) / 2;
        expect(blocked(rcx, rcz), `centro de ${room.id} está numa parede`).toBe(false);
        expect(reachable.has(toKey(rcx, rcz)), `${room.id} inacessível do spawn`).toBe(true);
      }
    });
  });
}
