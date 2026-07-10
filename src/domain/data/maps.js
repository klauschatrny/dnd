// Estrutura de Mapa (CGS §4/§5).
// O mapa fornece apenas o ambiente e os Pontos de Interesse (POIs) — NUNCA a solução.
// Cada POI diz ao gerador: tipo do objeto, posição, cômodo, peso e estados permitidos
// (por padrão, todos os estados do tipo de objeto).
//
// Coordenadas em metros. Piso em y=0, teto em `height`. Partições internas em x=0 e
// z=0. `facing` aponta para dentro do ambiente (usado pela camada 3D para orientar
// objetos de parede/teto).

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
  label: 'Apartamento',
  bounds: { minX: -6, maxX: 6, minZ: -4.5, maxZ: 4.5 },
  height: 2.8,
  rooms: [
    { id: 'sala', label: 'Sala', rect: { minX: -6, maxX: 0, minZ: -4.5, maxZ: 0 } },
    { id: 'quarto', label: 'Quarto', rect: { minX: 0, maxX: 6, minZ: -4.5, maxZ: 0 } },
    { id: 'cozinha', label: 'Cozinha', rect: { minX: -6, maxX: 0, minZ: 0, maxZ: 4.5 } },
    { id: 'banheiro', label: 'Banheiro', rect: { minX: 0, maxX: 6, minZ: 0, maxZ: 4.5 } },
  ],
  spawn: { position: [-4.5, 1.6, -3.4], lookAt: [0, 1.6, 0] },
  /** @type {Poi[]} */
  pois: [
    // --- Sala ---
    { id: 'tv_sala', room: 'sala', objectType: 'tv', position: [-5.88, 1.4, -2.0], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'picture_sala', room: 'sala', objectType: 'picture', position: [-3.0, 1.6, -4.38], facing: [0, 0, 1], anchor: 'wall' },
    { id: 'router_sala', room: 'sala', objectType: 'router', position: [-5.5, 0.92, -3.6], facing: [0, 0, 1], anchor: 'surface' },
    { id: 'outlet_sala', room: 'sala', objectType: 'outlet', position: [-5.88, 0.4, -0.7], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'smoke_sala', room: 'sala', objectType: 'smokeDetector', position: [-3.0, 2.75, -2.2], facing: [0, -1, 0], anchor: 'ceiling' },
    { id: 'plant_sala', room: 'sala', objectType: 'plant', position: [-5.8, 0.7, -1.2], facing: [1, 0, 0], anchor: 'floor' },

    // --- Quarto ---
    { id: 'clock_quarto', room: 'quarto', objectType: 'clock', position: [5.88, 1.7, -2.6], facing: [-1, 0, 0], anchor: 'wall' },
    { id: 'mirror_quarto', room: 'quarto', objectType: 'mirror', position: [0.9, 1.6, -0.1], facing: [0, 0, -1], anchor: 'wall' },
    { id: 'lamp_quarto', room: 'quarto', objectType: 'lamp', position: [2.7, 1.1, -4.3], facing: [0, 0, 1], anchor: 'surface' },
    { id: 'radio_quarto', room: 'quarto', objectType: 'radio', position: [2.1, 0.9, -4.3], facing: [0, 0, 1], anchor: 'surface' },
    { id: 'wardrobe_quarto', room: 'quarto', objectType: 'wardrobe', position: [0.9, 1, -4.2], facing: [0, 0, 1], anchor: 'floor' },
    { id: 'usb_quarto', room: 'quarto', objectType: 'usbCharger', position: [2.5, 0.5, -4.38], facing: [0, 0, 1], anchor: 'wall' },
    { id: 'smoke_quarto', room: 'quarto', objectType: 'smokeDetector', position: [3.5, 2.75, -2.2], facing: [0, -1, 0], anchor: 'ceiling' },

    // --- Cozinha ---
    { id: 'outlet_cozinha', room: 'cozinha', objectType: 'outlet', position: [-5.88, 1.0, 2.5], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'smoke_cozinha', room: 'cozinha', objectType: 'smokeDetector', position: [-3.0, 2.75, 2.2], facing: [0, -1, 0], anchor: 'ceiling' },

    // --- Banheiro ---
    { id: 'mirror_banheiro', room: 'banheiro', objectType: 'mirror', position: [5.88, 1.4, 2.4], facing: [-1, 0, 0], anchor: 'wall' },
    { id: 'outlet_banheiro', room: 'banheiro', objectType: 'outlet', position: [2.6, 1.0, 4.38], facing: [0, 0, -1], anchor: 'wall' },
  ],
};

export const MAPS = {
  apartment_01: APARTMENT_01,
};
