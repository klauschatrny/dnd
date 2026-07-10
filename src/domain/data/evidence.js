// Biblioteca de Evidências (CDIS — Camada 3).
// Cada evidência é revelada por UMA ferramenta e tem uma "confiança" (0..1):
// nenhuma evidência isolada confirma uma irregularidade — o jogador cruza pistas.

/** @typedef {'ZOOM'|'FLASHLIGHT'|'UV'|'RF'|'THERMAL'} ToolId */

export const TOOLS = {
  ZOOM: 'ZOOM',
  FLASHLIGHT: 'FLASHLIGHT',
  UV: 'UV',
  RF: 'RF',
  THERMAL: 'THERMAL',
};

export const TOOL_LABELS = {
  ZOOM: 'Zoom',
  FLASHLIGHT: 'Lanterna',
  UV: 'Luz UV',
  RF: 'Detector RF',
  THERMAL: 'Scanner Térmico',
};

/**
 * @typedef {Object} EvidenceDef
 * @property {string} id
 * @property {string} nome
 * @property {ToolId} tool      Ferramenta que revela esta evidência.
 * @property {string} descricao Texto mostrado ao jogador ao registrar.
 * @property {number} confianca Peso de credibilidade (0..1).
 */

/** @type {Record<string, EvidenceDef>} */
export const EVIDENCE = {
  LENS_REFLECTION: {
    id: 'LENS_REFLECTION',
    nome: 'Reflexo de lente',
    tool: TOOLS.ZOOM,
    descricao: 'Um pequeno reflexo circular, típico de uma lente escondida.',
    confianca: 0.7,
  },
  LED: {
    id: 'LED',
    nome: 'LED aceso',
    tool: TOOLS.ZOOM,
    descricao: 'Um ponto de luz fraco, como um LED de status.',
    confianca: 0.5,
  },
  GLUE_RESIDUE: {
    id: 'GLUE_RESIDUE',
    nome: 'Resíduo de cola',
    tool: TOOLS.UV,
    descricao: 'Marcas de cola e manipulação recentes, visíveis sob luz UV.',
    confianca: 0.5,
  },
  RF_SIGNAL: {
    id: 'RF_SIGNAL',
    nome: 'Sinal RF',
    tool: TOOLS.RF,
    descricao: 'Transmissão eletrônica ativa detectada nas proximidades.',
    confianca: 0.6,
  },
  HEAT: {
    id: 'HEAT',
    nome: 'Aquecimento',
    tool: TOOLS.THERMAL,
    descricao: 'Calor incompatível com um objeto desligado.',
    confianca: 0.4,
  },
  HIDDEN_WIRING: {
    id: 'HIDDEN_WIRING',
    nome: 'Fiação oculta',
    tool: TOOLS.FLASHLIGHT,
    descricao: 'Fios que não deveriam estar aqui, revelados pela lanterna.',
    confianca: 0.6,
  },
  SECRET_CAVITY: {
    id: 'SECRET_CAVITY',
    nome: 'Cavidade suspeita',
    tool: TOOLS.FLASHLIGHT,
    descricao: 'Um vão ou compartimento onde deveria ser sólido.',
    confianca: 0.7,
  },
};

/** Lista de ids de evidência. */
export const EVIDENCE_IDS = Object.keys(EVIDENCE);
