import * as THREE from 'three';

// Modelos procedurais por tipo de objeto: cada um é montado com primitivas simples
// para ter silhueta reconhecível (relógio, detector, tomada, TV...), sem depender
// de assets de arte. Cada modelo é construído "de frente" para +Z e com +Y para
// cima; o objectSpawner orienta o grupo conforme o `facing`/`anchor` do POI.

function mat(color, { rough = 0.6, metal = 0.1 } = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function box(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
}
function cyl(rt, rb, h, material, seg = 20) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
}
// Disco/cilindro com a face voltada para +Z (eixo ao longo de Z).
function disc(r, thick, material, seg = 22) {
  const m = cyl(r, r, thick, material, seg);
  m.rotation.x = Math.PI / 2;
  return m;
}
function group(...children) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

const builders = {
  clock() {
    const rim = disc(0.13, 0.045, mat(0x2a2a30, { metal: 0.3 }));
    const face = disc(0.115, 0.05, mat(0xf2efe6));
    face.position.z = 0.006;
    const hour = box(0.012, 0.06, 0.006, mat(0x222226));
    hour.position.set(0, 0.02, 0.03);
    const minute = box(0.008, 0.085, 0.006, mat(0x222226));
    minute.position.z = 0.03;
    minute.rotation.z = Math.PI / 2.4;
    return group(rim, face, hour, minute);
  },
  smokeDetector() {
    const body = disc(0.09, 0.05, mat(0xf0f0f0));
    const ring = disc(0.05, 0.056, mat(0xd8d8d8));
    ring.position.z = 0.003;
    const led = box(0.012, 0.012, 0.008, mat(0x33dd44));
    led.position.set(0.05, 0, 0.03);
    return group(body, ring, led);
  },
  mirror() {
    const frame = box(0.62, 1.02, 0.05, mat(0x5a4632, { rough: 0.5 }));
    const glass = box(0.54, 0.94, 0.02, mat(0xaad4e0, { rough: 0.05, metal: 0.9 }));
    glass.position.z = 0.02;
    return group(frame, glass);
  },
  outlet() {
    const plate = box(0.12, 0.14, 0.02, mat(0xf2f2f2));
    const socket = box(0.078, 0.09, 0.012, mat(0xdedede));
    socket.position.z = 0.01;
    const s1 = box(0.008, 0.03, 0.014, mat(0x333338));
    s1.position.set(-0.018, 0, 0.016);
    const s2 = box(0.008, 0.03, 0.014, mat(0x333338));
    s2.position.set(0.018, 0, 0.016);
    return group(plate, socket, s1, s2);
  },
  lamp() {
    const base = cyl(0.06, 0.09, 0.05, mat(0x3b3b40));
    base.position.y = -0.18;
    const stem = cyl(0.015, 0.015, 0.28, mat(0x8a8a90, { metal: 0.5 }));
    stem.position.y = -0.03;
    const shade = cyl(0.14, 0.1, 0.16, mat(0xd9c48a, { rough: 0.85 }));
    shade.position.y = 0.16;
    return group(base, stem, shade);
  },
  usbCharger() {
    const body = box(0.08, 0.08, 0.055, mat(0xffffff));
    const led = box(0.008, 0.008, 0.006, mat(0x40a0ff));
    led.position.set(0.026, -0.026, 0.03);
    return group(body, led);
  },
  picture() {
    const frame = box(0.52, 0.72, 0.04, mat(0x6b4f2a));
    const canvas = box(0.44, 0.64, 0.02, mat(0x87a9b0));
    canvas.position.z = 0.015;
    return group(frame, canvas);
  },
  router() {
    const body = box(0.2, 0.035, 0.13, mat(0x1c1c22));
    const a1 = cyl(0.006, 0.006, 0.14, mat(0x111114));
    a1.position.set(-0.07, 0.08, -0.04);
    const a2 = cyl(0.006, 0.006, 0.14, mat(0x111114));
    a2.position.set(0.07, 0.08, -0.04);
    const led = box(0.012, 0.006, 0.006, mat(0x33dd55));
    led.position.set(0, 0.02, 0.065);
    return group(body, a1, a2, led);
  },
  tv() {
    const frame = box(1.12, 0.66, 0.05, mat(0x0a0a0c));
    const screen = box(1.04, 0.58, 0.02, mat(0x121a24, { rough: 0.2, metal: 0.4 }));
    screen.position.z = 0.02;
    return group(frame, screen);
  },
  plant() {
    const pot = cyl(0.12, 0.09, 0.2, mat(0xa0562f, { rough: 0.9 }));
    pot.position.y = -0.2;
    const foliage = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(0x3f7d3f, { rough: 0.9 }));
    foliage.position.y = 0.08;
    foliage.scale.set(1, 1.3, 1);
    return group(pot, foliage);
  },
  radio() {
    const body = box(0.22, 0.1, 0.12, mat(0x1c1c22));
    const speaker = disc(0.035, 0.01, mat(0x33333a));
    speaker.position.set(-0.05, 0, 0.061);
    const display = box(0.08, 0.04, 0.006, mat(0x224433));
    display.position.set(0.05, 0.01, 0.061);
    return group(body, speaker, display);
  },
  wardrobe() {
    const body = box(1.0, 2.0, 0.6, mat(0x8a6f52, { rough: 0.85 }));
    const seam = box(0.02, 1.9, 0.02, mat(0x5a4632));
    seam.position.z = 0.3;
    const h1 = cyl(0.01, 0.01, 0.12, mat(0x2a2a2a));
    h1.rotation.x = Math.PI / 2;
    h1.position.set(-0.06, 0, 0.31);
    const h2 = cyl(0.01, 0.01, 0.12, mat(0x2a2a2a));
    h2.rotation.x = Math.PI / 2;
    h2.position.set(0.06, 0, 0.31);
    return group(body, seam, h1, h2);
  },
};

/** Constrói o grupo do modelo para um tipo de objeto (com fallback à primitiva). */
export function buildModel(objectType, visual) {
  if (builders[objectType]) return builders[objectType]();
  const [a, b, c] = visual.size;
  return group(box(a, b, c, mat(visual.color)));
}
