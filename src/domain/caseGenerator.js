// Gerador de Casos (CDIS — Camada 4 / CGS §26).
// Recebe uma seed e produz uma investigação determinística: a mesma seed sempre
// gera exatamente o mesmo caso. Independente de engine (não importa Three.js).
//
// Fluxo (CGS §26), adaptado ao refinamento por templates (Ajuste.txt):
//   mapa -> RNG(seed) -> dificuldade -> template -> POIs elegíveis ->
//   quantidade de irregularidades -> selecionar objetos (distribuídos por cômodo) ->
//   aplicar estados -> gerar evidências compatíveis -> distratores ->
//   denúncia compatível -> CaseInstance + CaseSolution.

import { createRng, randomSeed } from './rng.js';
import { MAPS, OBJECTS, STATES, EVIDENCE, TEMPLATES, DENUNCIAS } from './data/index.js';

/** Faixas de irregularidades por dificuldade (CGS §8). */
export const DIFFICULTY = {
  facil: { id: 'facil', label: 'Fácil', min: 1, max: 2, densityFactor: 1.2 },
  medio: { id: 'medio', label: 'Médio', min: 2, max: 4, densityFactor: 1.0 },
  dificil: { id: 'dificil', label: 'Difícil', min: 4, max: 6, densityFactor: 0.7 },
};

const DISTRACTOR_STATES = Object.values(STATES).filter((s) => s.distractor).map((s) => s.id);

/**
 * @typedef {Object} GenerateOptions
 * @property {number|string} [seed]        Se ausente, gera uma seed aleatória.
 * @property {string} [mapId]              Padrão: 'apartment_01'.
 * @property {string} [difficulty]         'facil' | 'medio' | 'dificil'.
 * @property {string} [templateId]         Força um template específico.
 */

/**
 * Gera um caso completo.
 * @param {GenerateOptions} [options]
 */
export function generateCase(options = {}) {
  const seed = options.seed ?? randomSeed();
  const mapId = options.mapId ?? 'apartment_01';
  const map = MAPS[mapId];
  if (!map) throw new Error(`Mapa desconhecido: ${mapId}`);

  const rng = createRng(seed);

  // 1) Dificuldade
  const difficulty = options.difficulty
    ? DIFFICULTY[options.difficulty]
    : rng.pickWeighted(Object.values(DIFFICULTY), (d) => (d.id === 'facil' ? 3 : d.id === 'medio' ? 2 : 1));

  // 2) Template (identidade do caso)
  const template = options.templateId
    ? TEMPLATES.find((t) => t.id === options.templateId)
    : rng.pickWeighted(TEMPLATES, (t) => t.weight);
  if (!template) throw new Error(`Template desconhecido: ${options.templateId}`);

  // 3) POIs elegíveis para irregularidade (respeitando filtro do template)
  const eligible = map.pois
    .map((poi) => ({ poi, irregularStates: eligibleIrregularStates(poi, template) }))
    .filter((e) => e.irregularStates.length > 0);

  // 4) Quantidade-alvo de irregularidades
  let targetIrregular = template.falseAlarm ? 0 : rng.int(difficulty.min, difficulty.max);
  targetIrregular = Math.min(targetIrregular, eligible.length);

  // 5) Selecionar POIs irregulares distribuídos entre os cômodos (CGS §9)
  const chosen = selectDistributed(rng, eligible, targetIrregular);
  const assignedPoiIds = new Set(chosen.map((c) => c.poi.id));

  // 6) Aplicar estados irregulares + gerar evidências
  const density = clamp01(template.evidenceDensity * difficulty.densityFactor);
  const objects = [];
  for (const { poi, irregularStates } of chosen) {
    const stateId = rng.pick(irregularStates);
    objects.push(buildObject(rng, poi, stateId, density));
  }

  // 7) Distratores (estados normais, porém de aparência suspeita)
  const remaining = map.pois.filter((poi) => !assignedPoiIds.has(poi.id));
  const distractorTarget = Math.round((template.falseAlarm ? rng.int(2, 4) : targetIrregular) * template.distractorRatio);
  const distractorPois = remaining.filter((poi) => poiDistractorStates(poi).length > 0);
  const chosenDistractors = rng.sample(distractorPois, Math.min(distractorTarget, distractorPois.length));
  const distractorSet = new Set(chosenDistractors.map((p) => p.id));
  for (const poi of chosenDistractors) {
    const stateId = rng.pick(poiDistractorStates(poi));
    objects.push(buildObject(rng, poi, stateId, density));
    assignedPoiIds.add(poi.id);
  }

  // 8) Restantes -> NORMAL (com sinais inocentes legítimos, CGS §17)
  for (const poi of map.pois) {
    if (assignedPoiIds.has(poi.id)) continue;
    objects.push(buildObject(rng, poi, 'NORMAL', density));
  }

  // Reordena os objetos na ordem original do mapa (estabilidade para a cena)
  objects.sort((a, b) => map.pois.findIndex((p) => p.id === a.poiId) - map.pois.findIndex((p) => p.id === b.poiId));

  // 9) Denúncia compatível
  const presentCategories = [...new Set(chosen.map(({ poi }) => STATES[objects.find((o) => o.poiId === poi.id).state].category))];
  const denuncia = pickDenuncia(rng, presentCategories);

  // 10) Solução interna (o jogador nunca vê)
  const solution = {
    objects: objects.map((o) => ({
      poiId: o.poiId,
      objectType: o.objectType,
      state: o.state,
      category: STATES[o.state].category,
      irregular: STATES[o.state].irregular,
      expectedConclusion: STATES[o.state].expectedConclusion,
    })),
    irregularCount: objects.filter((o) => STATES[o.state].irregular).length,
  };

  const instance = {
    seed: String(seed),
    mapId,
    difficulty: difficulty.id,
    template: template.id,
    denuncia,
    objects,
  };

  return { instance, solution };
}

// --- helpers ---

/** Estados irregulares que um POI pode assumir, filtrados pelo template. */
function eligibleIrregularStates(poi, template) {
  const allowed = poi.allowedStates ?? OBJECTS[poi.objectType].allowedStates;
  let irregular = allowed.filter((s) => STATES[s].irregular);
  if (template.irregularStates !== null) {
    const filter = new Set(template.irregularStates);
    irregular = irregular.filter((s) => filter.has(s));
  }
  return irregular;
}

/** Estados distratores (normais, porém suspeitos) que um POI pode assumir. */
function poiDistractorStates(poi) {
  const allowed = poi.allowedStates ?? OBJECTS[poi.objectType].allowedStates;
  return allowed.filter((s) => DISTRACTOR_STATES.includes(s));
}

/**
 * Seleciona `count` POIs entre os elegíveis, priorizando a distribuição entre
 * cômodos e respeitando os pesos dos objetos (CGS §9/§10/§11).
 */
function selectDistributed(rng, eligible, count) {
  const chosen = [];
  const roomCounts = {};
  let pool = eligible.slice();
  while (chosen.length < count && pool.length > 0) {
    const minRoom = Math.min(...pool.map((e) => roomCounts[e.poi.room] ?? 0));
    const candidates = pool.filter((e) => (roomCounts[e.poi.room] ?? 0) === minRoom);
    const picked = rng.pickWeighted(candidates, (e) => e.poi.weight ?? OBJECTS[e.poi.objectType].weight);
    chosen.push(picked);
    roomCounts[picked.poi.room] = (roomCounts[picked.poi.room] ?? 0) + 1;
    pool = pool.filter((e) => e.poi.id !== picked.poi.id);
  }
  return chosen;
}

/** Monta a representação de runtime de um objeto (POI + estado + evidências). */
function buildObject(rng, poi, stateId, density) {
  const state = STATES[stateId];
  const objDef = OBJECTS[poi.objectType];
  const evidences = new Set(state.required);

  // Evidências opcionais do estado (variedade por seed).
  for (const e of state.pool) {
    if (rng.chance(density)) evidences.add(e);
  }
  // Sinais legítimos de objetos normais (impedem soluções óbvias — CGS §17).
  if (!state.irregular && objDef.innocentSignals) {
    for (const e of objDef.innocentSignals) evidences.add(e);
  }
  // Garantia de consistência: nunca incluir evidência proibida pelo estado.
  for (const f of state.forbidden) evidences.delete(f);

  return {
    poiId: poi.id,
    objectType: poi.objectType,
    label: objDef.label,
    room: poi.room,
    position: poi.position,
    facing: poi.facing,
    anchor: poi.anchor,
    visual: objDef.visual,
    state: stateId,
    evidences: [...evidences],
  };
}

/** Escolhe uma denúncia compatível com as categorias presentes. */
function pickDenuncia(rng, categories) {
  let candidates = DENUNCIAS.filter((d) => d.categories.some((c) => categories.includes(c)));
  if (candidates.length === 0) {
    // Sem categoria compatível (ex.: falso alarme) -> denúncia vaga.
    candidates = DENUNCIAS.filter((d) => d.categories.length === 0);
  }
  return rng.pick(candidates).texto;
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

/** Resumo textual do caso (depuração). */
export function describeCase({ instance, solution }) {
  const lines = [
    `Seed: ${instance.seed} | Mapa: ${instance.mapId} | Dificuldade: ${instance.difficulty} | Template: ${instance.template}`,
    `Denúncia: ${instance.denuncia}`,
    `Irregularidades: ${solution.irregularCount}`,
  ];
  for (const o of instance.objects) {
    const st = STATES[o.state];
    const flag = st.irregular ? '⚠' : st.distractor ? '·' : ' ';
    const evs = o.evidences.map((e) => EVIDENCE[e].nome).join(', ') || '—';
    lines.push(`  ${flag} ${o.poiId} [${o.label}] = ${st.label} :: ${evs}`);
  }
  return lines.join('\n');
}
