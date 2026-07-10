// Estrutura de Mapa (CGS §4/§5).
// O mapa fornece apenas o ambiente e os Pontos de Interesse (POIs) — NUNCA a solução.
// Cada POI diz ao gerador: tipo do objeto, posição, cômodo, peso e estados permitidos
// (por padrão, todos os estados do tipo de objeto).
//
// Coordenadas em metros. Piso em y=0, teto em `height`. `facing` aponta para dentro
// do ambiente (usado pela camada 3D para orientar objetos de parede/teto).

/**
 * @typedef {Object} Poi
 * @property {string} id
 * @property {string} room
 * @property {string} objectType             Id em OBJECTS.
 * @property {[number,number,number]} position
 * @property {[number,number,number]} facing
 * @property {'floor'|'wall'|'ceiling'|'surface'} anchor
 * @property {number} [weight]               Sobrescreve o peso do objeto, se presente.
 * @property {string[]} [allowedStates]      Sobrescreve os estados permitidos do objeto.
 */

export const APARTMENT_01 = {
  id: 'apartment_01',
  label: 'Apartamento pequeno',
  bounds: { minX: -4, maxX: 4, minZ: -3, maxZ: 3 },
  height: 2.6,
  rooms: [
    { id: 'sala', label: 'Sala', rect: { minX: -4, maxX: 0, minZ: -3, maxZ: 1 } },
    { id: 'quarto', label: 'Quarto', rect: { minX: 0, maxX: 4, minZ: -3, maxZ: 1 } },
    { id: 'cozinha', label: 'Cozinha', rect: { minX: -4, maxX: 0, minZ: 1, maxZ: 3 } },
    { id: 'banheiro', label: 'Banheiro', rect: { minX: 0, maxX: 4, minZ: 1, maxZ: 3 } },
  ],
  spawn: { position: [-1.5, 1.6, 0], lookAt: [0, 1.6, -1] },
  /** @type {Poi[]} */
  pois: [
    // --- Sala ---
    { id: 'tv_sala', room: 'sala', objectType: 'tv', position: [-3.9, 1.3, -1.0], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'picture_sala', room: 'sala', objectType: 'picture', position: [-2.0, 1.5, -2.9], facing: [0, 0, 1], anchor: 'wall' },
    { id: 'router_sala', room: 'sala', objectType: 'router', position: [-3.4, 0.82, -2.5], facing: [0, 0, 1], anchor: 'surface' },
    { id: 'outlet_sala', room: 'sala', objectType: 'outlet', position: [-3.9, 0.4, 0.3], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'smoke_sala', room: 'sala', objectType: 'smokeDetector', position: [-2.0, 2.55, -1.0], facing: [0, -1, 0], anchor: 'ceiling' },
    { id: 'plant_sala', room: 'sala', objectType: 'plant', position: [-3.5, 0.3, 0.5], facing: [0, 0, 1], anchor: 'floor' },

    // --- Quarto ---
    { id: 'clock_quarto', room: 'quarto', objectType: 'clock', position: [3.9, 1.6, -1.5], facing: [-1, 0, 0], anchor: 'wall' },
    { id: 'mirror_quarto', room: 'quarto', objectType: 'mirror', position: [3.9, 1.2, 0.3], facing: [-1, 0, 0], anchor: 'wall' },
    { id: 'lamp_quarto', room: 'quarto', objectType: 'lamp', position: [2.5, 0.85, -2.4], facing: [0, 0, 1], anchor: 'surface' },
    { id: 'radio_quarto', room: 'quarto', objectType: 'radio', position: [1.9, 0.85, -2.4], facing: [0, 0, 1], anchor: 'surface' },
    { id: 'wardrobe_quarto', room: 'quarto', objectType: 'wardrobe', position: [1.0, 1.0, -2.5], facing: [0, 0, 1], anchor: 'floor' },
    { id: 'usb_quarto', room: 'quarto', objectType: 'usbCharger', position: [2.2, 0.5, -2.9], facing: [0, 0, 1], anchor: 'wall' },
    { id: 'smoke_quarto', room: 'quarto', objectType: 'smokeDetector', position: [2.5, 2.55, -1.0], facing: [0, -1, 0], anchor: 'ceiling' },

    // --- Cozinha ---
    { id: 'outlet_cozinha', room: 'cozinha', objectType: 'outlet', position: [-3.9, 1.0, 2.0], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'smoke_cozinha', room: 'cozinha', objectType: 'smokeDetector', position: [-2.0, 2.55, 2.0], facing: [0, -1, 0], anchor: 'ceiling' },

    // --- Banheiro ---
    { id: 'mirror_banheiro', room: 'banheiro', objectType: 'mirror', position: [3.9, 1.4, 2.0], facing: [-1, 0, 0], anchor: 'wall' },
    { id: 'outlet_banheiro', room: 'banheiro', objectType: 'outlet', position: [2.0, 1.0, 2.9], facing: [0, 0, -1], anchor: 'wall' },
  ],
};

export const MAPS = {
  apartment_01: APARTMENT_01,
};
