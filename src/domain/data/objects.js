// Biblioteca de Objetos (CDIS — Camada 2).
// Cada tipo de objeto conhece apenas seus estados possíveis e um peso de geração.
// `innocentSignals` = evidências legítimas que uma versão NORMAL emite (CGS §17),
// impedindo soluções óbvias (ex.: TV/roteador esquentam e emitem RF).
//
// `visual` são dados puros (forma/tamanho/cor/ancoragem) lidos pela camada 3D.
// Mantido aqui como dado — não há dependência de engine.

/**
 * @typedef {Object} ObjectDef
 * @property {string} id
 * @property {string} label
 * @property {number} weight               Objetos comuns têm peso maior (CGS §11).
 * @property {string[]} allowedStates      Estados válidos para este objeto.
 * @property {string[]} [innocentSignals]  Evidências legítimas quando NORMAL.
 * @property {Object} visual               Dicas para a renderização.
 * @property {'box'|'cylinder'|'sphere'|'panel'} visual.shape
 * @property {[number,number,number]} visual.size  Dimensões em metros.
 * @property {number} visual.color         Cor base (hex).
 * @property {'floor'|'wall'|'ceiling'|'surface'} visual.anchor  Onde costuma ficar.
 */

/** @type {Record<string, ObjectDef>} */
export const OBJECTS = {
  clock: {
    id: 'clock',
    label: 'Relógio',
    weight: 10,
    allowedStates: ['NORMAL', 'CAMERA', 'MICROPHONE', 'SECRET_COMPARTMENT', 'OLD_MODEL'],
    visual: { shape: 'cylinder', size: [0.22, 0.22, 0.05], color: 0x3b3b45, anchor: 'wall' },
  },
  smokeDetector: {
    id: 'smokeDetector',
    label: 'Detector de fumaça',
    weight: 8,
    allowedStates: ['NORMAL', 'CAMERA', 'MICROPHONE', 'OLD_MODEL'],
    visual: { shape: 'cylinder', size: [0.14, 0.14, 0.05], color: 0xf0f0f0, anchor: 'ceiling' },
  },
  mirror: {
    id: 'mirror',
    label: 'Espelho',
    weight: 6,
    allowedStates: ['NORMAL', 'FALSE_MIRROR'],
    visual: { shape: 'panel', size: [0.6, 1.0, 0.04], color: 0x9fd0e0, anchor: 'wall' },
  },
  outlet: {
    id: 'outlet',
    label: 'Tomada',
    weight: 7,
    allowedStates: ['NORMAL', 'MODIFIED_OUTLET', 'WORN_OUTLET'],
    visual: { shape: 'box', size: [0.12, 0.12, 0.02], color: 0xe8e8e8, anchor: 'wall' },
  },
  lamp: {
    id: 'lamp',
    label: 'Abajur',
    weight: 6,
    allowedStates: ['NORMAL', 'CAMERA', 'MICROPHONE'],
    innocentSignals: ['HEAT'],
    visual: { shape: 'cylinder', size: [0.2, 0.4, 0.2], color: 0xd9b382, anchor: 'surface' },
  },
  usbCharger: {
    id: 'usbCharger',
    label: 'Carregador USB',
    weight: 7,
    allowedStates: ['NORMAL', 'CAMERA', 'MICROPHONE', 'TRACKER'],
    innocentSignals: ['HEAT'],
    visual: { shape: 'box', size: [0.08, 0.08, 0.06], color: 0xffffff, anchor: 'wall' },
  },
  picture: {
    id: 'picture',
    label: 'Quadro',
    weight: 6,
    allowedStates: ['NORMAL', 'CAMERA', 'SECRET_COMPARTMENT'],
    visual: { shape: 'panel', size: [0.5, 0.7, 0.03], color: 0x6b4f3a, anchor: 'wall' },
  },
  router: {
    id: 'router',
    label: 'Roteador',
    weight: 5,
    allowedStates: ['NORMAL'],
    innocentSignals: ['RF_SIGNAL', 'HEAT'],
    visual: { shape: 'box', size: [0.18, 0.03, 0.12], color: 0x2b2b30, anchor: 'surface' },
  },
  tv: {
    id: 'tv',
    label: 'TV',
    weight: 5,
    allowedStates: ['NORMAL'],
    innocentSignals: ['HEAT', 'RF_SIGNAL'],
    visual: { shape: 'panel', size: [1.1, 0.65, 0.06], color: 0x101014, anchor: 'wall' },
  },
  plant: {
    id: 'plant',
    label: 'Planta',
    weight: 4,
    allowedStates: ['NORMAL', 'CAMERA', 'VISUAL_DEFECT'],
    visual: { shape: 'cylinder', size: [0.22, 0.6, 0.22], color: 0x3f7d3f, anchor: 'floor' },
  },
  radio: {
    id: 'radio',
    label: 'Rádio-despertador',
    weight: 6,
    allowedStates: ['NORMAL', 'MICROPHONE', 'CAMERA', 'OLD_MODEL'],
    innocentSignals: ['HEAT'],
    visual: { shape: 'box', size: [0.2, 0.1, 0.12], color: 0x1c1c22, anchor: 'surface' },
  },
  wardrobe: {
    id: 'wardrobe',
    label: 'Guarda-roupa',
    weight: 4,
    allowedStates: ['NORMAL', 'SECRET_COMPARTMENT'],
    visual: { shape: 'box', size: [1.0, 2.0, 0.6], color: 0x8a6f52, anchor: 'floor' },
  },
};

export const OBJECT_IDS = Object.keys(OBJECTS);
