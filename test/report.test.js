import { describe, it, expect } from 'vitest';
import { evaluateReport } from '../src/domain/report.js';
import { generateCase } from '../src/domain/caseGenerator.js';
import { CONCLUSIONS } from '../src/domain/data/index.js';

/** Constrói marks acusando (ILEGAL) exatamente os POIs irregulares da solução. */
function perfectMarks(solution) {
  const marks = {};
  for (const o of solution.objects) {
    if (o.irregular) marks[o.poiId] = CONCLUSIONS.ILEGAL;
  }
  return marks;
}

describe('evaluateReport', () => {
  it('laudo perfeito recebe nota S e zera perdidas/falsos positivos', () => {
    const { solution } = generateCase({ seed: 777, difficulty: 'medio' });
    const r = evaluateReport(solution, perfectMarks(solution));
    expect(r.stats.perdidas).toBe(0);
    expect(r.stats.falsosPositivos).toBe(0);
    expect(r.stats.encontradas).toBe(solution.irregularCount);
    expect(r.grade).toBe('S');
    expect(r.score).toBe(1);
  });

  it('deixar passar uma irregularidade conta como perdida e baixa a nota', () => {
    const { solution } = generateCase({ seed: 777, difficulty: 'medio' });
    const marks = perfectMarks(solution);
    // Remove a primeira acusação.
    const firstIrregular = solution.objects.find((o) => o.irregular);
    delete marks[firstIrregular.poiId];
    const r = evaluateReport(solution, marks);
    expect(r.stats.perdidas).toBe(1);
    expect(r.score).toBeLessThan(1);
  });

  it('acusar um objeto limpo conta como falso positivo', () => {
    const { solution } = generateCase({ seed: 777, difficulty: 'medio' });
    const marks = perfectMarks(solution);
    const clean = solution.objects.find((o) => !o.irregular);
    marks[clean.poiId] = CONCLUSIONS.ILEGAL;
    const r = evaluateReport(solution, marks);
    expect(r.stats.falsosPositivos).toBe(1);
    expect(r.breakdown.find((b) => b.poiId === clean.poiId).outcome).toBe('falso_positivo');
  });

  it('falso alarme sem acusações é laudo perfeito (S)', () => {
    const { solution } = generateCase({ seed: 3, templateId: 'FALSO_ALARME' });
    expect(solution.irregularCount).toBe(0);
    const r = evaluateReport(solution, {});
    expect(r.grade).toBe('S');
    expect(r.score).toBe(1);
  });

  it('falso alarme com uma acusação indevida recebe nota D', () => {
    const { solution } = generateCase({ seed: 3, templateId: 'FALSO_ALARME' });
    const anyPoi = solution.objects[0].poiId;
    const r = evaluateReport(solution, { [anyPoi]: CONCLUSIONS.ILEGAL });
    expect(r.stats.falsosPositivos).toBe(1);
    expect(r.grade).toBe('D');
  });

  it('conclusão PERMITIDO não é acusação (não gera falso positivo)', () => {
    const { solution } = generateCase({ seed: 5 });
    const clean = solution.objects.find((o) => !o.irregular);
    const r = evaluateReport(solution, { [clean.poiId]: CONCLUSIONS.PERMITIDO });
    expect(r.stats.falsosPositivos).toBe(0);
  });
});
