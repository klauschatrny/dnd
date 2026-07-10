import './style.css';
import * as THREE from 'three';
import { generateCase } from './domain/caseGenerator.js';
import { evaluateReport } from './domain/report.js';
import { MAPS } from './domain/data/index.js';
import { buildScene } from './game/scene.js';
import { spawnObjects } from './game/objectSpawner.js';
import { createPlayer } from './game/player.js';
import { createToolSystem, TOOL_ORDER } from './game/tools.js';
import { createInspection } from './game/inspection.js';
import { createRevealSystem } from './game/reveal.js';
import { createUI } from './game/ui.js';

const app = document.getElementById('app');

// --- Render / câmera / cena (persistentes) ---
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
app.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.05, 100);
const map = MAPS.apartment_01;
const { scene, colliders } = buildScene(map);
scene.add(camera); // a lanterna (spotlight) fica presa à câmera

const player = createPlayer({ camera, domElement: renderer.domElement, colliders, spawn: map.spawn, bounds: map.bounds });
const tools = createToolSystem({ camera });

// --- Estado do caso atual ---
const current = { instance: null, solution: null, inspectables: [], inspection: null, reveal: null };
let phase = 'menu'; // menu | briefing | inspection | results
let startTime = null;
let caseNumber = 0;
let sessionDifficulty; // mantém a dificuldade escolhida entre casos

const ui = createUI(app, {
  getInspectables: () => current.inspectables,
  onConclusion: (poiId, conclusion) => {
    const item = current.inspectables.find((i) => i.data.poiId === poiId);
    if (item) item.root.userData.inspect.conclusion = conclusion;
  },
  onFinish: () => emitReport(),
});

// --- Mira e overlay de pausa ---
const crosshair = document.createElement('div');
crosshair.className = 'crosshair hidden';
app.appendChild(crosshair);

const pause = document.createElement('div');
pause.className = 'overlay hidden';
pause.innerHTML = `<div class="overlay-card"><h1>Pausado</h1><p>Clique para continuar a inspeção</p></div>`;
app.appendChild(pause);
pause.addEventListener('click', () => player.controls.lock());

// --- Fluxo ---
function removeInspectables() {
  const g = scene.getObjectByName('inspectables');
  if (!g) return;
  g.traverse((o) => {
    if (o.isMesh) {
      o.geometry.dispose();
      o.material.dispose();
    }
  });
  scene.remove(g);
}

function startCase(opts = {}) {
  ui.hideMenu();
  removeInspectables();
  sessionDifficulty = opts.difficulty ?? sessionDifficulty;
  const gen = generateCase({ seed: opts.seed, difficulty: sessionDifficulty });
  current.instance = gen.instance;
  current.solution = gen.solution;
  current.inspectables = spawnObjects(scene, gen.instance);
  current.inspection = createInspection({ camera, inspectables: current.inspectables });
  current.reveal = createRevealSystem({ inspectables: current.inspectables, camera });

  // Reset de estado
  caseNumber += 1;
  startTime = null;
  phase = 'briefing';
  tools.setTool(TOOL_ORDER[0]);
  ui.setTool(tools.current);
  ui.hideResults();
  ui.hideHud();
  crosshair.classList.add('hidden');
  pause.classList.add('hidden');

  // Player de volta ao ponto inicial
  player.object.position.set(map.spawn.position[0], 1.6, map.spawn.position[2]);
  camera.lookAt(new THREE.Vector3(...map.spawn.lookAt));

  ui.showBriefing(current.instance, caseNumber, map.label, { onEnter: enterInspection });
}

function enterInspection() {
  ui.hideBriefing();
  ui.showHud();
  crosshair.classList.remove('hidden');
  phase = 'inspection';
  player.controls.lock();
}

function emitReport() {
  const marks = {};
  for (const { root, data } of current.inspectables) {
    if (root.userData.inspect.conclusion) marks[data.poiId] = root.userData.inspect.conclusion;
  }
  const time = startTime ? (performance.now() - startTime) / 1000 : 0;
  const result = evaluateReport(current.solution, marks, time);
  phase = 'results';
  crosshair.classList.add('hidden');
  player.controls.unlock();
  ui.showResults(result, { onNext: () => startCase({}) });
}

// --- Pointer lock ---
player.controls.addEventListener('lock', () => {
  pause.classList.add('hidden');
  if (startTime === null) startTime = performance.now();
});
player.controls.addEventListener('unlock', () => {
  if (phase === 'inspection' && !ui.isNotebookOpen()) pause.classList.remove('hidden');
});

// --- Entradas ---
function inspectNow() {
  if (!player.controls.isLocked) return;
  ui.reportInspection(current.inspection.inspect(tools.revealSet()));
}
function openNotebook() {
  ui.toggleNotebook(true);
  player.controls.unlock();
}
function closeNotebook() {
  ui.toggleNotebook(false);
  player.controls.lock();
}

document.addEventListener('keydown', (e) => {
  if (phase !== 'inspection') return;
  if (e.code === 'Tab') {
    e.preventDefault();
    ui.isNotebookOpen() ? closeNotebook() : openNotebook();
    return;
  }
  if (ui.isNotebookOpen()) return;
  const digit = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3, Digit5: 4 }[e.code];
  if (digit !== undefined) {
    tools.setTool(TOOL_ORDER[digit]);
    ui.setTool(tools.current);
  } else if (e.code === 'KeyE') {
    inspectNow();
  }
});

renderer.domElement.addEventListener('mousedown', (e) => {
  if (player.controls.isLocked && e.button === 0) inspectNow();
});
window.addEventListener('wheel', (e) => {
  if (!player.controls.isLocked) return;
  tools.cycle(e.deltaY > 0 ? 1 : -1);
  ui.setTool(tools.current);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Pista da ferramenta atual sobre o objeto mirado (RF não revela objeto — GDD §6).
function targetHint(target) {
  if (!target || tools.current === 'RF') return undefined;
  const evs = tools.revealSet();
  const st = target.userData.inspect;
  const detectable = st.data.evidences.filter((e) => evs.includes(e));
  if (detectable.length === 0) return 'none';
  if (detectable.every((e) => st.foundEvidence.has(e))) return 'found';
  return 'signal';
}

// --- Medidor RF (não aponta o objeto exato — GDD §6) ---
const camPos = new THREE.Vector3();
function updateRf() {
  if (tools.current !== 'RF') return;
  camera.getWorldPosition(camPos);
  let intensity = 0;
  for (const { root, data } of current.inspectables) {
    if (!data.evidences.includes('RF_SIGNAL')) continue;
    intensity = Math.max(intensity, Math.max(0, 1 - camPos.distanceTo(root.position) / 4.5));
  }
  ui.setRf(intensity);
}

// --- Loop ---
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const delta = Math.min(clock.getDelta(), 0.1);
  player.move(delta);
  tools.update(delta);
  if (phase === 'inspection') {
    const target = current.inspection.update();
    current.reveal.update(tools.current, target, clock.elapsedTime);
    if (player.controls.isLocked) {
      ui.setTarget(target, targetHint(target), tools.currentLabel);
      updateRf();
    } else {
      ui.setTarget(null);
    }
  }
  renderer.render(scene, camera);
});

// Hook de depuração (apenas em desenvolvimento) para inspeção/testes.
if (import.meta.env.DEV) window.__game = { camera, scene, renderer };

// --- Início ---
ui.showMenu({ onStart: (opts) => startCase(opts) });
