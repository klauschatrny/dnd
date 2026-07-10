import * as THREE from 'three';

// Constrói o ambiente 3D a partir dos dados do mapa (CDIS: o mapa é só o cenário).
// Retorna a cena, a lista de colisores (paredes) e as luzes de teto por cômodo.

const WALL_THICKNESS = 0.12;
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

  // Definição das paredes (visual + colisão). Cada uma: {cx,cz,hx,hz}.
  const t = WALL_THICKNESS / 2;
  const wallDefs = [
    // Externas
    { cx, cz: minZ, hx: w / 2, hz: t },
    { cx, cz: maxZ, hx: w / 2, hz: t },
    { cx: minX, cz, hx: t, hz: d / 2 },
    { cx: maxX, cz, hx: t, hz: d / 2 },
    // Partição vertical (x=0) com vão central
    { cx: 0, cz: -1.8, hx: t, hz: 1.2 },
    { cx: 0, cz: 1.8, hx: t, hz: 1.2 },
    // Partição horizontal (z=1) com vão central
    { cx: -2.3, cz: 1, hx: 1.7, hz: t },
    { cx: 2.3, cz: 1, hx: 1.7, hz: t },
  ];

  const wallMat = new THREE.MeshStandardMaterial({ color: WALL_COLOR, roughness: 0.9 });
  const colliders = [];
  for (const def of wallDefs) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(def.hx * 2, h, def.hz * 2), wallMat);
    mesh.position.set(def.cx, h / 2, def.cz);
    scene.add(mesh);
    colliders.push({
      minX: def.cx - def.hx,
      maxX: def.cx + def.hx,
      minZ: def.cz - def.hz,
      maxZ: def.cz + def.hz,
    });
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
