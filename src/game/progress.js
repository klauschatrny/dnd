import { levelNode } from '../domain/data/index.js';

// Estado de progressão do jogador (runtime, persistido em localStorage).
// Guarda quais levels foram concluídos e a melhor nota de cada um.
//
// UNLOCK_ALL: por enquanto TODOS os levels ficam liberados (o usuário quer acesso a
// tudo). Na versão final, basta trocar para `false` para ativar a progressão: um
// level só libera quando algum dos seus `requires` (ver progression.js) é concluído.

export const UNLOCK_ALL = true;

const KEY = 'mhs_progress_v1';
const GRADE_RANK = { S: 5, A: 4, B: 3, C: 2, D: 1 };

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}
function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* localStorage indisponível — segue sem persistir */
  }
}

const state = load();
state.completed ??= {}; // { [mapId]: { bestGrade } }

/** Registro de conclusão de um level (ou null se nunca concluído). */
export function getCompleted(mapId) {
  return state.completed[mapId] ?? null;
}

/** Um level está liberado? (sempre true enquanto UNLOCK_ALL). */
export function isUnlocked(mapId) {
  if (UNLOCK_ALL) return true;
  const node = levelNode(mapId);
  if (!node || node.requires.length === 0) return true;
  return node.requires.some((r) => state.completed[r]);
}

/** Marca um level como concluído, guardando a melhor nota. */
export function markCompleted(mapId, grade) {
  const prev = state.completed[mapId]?.bestGrade;
  if (!prev || (GRADE_RANK[grade] ?? 0) > (GRADE_RANK[prev] ?? 0)) {
    state.completed[mapId] = { bestGrade: grade };
    persist();
  }
}
