// Estrutura de Mapa (CGS §4/§5).
// O mapa fornece apenas o ambiente e os Pontos de Interesse (POIs) — NUNCA a solução.
// Cada POI diz ao gerador: tipo do objeto, posição, cômodo, peso e estados permitidos
// (por padrão, todos os estados do tipo de objeto).
//
// Coordenadas em metros. Piso em y=0, teto em `height`. `facing` aponta para dentro
// do ambiente (usado pela camada 3D para orientar objetos de parede/teto).
//
// `walls` = partições INTERNAS do mapa (as externas são geradas dos `bounds`). Cada
// parede é um retângulo {cx,cz,hx,hz} (centro + meia-largura/meia-profundidade). Os
// vãos de porta são criados deixando lacunas entre segmentos. `T` é a meia-espessura
// padrão. Mantenha os vãos fora dos cruzamentos entre partições, senão o cômodo ilha.

const T = 0.06; // meia-espessura padrão das paredes internas

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
  // Partição vertical (x=0) com vãos em z∈(-2.2,-1.0) e z∈(1.0,2.2);
  // partição horizontal (z=0) com vãos em x∈(-4.5,-3.3) e x∈(3.3,4.5).
  walls: [
    { cx: 0, cz: -3.35, hx: T, hz: 1.15 },
    { cx: 0, cz: 0, hx: T, hz: 1.0 },
    { cx: 0, cz: 3.35, hx: T, hz: 1.15 },
    { cx: -5.25, cz: 0, hx: 0.75, hz: T },
    { cx: 0, cz: 0, hx: 3.3, hz: T },
    { cx: 5.25, cz: 0, hx: 0.75, hz: T },
  ],
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

// Quitinete/studio: um único ambiente grande + um banheiro no canto sudeste.
// Planta compacta e aberta — contraste com a divisão em quatro cômodos do ap. 01.
export const STUDIO_02 = {
  id: 'studio_02',
  label: 'Quitinete',
  bounds: { minX: -4, maxX: 4, minZ: -3, maxZ: 3 },
  height: 2.8,
  rooms: [
    { id: 'studio', label: 'Studio', rect: { minX: -4, maxX: 4, minZ: -3, maxZ: 3 } },
    { id: 'banheiro', label: 'Banheiro', rect: { minX: 2, maxX: 4, minZ: 1, maxZ: 3 } },
  ],
  spawn: { position: [-3.2, 1.6, -2.2], lookAt: [1, 1.6, 1] },
  // Banheiro fechado no canto SE: parede norte (z=1) inteira + parede oeste (x=2)
  // com um vão de porta em z∈(1.5,2.5).
  walls: [
    { cx: 3, cz: 1, hx: 1, hz: T },
    { cx: 2, cz: 1.25, hx: T, hz: 0.25 },
    { cx: 2, cz: 2.75, hx: T, hz: 0.25 },
  ],
  /** @type {Poi[]} */
  pois: [
    // --- Studio ---
    { id: 'tv_studio', room: 'studio', objectType: 'tv', position: [-2.4, 1.2, -2.94], facing: [0, 0, 1], anchor: 'wall' },
    { id: 'picture_studio', room: 'studio', objectType: 'picture', position: [0.6, 1.6, -2.94], facing: [0, 0, 1], anchor: 'wall' },
    { id: 'clock_studio', room: 'studio', objectType: 'clock', position: [-3.94, 1.7, -0.6], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'smoke_studio', room: 'studio', objectType: 'smokeDetector', position: [-1.2, 2.75, -0.8], facing: [0, -1, 0], anchor: 'ceiling' },
    { id: 'lamp_studio', room: 'studio', objectType: 'lamp', position: [1.5, 0.5, -2.6], facing: [0, 0, 1], anchor: 'surface' },
    { id: 'radio_studio', room: 'studio', objectType: 'radio', position: [-3.35, 0.95, -2.5], facing: [1, 0, 0], anchor: 'surface' },
    { id: 'router_studio', room: 'studio', objectType: 'router', position: [-3.35, 0.95, -1.6], facing: [1, 0, 0], anchor: 'surface' },
    { id: 'usb_studio', room: 'studio', objectType: 'usbCharger', position: [3.94, 0.5, -1.6], facing: [-1, 0, 0], anchor: 'wall' },
    { id: 'outlet_studio', room: 'studio', objectType: 'outlet', position: [-3.94, 0.4, 1.8], facing: [1, 0, 0], anchor: 'wall' },
    { id: 'plant_studio', room: 'studio', objectType: 'plant', position: [3.4, 0.3, -2.5], facing: [-1, 0, 0], anchor: 'floor' },
    { id: 'wardrobe_studio', room: 'studio', objectType: 'wardrobe', position: [-3.45, 1.0, 0.4], facing: [1, 0, 0], anchor: 'floor' },

    // --- Banheiro ---
    { id: 'mirror_banheiro', room: 'banheiro', objectType: 'mirror', position: [3.2, 1.4, 1.06], facing: [0, 0, 1], anchor: 'wall' },
    { id: 'outlet_banheiro', room: 'banheiro', objectType: 'outlet', position: [3.94, 1.0, 2.4], facing: [-1, 0, 0], anchor: 'wall' },
  ],
};

export const MAPS = {
  apartment_01: APARTMENT_01,
  studio_02: STUDIO_02,
};
