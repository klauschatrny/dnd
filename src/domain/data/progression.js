// Árvore de progressão dos levels (CDIS: os levels são os imóveis; os casos são
// gerados por seed dentro de cada um). Dado puro, sem engine.
//
// Ordenada em ordem CRESCENTE de número de cômodos — o jogador começa por imóveis
// pequenos e avança para os maiores. Cada nó declara de quais levels ele depende
// (`requires`); vazio = ponto de partida. A progressão é linear por enquanto, mas a
// estrutura de árvore (pai → filhos) permite ramificar no futuro.
//
// O DESBLOQUEIO em si (quem já está liberado) é estado de runtime — ver
// `src/game/progress.js`. Aqui fica apenas a topologia, que é conteúdo.

import { MAPS } from './maps.js';

// Ordena os imóveis por nº de cômodos (empate: por id, para ser determinístico).
const ordered = Object.values(MAPS)
  .map((m) => ({ mapId: m.id, label: m.label, rooms: m.rooms.length }))
  .sort((a, b) => a.rooms - b.rooms || a.mapId.localeCompare(b.mapId));

/**
 * @typedef {Object} LevelNode
 * @property {string} mapId
 * @property {string} label
 * @property {number} rooms      Número de cômodos do imóvel.
 * @property {number} tier       Posição na progressão (0 = inicial).
 * @property {string[]} requires Levels que precisam ser concluídos para liberar este.
 */

/** @type {LevelNode[]} */
export const LEVEL_TREE = ordered.map((n, i) => ({
  mapId: n.mapId,
  label: n.label,
  rooms: n.rooms,
  tier: i,
  requires: i === 0 ? [] : [ordered[i - 1].mapId],
}));

/** Ordem dos levels (ids) na progressão. */
export const LEVEL_ORDER = LEVEL_TREE.map((n) => n.mapId);

/** Primeiro level (sempre liberado). */
export const FIRST_LEVEL = LEVEL_ORDER[0];

/** Nó da árvore de um level. */
export function levelNode(mapId) {
  return LEVEL_TREE.find((n) => n.mapId === mapId) ?? null;
}
