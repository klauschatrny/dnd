import * as THREE from 'three';

// Móveis decorativos (não interativos) para ambientar os cômodos, no mesmo estilo
// de geometria simples com cores. Não entram na inspeção nem colidem — servem só
// para tornar o ambiente mais natural. Cada peça é construída com a base em y=0.
// Nenhuma peça imita a silhueta de um objeto inspecionável (relógio, TV, espelho...).

function mat(color, { rough = 0.75, metal = 0.05 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}
function cyl(rt, rb, h, material, seg = 18) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
}
function group(...children) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

// --- Peças ---

function rug(w, d, color) {
  const r = box(w, 0.02, d, mat(color, { rough: 0.95 }));
  r.position.y = 0.011;
  return group(r);
}

function upholstered(w, color) {
  // Sofá/poltrona genérico de largura w, de frente para +Z.
  const c = mat(color, { rough: 0.9 });
  const base = box(w, 0.35, 0.85, c);
  base.position.y = 0.2;
  const back = box(w, 0.5, 0.18, c);
  back.position.set(0, 0.45, -0.34);
  const armL = box(0.16, 0.44, 0.85, c);
  armL.position.set(-w / 2 + 0.08, 0.32, 0);
  const armR = box(0.16, 0.44, 0.85, c);
  armR.position.set(w / 2 - 0.08, 0.32, 0);
  const seat = box(w - 0.32, 0.12, 0.7, mat(color + 0x0a0a0a, { rough: 0.9 }));
  seat.position.set(0, 0.4, 0.03);
  return group(base, back, armL, armR, seat);
}

function table(w, d, h, color) {
  const m = mat(color, { rough: 0.6 });
  const top = box(w, 0.06, d, m);
  top.position.y = h;
  const g = group(top);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = box(0.06, h, 0.06, m);
    leg.position.set(sx * (w / 2 - 0.06), h / 2, sz * (d / 2 - 0.06));
    g.add(leg);
  }
  return g;
}

function chair(color) {
  const m = mat(color, { rough: 0.6 });
  const seat = box(0.42, 0.06, 0.42, m);
  seat.position.y = 0.45;
  const back = box(0.42, 0.5, 0.06, m);
  back.position.set(0, 0.7, -0.18);
  const g = group(seat, back);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = box(0.05, 0.45, 0.05, m);
    leg.position.set(sx * 0.17, 0.22, sz * 0.17);
    g.add(leg);
  }
  return g;
}

/** Armário/console genérico (base em y=0). */
function cabinet(w, h, d, color, topColor) {
  const body = box(w, h, d, mat(color, { rough: 0.7 }));
  body.position.y = h / 2;
  const g = group(body);
  if (topColor) {
    const top = box(w + 0.04, 0.05, d + 0.04, mat(topColor, { rough: 0.4, metal: 0.15 }));
    top.position.y = h + 0.02;
    g.add(top);
  }
  return g;
}

function dresser(w, color) {
  const g = cabinet(w, 0.9, 0.5, color);
  for (const y of [0.25, 0.55, 0.85]) {
    const seam = box(w - 0.06, 0.015, 0.02, mat(0x000000, { rough: 1 }));
    seam.position.set(0, y - 0.15, 0.25);
    const handle = box(0.12, 0.02, 0.03, mat(0x2a2a2a, { metal: 0.4 }));
    handle.position.set(0, y, 0.26);
    g.add(seam, handle);
  }
  return g;
}

function bookshelf(color) {
  const m = mat(color, { rough: 0.7 });
  const g = group();
  const body = box(1.0, 1.8, 0.3, m);
  body.position.y = 0.9;
  g.add(body);
  const bookColors = [0x8a4b3b, 0x3b6b5a, 0x4a5a8a, 0x8a7a3b, 0x6b3b6b];
  for (let s = 0; s < 3; s++) {
    const y = 0.45 + s * 0.5;
    const shelf = box(0.94, 0.03, 0.28, mat(0x000000, { rough: 1 }));
    shelf.position.set(0, y - 0.02, 0.01);
    g.add(shelf);
    for (let b = 0; b < 6; b++) {
      const book = box(0.1, 0.32, 0.2, mat(bookColors[(s * 6 + b) % bookColors.length], { rough: 0.9 }));
      book.position.set(-0.42 + b * 0.14, y + 0.17, 0.02);
      book.rotation.z = (b % 3 === 0 ? 0.04 : 0) * (b % 2 ? -1 : 1);
      g.add(book);
    }
  }
  return g;
}

function bed() {
  const frame = box(1.5, 0.3, 2.0, mat(0x5a4632, { rough: 0.8 }));
  frame.position.y = 0.15;
  const mattress = box(1.42, 0.2, 1.9, mat(0xd8d2c4, { rough: 0.95 }));
  mattress.position.y = 0.4;
  const duvet = box(1.44, 0.08, 1.2, mat(0x4a6a7a, { rough: 0.95 }));
  duvet.position.set(0, 0.5, 0.35);
  const pillow = box(1.2, 0.12, 0.32, mat(0xeeeae0, { rough: 0.95 }));
  pillow.position.set(0, 0.5, -0.75);
  const head = box(1.5, 0.6, 0.1, mat(0x6b5540, { rough: 0.7 }));
  head.position.set(0, 0.4, -1.02);
  return group(frame, mattress, duvet, pillow, head);
}

function fridge() {
  const b = box(0.7, 1.8, 0.68, mat(0xcdd2d6, { rough: 0.35, metal: 0.3 }));
  b.position.y = 0.9;
  const seam = box(0.72, 0.02, 0.02, mat(0x9aa0a8));
  seam.position.set(0, 1.12, 0.35);
  const handle = box(0.03, 0.5, 0.05, mat(0x777c85, { metal: 0.4 }));
  handle.position.set(0.28, 1.0, 0.35);
  return group(b, seam, handle);
}

function vanity() {
  const body = box(0.7, 0.8, 0.5, mat(0x8a8f98, { rough: 0.7 }));
  body.position.y = 0.4;
  const top = box(0.74, 0.06, 0.54, mat(0xe6e8ec, { rough: 0.3 }));
  top.position.y = 0.82;
  const basin = cyl(0.14, 0.12, 0.08, mat(0xffffff, { rough: 0.2 }));
  basin.position.y = 0.84;
  return group(body, top, basin);
}

function toilet() {
  const bowl = cyl(0.18, 0.15, 0.4, mat(0xf0f2f4, { rough: 0.3 }));
  bowl.position.y = 0.2;
  const seat = cyl(0.2, 0.2, 0.06, mat(0xffffff, { rough: 0.3 }));
  seat.position.y = 0.42;
  const tank = box(0.4, 0.42, 0.16, mat(0xf0f2f4, { rough: 0.3 }));
  tank.position.set(0, 0.6, -0.2);
  return group(bowl, seat, tank);
}

function bathtub() {
  const shell = box(1.7, 0.5, 0.75, mat(0xf2f4f6, { rough: 0.3 }));
  shell.position.y = 0.25;
  const water = box(1.5, 0.4, 0.58, mat(0x9fc6d6, { rough: 0.1, metal: 0.2 }));
  water.position.y = 0.34;
  return group(shell, water);
}

const HALF = Math.PI / 2;

// Registro de construtores por tipo (permite layout declarativo + edição/export).
const BUILDERS = {
  rug: (a) => rug(a[0], a[1], a[2]),
  sofa: (a) => upholstered(a[0], a[1]),
  table: (a) => table(a[0], a[1], a[2], a[3]),
  chair: (a) => chair(a[0]),
  cabinet: (a) => cabinet(a[0], a[1], a[2], a[3], a[4]),
  dresser: (a) => dresser(a[0], a[1]),
  bookshelf: (a) => bookshelf(a[0]),
  bed: () => bed(),
  fridge: () => fridge(),
  vanity: () => vanity(),
  toilet: () => toilet(),
  bathtub: () => bathtub(),
};

// Índices de argumentos que são cores (para o editor exportar como 0xhex).
export const COLOR_ARGS = {
  rug: [2],
  sofa: [1],
  table: [3],
  chair: [0],
  cabinet: [3, 4],
  dresser: [1],
  bookshelf: [0],
};

// Layout declarativo da mobília por mapa. pos=[x,z] no piso; ry=giro em Y; args=
// parâmetros do construtor (dimensões/cores). A mobília é puramente decorativa (não
// interage nem colide), por isso vive na camada de apresentação — não no domínio.
// O editor edita pos/ry/y e exporta o array do mapa atual.
export const FURNITURE_BY_MAP = {
  apartment_01: [
  // --- Sala (x[-6,0], z[-4.5,0]) ---
  { type: 'rug', pos: [-3, -2.6], args: [3.4, 2.8, 0x2c313d] },
  { type: 'sofa', pos: [-3.2, -4], args: [1.8, 0x455066] },
  { type: 'sofa', pos: [-1.2, -3.1], ry: -HALF * 0.7, args: [0.95, 0x4a5a63] },
  { type: 'table', pos: [-3, -2.5], args: [1.1, 0.6, 0.4, 0x6b4f34] },
  { type: 'cabinet', pos: [-5.74, -2], ry: HALF, args: [2, 0.4, 0.4, 0x4a3b2a] },
  { type: 'cabinet', pos: [-5.6, -3.6], ry: HALF, args: [0.55, 0.9, 0.4, 0x6b4f34] },
  { type: 'bookshelf', pos: [-0.9, -0.2], args: [0x5a4632] },

  // --- Quarto (x[0,6], z[-4.5,0]) ---
  { type: 'rug', pos: [4.1, -2.7], ry: HALF, args: [3.4, 2.8, 0x2c313d] },
  { type: 'bed', pos: [4.1, -3.4] },
  { type: 'cabinet', pos: [2.4, -4.3], args: [1.25, 0.86, 0.42, 0x6b4f34] },
  { type: 'dresser', pos: [0.9, -0.3], args: [1.4, 0x6b4f34] },

  // --- Cozinha (x[-6,0], z[0,4.5]) ---
  { type: 'cabinet', pos: [-5.72, 2.5], ry: HALF, args: [3.2, 0.85, 0.55, 0x878d96, 0x2a2d33] },
  { type: 'cabinet', pos: [-5.82, 2.5], ry: HALF, y: 1.95, args: [2.8, 0.5, 0.3, 0x9aa0a8] },
  { type: 'fridge', pos: [-1.4, 4.06], ry: Math.PI },
  { type: 'rug', pos: [-2.7, 1.9], args: [1.9, 1.7, 0x2c313d] },
  { type: 'table', pos: [-2.7, 1.9], args: [1.2, 0.85, 0.75, 0x6b4f34] },
  { type: 'chair', pos: [-2.7, 1.05], args: [0x5a4632] },
  { type: 'chair', pos: [-2.7, 2.75], ry: Math.PI, args: [0x5a4632] },

  // --- Banheiro (x[0,6], z[0,4.5]) ---
  { type: 'vanity', pos: [5.64, 2.4], ry: -HALF },
  { type: 'toilet', pos: [4.8, 4.05], ry: Math.PI },
  { type: 'bathtub', pos: [1.55, 4] },
  { type: 'rug', pos: [1.6, 3], args: [1.3, 1, 0x33384a] },
  ],
};

/** Layout de mobília de um mapa (vazio se não houver). */
export function furnitureFor(mapId) {
  return FURNITURE_BY_MAP[mapId] ?? [];
}

/** Constrói o grupo de um item de mobília (com vínculo ao dado, para o editor). */
export function buildFurnitureItem(item) {
  const m = BUILDERS[item.type](item.args ?? []);
  m.position.set(item.pos[0], item.y ?? 0, item.pos[1]);
  m.rotation.y = item.ry ?? 0;
  m.userData.item = item;
  return m;
}

/** Grupo com a mobília decorativa de um mapa (recebe o array de itens). */
export function buildFurniture(items = []) {
  const g = new THREE.Group();
  g.name = 'furniture';
  for (const item of items) g.add(buildFurnitureItem(item));
  return g;
}
