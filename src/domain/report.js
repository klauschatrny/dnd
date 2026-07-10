// Sistema de Laudo (CDIS — Camada 5 / CGS §22).
// Compara o que o jogador concluiu (marks) com a solução real do caso (CaseSolution),
// produzindo acertos, irregularidades perdidas, falsos positivos e a nota final.
// Independente de engine.

import { OBJECTS, STATES, CONCLUSIONS } from './data/index.js';

// Conclusões que "acusam" o objeto (marcá-lo como problema).
const FLAGGED = new Set([CONCLUSIONS.SUSPEITO, CONCLUSIONS.ILEGAL]);

/**
 * Avalia o laudo do jogador.
 * @param {object} solution     CaseSolution de generateCase().
 * @param {Record<string,string|null>} marks  poiId -> conclusão do jogador.
 * @param {number} [timeSeconds]
 */
export function evaluateReport(solution, marks = {}, timeSeconds = 0) {
  let encontradas = 0; // irregularidades corretamente acusadas (TP)
  let perdidas = 0; // irregularidades não acusadas (FN)
  let falsosPositivos = 0; // objetos limpos acusados (FP)
  let limposCorretos = 0; // objetos limpos corretamente deixados (TN)

  const breakdown = [];
  for (const o of solution.objects) {
    const player = marks[o.poiId] || CONCLUSIONS.LIMPO;
    const flagged = FLAGGED.has(player);
    let outcome;
    if (o.irregular) {
      if (flagged) {
        encontradas++;
        outcome = 'acerto';
      } else {
        perdidas++;
        outcome = 'perdida';
      }
    } else if (flagged) {
      falsosPositivos++;
      outcome = 'falso_positivo';
    } else {
      limposCorretos++;
      outcome = 'ok';
    }

    breakdown.push({
      poiId: o.poiId,
      label: OBJECTS[o.objectType].label,
      stateLabel: STATES[o.state].label,
      irregular: o.irregular,
      expectedConclusion: o.expectedConclusion,
      playerConclusion: player,
      outcome,
      // "Relevante" para exibição: irregularidades e qualquer acusação do jogador.
      relevant: o.irregular || flagged,
    });
  }

  // Precisão combinada: TP / (TP + FN + FP). Sem irregularidades e sem falsos
  // positivos => caso perfeito (útil para o template de falso alarme).
  const denom = encontradas + perdidas + falsosPositivos;
  const score = denom === 0 ? 1 : encontradas / denom;
  const grade = toGrade(score);

  return {
    grade,
    score,
    stats: {
      totalIrregular: solution.irregularCount,
      encontradas,
      perdidas,
      falsosPositivos,
      limposCorretos,
    },
    breakdown,
    timeSeconds,
  };
}

export function toGrade(score) {
  if (score >= 0.95) return 'S';
  if (score >= 0.8) return 'A';
  if (score >= 0.6) return 'B';
  if (score >= 0.4) return 'C';
  return 'D';
}
