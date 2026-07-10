import * as THREE from 'three';

// Instancia os objetos do caso na cena, a partir dos dados de runtime (CaseInstance).
// O objeto 3D só conhece sua aparência e guarda em userData a referência ao dado do
// caso (estado + evidências) — o objeto "não sabe" qual caso está acontecendo (TDD §10).

const UP = new THREE.Vector3(0, 1, 0);

/** Cria a geometria conforme a dica visual do objeto. */
function createGeometry(visual) {
  const [a, b, c] = visual.size;
  switch (visual.shape) {
    case 'cylinder':
      return new THREE.CylinderGeometry(a / 2, a / 2, b, 20);
    case 'sphere':
      return new THREE.SphereGeometry(a / 2, 20, 16);
    case 'panel':
    case 'box':
    default:
      return new THREE.BoxGeometry(a, b, c);
  }
}

/** Orienta o mesh segundo o vetor `facing`. */
function orient(mesh, position, facing, shape) {
  const f = new THREE.Vector3(...facing);
  if (f.lengthSq() < 1e-6) return;
  f.normalize();
  if (shape === 'cylinder') {
    // Alinha o eixo Y do cilindro ao vetor facing (disco voltado para o ambiente).
    mesh.quaternion.setFromUnitVectors(UP, f);
  } else {
    // Alinha +Z local (profundidade) ao facing.
    mesh.lookAt(new THREE.Vector3(...position).add(f));
  }
}

/**
 * @param {THREE.Scene} scene
 * @param {object} instance  CaseInstance de generateCase().
 * @returns {Array<{mesh: THREE.Mesh, data: object}>} objetos inspecionáveis.
 */
export function spawnObjects(scene, instance) {
  const group = new THREE.Group();
  group.name = 'inspectables';
  const inspectables = [];

  for (const data of instance.objects) {
    const geo = createGeometry(data.visual);
    const mat = new THREE.MeshStandardMaterial({
      color: data.visual.color,
      roughness: 0.6,
      metalness: 0.1,
      emissive: 0x000000,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...data.position);
    orient(mesh, data.position, data.facing, data.visual.shape);

    // Estado de inspeção acumulado (preenchido em runtime pela camada de inspeção).
    mesh.userData.inspect = {
      data,
      foundEvidence: new Set(),
      conclusion: null,
      baseEmissive: 0x000000,
    };
    group.add(mesh);
    inspectables.push({ mesh, data });
  }

  scene.add(group);
  return inspectables;
}
