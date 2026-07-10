import * as THREE from 'three';
import { buildModel } from './models.js';

// Instancia os objetos do caso na cena, a partir dos dados de runtime (CaseInstance).
// Cada objeto é um grupo (modelo procedural) que guarda em userData a referência ao
// dado do caso (estado + evidências) — o objeto "não sabe" qual caso acontece (TDD §10).

/** Orienta o grupo do modelo segundo `facing`/`anchor`. */
function orient(grp, position, facing, anchor) {
  grp.position.set(...position);
  if (anchor === 'ceiling') {
    grp.rotation.x = Math.PI / 2; // a frente (+Z) passa a apontar para baixo
    return;
  }
  const f = new THREE.Vector3(...facing);
  if (f.lengthSq() > 1e-6) grp.lookAt(new THREE.Vector3(...position).add(f.normalize()));
}

/**
 * @param {THREE.Scene} scene
 * @param {object} instance  CaseInstance de generateCase().
 * @returns {Array<{root: THREE.Object3D, data: object, materials: THREE.Material[]}>}
 */
export function spawnObjects(scene, instance) {
  const container = new THREE.Group();
  container.name = 'inspectables';
  const inspectables = [];

  for (const data of instance.objects) {
    const model = buildModel(data.objectType, data.visual);
    orient(model, data.position, data.facing, data.anchor);

    // Materiais do modelo (o sistema de revelação os tinge) e vínculo para o raycast.
    const materials = [];
    model.traverse((o) => {
      if (o.isMesh) materials.push(o.material);
      o.userData.inspectRoot = model;
    });

    model.userData.inspect = {
      data,
      foundEvidence: new Set(),
      conclusion: null,
      examined: false,
    };
    container.add(model);
    inspectables.push({ root: model, data, materials });
  }

  scene.add(container);
  return inspectables;
}
