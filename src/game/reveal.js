import * as THREE from 'three';
import { EVIDENCE, TOOLS } from '../domain/data/index.js';

// Revelação visual das ferramentas: quando uma ferramenta está ativa, os objetos
// que possuem evidência detectável por ela brilham na cor da ferramenta (fiel ao
// design: "UV revela cola", "térmico mostra calor"). Assim o jogador varre o
// ambiente e vê o que reage, em vez de apertar E às cegas.
//
// O Detector RF é proposital: NÃO acende objetos (o medidor de proximidade é a
// única pista — GDD §6), evitando entregar qual objeto transmite.

const TOOL_GLOW = {
  [TOOLS.ZOOM]: { color: 0x9fd8ff, range: 4.5, needsAim: true },
  [TOOLS.FLASHLIGHT]: { color: 0xffdf9a, range: 3.4, needsAim: true },
  [TOOLS.UV]: { color: 0xb072ff, range: 4.2, needsAim: false },
  [TOOLS.THERMAL]: { color: 0xff7a33, range: 9.0, needsAim: false },
};

const TARGET_TINT = 0x203247;

// Índice evidência -> ferramenta.
const EV_BY_TOOL = {};
for (const ev of Object.values(EVIDENCE)) (EV_BY_TOOL[ev.tool] ??= []).push(ev.id);

export function createRevealSystem({ inspectables, camera }) {
  const camPos = new THREE.Vector3();
  const fwd = new THREE.Vector3();
  const dir = new THREE.Vector3();

  /**
   * @param {string} tool   Ferramenta atual.
   * @param {THREE.Mesh|null} target  Objeto mirado.
   * @param {number} time   Tempo (s) para pulsar o brilho.
   */
  function update(tool, target, time) {
    camera.getWorldPosition(camPos);
    camera.getWorldDirection(fwd);
    const glow = TOOL_GLOW[tool];
    const pulse = 0.75 + 0.25 * Math.sin(time * 6);

    for (const { root, data, materials } of inspectables) {
      let color = 0x000000;
      let intensity = 1;

      if (glow) {
        const evs = EV_BY_TOOL[tool] ?? [];
        if (data.evidences.some((e) => evs.includes(e))) {
          dir.copy(root.position).sub(camPos);
          const dist = dir.length();
          if (dist <= glow.range) {
            let aimOk = true;
            if (glow.needsAim) {
              dir.normalize();
              aimOk = dir.dot(fwd) > 0.92; // precisa estar olhando quase direto
            }
            if (aimOk) {
              color = glow.color;
              intensity = pulse;
            }
          }
        }
      }

      // Realce sutil do objeto mirado (quando não há revelação de ferramenta).
      if (root === target && color === 0x000000) color = TARGET_TINT;

      for (const m of materials) {
        m.emissive.setHex(color);
        m.emissiveIntensity = intensity;
      }
    }
  }

  return { update };
}
