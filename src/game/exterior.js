import * as THREE from 'three';
import { createRng } from '../domain/rng.js';

// Ambiente externo procedural em volta da casa: chão de grama, rua + calçada a
// oeste, caminho até a porta da frente, um telhado simples sobre a casa, iluminação
// noturna (lua + poste + luz da porta) e uma floresta escura cercando a clareira.
//
// A floresta fica FORA dos `exterior.bounds` (onde o jogador é contido), então serve
// de "muralha" visual sem precisar de colisão. Tudo é decorativo — não colide.

function mat(color, o = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.9, metalness: o.metal ?? 0 });
}
function slab(w, d, color, y, x, z, o) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color, o));
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, y, z);
  return m;
}

/** Constrói o grupo do ambiente externo do mapa (só quando `map.exterior`). */
export function buildExterior(map) {
  const g = new THREE.Group();
  g.name = 'exterior';
  const b = map.exterior.bounds;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const houseW = map.bounds.maxX - map.bounds.minX;
  const houseD = map.bounds.maxZ - map.bounds.minZ;

  // --- Chão (grama escura), cobrindo bem além da clareira ---
  g.add(slab((b.maxX - b.minX) + 40, (b.maxZ - b.minZ) + 40, 0x15251a, -0.02, cx, cz, { rough: 1 }));

  // --- Rua + calçada ao norte (frente da casa) ---
  const at = map.exterior.approach.at; // x da porta (norte)
  const wallZ = map.bounds.minZ; // parede norte da casa
  const width = b.maxX - b.minX; // rua/calçada correm ao longo de X
  g.add(slab(width, 2.2, 0x191b21, 0.006, cx, -10.2, { rough: 1 })); // asfalto
  g.add(slab(width, 1.0, 0x3b3f47, 0.012, cx, -8.6, { rough: 0.95 })); // calçada
  // Faixa central tracejada (segmentos alongados no sentido da rua, X)
  for (let x = b.minX + 1; x < b.maxX - 1; x += 2.2) {
    g.add(slab(1.1, 0.14, 0xcaa63c, 0.02, x, -10.2, { rough: 0.8 }));
  }

  // --- Caminho da calçada até a porta (ao longo de Z, alinhado ao vão x≈-1) ---
  g.add(slab(1.5, 3.6, 0x4a4a52, 0.02, at, wallZ - 1.8, { rough: 0.95 }));

  // --- Telhado simples (pirâmide de base retangular sobre a casa) ---
  const roofH = 1.5;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1, roofH, 4), mat(0x241d18, { rough: 1 }));
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(houseW / 2 + 0.5, 1, houseD / 2 + 0.5);
  roof.position.set(
    (map.bounds.minX + map.bounds.maxX) / 2,
    map.height + roofH / 2,
    (map.bounds.minZ + map.bounds.maxZ) / 2,
  );
  g.add(roof);

  // --- Iluminação noturna (~20% mais clara) ---
  const moon = new THREE.DirectionalLight(0x9fb0d8, 0.42);
  moon.position.set(-22, 30, -14);
  g.add(moon);

  // Poste ao lado do caminho + luz da porta (aconchegam a chegada à casa)
  g.add(streetLamp(at + 1.4, -8.3));
  const doorLight = new THREE.PointLight(0xffca7a, 7.2, 6, 2);
  doorLight.position.set(at, 2.2, wallZ - 0.3);
  g.add(doorLight);

  // --- Floresta escura (instanciada) cercando a clareira ---
  g.add(buildForest(b));

  return g;
}

/** Poste de rua com cúpula luminosa. */
function streetLamp(x, z) {
  const lamp = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 3.2, 8), mat(0x20242b, { metal: 0.4 }));
  post.position.set(x, 1.6, z);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffe6b0, emissive: 0xffd27a, emissiveIntensity: 1.4, roughness: 0.6 }));
  head.position.set(x, 3.25, z);
  const light = new THREE.PointLight(0xffd9a0, 10.8, 10, 2);
  light.position.set(x, 3.2, z);
  lamp.add(post, head, light);
  return lamp;
}

/** Floresta escura: dois InstancedMesh (troncos + copas) espalhados na borda. */
function buildForest(b) {
  const forest = new THREE.Group();
  forest.name = 'forest';
  const rng = createRng('floresta-apartment');
  const margin = 9;
  const outer = { minX: b.minX - margin, maxX: b.maxX + margin, minZ: b.minZ - margin, maxZ: b.maxZ + margin };
  const trees = [];
  const target = 300;
  let tries = 0;
  while (trees.length < target && tries < target * 6) {
    tries++;
    const x = outer.minX + rng.float() * (outer.maxX - outer.minX);
    const z = outer.minZ + rng.float() * (outer.maxZ - outer.minZ);
    // Só na borda: fora da clareira caminhável (com uma folga pequena p/ fechar bem).
    if (x > b.minX + 0.2 && x < b.maxX - 0.2 && z > b.minZ + 0.2 && z < b.maxZ - 0.2) continue;
    trees.push([x, z, 0.8 + rng.float() * 1.1, rng.float() * Math.PI * 2]);
  }

  const trunkGeo = new THREE.CylinderGeometry(0.11, 0.15, 1, 6);
  const foliageGeo = new THREE.ConeGeometry(0.95, 1, 7);
  const trunkMat = mat(0x241a12, { rough: 1 });
  const foliageMat = mat(0x0d1f13, { rough: 1 });
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, trees.length);
  const foliage = new THREE.InstancedMesh(foliageGeo, foliageMat, trees.length);

  const dummy = new THREE.Object3D();
  trees.forEach(([x, z, s, rot], i) => {
    const trunkH = 1.3 * s;
    dummy.position.set(x, trunkH / 2, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(s, trunkH, s);
    dummy.updateMatrix();
    trunks.setMatrixAt(i, dummy.matrix);

    const folH = 3.0 * s;
    dummy.position.set(x, trunkH + folH / 2 - 0.3 * s, z);
    dummy.scale.set(1.5 * s, folH, 1.5 * s);
    dummy.updateMatrix();
    foliage.setMatrixAt(i, dummy.matrix);
  });
  trunks.instanceMatrix.needsUpdate = true;
  foliage.instanceMatrix.needsUpdate = true;
  forest.add(trunks, foliage);
  return forest;
}
