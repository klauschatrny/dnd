import * as THREE from 'three';
import { buildWalls, wallToAABB } from './layout.js';

// Constrói o ambiente 3D a partir dos dados do mapa (CDIS: o mapa é só o cenário).
// Retorna a cena, a lista de colisores (paredes) e as luzes de teto por cômodo.

const WALL_COLOR = 0x2a2f3a;
const FLOOR_COLOR = 0x1b1e26;
const CEIL_COLOR = 0x14171d;

/**
 * @param {object} map  Definição de mapa (ver domain/data/maps.js).
 */
export function buildScene(map) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0d11);
  scene.fog = new THREE.Fog(0x0b0d11, 6, 16);

  const { minX, maxX, minZ, maxZ } = map.bounds;
  const w = maxX - minX;
  const d = maxZ - minZ;
  const h = map.height;
  const cx = (minX + maxX) / 2;
  const cz = (minZ + maxZ) / 2;

  // Piso e teto
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: FLOOR_COLOR, roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshStandardMaterial({ color: CEIL_COLOR, roughness: 1 }),
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(cx, h, cz);
  scene.add(ceiling);

  // Paredes (visual + colisão) a partir da geometria compartilhada em layout.js.
  const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.9 });
  const colliders = [];
  for (const def of buildWalls(map)) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(def.hx * 2, h, def.hz * 2), wallMat);
    mesh.position.set(def.cx, h / 2, def.cz);
    scene.add(mesh);
    colliders.push(wallToAABB(def));
  }

  // Iluminação: ambiente baixo (a lanterna importa) + uma luz suave por cômodo.
  scene.add(new THREE.HemisphereLight(0x8090a0, 0x202028, 0.5));
  const ambient = new THREE.AmbientLight(0xffffff, 0.18);
  scene.add(ambient);

  const ceilingLights = [];
  for (const room of map.rooms) {
    const rcx = (room.rect.minX + room.rect.maxX) / 2;
    const rcz = (room.rect.minZ + room.rect.maxZ) / 2;
    const light = new THREE.PointLight(0xffe8c0, 8, 7, 2);
    light.position.set(rcx, h - 0.2, rcz);
    scene.add(light);
    ceilingLights.push(light);
  }

  return { scene, colliders, ceilingLights, ambient };
}
