// Templates de Caso (refinamento do Ajuste.txt).
// Em vez de sortear estados de forma puramente aleatória, o gerador escolhe primeiro
// um TEMPLATE, dando identidade e ritmo próprios a cada investigação, e então o adapta
// ao mapa e à dificuldade.

/**
 * @typedef {Object} CaseTemplate
 * @property {string} id
 * @property {string} label
 * @property {string} descricao
 * @property {number} weight                 Chance relativa de o template ser escolhido.
 * @property {string[]|null} irregularStates Estados irregulares permitidos (null = todos).
 * @property {number} evidenceDensity        Fração média do pool opcional revelada (0..1).
 * @property {number} distractorRatio        Distratores por irregularidade (aprox.).
 * @property {boolean} [falseAlarm]          Caso sem irregularidades reais.
 */

/** @type {CaseTemplate[]} */
export const TEMPLATES = [
  {
    id: 'CAMERA_ESCONDIDA',
    label: 'Câmera escondida',
    descricao: 'Evidências ópticas fortes; foco em câmeras.',
    weight: 10,
    irregularStates: ['CAMERA'],
    evidenceDensity: 0.6,
    distractorRatio: 1.0,
  },
  {
    id: 'ESPIONAGEM_AUDIO',
    label: 'Espionagem por áudio',
    descricao: 'Microfones e poucos sinais visuais.',
    weight: 8,
    irregularStates: ['MICROPHONE', 'TRACKER'],
    evidenceDensity: 0.5,
    distractorRatio: 1.2,
  },
  {
    id: 'ESTRUTURAS_ADULTERADAS',
    label: 'Estruturas adulteradas',
    descricao: 'Espelhos falsos, tomadas modificadas, compartimentos.',
    weight: 7,
    irregularStates: ['FALSE_MIRROR', 'MODIFIED_OUTLET', 'SECRET_COMPARTMENT'],
    evidenceDensity: 0.5,
    distractorRatio: 1.0,
  },
  {
    id: 'CASO_MISTO',
    label: 'Caso misto',
    descricao: 'Combinação de várias categorias.',
    weight: 6,
    irregularStates: null,
    evidenceDensity: 0.55,
    distractorRatio: 1.0,
  },
  {
    id: 'FALSO_ALARME',
    label: 'Falso alarme',
    descricao: 'Muitos objetos suspeitos, nenhuma irregularidade real.',
    weight: 3,
    irregularStates: [],
    evidenceDensity: 0.3,
    distractorRatio: 3.0,
    falseAlarm: true,
  },
];

export const TEMPLATES_BY_ID = Object.fromEntries(TEMPLATES.map((t) => [t.id, t]));
