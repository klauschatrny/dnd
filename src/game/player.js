import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Player em 1ª pessoa: PointerLockControls para olhar, WASD para andar,
// com colisão simples (círculo vs. AABB) contra as paredes.

const SPEED = 3.2; // m/s
const RADIUS = 0.32; // raio de colisão do jogador
const EYE = 1.6; // altura dos olhos

export function createPlayer({ camera, domElement, colliders, spawn, bounds }) {
  const controls = new PointerLockControls(camera, domElement);
  const obj = controls.object; // objeto que contém a câmera

  obj.position.set(spawn.position[0], EYE, spawn.position[2]);
  // Orientação inicial olhando para lookAt.
  camera.lookAt(new THREE.Vector3(...spawn.lookAt));

  const keys = new Set();
  const onKeyDown = (e) => keys.add(e.code);
  const onKeyUp = (e) => keys.delete(e.code);
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  function move(delta) {
    if (!controls.isLocked) return;
    let mf = 0;
    let mr = 0;
    if (keys.has('KeyW') || keys.has('ArrowUp')) mf += 1;
    if (keys.has('KeyS') || keys.has('ArrowDown')) mf -= 1;
    if (keys.has('KeyD') || keys.has('ArrowRight')) mr += 1;
    if (keys.has('KeyA') || keys.has('ArrowLeft')) mr -= 1;
    if (mf === 0 && mr === 0) return;

    // Direções no plano XZ.
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    right.crossVectors(forward, THREE.Object3D.DEFAULT_UP).normalize();

    const step = SPEED * delta;
    const dx = (forward.x * mf + right.x * mr);
    const dz = (forward.z * mf + right.z * mr);
    const len = Math.hypot(dx, dz) || 1;
    const nx = obj.position.x + (dx / len) * step;
    const nz = obj.position.z + (dz / len) * step;

    // Colisão eixo a eixo (permite deslizar ao longo das paredes).
    obj.position.x = resolveAxis(nx, obj.position.z, 'x', colliders, bounds);
    obj.position.z = resolveAxis(obj.position.x, nz, 'z', colliders, bounds);
    obj.position.y = EYE;
  }

  function dispose() {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    controls.disconnect?.();
  }

  return { controls, object: obj, move, dispose };
}

function resolveAxis(x, z, axis, colliders, bounds) {
  // Mantém dentro dos limites externos.
  let px = x;
  let pz = z;
  px = Math.min(Math.max(px, bounds.minX + RADIUS), bounds.maxX - RADIUS);
  pz = Math.min(Math.max(pz, bounds.minZ + RADIUS), bounds.maxZ - RADIUS);

  for (const c of colliders) {
    const overlapX = px > c.minX - RADIUS && px < c.maxX + RADIUS;
    const overlapZ = pz > c.minZ - RADIUS && pz < c.maxZ + RADIUS;
    if (overlapX && overlapZ) {
      if (axis === 'x') {
        // Empurra para fora no eixo X.
        const fromLeft = Math.abs(px - (c.minX - RADIUS));
        const fromRight = Math.abs(px - (c.maxX + RADIUS));
        px = fromLeft < fromRight ? c.minX - RADIUS : c.maxX + RADIUS;
      } else {
        const fromNear = Math.abs(pz - (c.minZ - RADIUS));
        const fromFar = Math.abs(pz - (c.maxZ + RADIUS));
        pz = fromNear < fromFar ? c.minZ - RADIUS : c.maxZ + RADIUS;
      }
    }
  }
  return axis === 'x' ? px : pz;
}
