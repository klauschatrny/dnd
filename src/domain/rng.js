// RNG determinístico por seed — núcleo do CDIS.
// A mesma seed sempre produz exatamente a mesma sequência (e, portanto, o mesmo caso).
// Sem dependência de engine: JS puro, testável de forma isolada.

/** Hash de string -> inteiro 32 bits (xmur3), para aceitar seeds textuais. */
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

/** Gerador mulberry32: rápido, determinístico, boa distribuição para jogos. */
function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Cria um RNG determinístico a partir de uma seed (número ou string).
 * @param {number|string} seed
 */
export function createRng(seed) {
  const seedStr = String(seed);
  const seedInt = xmur3(seedStr)();
  const next = mulberry32(seedInt);

  const rng = {
    seed: seedStr,

    /** Float em [0, 1). */
    float: () => next(),

    /** Inteiro em [min, max] inclusive. */
    int(min, max) {
      return Math.floor(next() * (max - min + 1)) + min;
    },

    /** true com probabilidade p (0..1). */
    chance(p) {
      return next() < p;
    },

    /** Escolhe um elemento aleatório do array. */
    pick(array) {
      if (!array || array.length === 0) return undefined;
      return array[Math.floor(next() * array.length)];
    },

    /**
     * Escolha ponderada. weightFn(item) -> número >= 0.
     * @template T
     * @param {T[]} array
     * @param {(item: T) => number} weightFn
     * @returns {T}
     */
    pickWeighted(array, weightFn) {
      const weights = array.map((item) => Math.max(0, weightFn(item)));
      const total = weights.reduce((a, b) => a + b, 0);
      if (total <= 0) return rng.pick(array);
      let r = next() * total;
      for (let i = 0; i < array.length; i++) {
        r -= weights[i];
        if (r < 0) return array[i];
      }
      return array[array.length - 1];
    },

    /** Retorna uma cópia embaralhada (Fisher–Yates), sem mutar o original. */
    shuffle(array) {
      const a = array.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },

    /** Escolhe `count` elementos distintos (sem repetição). */
    sample(array, count) {
      return rng.shuffle(array).slice(0, Math.max(0, Math.min(count, array.length)));
    },
  };

  return rng;
}

/** Gera uma seed numérica "apresentável" (8 dígitos), a partir de aleatoriedade não-determinística. */
export function randomSeed() {
  return Math.floor(Math.random() * 90000000) + 10000000;
}
