import { describe, it, expect } from 'vitest';
import { generateCase, DIFFICULTY } from '../src/domain/caseGenerator.js';
import { STATES, OBJECTS } from '../src/domain/data/index.js';

/** Gera vários casos com seeds distintas para testes estatísticos. */
function manyCases(n, opts = {}) {
  return Array.from({ length: n }, (_, i) => generateCase({ seed: 1000 + i, ...opts }));
}

describe('generateCase', () => {
  it('é determinístico: a mesma seed produz exatamente o mesmo caso', () => {
    const a = generateCase({ seed: 84723191 });
    const b = generateCase({ seed: 84723191 });
    expect(a).toEqual(b);
  });

  it('seeds diferentes tendem a produzir casos diferentes', () => {
    const a = JSON.stringify(generateCase({ seed: 1 }).instance);
    const b = JSON.stringify(generateCase({ seed: 2 }).instance);
    expect(a).not.toEqual(b);
  });

  it('todos os POIs do mapa viram objetos (a maioria NORMAL)', () => {
    const { instance } = generateCase({ seed: 5, mapId: 'apartment_01' });
    expect(instance.objects.length).toBe(17);
  });

  it('nunca gera evidências proibidas pelo estado (consistência CGS §18)', () => {
    for (const { instance } of manyCases(300)) {
      for (const o of instance.objects) {
        for (const forbidden of STATES[o.state].forbidden) {
          expect(o.evidences, `${o.poiId} (${o.state})`).not.toContain(forbidden);
        }
      }
    }
  });

  it('todo objeto irregular tem ao menos uma evidência detectável (caso justo CGS §23)', () => {
    for (const { instance } of manyCases(300)) {
      for (const o of instance.objects) {
        if (STATES[o.state].irregular) {
          expect(o.evidences.length, `${o.poiId}`).toBeGreaterThan(0);
        }
      }
    }
  });

  it('respeita a faixa de irregularidades da dificuldade', () => {
    for (const diff of Object.values(DIFFICULTY)) {
      for (const { solution, instance } of manyCases(60, { difficulty: diff.id })) {
        // Falso alarme zera as irregularidades, independentemente da dificuldade.
        if (instance.template === 'FALSO_ALARME') {
          expect(solution.irregularCount).toBe(0);
        } else {
          expect(solution.irregularCount).toBeGreaterThanOrEqual(Math.min(diff.min, 1));
          expect(solution.irregularCount).toBeLessThanOrEqual(diff.max);
        }
      }
    }
  });

  it('o template de falso alarme não produz irregularidades', () => {
    for (const { solution } of manyCases(30, { templateId: 'FALSO_ALARME' })) {
      expect(solution.irregularCount).toBe(0);
    }
  });

  it('o template de câmera escondida só usa câmeras como irregularidade', () => {
    for (const { solution } of manyCases(50, { templateId: 'CAMERA_ESCONDIDA' })) {
      for (const o of solution.objects) {
        if (o.irregular) expect(o.state).toBe('CAMERA');
      }
    }
  });

  it('nunca aplica um estado que o objeto não permite', () => {
    for (const { instance } of manyCases(200)) {
      for (const o of instance.objects) {
        expect(OBJECTS[o.objectType].allowedStates, `${o.poiId}`).toContain(o.state);
      }
    }
  });

  it('distribui irregularidades entre cômodos quando há mais de um', () => {
    // Em dificuldade difícil (muitas irregularidades), espera-se uso de vários cômodos.
    let multiRoomCases = 0;
    let eligibleCases = 0;
    for (const { instance, solution } of manyCases(80, { difficulty: 'dificil' })) {
      if (solution.irregularCount >= 2) {
        eligibleCases++;
        const rooms = new Set(
          instance.objects.filter((o) => STATES[o.state].irregular).map((o) => o.room),
        );
        if (rooms.size >= 2) multiRoomCases++;
      }
    }
    // A grande maioria dos casos com 2+ irregularidades deve espalhar por cômodos.
    expect(multiRoomCases / eligibleCases).toBeGreaterThan(0.7);
  });

  it('sempre inclui uma denúncia não-vazia', () => {
    for (const { instance } of manyCases(50)) {
      expect(instance.denuncia).toBeTruthy();
      expect(typeof instance.denuncia).toBe('string');
    }
  });
});
