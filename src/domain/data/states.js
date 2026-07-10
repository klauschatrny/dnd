// Biblioteca de Estados (CDIS — Camadas 2/3).
// Cada estado define: a categoria, se é irregularidade, a conclusão correta esperada,
// e QUAIS evidências são compatíveis (regras de consistência do CGS §18).
//
// - required:  evidências que SEMPRE aparecem (garante o caso resolvível/justo).
// - pool:      evidências opcionais que PODEM aparecer (variedade entre seeds).
// - forbidden: evidências que NUNCA podem aparecer (consistência).
//
// Regras de consistência inegociáveis (CGS §18):
//   Câmera sempre tem lente (LENS_REFLECTION required).
//   Microfone nunca reflete lente (LENS_REFLECTION forbidden).
//   Espelho falso nunca emite RF (RF_SIGNAL forbidden).

export const CATEGORIES = {
  DISPOSITIVO_ILEGAL: 'DISPOSITIVO_ILEGAL',
  ESTRUTURA_ADULTERADA: 'ESTRUTURA_ADULTERADA',
  COMPARTIMENTO_SECRETO: 'COMPARTIMENTO_SECRETO',
  EQUIPAMENTO_PERMITIDO: 'EQUIPAMENTO_PERMITIDO',
  NORMAL: 'NORMAL',
};

// Conclusões que o jogador atribui no laudo (GDD §5.4).
export const CONCLUSIONS = {
  LIMPO: 'LIMPO', // Sem irregularidade
  PERMITIDO: 'PERMITIDO', // Equipamento permitido
  SUSPEITO: 'SUSPEITO', // Equipamento suspeito
  ILEGAL: 'ILEGAL', // Equipamento ilegal
};

export const CONCLUSION_LABELS = {
  LIMPO: 'Sem irregularidade',
  PERMITIDO: 'Equipamento permitido',
  SUSPEITO: 'Equipamento suspeito',
  ILEGAL: 'Equipamento ilegal',
};

/**
 * @typedef {Object} StateDef
 * @property {string} id
 * @property {string} label
 * @property {string} category
 * @property {boolean} irregular          Deve ser sinalizado pelo jogador?
 * @property {string} expectedConclusion  Conclusão "correta" para o laudo.
 * @property {string[]} required          Evidências sempre presentes.
 * @property {string[]} pool              Evidências opcionais.
 * @property {string[]} forbidden         Evidências proibidas (consistência).
 * @property {boolean} [distractor]       Estado normal, porém de aparência suspeita.
 */

/** @type {Record<string, StateDef>} */
export const STATES = {
  NORMAL: {
    id: 'NORMAL',
    label: 'Normal',
    category: CATEGORIES.NORMAL,
    irregular: false,
    expectedConclusion: CONCLUSIONS.LIMPO,
    required: [],
    pool: [],
    forbidden: [],
  },

  // --- Dispositivos ilegais ---
  CAMERA: {
    id: 'CAMERA',
    label: 'Câmera escondida',
    category: CATEGORIES.DISPOSITIVO_ILEGAL,
    irregular: true,
    expectedConclusion: CONCLUSIONS.ILEGAL,
    required: ['LENS_REFLECTION'],
    pool: ['RF_SIGNAL', 'HEAT', 'LED', 'GLUE_RESIDUE'],
    forbidden: [],
  },
  MICROPHONE: {
    id: 'MICROPHONE',
    label: 'Microfone escondido',
    category: CATEGORIES.DISPOSITIVO_ILEGAL,
    irregular: true,
    expectedConclusion: CONCLUSIONS.ILEGAL,
    required: ['RF_SIGNAL'],
    pool: ['HEAT', 'GLUE_RESIDUE'],
    forbidden: ['LENS_REFLECTION'], // microfone nunca reflete lente
  },
  TRACKER: {
    id: 'TRACKER',
    label: 'Rastreador',
    category: CATEGORIES.DISPOSITIVO_ILEGAL,
    irregular: true,
    expectedConclusion: CONCLUSIONS.ILEGAL,
    required: ['RF_SIGNAL'],
    pool: ['HEAT', 'GLUE_RESIDUE'],
    forbidden: ['LENS_REFLECTION'],
  },

  // --- Estruturas adulteradas ---
  FALSE_MIRROR: {
    id: 'FALSE_MIRROR',
    label: 'Espelho falso',
    category: CATEGORIES.ESTRUTURA_ADULTERADA,
    irregular: true,
    expectedConclusion: CONCLUSIONS.ILEGAL,
    required: ['SECRET_CAVITY'],
    pool: ['GLUE_RESIDUE', 'LENS_REFLECTION'],
    forbidden: ['RF_SIGNAL'], // espelho falso não emite RF
  },
  MODIFIED_OUTLET: {
    id: 'MODIFIED_OUTLET',
    label: 'Tomada modificada',
    category: CATEGORIES.ESTRUTURA_ADULTERADA,
    irregular: true,
    expectedConclusion: CONCLUSIONS.ILEGAL,
    required: ['HIDDEN_WIRING'],
    pool: ['RF_SIGNAL', 'HEAT', 'GLUE_RESIDUE'],
    forbidden: [],
  },

  // --- Compartimentos secretos ---
  SECRET_COMPARTMENT: {
    id: 'SECRET_COMPARTMENT',
    label: 'Compartimento secreto',
    category: CATEGORIES.COMPARTIMENTO_SECRETO,
    irregular: true,
    expectedConclusion: CONCLUSIONS.SUSPEITO,
    required: ['SECRET_CAVITY'],
    pool: ['GLUE_RESIDUE', 'HIDDEN_WIRING'],
    forbidden: ['RF_SIGNAL', 'LENS_REFLECTION'],
  },

  // --- Equipamento permitido (marcar como ilegal = falso positivo) ---
  ALLOWED_CAMERA: {
    id: 'ALLOWED_CAMERA',
    label: 'Câmera externa permitida',
    category: CATEGORIES.EQUIPAMENTO_PERMITIDO,
    irregular: false,
    expectedConclusion: CONCLUSIONS.PERMITIDO,
    required: ['LENS_REFLECTION'],
    pool: ['HEAT', 'LED'],
    forbidden: [],
  },

  // --- Distratores: normais, porém de aparência suspeita ---
  OLD_MODEL: {
    id: 'OLD_MODEL',
    label: 'Modelo antigo',
    category: CATEGORIES.NORMAL,
    irregular: false,
    expectedConclusion: CONCLUSIONS.LIMPO,
    required: [],
    pool: ['HEAT'],
    forbidden: [],
    distractor: true,
  },
  WORN_OUTLET: {
    id: 'WORN_OUTLET',
    label: 'Tomada desgastada',
    category: CATEGORIES.NORMAL,
    irregular: false,
    expectedConclusion: CONCLUSIONS.LIMPO,
    required: [],
    pool: ['HEAT'],
    forbidden: [],
    distractor: true,
  },
  VISUAL_DEFECT: {
    id: 'VISUAL_DEFECT',
    label: 'Defeito visual',
    category: CATEGORIES.NORMAL,
    irregular: false,
    expectedConclusion: CONCLUSIONS.LIMPO,
    required: [],
    pool: [],
    forbidden: [],
    distractor: true,
  },
};

export const STATE_IDS = Object.keys(STATES);

/** Estados que representam irregularidades reais (usados pelo gerador). */
export const IRREGULAR_STATE_IDS = STATE_IDS.filter((id) => STATES[id].irregular);
