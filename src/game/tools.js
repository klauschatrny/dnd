import * as THREE from 'three';
import { EVIDENCE, TOOLS, TOOL_LABELS } from '../domain/data/index.js';

// Sistema de ferramentas (GDD §6 / TDD §8). Todas ficam disponíveis o tempo todo,
// sem upgrades. Cada ferramenta revela um tipo diferente de evidência e tem um
// efeito visual próprio. A troca é feita pelas teclas 1–5.

// Lanterna como ferramenta padrão (visão ampla); Zoom estreita o FOV quando ativo.
export const TOOL_ORDER = [TOOLS.FLASHLIGHT, TOOLS.ZOOM, TOOLS.UV, TOOLS.RF, TOOLS.THERMAL];

// Ferramenta que revela cada evidência (índice inverso da biblioteca).
const EVIDENCE_BY_TOOL = {};
for (const ev of Object.values(EVIDENCE)) {
  (EVIDENCE_BY_TOOL[ev.tool] ??= []).push(ev.id);
}

const BASE_FOV = 70;
const ZOOM_FOV = 26;

export function createToolSystem({ camera }) {
  // Lanterna: spotlight preso à câmera, apontando para frente.
  const spot = new THREE.SpotLight(0xfff2d8, 0, 9, Math.PI / 7, 0.4, 1.2);
  spot.position.set(0, 0, 0.1);
  spot.target.position.set(0, 0, -1);
  camera.add(spot);
  camera.add(spot.target);

  let current = TOOL_ORDER[0];
  let targetFov = BASE_FOV;

  function setTool(toolId) {
    if (!TOOL_ORDER.includes(toolId)) return;
    current = toolId;
    targetFov = toolId === TOOLS.ZOOM ? ZOOM_FOV : BASE_FOV;
    spot.intensity = toolId === TOOLS.FLASHLIGHT ? 22 : 0;
  }

  setTool(current); // aplica o estado inicial (lanterna acesa)

  function cycle(dir) {
    const i = TOOL_ORDER.indexOf(current);
    setTool(TOOL_ORDER[(i + dir + TOOL_ORDER.length) % TOOL_ORDER.length]);
  }

  /** Evidências (ids) que a ferramenta atual consegue detectar. */
  function revealSet() {
    return EVIDENCE_BY_TOOL[current] ?? [];
  }

  function update(delta) {
    // Suaviza o zoom.
    const lerp = 1 - Math.pow(0.001, delta);
    if (Math.abs(camera.fov - targetFov) > 0.05) {
      camera.fov += (targetFov - camera.fov) * lerp;
      camera.updateProjectionMatrix();
    }
  }

  return {
    setTool,
    cycle,
    revealSet,
    update,
    get current() {
      return current;
    },
    get currentLabel() {
      return TOOL_LABELS[current];
    },
  };
}
