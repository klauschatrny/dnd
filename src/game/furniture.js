import * as THREE from 'three';

// Móveis decorativos (não interativos) para ambientar os cômodos, no mesmo estilo
// de geometria simples com cores. Não entram na inspeção nem colidem — servem só
// para tornar o ambiente mais natural. Cada peça é construída com a base em y=0.

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

function sofa() {
  const c = mat(0x455066, { rough: 0.9 });
  const base = box(1.7, 0.35, 0.85, c);
  base.position.y = 0.2;
  const back = box(1.7, 0.5, 0.18, c);
  back.position.set(0, 0.45, -0.34);
  const armL = box(0.18, 0.45, 0.85, c);
  armL.position.set(-0.76, 0.32, 0);
  const armR = box(0.18, 0.45, 0.85, c);
  armR.position.set(0.76, 0.32, 0);
  const seat = box(1.32, 0.12, 0.7, mat(0x54617a, { rough: 0.9 }));
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

function bed() {
  const frame = box(1.5, 0.3, 2.0, mat(0x5a4632, { rough: 0.8 }));
  frame.position.y = 0.15;
  const mattress = box(1.42, 0.2, 1.9, mat(0xd8d2c4, { rough: 0.95 }));
  mattress.position.y = 0.4;
  const pillow = box(1.2, 0.12, 0.32, mat(0xeeeae0, { rough: 0.95 }));
  pillow.position.set(0, 0.5, -0.75);
  const head = box(1.5, 0.6, 0.1, mat(0x6b5540, { rough: 0.7 }));
  head.position.set(0, 0.4, -1.02);
  return group(frame, mattress, pillow, head);
}

function fridge() {
  const b = box(0.7, 1.8, 0.7, mat(0xcdd2d6, { rough: 0.35, metal: 0.3 }));
  b.position.y = 0.9;
  const seam = box(0.72, 0.02, 0.02, mat(0x9aa0a8));
  seam.position.set(0, 1.12, 0.36);
  const handle = box(0.03, 0.5, 0.05, mat(0x777c85, { metal: 0.4 }));
  handle.position.set(0.28, 1.0, 0.36);
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

const HALF = Math.PI / 2;

// Layout do apartamento (posições [x,z] no piso, ry = rotação em torno de Y).
const LAYOUT = [
  // --- Sala ---
  { build: () => rug(2.5, 1.9, 0x2c313d), pos: [-1.9, -0.9] },
  { build: () => sofa(), pos: [-1.0, -0.9], ry: -HALF }, // de frente para a TV
  { build: () => table(0.9, 0.5, 0.4, 0x6b4f34), pos: [-2.5, -0.9] },
  { build: () => cabinet(1.3, 0.4, 0.34, 0x4a3b2a), pos: [-3.76, -1.0], ry: HALF }, // sob a TV
  { build: () => cabinet(0.5, 0.8, 0.34, 0x6b4f34), pos: [-3.45, -2.55] }, // sob o roteador

  // --- Quarto ---
  { build: () => rug(2.0, 1.9, 0x2c313d), pos: [2.8, -0.6] },
  { build: () => bed(), pos: [3.0, -0.5], ry: -HALF }, // cabeceira na parede leste
  { build: () => cabinet(1.15, 0.8, 0.42, 0x6b4f34), pos: [2.2, -2.45] }, // sob abajur/rádio

  // --- Cozinha ---
  { build: () => cabinet(1.6, 0.82, 0.55, 0x878d96, 0x2a2d33), pos: [-3.66, 2.0], ry: HALF }, // bancada
  { build: () => cabinet(1.5, 0.5, 0.3, 0x9aa0a8), pos: [-3.72, 2.0], ry: HALF, y: 1.6 }, // armários altos
  { build: () => fridge(), pos: [-0.5, 2.5], ry: -HALF },
  { build: () => rug(1.4, 1.2, 0x2c313d), pos: [-1.8, 2.0] },

  // --- Banheiro ---
  { build: () => vanity(), pos: [3.62, 2.0], ry: -HALF }, // sob o espelho
  { build: () => toilet(), pos: [2.5, 2.6], ry: Math.PI }, // caixa contra a parede sul
  { build: () => rug(1.0, 0.8, 0x33384a), pos: [3.0, 1.5] },
];

/** Grupo com toda a mobília decorativa do mapa. */
export function buildFurniture() {
  const g = new THREE.Group();
  g.name = 'furniture';
  for (const item of LAYOUT) {
    const m = item.build();
    m.position.set(item.pos[0], item.y ?? 0, item.pos[1]);
    m.rotation.y = item.ry ?? 0;
    g.add(m);
  }
  return g;
}
