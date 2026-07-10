import { describe, it, expect } from 'vitest';
import { createRng } from '../src/domain/rng.js';

describe('createRng', () => {
  it('é determinístico: mesma seed produz a mesma sequência', () => {
    const a = createRng('abc');
    const b = createRng('abc');
    const seqA = Array.from({ length: 10 }, () => a.float());
    const seqB = Array.from({ length: 10 }, () => b.float());
    expect(seqA).toEqual(seqB);
  });

  it('seeds diferentes produzem sequências diferentes', () => {
    const a = createRng(123);
    const b = createRng(124);
    const seqA = Array.from({ length: 10 }, () => a.float());
    const seqB = Array.from({ length: 10 }, () => b.float());
    expect(seqA).not.toEqual(seqB);
  });

  it('aceita seed numérica ou textual equivalentes', () => {
    const a = createRng(42);
    const b = createRng('42');
    expect(a.float()).toBe(b.float());
  });

  it('float fica em [0, 1)', () => {
    const r = createRng('range');
    for (let i = 0; i < 1000; i++) {
      const v = r.float();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int respeita os limites inclusivos', () => {
    const r = createRng('int');
    const seen = new Set();
    for (let i = 0; i < 500; i++) {
      const v = r.int(1, 6);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(6);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it('pickWeighted favorece pesos maiores', () => {
    const r = createRng('weight');
    const items = ['a', 'b'];
    const counts = { a: 0, b: 0 };
    for (let i = 0; i < 2000; i++) {
      counts[r.pickWeighted(items, (x) => (x === 'a' ? 9 : 1))]++;
    }
    expect(counts.a).toBeGreaterThan(counts.b * 3);
  });

  it('sample retorna elementos distintos e na quantidade pedida', () => {
    const r = createRng('sample');
    const out = r.sample([1, 2, 3, 4, 5], 3);
    expect(out).toHaveLength(3);
    expect(new Set(out).size).toBe(3);
  });

  it('shuffle não muta o array original', () => {
    const r = createRng('shuffle');
    const orig = [1, 2, 3, 4, 5];
    const copy = orig.slice();
    r.shuffle(orig);
    expect(orig).toEqual(copy);
  });
});
