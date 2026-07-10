import { describe, it, expect } from 'vitest';
import { LEVEL_TREE, LEVEL_ORDER, FIRST_LEVEL, levelNode, MAPS } from '../src/domain/data/index.js';

// A árvore de progressão precisa cobrir todos os mapas, estar em ordem crescente de
// cômodos e formar uma cadeia consistente de dependências (requires).

describe('árvore de progressão', () => {
  it('inclui todos os mapas exatamente uma vez', () => {
    expect(LEVEL_ORDER.slice().sort()).toEqual(Object.keys(MAPS).sort());
  });

  it('está em ordem crescente de número de cômodos', () => {
    const rooms = LEVEL_TREE.map((n) => n.rooms);
    for (let i = 1; i < rooms.length; i++) {
      expect(rooms[i]).toBeGreaterThanOrEqual(rooms[i - 1]);
    }
  });

  it('rooms de cada nó bate com o mapa correspondente', () => {
    for (const n of LEVEL_TREE) {
      expect(n.rooms).toBe(MAPS[n.mapId].rooms.length);
    }
  });

  it('o primeiro level não tem pré-requisitos e os demais dependem do anterior', () => {
    expect(FIRST_LEVEL).toBe(LEVEL_ORDER[0]);
    expect(levelNode(FIRST_LEVEL).requires).toEqual([]);
    for (let i = 1; i < LEVEL_TREE.length; i++) {
      expect(LEVEL_TREE[i].requires).toEqual([LEVEL_ORDER[i - 1]]);
    }
  });
});
